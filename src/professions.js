// Wisconsin DSPS LicensE profession (credential) catalog.
// Captured from DSPS_LicensesLookupController.fetchProfessions on 2026-11-05.
// The actor refreshes this list live at start-up and only falls back to this
// snapshot when the live call fails. IDs are Salesforce record IDs and are
// stable unless DSPS rebuilds its catalog.

/** Organization-level credentials (the "Org" list): issued to a business. */
export const ORG_PROFESSIONS = [
    { label: 'Dwelling Contractor', value: '0eh3d0000000Q8NAAU', category: 'Trades' },
    { label: 'Dwelling Contractor Restricted', value: '0eh3d0000000Q8OAAU', category: 'Trades' },
    { label: 'Electrical Contractor', value: '0eh3d0000000Q8kAAE', category: 'Trades' },
    { label: 'Electrical Inspection Agency', value: '0eh3d0000000Q8lAAE', category: 'Trades' },
    { label: 'Elevator Contractor', value: '0eh3d0000000Q9DAAU', category: 'Trades' },
    { label: 'Fireworks Manufacturer', value: '0eh3d0000000Q9NAAU', category: 'Trades' },
    { label: 'HVAC Contractor', value: '0eh3d0000000Q90AAE', category: 'Trades' },
    { label: 'Liquefied Gas Supplier', value: '0eh3d0000000Q9cAAE', category: 'Trades' },
    { label: 'Liquefied Gas Supplier Restricted', value: '0eh3d0000000Q9WAAU', category: 'Trades' },
    { label: 'UDC Inspection Agency', value: '0eh3d0000000Q9UAAU', category: 'Trades' },
    { label: 'Manufactured Home Communities', value: '0eh3d0000000Q8aAAE', category: 'Manufactured Homes' },
    { label: 'Manufactured Home Dealers', value: '0eh3d0000000Q9OAAU', category: 'Manufactured Homes' },
    { label: 'Manufactured Home Manufacturer', value: '0eh3d0000000Q8bAAE', category: 'Manufactured Homes' },
    { label: 'Certificate of Authorization – Architecture, Engineer, Designer of Engineering, or Interior Design', value: '0eh3d0000000898AAA', category: 'Business' },
];

