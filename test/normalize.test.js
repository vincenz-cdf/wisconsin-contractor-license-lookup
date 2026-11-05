import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyQuery, normalizeLicenseNumber, splitPersonName, mapRecord, mapDetail, passesFilters } from '../src/normalize.js';
import { buildProfessionIndex } from '../src/professions.js';

// Real rows returned by searchLicense on 2026-11-05.
const RAW_DC = {
    city: 'Caledonia', granted: '2025-05-27', Id: '0cEcr000000ufJpEAI', isProtection: false,
    licenseNo: '2831 - DCFR', licenseType: 'Regular', name: 'LEON GTO ROOFING & SIDING LLC',
    profession: 'Dwelling Contractor', state: 'Wisconsin', status: 'Active', zip: '53406-1809',
};
const RAW_NO_ADDRESS = {
    granted: '2019-12-20', Id: '0cE3d000000XbRvEAK', isProtection: false, licenseNo: '121901224 - DC',
    licenseType: 'Regular', name: 'ABC WATERPROOFING LLC', profession: 'Dwelling Contractor', status: 'Active',
};
const RAW_CPA = {
    city: 'Naples', granted: '1964-07-31', Id: '0cE3d0000007MjpEAE', isProtection: false, licenseNo: '2831 - 1',
    licenseType: 'Regular', name: 'Patrick W Walsh', profession: 'Accountant, Certified Public', state: 'Florida', status: 'Expired', zip: '34114-6431',
};
// Real detail payload (trimmed) for 500 - DCQ.
const DETAIL = {
    currentTerm: { HoursCompleted: 0, HoursToRenew: 12, TermEndtDate: '1/9/2028', TermStartDate: '1/7/2026' },
    eligibleToPractice: 'Eligible', expirationDate: '2028-01-08', licenseCurrentThrough: '2028-01-08',
    location: 'Racine, Wisconsin - 53402-3745', multiState: 'N', orderCount: '0', orders: [],
    relationships: { Individual: [{ relName: 'Jane Doe', licenseNo: '123 - DCQ', relLocation: 'Racine, WI', relType: 'Qualifier', relDate: '2024-01-08' }], Organization: [] },
    status: 'License is current (Active)',
};

const index = buildProfessionIndex(null); // static snapshot

test('license numbers are canonicalized to the portal format', () => {
    assert.equal(normalizeLicenseNumber('2831-DCFR'), '2831 - DCFR');
    assert.equal(normalizeLicenseNumber('2831 - dcfr'), '2831 - DCFR');
    assert.equal(normalizeLicenseNumber(' 121901224 '), '121901224');
    assert.equal(normalizeLicenseNumber('abc'), 'abc');
});

test('auto mode routes numbers to license search and text to organization search', () => {
    assert.deepEqual(classifyQuery('2831-DCFR'), { searchType: 'LicenseNumber', dataObj: { licenseNumbers: ['2831 - DCFR'] }, matchedBy: 'license_number' });
    assert.equal(classifyQuery('121901224').searchType, 'LicenseNumber');
    assert.deepEqual(classifyQuery('roofing'), { searchType: 'OrganizationName', dataObj: { organizationName: 'roofing' }, matchedBy: 'organization_name' });
    assert.throws(() => classifyQuery('   '));
});

test('individual names split into first/last', () => {
    assert.deepEqual(splitPersonName('Kowalski'), { lastName: 'Kowalski' });
    assert.deepEqual(splitPersonName('John  Kowalski'), { firstName: 'John', lastName: 'Kowalski' });
    assert.deepEqual(splitPersonName('Kowalski, John'), { lastName: 'Kowalski', firstName: 'John' });
    const plan = classifyQuery('Kowalski, John', 'individualName');
    assert.deepEqual(plan.dataObj, { lastName: 'Kowalski', selectedOperator: 'AND', firstName: 'John' });
});

test('records map to the output schema', () => {
    const row = mapRecord(RAW_DC, { professionIndex: index, matchedBy: 'organization_name', query: 'roofing' });
    assert.equal(row.license_number, '2831 - DCFR');
    assert.equal(row.license_number_base, '2831');
    assert.equal(row.license_suffix, 'DCFR');
    assert.equal(row.category, 'Trades');
    assert.equal(row.entity_type, 'organization');
    assert.equal(row.zip_code, '53406-1809');
    assert.equal(row.detail_url, 'https://license.wi.gov/s/licenseView?id=0cEcr000000ufJpEAI');
    assert.equal(row.state, 'WI');
    const sparse = mapRecord(RAW_NO_ADDRESS, { professionIndex: index });
    assert.equal(sparse.city, null);
    assert.equal(sparse.dba, null);
});

test('detail payload flattens', () => {
    const d = mapDetail(DETAIL);
    assert.equal(d.expiration_date, '2028-01-08');
    assert.equal(d.eligible_to_practice, 'Eligible');
    assert.equal(d.multi_state, false);
    assert.equal(d.order_count, 0);
    assert.equal(d.ce_hours_required, 12);
    assert.deepEqual(d.related_individuals, [{ name: 'Jane Doe', license_number: '123 - DCQ', location: 'Racine, WI', type: 'Qualifier', start_date: '2024-01-08' }]);
    assert.deepEqual(mapDetail(null), {});
});

test('filters: construction-only drops non-trade professions', () => {
    const cats = new Set(['trades', 'manufactured homes']);
    const dc = mapRecord(RAW_DC, { professionIndex: index });
    const cpa = mapRecord(RAW_CPA, { professionIndex: index });
    assert.equal(passesFilters(dc, { categories: cats }), true);
    assert.equal(passesFilters(cpa, { categories: cats }), false);
});

test('filters: status, city, zip prefix, profession', () => {
    const dc = mapRecord(RAW_DC, { professionIndex: index });
    assert.equal(passesFilters(dc, { status: 'active' }), true);
    assert.equal(passesFilters(dc, { status: 'Expired' }), false);
    assert.equal(passesFilters(dc, { city: 'caledonia' }), true);
    assert.equal(passesFilters(dc, { zipPrefix: '534' }), true);
    assert.equal(passesFilters(dc, { zipPrefix: '532' }), false);
    assert.equal(passesFilters(dc, { professions: new Set(['dwelling contractor']) }), true);
    assert.equal(passesFilters(dc, { professions: new Set(['hvac contractor']) }), false);
});

test('profession index prefers live payload and tags org vs individual', () => {
    const live = buildProfessionIndex({
        Org: [{ category: 'Trades', label: 'HVAC Contractor', value: 'X1' }],
        Trades: [{ category: 'Trades', label: 'HVAC Qualifier', value: 'X2' }],
    });
    assert.equal(live.get('hvac contractor').entityType, 'organization');
    assert.equal(live.get('hvac qualifier').entityType, 'individual');
    assert.equal(live.size, 2);
    assert.ok(index.get('dwelling contractor qualifier'));
});
