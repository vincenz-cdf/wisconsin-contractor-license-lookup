// Thin client for the Wisconsin DSPS LicensE public lookup (Salesforce
// Experience Cloud, guest user). It calls the same Apex actions the public
// page calls: fetchProfessions, searchLicense, and the detail lookup.
//
// It sends ordinary requests with an honest User-Agent. It does not try to
// defeat bot protection: if the site's Cloudflare front end refuses a
// request, the client raises BlockedError and the run stops with a clear
// message.

import { ProxyAgent } from 'undici';

const BASE = 'https://license.wi.gov';
const LOOKUP_PATH = '/s/license-lookup';
const DETAIL_PATH = '/s/licenseView';
const AURA_URL = `${BASE}/s/sfsites/aura?r=1&aura.ApexAction.execute=1`;

const USER_AGENT = 'Mozilla/5.0 (compatible; WisconsinLicenseLookupActor/0.1; +https://apify.com)';

// Fallback Aura context captured 2026-11-05. Refreshed from the page at start.
const FALLBACK_FWUID = 'NjZ1S2dpaDFCTURrSEliQmh0ZXRhZ2tVMjdnTGFERUU2S3FfSVdrcU92bkExNS4zLjE2MDEw';
const FALLBACK_LOADED = { 'APPLICATION@markup://siteforce:communityApp': '1913_ebdeTt9njw4JArw_mL8PvA' };

export class BlockedError extends Error {
    constructor(status, detail) {
        super(`license.wi.gov refused the request (HTTP ${status}${detail ? `, ${detail}` : ''}). `
            + 'The site is fronted by Cloudflare and did not accept requests from this network. '
            + 'The run stopped without retrying. If this persists, contact DSPS (DSPSPublicRecords@wisconsin.gov) about bulk access.');
        this.name = 'BlockedError';
        this.status = status;
    }
}

export class ApexError extends Error {
    constructor(method, errors) {
        super(`Apex ${method} failed: ${JSON.stringify(errors).slice(0, 500)}`);
        this.name = 'ApexError';
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function looksBlocked(status, text) {
    return (status === 403 || status === 429 || status === 503)
        && /cloudflare|cf-error|Attention Required|Just a moment/i.test(text);
}

export class LicenseClient {
    /**
     * @param {{proxyUrlFn?: () => Promise<string|undefined>, log?: any, maxRetries?: number}} opts
     */
    constructor({ proxyUrlFn, log, maxRetries = 3 } = {}) {
        this.proxyUrlFn = proxyUrlFn;
        this.log = log ?? console;
        this.maxRetries = maxRetries;
        this.fwuid = FALLBACK_FWUID;
        this.loaded = FALLBACK_LOADED;
        this.cookies = new Map();
    }

    async #dispatcher() {
        const url = this.proxyUrlFn ? await this.proxyUrlFn() : undefined;
        return url ? new ProxyAgent(url) : undefined;
    }

    #cookieHeader() {
        return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    }

    #storeCookies(res) {
        const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
        for (const c of list) {
            const [pair] = c.split(';');
            const i = pair.indexOf('=');
            if (i > 0) this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
        }
    }

    async #request(url, init) {
        let lastErr;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const headers = { 'user-agent': USER_AGENT, 'accept-language': 'en-US,en;q=0.9', ...init.headers };
                const cookie = this.#cookieHeader();
                if (cookie) headers.cookie = cookie;
                const res = await fetch(url, { ...init, headers, dispatcher: await this.#dispatcher() });
                this.#storeCookies(res);
                const text = await res.text();
                if (looksBlocked(res.status, text)) throw new BlockedError(res.status, 'Cloudflare block page');
                if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
                if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
                return text;
            } catch (err) {
                lastErr = err;
                // Never retry a block: stop and report it.
                if (err instanceof BlockedError) throw err;
                if (attempt < this.maxRetries) {
                    const wait = 1000 * 2 ** (attempt - 1);
                    this.log.warning?.(`Request failed (${err.message}); retry ${attempt}/${this.maxRetries - 1} in ${wait} ms`);
                    await sleep(wait);
                }
            }
        }
        throw lastErr;
    }

    /** Load the public page once to pick up the current Aura framework id. */
    async init() {
        const html = await this.#request(`${BASE}${LOOKUP_PATH}`, { method: 'GET', headers: { accept: 'text/html' } });
        let decoded = html;
        try { decoded = decodeURIComponent(html); } catch { /* keep raw */ }
        const fwuid = decoded.match(/"fwuid":"([^"]+)"/)?.[1];
        const loaded = decoded.match(/"loaded":(\{[^}]*communityApp[^}]*\})/)?.[1];
        if (fwuid) this.fwuid = fwuid;
        if (loaded) {
            try { this.loaded = JSON.parse(loaded); } catch { /* keep fallback */ }
        }
        this.log.debug?.(`Aura context: fwuid=${this.fwuid}`);
    }

    async #apex(classname, method, params, pageURI = LOOKUP_PATH, allowResync = true) {
        const message = {
            actions: [{
                id: '1;a',
                descriptor: 'aura://ApexActionController/ACTION$execute',
                callingDescriptor: 'UNKNOWN',
                params: { namespace: '', classname, method, params, cacheable: false, isContinuation: false },
            }],
        };
        const context = { mode: 'PROD', fwuid: this.fwuid, app: 'siteforce:communityApp', loaded: this.loaded, dn: [], globals: {}, uad: true };
        const body = new URLSearchParams({
            message: JSON.stringify(message),
            'aura.context': JSON.stringify(context),
            'aura.pageURI': pageURI,
            'aura.token': 'null',
        });
        const text = await this.#request(AURA_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', accept: '*/*', origin: BASE, referer: `${BASE}${pageURI}` },
            body,
        });
        const json = JSON.parse(text.replace(/^\s*while\(1\);\s*/, ''));

        // Salesforce answers with clientOutOfSync after a platform release; it
        // includes the new fwuid in the context. Adopt it and retry once.
        const outOfSync = JSON.stringify(json.exceptionEvent ?? json.events ?? '').includes('clientOutOfSync');
        if (outOfSync && allowResync) {
            if (json.context?.fwuid) this.fwuid = json.context.fwuid;
            if (json.context?.loaded) this.loaded = json.context.loaded;
            return this.#apex(classname, method, params, pageURI, false);
        }

        const action = json.actions?.[0];
        if (!action || action.state !== 'SUCCESS') throw new ApexError(method, action?.error ?? json);
        return action.returnValue?.returnValue ?? null;
    }

    fetchProfessions() {
        return this.#apex('DSPS_LicensesLookupController', 'fetchProfessions', {});
    }

    /**
     * @param {'LicenseNumber'|'IndividualName'|'OrganizationName'|'Profession'} searchType
     * @param {object} dataObj
     * @returns {Promise<object[]>}
     */
    async searchLicense(searchType, dataObj) {
        // The public page sends an empty token when reCAPTCHA isn't rendered.
        const rows = await this.#apex('DSPS_LicensesLookupController', 'searchLicense', {
            searchType,
            dataObj: JSON.stringify(dataObj),
            recapToken: '',
        });
        return Array.isArray(rows) ? rows : [];
    }

    async getDetail(recordId) {
        const rows = await this.#apex('DSPS_LLMS_LicenseLookupDetailsController', 'searchLicense', { recId: recordId }, DETAIL_PATH);
        return Array.isArray(rows) ? rows[0] ?? null : null;
    }
}
