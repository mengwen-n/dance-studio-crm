# Dance Studio CRM

Low-cost Google Sheets and Apps Script CRM/automation template for dance studios. The active studio implementation is **The Wolves Dance Academy**. The Google Sheet is the private operating backend; this repository stores reusable templates, business rules, Apps Script source, and fictional test data only.

## Current implementation status

Configuration separation is implemented locally; live migration remains pending.
See [configuration migration](apps-script/CONFIGURATION.md). Earlier demo successes do not
establish production readiness; the migration document lists remaining reliability gaps.

### Done and tested in the Wolves workbook

- Standard Google Sheets backend with controlled dropdowns, IDs, feature controls, owner-facing `START_HERE`, and operational tabs.
- Lead, member, crew, package, payment, entitlement, attendance, room booking, event, follow-up, automation-log, and change-log data structure.
- Wolves-specific pricing and membership rules, including public/in-house packages, trials, walk-ins, in-house registration and rest periods.
- V1 attendance package-credit deduction, including ledger entries, earliest-expiring entitlement selection, and duplicate protection.
- V2 paid package payment -> entitlement creation.
- V2.1 important-field audit entries in `Change_Log`.
- V3 daily expiry/exhausted package maintenance.
- V4 trial-attended follow-up creation.
- V5 room conflict detection: Yang is exclusive; Yin allows up to three concurrent crew-practice teams only when no class/rental/exclusive booking overlaps.
- V6 `Class_Sessions` -> linked `Room_Bookings` sync. Cancelling a fixed class releases the room and can confirm an otherwise-free pending crew booking.
- V7 fixed-class session generation exactly seven days ahead. Fixed classes default to `ROOM-YANG`; generated sessions create their linked fixed-class booking through V6.
- V8 monthly in-house fee generation is implemented locally and ready for a fictional September test; it creates RM80 charges or RM0 waived rest records based on the workbook settings.
- V8.1 in-house rest lifecycle is implemented locally: it applies approved rest start/end dates to member and request statuses.
- V9 lead conversion is implemented locally: a converted lead creates or links one member while blocking possible phone/email duplicates for review.
- V10 walk-in attendance charge is implemented locally: eligible fixed-class attendance creates exactly one pending RM40 public-member or RM45 non-member charge. In-house crew is flagged to buy the in-house credit package instead.
- V11 walk-in payment reconciliation is implemented locally: a matching paid payment marks its linked V10 charge and attendance as Paid. It blocks missing, duplicate, or wrong-amount payments for review.
- V12 trial attendance validation is tested in the Wolves workbook: a paid RM100 seven-day trial permits only eligible Fixed-class attendance and never deducts credits.
- Date display in `Class_Sessions.Session_Date` is standardized to `yyyy-mm-dd`.

### Confirmed studio operating rules

- Fixed recurring classes use **Yang** by default.
- Yin: 480 sq ft / around 10 people. RM40 hourly, RM100 for first 3 hours, then RM20 per following hour.
- Yang: 1,000 sq ft / 20+ people. RM60 hourly, RM150 for first 3 hours, then RM30 per following hour.
- In-house studio fee: RM80 per active calendar month; approved rest is RM0 and must be requested before the 20th for the following month. Rest is not an exit.
- In-house registration: RM120 in January-June, RM60 in July-December; no new registration charge after approved rest.
- In-house packages: RM50 / 4 credits / 30 days; RM100 / 8 credits / 60 days; RM150 / 12 credits / 90 days.
- Public packages: RM140 / 4 credits / 30 days; RM250 / 8 credits / 60 days; RM330 / 12 credits / 90 days.
- Public member walk-in is RM40; non-member is RM45. In-house members without credits buy the in-house 4-credit package.
- First-time trial: RM100, valid for seven consecutive days from payment date; unlimited regular fixed classes only (not pop classes/workshops).

### Still to do / needs owner confirmation before enabling

- Verify every recurring class coach, capacity, and timetable against the current studio schedule.
- Confirm Yang's exact maximum capacity and any booking buffer/cleaning time.
- Set the V7 automation rule to `TRUE`, manually test `runSevenDayClassSessionGenerator`, then install its one daily trigger.
- Build staff-facing Google Forms or a simple front-end for leads, attendance, payments, rentals, and crew booking.
- Add owner notifications/reminders (WhatsApp/email) only after the preferred channel, message content, and recipient list are confirmed.
- Define event/show workflow details: client quotation, dancer payment, transport, costume, deposits, and approval process.
- Add reporting/dashboard views after live operating data exists.
- Protect technical/history tabs and define staff roles before production use.

## Automation versions

| Version | Purpose | Trigger |
| --- | --- | --- |
| V1 | Attendance -> credit deduction and ledger | Shared on-edit trigger |
| V2 | Paid package payment -> entitlement | Shared on-edit trigger |
| V2.1 | Important changes -> audit history | Shared on-edit trigger |
| V3 | Expired/exhausted package maintenance | Daily trigger |
| V4 | Trial-attended lead -> follow-up | Shared on-edit trigger |
| V5 | Room conflict checks | Shared on-edit trigger |
| V6 | Class session -> fixed room booking | Shared on-edit trigger |
| V7 | Create fixed sessions seven days ahead | Daily trigger |
| V8 | In-house monthly fee and approved-rest handling | Daily trigger |
| V8.1 | Approved rest start/end status lifecycle | V8 daily trigger |
| V9 | Converted lead -> linked member | Shared on-edit trigger |
| V10 | Eligible walk-in attendance -> pending charge | Shared on-edit trigger |
| V11 | Paid walk-in payment -> linked charge and attendance marked Paid | Shared on-edit trigger |
| V12 | Paid seven-day trial -> eligible Fixed-class attendance validation | Shared on-edit trigger |

Use the `Automation_Rules` tab as the per-workbook on/off control. No deployment is needed for ordinary Apps Script code or trigger updates.

## Repository structure

- `01_Dance_Studio/` — reusable, neutral dance-studio template and business rules.
- `02_The_Wolves_Dance_Academy/` — Wolves-specific rules, plan, feature flags, and reference material.
- `google-sheets/` — workbook schema and setup notes.
- `apps-script/` — modular Apps Script source and local smoke test.
- `skills/the-wolves-dance-academy/` — reusable studio-context skill for future work.
- `config/` — neutral CSV templates for IDs, tabs, validation, and feature controls.

## Apps Script setup

Add all files in `apps-script/` to **one** Apps Script project attached to the Wolves workbook. Keep exactly one installable on-edit trigger: `onAttendanceEdit`.

- Run `resetAllAttendanceEditTriggers` only when repairing the shared on-edit trigger.
- Run `installPackageMaintenanceTrigger` once for V3.
- Run `installSevenDayClassSessionTrigger` once only after V7 has passed a manual test.
- Do not create a deployment for these spreadsheet automations.

See [apps-script/README.md](apps-script/README.md) for test and fallback details.

## Privacy

Do not place real member names, phone numbers, payment records, or Google Sheet links in this repository. Use fictional test data only.
