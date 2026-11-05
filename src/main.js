import { Actor, log } from 'apify';
import { LicenseClient, BlockedError } from './client.js';
import { buildProfessionIndex, DEFAULT_EXPORT_TYPES, CONSTRUCTION_CATEGORIES } from './professions.js';
import { classifyQuery, mapRecord, mapDetail, passesFilters } from './normalize.js';

await Actor.init();

try {
    const input = (await Actor.getInput()) ?? {};
    const {
        query = '',
        queries = [],
        searchBy = 'auto',
        licenseTypes = [],
        constructionOnly = true,
        statusFilter = '',
        cityFilter = '',
        zipPrefix = '',
        includeDetails = false,
        maxResults = 100,
        proxyConfiguration,
    } = input;

    const entries = [...new Set([query, ...queries].map((q) => String(q ?? '').trim()).filter(Boolean))];
    const cap = Number(maxResults) > 0 ? Number(maxResults) : Infinity;

    let proxyUrlFn;
    if (proxyConfiguration?.useApifyProxy || proxyConfiguration?.proxyUrls?.length) {
        const proxy = await Actor.createProxyConfiguration(proxyConfiguration);
        if (proxy) proxyUrlFn = () => proxy.newUrl();
    }

    const client = new LicenseClient({ proxyUrlFn, log });
    await client.init();

    let professionPayload = null;
    try {
        professionPayload = await client.fetchProfessions();
    } catch (err) {
        if (err instanceof BlockedError) throw err;
        log.warning(`Could not load the live license-type list (${err.message}); using the built-in snapshot.`);
    }
    const professionIndex = buildProfessionIndex(professionPayload);

    // Resolve requested license types (labels, case-insensitive).
    const requestedTypes = (licenseTypes ?? []).map((t) => String(t).trim()).filter(Boolean);
    const unknownTypes = requestedTypes.filter((t) => !professionIndex.has(t.toLowerCase()));
    if (unknownTypes.length) log.warning(`Unknown license types ignored: ${unknownTypes.join(', ')}`);
    const knownTypes = requestedTypes.filter((t) => professionIndex.has(t.toLowerCase()));

    const filters = {
        status: statusFilter || null,
        city: cityFilter || null,
        zipPrefix: zipPrefix || null,
        professions: knownTypes.length ? new Set(knownTypes.map((t) => t.toLowerCase())) : null,
        categories: !knownTypes.length && constructionOnly
            ? new Set(CONSTRUCTION_CATEGORIES.map((c) => c.toLowerCase()))
            : null,
    };

    const seen = new Set();
    let pushed = 0;

    async function emit(rows) {
        let batch = [];
        for (const row of rows) {
            if (row.record_id && seen.has(row.record_id)) continue;
            if (row.record_id) seen.add(row.record_id);
            batch.push(row);
        }
        if (includeDetails && batch.length) {
            batch = await enrich(batch);
        }
        if (batch.length) {
            await Actor.pushData(batch);
            pushed += batch.length;
        }
    }

    async function enrich(rows, concurrency = 4) {
        const out = new Array(rows.length);
        let i = 0;
        const worker = async () => {
            while (i < rows.length) {
                const idx = i++;
                const row = rows[idx];
                try {
                    const detail = row.record_id ? await client.getDetail(row.record_id) : null;
                    out[idx] = { ...row, ...mapDetail(detail) };
                } catch (err) {
                    if (err instanceof BlockedError) throw err;
                    log.warning(`Detail lookup failed for ${row.license_number}: ${err.message}`);
                    out[idx] = { ...row, detail_error: err.message };
                }
            }
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));
        return out;
    }

    if (entries.length) {
        // LOOKUP MODE: each entry is a license number or a name.
        log.info(`Lookup mode: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`);
        for (const entry of entries) {
            let plan;
            try {
                plan = classifyQuery(entry, searchBy);
            } catch (err) {
                log.warning(`Skipping "${entry}": ${err.message}`);
                continue;
            }
            // Narrow on the server when exactly one license type was requested.
            if (knownTypes.length === 1 && plan.searchType !== 'LicenseNumber') {
                const p = professionIndex.get(knownTypes[0].toLowerCase());
                plan.dataObj.selectedCategory = p.category;
                plan.dataObj.selectedProfession = p.value;
            }
            const raw = await client.searchLicense(plan.searchType, plan.dataObj);
            const rows = raw
                .map((r) => mapRecord(r, { professionIndex, matchedBy: plan.matchedBy, query: entry }))
                .filter((r) => passesFilters(r, filters))
                .slice(0, cap);
            log.info(`"${entry}" (${plan.matchedBy}): ${raw.length} found, ${rows.length} kept after filters/limit.`);
            await emit(rows);
        }
    } else {
        // EXPORT MODE: download whole license types.
        const types = knownTypes.length ? knownTypes : DEFAULT_EXPORT_TYPES;
        log.info(`Export mode: ${types.join(', ')}.`);
        const exportFilters = { ...filters, professions: null, categories: null };
        for (const label of types) {
            const p = professionIndex.get(label.toLowerCase());
            if (!p) {
                log.warning(`License type "${label}" is not in the catalog; skipped.`);
                continue;
            }
            const raw = await client.searchLicense('Profession', { selectedCategory: p.category, selectedProfession: p.value });
            const rows = raw
                .map((r) => mapRecord(r, { professionIndex, matchedBy: 'license_type', query: p.label }))
                .filter((r) => passesFilters(r, exportFilters))
                .slice(0, cap);
            log.info(`${p.label}: ${raw.length} on file, ${rows.length} kept after filters/limit.`);
            await emit(rows);
        }
    }

    log.info(`Done. ${pushed} record(s) saved.`);
    if (pushed === 0) log.info('No records matched. Empty runs produce no dataset items.');
} catch (err) {
    if (err instanceof BlockedError) {
        await Actor.fail(err.message);
    } else {
        throw err;
    }
}

await Actor.exit();
