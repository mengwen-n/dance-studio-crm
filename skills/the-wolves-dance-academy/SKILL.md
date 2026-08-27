---
name: the-wolves-dance-academy
description: Studio-specific business context for The Wolves Dance Academy CRM, including public classes, fixed schedules, pop classes, workshops, attendance, package credits, in-house crew access, Ying/Yang room bookings, studio rental, payments, follow-ups, and owner automation. Use when designing, documenting, implementing, or testing this studio's CRM or Google Sheets backend.
---

# The Wolves Dance Academy

Use this skill as the studio-specific business context. Keep reusable CRM patterns in `01_Dance_Studio/`; keep Wolves-specific facts here and in `02_The_Wolves_Dance_Academy/`.

## Current business model

- Serve public dance members, trial students, walk-ins, and in-house crew.
- Run fixed recurring classes, pop classes, workshops, and special sessions.
- Use studio rooms such as Ying and Yang.
- Allow in-house crew members to use studio space by booking a time.
- Support studio rental as a separate booking and payment type.
- Reduce daily admin work around attendance, credits, payments, room conflicts, and follow-up.

## Core workflows

1. Capture a lead or trial request.
2. Register a member and assign a member type or package.
3. Publish or record a class session with coach, time, room, capacity, and status.
4. Record attendance as package, walk-in, trial, free, absent, excused, or late.
5. Deduct a package credit only when the attendance rule allows it.
6. Record every credit addition, deduction, correction, or expiry in `Credit_Ledger`.
7. Create follow-ups for trial conversion, low credits, inactive members, and unpaid records.
8. Book rooms for classes, crew use, workshops, or rentals, flag conflicts, and preserve an admin manual resolution path.
9. Produce daily attendance, payment, room, and exception summaries for the owner.

## Google Sheets backend tabs

Use these tabs for the first private workbook:

`START_HERE`, `Settings`, `Feature_Flags`, `ID_Rules`, `Members`, `Member_Type_History`, `Member_Rest_Requests`, `Crew_Groups`, `Member_Crew_Assignments`, `Leads`, `Lead_Status_History`, `Packages`, `Member_Packages`, `Member_Charges`, `Payments`, `Credit_Ledger`, `Classes`, `Class_Sessions`, `Attendance`, `Rooms`, `Room_Bookings`, `Follow_ups`, `Automation_Rules`, `Automation_Log`, `User_Roles`, `Class_Fees`, `Fee_History`, `Events`, `Event_Rosters`, `Event_Sessions`, and `Monthly_Report`.

Use `START_HERE` as the owner-facing map. The other tabs are organized backend tables; technical history tabs can later be protected or hidden from day-to-day users.

## Identity rule

Use `Member_ID` as the canonical person ID for anyone who may attend a session: public student, in-house crew member, trial student, or walk-in. Store the category in `Member_Type`. Store crew details through `Crew_Groups` and `Member_Crew_Assignments`. Attendance, charges, payments, and credit transactions should reference `Member_ID`, not separate IDs for different dancer categories.

When a member changes type, update the current value in `Members` and append a row to `Member_Type_History` with the effective date, previous type, new type, reason, and approver. Attendance should preserve `Member_Type_At_Time` so historical pricing and credit decisions remain stable.

## Crew hierarchy

Represent crew groups separately from member identities. Use `Crew_Groups` for parent and child groups, and `Member_Crew_Assignments` for effective-dated member membership. A member can have more than one assignment when the studio approves it.

Initial known groups:

- `Wolves In-house Lunarize`
- `Wolves In-house Solarize`
- `DGXT` as an umbrella group
- `DistriXt`, `DimitriXt`, and `DinyX` as DGXT child units

Do not infer a member's crew from a name. Use an explicit assignment with start date, optional end date, role, status, and approver.

## Payment and package rule

