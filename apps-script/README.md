# Dance Studio CRM Apps Script

This is a **reusable automation codebase** for any dance studio that uses the standard CRM workbook structure. Each studio gets its own Google Sheet, Apps Script project, owner/admin account, trigger set, data, and feature-rule settings.

Do **not** connect multiple studios to one live spreadsheet or one Apps Script project. Copy the template for each new studio.

## What is reusable vs studio-specific

| Reusable code | Configure per studio in Google Sheets |
| --- | --- |
| Automation modules and safety checks | Studio name, rooms, class schedule, prices, packages, staff, members |
| Sheet/tab names, IDs, shared trigger dispatcher | `Automation_Rules` on/off values |
| Credit, payment, history, follow-up, conflict, and booking logic | Dropdown lists, roles, notifications, local operating rules |

`Config.gs` contains neutral tab names and rule IDs. Avoid adding Wolves names, prices, or member data to the code. Put those values in the workbook.

## Modules

| Version | File | Function | Trigger |
| --- | --- | --- | --- |
| V1 | `AttendanceAutomation.gs` | Attendance -> package-credit deduction + `Credit_Ledger` | Shared on-edit |
| V2 | `PaymentsAutomation.gs` | Paid package -> entitlement | Shared on-edit |
| V2.1 | `ChangeHistoryAutomation.gs` | Important change -> `Change_Log` | Shared on-edit |
| V3 | `PackageMaintenanceAutomation.gs` | Expired/exhausted entitlement maintenance | Daily |
| V4 | `LeadFollowUpAutomation.gs` | Trial attended -> follow-up | Shared on-edit |
| V5 | `RoomBookingAutomation.gs` | Room conflict evaluation | Shared on-edit |
| V6 | `ClassSessionBookingAutomation.gs` | Class session -> linked fixed-class booking | Shared on-edit |
| V7 | `ScheduledClassSessionAutomation.gs` | Fixed sessions generated seven days ahead | Daily |
| V8 | `InHouseFeeAutomation.gs` | In-house monthly fee and approved-rest handling | Daily |
| V8.1 | `InHouseFeeAutomation.gs` | Approved rest start/end status lifecycle | V8 daily |
| V9 | `LeadConversionAutomation.gs` | Converted lead -> linked member | Shared on-edit |
| V10 | `WalkInAttendanceAutomation.gs` | Eligible walk-in attendance -> pending charge | Shared on-edit |
| V11 | `WalkInPaymentAutomation.gs` | Paid walk-in payment -> charge and attendance marked Paid | Shared on-edit |
| V12 | `TrialAttendanceAutomation.gs` | Validate paid seven-day Fixed-class trial attendance | Shared on-edit |

Every module is independently controlled in the workbook's `Automation_Rules` tab. Code files remain separate for maintenance, but V1/V2/V2.1/V4/V5/V6 deliberately share **one** on-edit trigger: `onAttendanceEdit`.

## New studio setup

1. Copy the standard CRM Google Sheet. Populate its rooms, packages, staff, class schedule, roles, controlled dropdown values, and feature flags.
2. Open the copied Sheet: **Extensions -> Apps Script**. Create a new project named, for example, `Studio Name CRM Automation`.
3. Copy every `.gs` file in this folder into that one project. Save.
4. Run `resetAllAttendanceEditTriggers` once, approve permissions as the studio owner/admin, and check **Triggers**: only one `onAttendanceEdit` trigger should exist.
5. Leave all `Automation_Rules.Enabled` values `FALSE` initially. Test one module with fictional data, then enable only that rule.
6. When V3 passes manual testing, run `installPackageMaintenanceTrigger` once. When V7 passes manual testing, run `installSevenDayClassSessionTrigger` once. When V8 passes manual testing, run `installInHouseFeeTrigger` once.
7. Do not use **Deploy**. These are spreadsheet-bound triggers, not a web app.

## Required workbook compatibility

The copied Sheet must keep the standard tab and field names expected by `Config.gs`. Before enabling a module, ensure its dependent tabs/columns exist.

- V1: `Attendance`, `Member_Packages`, `Credit_Ledger`, `Automation_Log`.
- V2: `Payments`, `Member_Packages`, `Packages`, `Automation_Log`.
- V2.1: `Change_Log` plus the relevant source tabs.
- V3: `Member_Packages`, `Change_Log`, `Automation_Log`.
- V4: `Leads`, `Follow_ups`, `Automation_Log`.
- V5: `Room_Bookings`, `Rooms`, `Automation_Log`.
- V6: `Class_Sessions` and `Room_Bookings`, including `Booking_Source`, `Source_Reference`, and `Requested_At`.
- V7: `Classes`, `Class_Sessions`, V6 enabled if the studio wants automatic room reservations.
- V8: `Members`, `Member_Rest_Requests`, `Member_Charges`, `Settings`, and `Automation_Log`. Required Settings keys: `InHouse_Studio_Fee_Active`, `InHouse_Studio_Fee_Rest`, and `InHouse_Rest_Notice_Deadline_Day`.
- V9: `Leads`, `Members`, and `Automation_Log`. `Leads` requires `Converted_Member_ID`; `Members` requires `Source_Lead_ID` and `Member_Origin`.
- V10: `Attendance`, `Class_Sessions`, `Classes`, `Member_Charges`, and `Automation_Log`. It only charges attended `Walk_In` rows for a non-cancelled `Fixed` class: Public = RM40, Walk_In = RM45. It does not create a payment record; staff add the payment after collecting money. In-house crew requires the in-house credit package and is logged for review.
- V11: `Payments`, `Attendance`, `Member_Charges`, and `Automation_Log`. Enter a paid `Walk_In` payment with the exact `Attendance_ID`; it must match the member and the charge amount. The automation links `Payment_ID`, then marks both the charge and attendance `Paid`.
- V12: `Payments`, `Attendance`, `Class_Sessions`, `Classes`, and `Automation_Log`. A paid `Trial` payment using `PKG-TRIAL-7D` validates `Trial` attendance only from payment date through day 7, only for non-cancelled `Fixed` classes. It marks attendance paid with zero credits used.

## Test and fallback rules

- Use fictional records for testing.
- Verify both the business result and its `Automation_Log` entry after every test.
- Automation failure must not silently destroy history: `Credit_Ledger`, `Change_Log`, and generated room-booking history are append/preserve records.
- If a credit correction is needed, add a correction ledger entry; do not delete past ledger rows.
- If an automation log reports `Needs manual action`, leave the record pending, resolve the business issue, then edit/retry with a new valid test record where appropriate.
- For room conflicts, V5 flags the conflict; an admin decides cancellation, move, or manual confirmation. V6 cancels only the booking generated from a cancelled class session and then rechecks pending bookings.
- To test V8 from the Apps Script Run button, use `runNextMonthInHouseFeeGeneration` (no parameter). `runInHouseFeeGenerationForPeriod('YYYY-MM')` is an advanced helper for code-based tests because the Run button cannot pass arguments.

## Wolves reference implementation

The Wolves workbook is the first studio implementation. Its current business rules and implementation status are documented in [the project README](../README.md) and [the Wolves skill](../skills/the-wolves-dance-academy/SKILL.md). Treat them as reference configuration, not default values for every new studio.
