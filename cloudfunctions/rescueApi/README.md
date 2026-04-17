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

## Profile and support history

- `getMyProfile` and `updateMyProfile` read and write the current user's `user_profiles` document by cloud function OPENID.
- Profile QR images are stored as CloudBase `cloud://` file IDs in `evidence_assets(kind=payment_qr)` and linked through `user_profiles.paymentQrAssetId`.
- `getMySupportHistory` aggregates confirmed support entries for the current OPENID and returns case-level support history items.
- `getRescuerHomepage` returns public rescuer profile data and published case bundles by `rescuerId` or `caseId`.
- `updateCaseProfile` updates owner-managed case profile fields such as animal name and cover image file ID.
- `getCaseRecordDetail` returns immutable record details for expenses, progress updates, budget adjustments, and support records.

## Required setup

1. Create a CloudBase environment for the mini program AppID.
2. Create the collections above.
3. Keep front-end direct database writes disabled; this function is the write boundary.
4. Upload and deploy this folder as the `rescueApi` cloud function.
5. Confirm `src/config/cloudbase.ts` points at `cloud1-9gl5sric0e5b386b`.
6. Import the development seed documents from `docs/cloudbase_seed/` if the homepage should show a sample case immediately.

If the cloud function is not deployed yet, the mini program falls back to the existing local repository for infrastructure errors.

## Support entry loop

- `createSupportEntry` writes pending support entries, private proof assets, support thread aggregates, and a private pending support event.
- `createManualSupportEntry` writes owner-entered confirmed support entries and public `manual_entry` support events.
- `reviewSupportEntry` updates entries to `confirmed` or `unmatched`, recomputes the support thread, and updates the projected support event.
- Confirmed support events become public timeline items; unmatched support events stay private with `verificationStatus=rejected`.
- Screenshot proofs must be CloudBase `cloud://` file IDs. Local temp paths are rejected by the cloud function.

## Rescue content writes

- `createProgressUpdate` writes public progress events, optional progress photo assets, and updates the case status fields.
- `createExpenseRecord` writes structured expense records plus projected public expense events.
- `createBudgetAdjustment` writes public budget adjustment events and updates the case target amount.
- These owner-only actions use the cloud function OPENID as the authority source.