Record the amount owed in `Member_Charges`, the money transaction in `Payments`, the purchased entitlement in `Member_Packages`, and every credit movement in `Credit_Ledger`. A payment may be for a package, walk-in, rental, workshop, or other charge. For a package purchase, link `Payment_ID` to `Entitlement_ID` and record the credits granted. Link credit events to `Entitlement_ID` so multiple active packages can be allocated correctly.

An entitlement is one purchased allocation for one member, such as an 8-class package valid for 60 days. One member can have multiple entitlements over time. `Credits_Remaining` is the operational balance; the ledger is the audit trail.

For a recurring fixed class, put the weekday in `Classes.Recurring_Day`. For a pop class or one-off session such as `CLS-POP-001`, leave it blank and schedule the actual date in `Class_Sessions`.

## Room and rental rules

- Yin uses stable ID `ROOM-YING`: 480 sq ft, 10 people, RM40 per hour, RM100 for three hours, then RM20 per subsequent hour.
- Yang uses stable ID `ROOM-YANG`: 1,000 sq ft, 20+ people, RM60 per hour, RM150 for three hours, then RM30 per subsequent hour. Its exact maximum capacity is not confirmed.
- Treat the lower three-hour rate as a package, not as three separate hourly charges. Apply the subsequent-hour rate only after the first three hours.
- Fixed recurring classes use `ROOM-YANG` by default. A fixed class occupies Yang exclusively. A cancelled fixed class releases its linked booking for other valid requests.
- Yin permits up to three concurrent `Crew_Practice` teams, but never alongside a class, rental, or other exclusive booking. Yang and every non-crew booking are exclusive.

## Confirmed recurring schedule

- Monday 20:00-21:00: Breaking — Brandon.
- Tuesday 19:45-20:45: Intro Femme Choreography — Leewen.
- Tuesday 20:00-21:00: Girls K-pop — Crystal.
- Tuesday 21:00-22:00: Hip Hop — Zi Cheng.
- Tuesday 21:00-22:00: Femme Choreography — Leewen.
- Thursday 20:00-21:00: Choreography — Zee.
- Friday 20:00-21:00: Popping — Luois (name preserved as provided).

All fixed recurring classes use `ROOM-YANG` by default. Capacity remains owner-confirmed; do not invent a numeric limit for Yang.

External shows are managed in `Events`, with dancer requirements and event details, `Event_Rosters` for selected dancers/crew, and `Event_Sessions` for rehearsals and performance sessions. Capture venue, call time, performance time, required dancers, role, costume, transport, rehearsal status, and payment status.

## Lead status rule

Keep one current row per lead in `Leads` and update its `Status` in place. Append one row to `Lead_Status_History` for every status transition, including changed time, previous status, new status, staff member, and reason. Do not duplicate the lead in `Leads` just to preserve history.

## Lead-to-member lifecycle

Treat a lead as a person who has shown interest but is not yet an official member. Use `Leads.Status = Converted` when the person joins, create a `Members` row, and link the records with `Leads.Converted_Member_ID` and `Members.Source_Lead_ID`. Use `Member_ID` for all later attendance, package, payment, and credit records.

Not every member needs a lead. Record the origin in `Members.Member_Origin`, such as `Lead_Conversion`, `Direct_Signup`, `Walk_In`, `Crew_Registration`, `Existing_Data`, or `Referral`. Leave `Source_Lead_ID` blank when there was no lead.

## Ledger definition

A ledger is a permanent transaction history. It records each change instead of overwriting the current balance.

For credits, use one row per event:

`Ledger_ID | Member_ID | Event_Date | Event_Type | Reference_ID | Credit_Change | Balance_After | Recorded_By | Notes | Entitlement_ID`

Examples of `Event_Type`: `Package_Purchase`, `Attendance_Deduction`, `Manual_Adjustment`, `Refund`, and `Expiry`.

The current balance should be calculated from the ledger or reconciled against it. Never delete historical credit events to fix a mistake; add a correction event.

## Rules and assumptions

