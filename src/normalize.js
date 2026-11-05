// Pure helpers: query classification, license-number normalization,
// record mapping and filtering. No I/O here so it is unit-testable.

export const SOURCE_URL = 'https://license.wi.gov/s/license-lookup';
export const DETAIL_URL = 'https://license.wi.gov/s/licenseView?id=';

// LicensE numbers look like "121901224 - DC", "2831 - DCFR", "500 - DCQ", "30000 - 1".
const LICENSE_RE = /^\s*(\d{1,12})\s*(?:-\s*([A-Z0-9]{1,8}))?\s*$/i;

/**
 * Decide how a free-text entry should be searched.
 * @param {string} entry
 * @param {'auto'|'licenseNumber'|'organizationName'|'individualName'} searchBy
 * @returns {{searchType:'LicenseNumber'|'OrganizationName'|'IndividualName', dataObj:object, matchedBy:string}}
 */
export function classifyQuery(entry, searchBy = 'auto') {
    const q = String(entry ?? '').trim();
    if (!q) throw new Error('Empty query');
    const mode = searchBy === 'auto' ? (LICENSE_RE.test(q) ? 'licenseNumber' : 'organizationName') : searchBy;
    switch (mode) {
        case 'licenseNumber':
            return { searchType: 'LicenseNumber', dataObj: { licenseNumbers: [normalizeLicenseNumber(q)] }, matchedBy: 'license_number' };
        case 'individualName': {
            const { firstName, lastName } = splitPersonName(q);
            const dataObj = { lastName, selectedOperator: 'AND' };
            if (firstName) dataObj.firstName = firstName;
            return { searchType: 'IndividualName', dataObj, matchedBy: 'individual_name' };
        }
        case 'organizationName':
            return { searchType: 'OrganizationName', dataObj: { organizationName: q }, matchedBy: 'organization_name' };
        default:
            throw new Error(`Unknown searchBy: ${searchBy}`);
    }
}

/**
 * The portal only matches "2831 - DCFR" (spaces around the dash) or the bare
 * number "2831". "2831-DCFR" returns nothing, so canonicalize.
 */
export function normalizeLicenseNumber(raw) {
    const m = String(raw).match(LICENSE_RE);
    if (!m) return String(raw).trim();
    return m[2] ? `${m[1]} - ${m[2].toUpperCase()}` : m[1];
}

/** "Smith, John" -> {lastName:Smith, firstName:John}; "John Smith" -> same; "Smith" -> lastName only. */
export function splitPersonName(q) {
    const s = q.trim().replace(/\s+/g, ' ');
    if (s.includes(',')) {
        const [last, first] = s.split(',').map((x) => x.trim());
        return { lastName: last, firstName: first || undefined };
    }
    const parts = s.split(' ');
    if (parts.length === 1) return { lastName: parts[0] };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

const blank = (v) => (v === undefined || v === null || v === '' ? null : v);

/**
 * Map one raw searchLicense row to the output schema.
 * Raw keys seen: Id, licenseNo, profession, licenseType, name, doingBusinessAs,
 * city, state, zip, granted, status, isProtection.
 */
export function mapRecord(raw, { professionIndex, matchedBy, query } = {}) {
    const licenseNo = blank(raw.licenseNo);
    const [base, suffix] = licenseNo ? licenseNo.split(/\s*-\s*/) : [null, null];
    const prof = raw.profession ? professionIndex?.get(String(raw.profession).trim().toLowerCase()) : undefined;
    return {
        state: 'WI',
        license_number: licenseNo,
        license_number_base: blank(base),
        license_suffix: blank(suffix),
        profession: blank(raw.profession),
        category: prof?.category ?? null,
        entity_type: prof?.entityType ?? null,
        credential_type: blank(raw.licenseType),
        name: blank(raw.name),
        dba: blank(raw.doingBusinessAs),
        city: blank(raw.city),
        state_name: blank(raw.state),
        zip_code: blank(raw.zip),
        granted_date: blank(raw.granted),
        status: blank(raw.status),
        address_protected: raw.isProtection === true,
        record_id: blank(raw.Id),
        detail_url: raw.Id ? DETAIL_URL + raw.Id : null,
        matched_by: matchedBy ?? null,
        query: query ?? null,
        source_url: SOURCE_URL,
    };
}

/** Flatten the detail payload (DSPS_LLMS_LicenseLookupDetailsController.searchLicense). */
export function mapDetail(d) {
    if (!d) return {};
    const rel = d.relationships ?? {};
    const mapRel = (r) => ({
        name: blank(r.relName ?? r.name),
        license_number: blank(r.licenseNo),
        location: blank(r.relLocation ?? r.location),
        type: blank(r.relType ?? r.type),
        start_date: blank(r.relDate ?? r.startDate),
    });
    const term = d.currentTerm ?? null;
    return {
        expiration_date: blank(d.expirationDate),
        current_through: blank(d.licenseCurrentThrough),
        eligible_to_practice: blank(d.eligibleToPractice),
        status_detail: blank(d.status),
        location: blank(d.location),
        multi_state: d.multiState === 'Y' ? true : d.multiState === 'N' ? false : null,
        order_count: d.orderCount != null && d.orderCount !== '' ? Number(d.orderCount) : null,
        orders: (d.orders ?? []).map((o) => ({
            order_number: blank(o.hearingId ?? o.orderNo),
            order_date: blank(o.orderDate),
            subject: blank(o.subject),
            document_url: blank(o.distributionLinkUrl),
        })),
        related_individuals: (rel.Individual ?? []).map(mapRel),
        related_organizations: (rel.Organization ?? []).map(mapRel),
        ce_hours_required: term?.HoursToRenew ?? null,
        ce_hours_completed: term?.HoursCompleted ?? null,
        ce_term_start: blank(term?.TermStartDate),
        ce_term_end: blank(term?.TermEndtDate),
    };
}

/**
 * Client-side filters. All are case-insensitive; empty filter = pass.
 * @param {object} row mapped record
 * @param {{status?:string, city?:string, zipPrefix?:string, professions?:Set<string>|null, categories?:Set<string>|null}} f
 */
export function passesFilters(row, f = {}) {
    const eq = (a, b) => String(a ?? '').trim().toLowerCase() === String(b).trim().toLowerCase();
    if (f.status && !eq(row.status, f.status)) return false;
    if (f.city && !eq(row.city, f.city)) return false;
    if (f.zipPrefix && !String(row.zip_code ?? '').startsWith(String(f.zipPrefix).trim())) return false;
    if (f.professions?.size && !f.professions.has(String(row.profession ?? '').toLowerCase())) return false;
    if (f.categories?.size && !(row.category && f.categories.has(row.category.toLowerCase()))) return false;
    return true;
}
