# Wisconsin Contractor License Lookup & Export (DSPS)

Verify a Wisconsin contractor's credential in seconds, or download every licensed Dwelling Contractor, Electrical Contractor, HVAC Contractor, plumber or electrician in the state as a clean table. Data comes straight from the official **Wisconsin Department of Safety and Professional Services (DSPS) LicensE public lookup**.

## Pain points

- The DSPS lookup shows 10 rows per page and has no export button.
- Searching one contractor at a time is slow when you have a list of 200 subcontractors to check.
- Expiration dates, disciplinary orders and the linked Dwelling Contractor Qualifier are only on each record's separate detail page.

## What this actor does

- **Lookup mode**: give license numbers or names (one or many). You get every matching credential.
- **Export mode**: leave the query empty and pick license types. You get the complete roster for each type (for example about 21,000 Dwelling Contractor Qualifiers).
- **Optional detail enrichment**: expiration date, eligibility to practice, disciplinary orders, related qualifiers/organizations and continuing-education hours.
- Filters: status, city, ZIP prefix, license type, construction & trades only.

## Who it's for

General contractors vetting subs · insurers and sureties · property managers · lenders and title companies · building-material suppliers and lead-gen teams · compliance and procurement.

## How to use

1. **Verify one contractor:** set **License number or name** to `2831 - DCFR`, or to a business name like `Leon GTO Roofing`.
2. **Verify a list:** paste license numbers or names into **Queries (batch)**.
3. **Export a roster:** clear the query, add `Dwelling Contractor` (and others) to **License types**, set **Status** to `Active`, and set **Max results** to `0` for no limit.
4. Turn on **Include detail page data** if you need expiration dates and disciplinary orders.

### Input examples

```json
{ "query": "2831-DCFR" }
```

```json
{ "queries": ["roofing", "121901224", "Kowalski Electric"], "statusFilter": "Active" }
```

```json
{ "licenseTypes": ["Dwelling Contractor", "HVAC Contractor"], "statusFilter": "Active", "zipPrefix": "532", "maxResults": 0 }
```

```json
{ "query": "Kowalski, John", "searchBy": "individualName", "licenseTypes": ["Master Electrician"], "includeDetails": true }
```

## Inputs

| Field | Description |
|---|---|
| `query` | License number or part of a name. Empty plus no `queries` = export mode. |
| `queries` | Batch of license numbers or names. |
| `searchBy` | `auto` (default), `licenseNumber`, `organizationName`, `individualName`. Auto treats digits (optionally with a suffix such as `- DC`) as a license number; anything else is an organization/DBA name. |
| `licenseTypes` | Export: types to download. Lookup: keep only these types. Must match DSPS names. |
| `constructionOnly` | Lookup without `licenseTypes`: keep only Trades and Manufactured Homes credentials (default `true`). Set to `false` to see every profession. |
| `statusFilter` | Exact status, e.g. `Active`, `Expired`. |
| `cityFilter`, `zipPrefix` | Location filters. |
| `includeDetails` | Fetch each record's detail page (one extra request per record). |
| `maxResults` | Cap per query or per license type (default 100, `0` = no limit). |
| `proxyConfiguration` | Optional; not normally needed. |

### Construction license types

Organizations: Dwelling Contractor · Dwelling Contractor Restricted · Electrical Contractor · HVAC Contractor · Elevator Contractor · Liquefied Gas Supplier · UDC Inspection Agency · Electrical Inspection Agency · Manufactured Home Dealers / Manufacturer / Communities.

Individuals: Dwelling Contractor Qualifier · HVAC Qualifier · Master / Journeyman / Registered Electrician (incl. Industrial & Residential) · Master / Journeyman Plumber (incl. Restricted) · Automatic Fire Sprinkler (Contractor, Fitter, Tester) · Utility Contractor · Pipelayer · Welder · Blaster (Class 1–7) · POWTS Inspector / Maintainer · Soil Tester · UDC & Commercial Inspectors · Elevator / Lift Mechanic · Manufactured Home Installer · Architect · Professional Engineer · Home Inspector · Land Surveyor.

The actor loads the live DSPS list at start-up, so newly added types work too.

## What you get