- Treat Instagram as a discovery/reference source, not the final database.
- Confirm any still-unknown class, room, and crew-access rules with the owner before activating the related automation.
- Keep production member, phone, payment, and booking data in private Google Drive only.
- Use fictional data in this repository.
- Keep a manual fallback for attendance, credit correction, room booking, and reminders.
- Do not assume a walk-in consumes a package credit; record the payment method and apply the confirmed studio rule.
- Use strict Google Sheets data validation for controlled fields such as `Member_Type`, `Member_Origin`, statuses, payment methods, class types, room IDs, and event statuses. Keep names and notes as free text, and do not restrict relationship IDs to demo-only values.
- For in-house rest, require notice by the 20th for the next calendar month. One approved request can cover multiple consecutive months; use `Member_Rest_Requests.Rest_End_Date` and charge RM0 during the approved rest range.
- In-house packages: RM50 for 4 credits / 30 days, RM100 for 8 credits / 60 days, and RM150 for 12 credits / 90 days.
- Public packages: RM140 for 4 credits / 30 days, RM250 for 8 credits / 60 days, and RM330 for 12 credits / 90 days.
- Official public member walk-in is RM40 per regular class; non-member walk-in is RM45 per regular class. The RM40 rate does not apply to in-house members. If an in-house member has no credits, require purchase of the RM50 / 4-credit package (`PKG-IH-4`).
- The first-time student trial costs RM100 for seven consecutive days starting from `Payment_Date` and allows unlimited `Fixed` classes during that period. It excludes `Pop_Class` and `Workshop`. Record it as a time-based trial with zero credits and do not deduct credits for eligible trial attendance.
- When multiple eligible active entitlements have credits, deduct from the entitlement with the earliest `Expiry_Date` first. Do not deduct when `Attendance.Attended` is `FALSE`, including no-shows and late cancellations.
- Annual registration is in-house only and renews in January. Charge RM120 for January-June joining and RM60 for July-December joining. Approved rest is not an exit and does not trigger registration again.
- `Automation_Rules` describes planned behavior only until its Apps Script trigger is installed and verified.

## Automation state and implementation rules

- V1 attendance credit deduction, V2 paid package entitlement creation, V2.1 change history, V3 package maintenance, V4 trial follow-up, V5 room conflict checks, and V6 class-session room sync have been tested in the Wolves workbook.
- V7 generates each active fixed class session exactly seven days ahead and then invokes V6 to create the linked room booking. It needs its own daily time trigger after one successful manual run.
- V8 generates one monthly fee per active in-house member. A full, approved, on-time rest month is stored as a RM0 `Waived` charge; late or partial rest creates the normal fee and flags manual review.
- V8.1 moves a member to `on_rest` when an approved request starts and returns them to `active` after it ends. `Member_Rest_Requests` remains the source of truth.
- V9 creates or links a `Members` row when `Leads.Status` becomes `Converted`. It blocks possible phone/email duplicates for an admin decision.
- V10 creates one pending `Member_Charges` walk-in charge from attended `Walk_In` attendance at a non-cancelled fixed class: Public RM40, non-member RM45. It never auto-marks payment as received; in-house crew is directed to the in-house credit package.
- V11 matches a paid `Payments` row with `Payment_Type = Walk_In` and an `Attendance_ID` to its V10 charge. Exact amount and member must match before the charge and attendance are marked `Paid`.
- V12 validates `Attendance_Type = Trial` from a paid `Trial` payment using `PKG-TRIAL-7D`: payment date through day 7, only for non-cancelled `Fixed` classes, with zero credit deduction.
- Keep one shared installable on-edit trigger (`onAttendanceEdit`) for V1, V2, V2.1, V4, V5, and V6. Do not create one on-edit trigger per module.
- Use `Automation_Rules` to enable or disable modules per workbook. Code stays modular in separate `.gs` files; do not copy separate script projects for each feature.
- Store generated `Session_Date` values and display them as `yyyy-mm-dd`.
- Read `../../README.md` for the maintained done/not-yet-done project summary. For script installation and fallback behavior, read `../../apps-script/README.md`.
