# rescueApi CloudBase function

This MVP function is intentionally a single action-dispatch function so the mini program only needs one CloudBase deployment target while the product shape is still moving.

## Collections

- `user_profiles`
- `rescue_cases`
- `case_events`
- `expense_records`
- `support_threads`
- `support_entries`
- `evidence_assets`
- `shared_evidence_groups`

## Required setup

1. Create a CloudBase environment for the mini program AppID.
2. Create the collections above.
3. Keep front-end direct database writes disabled; this function is the write boundary.
4. Upload and deploy this folder as the `rescueApi` cloud function.
5. Confirm `src/config/cloudbase.ts` points at `cloud1-9gl5sric0e5b386b`.
6. Import the development seed documents from `docs/cloudbase_seed/` if the homepage should show a sample case immediately.

If the cloud function is not deployed yet, the mini program falls back to the existing local repository for infrastructure errors.