| Field | Example |
|---|---|
| `state` | `WI` |
| `license_number` | `2831 - DCFR` |
| `license_number_base` / `license_suffix` | `2831` / `DCFR` |
| `profession` | `Dwelling Contractor` |
| `category` | `Trades` |
| `entity_type` | `organization` or `individual` |
| `credential_type` | `Regular` |
| `name` / `dba` | `LEON GTO ROOFING & SIDING LLC` |
| `city` / `state_name` / `zip_code` | `Caledonia` / `Wisconsin` / `53406-1809` |
| `granted_date` | `2025-05-27` |
| `status` | `Active` |
| `address_protected` | `false` |
| `record_id` / `detail_url` | link to the official detail page |
| `matched_by` / `query` | how the row was found |
| `source_url` | the DSPS lookup |

With `includeDetails`: `expiration_date`, `current_through`, `eligible_to_practice`, `status_detail`, `location`, `multi_state`, `order_count`, `orders[]`, `related_individuals[]`, `related_organizations[]`, `ce_hours_required`, `ce_hours_completed`, `ce_term_start`, `ce_term_end`.

DSPS does not publish phone numbers or email addresses in this lookup, so those fields are not included.

### Sample record

```json
{
  "state": "WI",
  "license_number": "2831 - DCFR",
  "license_number_base": "2831",
  "license_suffix": "DCFR",
  "profession": "Dwelling Contractor",
  "category": "Trades",
  "entity_type": "organization",
  "credential_type": "Regular",
  "name": "LEON GTO ROOFING & SIDING LLC",
  "dba": null,
  "city": "Caledonia",
  "state_name": "Wisconsin",
  "zip_code": "53406-1809",
  "granted_date": "2025-05-27",
  "status": "Active",
  "address_protected": false,
  "record_id": "0cEcr000000ufJpEAI",
  "detail_url": "https://license.wi.gov/s/licenseView?id=0cEcr000000ufJpEAI",
  "matched_by": "organization_name",
  "query": "roofing",
  "source_url": "https://license.wi.gov/s/license-lookup",
  "expiration_date": "2027-05-27",
  "eligible_to_practice": "Eligible",
  "order_count": 0
}
```

## Pricing (pay per event)

You pay per license record saved to the dataset. Runs that find nothing save nothing and cost nothing beyond minimal platform usage. Detail enrichment is included in the per-record price but makes runs slower.

## Use cases

- Check that a sub's Dwelling Contractor credential is **Active** before pulling a permit (Wisconsin requires it for 1- and 2-family dwellings).
- Monthly re-check of a vendor list: flag anything that turned `Expired` or has new disciplinary orders.
- Build a territory list of active HVAC or Electrical Contractors by ZIP prefix.
- Match a Dwelling Contractor company to its Qualifier via `related_individuals`.

## Limitations

- The source can change without notice. If DSPS changes its site, the actor may need an update.
- `license.wi.gov` is behind Cloudflare. If it refuses the actor's network, the run stops with a clear error instead of retrying.
- Some records have no address (`city`/`zip_code` empty), and some are marked `address_protected` by DSPS.
- Name searches are substring matches run by DSPS; very short terms return large result sets.
- A bare number like `2831` matches every profession that uses that number. Use the full form `2831 - DCFR`, or keep `constructionOnly` on.

## FAQ

**Is this data public?** Yes. DSPS publishes it as its official public credential lookup, which it describes as primary-source verification.

**How fresh is it?** Every run queries DSPS live.

**Can it find business registrations or liens?** No. Those come from other agencies (DFI for entities and UCC, DOR for tax liens, circuit courts for judgment and construction liens).

## Data & lawful use

Records contain names and city/ZIP of licensed individuals. Use them in line with applicable law, including FCRA (do not use for employment, credit or insurance eligibility decisions without a compliant process), CAN-SPAM, TCPA and state privacy laws. Always confirm critical decisions directly with DSPS.

## Disclaimer

This actor is not affiliated with or endorsed by the Wisconsin Department of Safety and Professional Services. The data may contain errors or lag behind DSPS records.

## Changelog

- **0.1.0**: first release. Lookup by license number, organization name or individual name; export by license type; filters; optional detail enrichment.