/** Individual credentials in the construction-related categories. */
export const INDIVIDUAL_PROFESSIONS = [
    ['Automatic Fire Sprinkler Contractor', '0eh3d0000000Q8cAAE'],
    ['Automatic Fire Sprinkler Contractor Maintenance', '0eh3d0000000Q8dAAE'],
    ['Automatic Fire Sprinkler Fitter Maintenance', '0eh3d0000000Q8fAAE'],
    ['Automatic Fire Sprinkler Fitter, Journeyman', '0eh3d0000000Q8eAAE'],
    ['Automatic Fire Sprinkler System Apprentice', '0eh3d0000000Q84AAE'],
    ['Automatic Fire Sprinkler System Tester', '0eh3d0000000Q8gAAE'],
    ['Automatic Fire Sprinkler System Tester Learner', '0eh3d0000000Q82AAE'],
    ['Blaster, Class 1', '0eh3d0000000Q9EAAU'],
    ['Blaster, Class 2', '0eh3d0000000Q9FAAU'],
    ['Blaster, Class 3', '0eh3d0000000Q9GAAU'],
    ['Blaster, Class 4', '0eh3d0000000Q9HAAU'],
    ['Blaster, Class 5', '0eh3d0000000Q9IAAU'],
    ['Blaster, Class 6', '0eh3d0000000Q9JAAU'],
    ['Blaster, Class 7', '0eh3d0000000Q9KAAU'],
    ['Boiler-Pressure Vessel Inspector', '0eh3d0000000Q9LAAU'],
    ['Commercial Building Inspector', '0eh3d0000000Q8hAAE'],
    ['Commercial Electrical Inspector', '0eh3d0000000Q8iAAE'],
    ['Commercial Plumbing Inspector', '0eh3d0000000Q8jAAE'],
    ['Cross Connection Control Tester', '0eh3d0000000Q9gAAE'],
    ['Dwelling Contractor Qualifier', '0eh3d0000000Q92AAE'],
    ['Electrical Apprentice', '0eh3d0000000Q85AAE'],
    ['Electrical Apprentice, Industrial', '0eh3d0000000Q86AAE'],
    ['Electrical Apprentice, Residential', '0eh3d0000000Q87AAE'],
    ['Electrician, Registered', '0eh3d0000000Q88AAE'],
    ['Elevator Apprentice', '0eh3d0000000Q93AAE'],
    ['Elevator Apprentice Restricted', '0eh3d0000000Q94AAE'],
    ['Elevator Helper', '0eh3d0000000Q95AAE'],
    ['Elevator Inspector', '0eh3d0000000Q96AAE'],
    ['Elevator Mechanic', '0eh3d0000000Q97AAE'],
    ['Elevator Mechanic Restricted', '0eh3d0000000Q98AAE'],
    ['Fire Detection, Prevention, and Suppression Inspector', '0eh3d0000000Q9MAAU'],
    ['HVAC Qualifier', '0eh3d0000000Q91AAE'],
    ['Journeyman Electrician', '0eh3d0000000Q8mAAE'],
    ['Journeyman Electrician, Industrial', '0eh3d0000000Q8nAAE'],
    ['Journeyman Electrician, Residential', '0eh3d0000000Q8oAAE'],
    ['Journeyman Plumber', '0eh3d0000000Q8rAAE'],
    ['Journeyman Plumber Restricted Appliance', '0eh3d0000000Q8sAAE'],
    ['Journeyman Plumber Restricted Service', '0eh3d0000000Q8tAAE'],
    ['Lift Apprentice', '0eh3d0000000Q99AAE'],
    ['Lift Helper', '0eh3d0000000Q9AAAU'],
    ['Lift Mechanic', '0eh3d0000000Q9BAAU'],
    ['Master Electrician', '0eh3d0000000Q8pAAE'],
    ['Master Electrician, Registered', '0eh3d0000000Q83AAE'],
    ['Master Electrician, Residential', '0eh3d0000000Q8qAAE'],
    ['Master Plumber', '0eh3d0000000Q8uAAE'],
    ['Master Plumber Restricted Appliance', '0eh3d0000000Q8vAAE'],
    ['Master Plumber Restricted Service', '0eh3d0000000Q8wAAE'],
    ['Pipelayer', '0eh3d0000000Q9YAAU'],
    ['Plumbing Apprentice', '0eh3d0000000Q8LAAU'],
    ['Plumbing Learner Restricted Appliance', '0eh3d0000000Q8xAAE'],
    ['Plumbing Learner Restricted Service', '0eh3d0000000Q8yAAE'],
    ['POWTS Inspector', '0eh3d0000000Q9ZAAU'],
    ['POWTS Maintainer', '0eh3d0000000Q9XAAU'],
    ['Soil Erosion Inspector', '0eh3d0000000Q9aAAE'],
    ['Soil Tester', '0eh3d0000000Q9bAAE'],
    ['UDC Construction Inspector', '0eh3d0000000Q9RAAU'],
    ['UDC Electrical Inspector', '0eh3d0000000Q9SAAU'],
    ['UDC HVAC Inspector', '0eh3d0000000Q9TAAU'],
    ['UDC Plumbing Inspector', '0eh3d0000000Q9VAAU'],
    ['Utility Contractor', '0eh3d0000000Q9dAAE'],
    ['Weld Test Conductor', '0eh3d0000000Q9fAAE'],
    ['Welder', '0eh3d0000000Q9eAAE'],
].map(([label, value]) => ({ label, value, category: 'Trades' })).concat([
    { label: 'Manufactured Home Installer', value: '0eh3d0000000Q9PAAU', category: 'Manufactured Homes' },
    { label: 'Manufactured Home Salesperson', value: '0eh3d0000000Q9QAAU', category: 'Manufactured Homes' },
    { label: 'Architect', value: '0eh3d0000000899AAA', category: 'Business' },
    { label: 'Designer Of Engineering Systems', value: '0eh3d000000089GAAQ', category: 'Business' },
    { label: 'Home Inspector', value: '0eh3d000000089aAAA', category: 'Business' },
    { label: 'Landscape Architect', value: '0eh3d000000089EAAQ', category: 'Business' },
    { label: 'Professional Engineer', value: '0eh3d000000089zAAA', category: 'Business' },
    { label: 'Professional Land Surveyor', value: '0eh3d0000000897AAA', category: 'Business' },
]);

/** Default export set when the user gives no query and no license types. */
export const DEFAULT_EXPORT_TYPES = [
    'Dwelling Contractor',
    'Dwelling Contractor Restricted',
    'Electrical Contractor',
    'HVAC Contractor',
];

/** Categories treated as construction/trades for lookup filtering. */
export const CONSTRUCTION_CATEGORIES = ['Trades', 'Manufactured Homes'];

/**
 * Build a lookup table from a live fetchProfessions() payload
 * ({ Health:[...], Trades:[...], Business:[...], 'Manufactured Homes':[...], Org:[...] }).
 * Falls back to the static snapshot when payload is missing.
 * @returns {Map<string, {label:string,value:string,category:string,entityType:'organization'|'individual'}>}
 *   keyed by lower-cased label.
 */
export function buildProfessionIndex(payload) {
    const index = new Map();
    const add = (p, entityType) => {
        if (!p?.label || !p?.value) return;
        const key = p.label.trim().toLowerCase();
        if (!index.has(key)) index.set(key, { label: p.label.trim(), value: p.value, category: p.category ?? null, entityType });
    };
    if (payload && typeof payload === 'object') {
        for (const p of payload.Org ?? []) add(p, 'organization');
        for (const [cat, list] of Object.entries(payload)) {
            if (cat === 'Org' || !Array.isArray(list)) continue;
            for (const p of list) add({ ...p, category: p.category ?? cat }, 'individual');
        }
    }
    if (index.size === 0) {
        for (const p of ORG_PROFESSIONS) add(p, 'organization');
        for (const p of INDIVIDUAL_PROFESSIONS) add(p, 'individual');
    }
    return index;
}
