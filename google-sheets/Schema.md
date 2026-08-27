# The Wolves Dance Academy CRM — Initial Schema

## Core tabs

| Tab | Purpose |
|---|---|
| Leads | Enquiries, trials, source, owner, and next follow-up |
| Lead_Status_History | Append-only history of lead status changes |
| Members | Public members, package, status, and current balance |
| Member_Type_History | Effective-dated changes between public, crew, trial, or walk-in types |
| Member_Rest_Requests | Approved rest periods, notice deadline, date range, fee treatment, and approval history |
| Crew_Groups | Parent and child crew hierarchy |
| Member_Crew_Assignments | Effective-dated membership of people in one or more crew groups |
| Packages | Package definitions, credits, price, and validity |
| Member_Packages | Purchased package entitlements and remaining credits |
| Member_Charges | Amounts due, billing period, coverage, status, and linked payment |
| Payments | Money actually received |
| Credit_Ledger | Permanent credit transactions and corrections |
| Classes | Reusable class definitions and recurring rules |
| Class_Sessions | Actual dated sessions with room and capacity |
| Rooms | Yin/Yang size, capacity, hourly price, three-hour package, and subsequent-hour price |
| Room_Bookings | Fixed classes, crew use, workshops, and rental bookings |
| Follow_ups | Trial, payment, low-credit, and inactive-member actions |
| Automation_Log | Trigger, action, result, and error history |
| User_Roles | Role, scope, view/edit permissions, and active status |
| Class_Fees | Current fee definitions with effective dates |
| Fee_History | Historical fee changes and approvals |
| START_HERE | Owner-facing map of what each area is for and who uses it |
| ID_Rules | ID prefixes, ownership, examples, and generation rules |
| Events | External shows, organizer, venue, timing, dancer requirement, budget, and status |
| Event_Rosters | Dancers/crew selected for an external event, roles, costume, transport, rehearsal, and payment status |
| Event_Sessions | Rehearsals and performance sessions connected to an event |

## Identity rule

`Members` is the single person registry. Every person who may attend a class receives one `Member_ID`, including public students, in-house crew, trial students, and walk-ins. Use `Member_Type` to distinguish them. Crew-specific membership belongs in `Crew_Groups` and `Member_Crew_Assignments`; do not create a second person identity.

`Attendance`, `Payments`, and `Credit_Ledger` should all reference `Member_ID`.

When a member becomes in-house or leaves in-house crew, update the current `Member_Type` in `Members` and add a row to `Member_Type_History`. Do not rewrite old attendance or credit rows. Store `Member_Type_At_Time` on attendance when historical pricing or credit rules depend on the member type.

## Crew hierarchy

Use `Crew_Groups` to represent the structure:

```text
DGXT
├── DistriXt
├── DimitriXt
└── DinyX

The Wolves Dance Academy
├── Wolves In-house Lunarize
└── Wolves In-house Solarize
```

Use `Member_Crew_Assignments` to connect a `Member_ID` to a group. Include start/end dates and status so a member can join, leave, or change crew without losing history.

## Payments and packages

Yes, record the package. Use four linked layers:

1. `Member_Charges`: what the member owes, billing period, coverage, due date, and status.
2. `Payments`: money received, method, payment type, and amount.
3. `Member_Packages`: the package entitlement purchased by the member, credits granted, expiry, and remaining balance.
4. `Credit_Ledger`: every credit addition, deduction, refund, correction, or expiry, linked to `Entitlement_ID` where applicable.

For a package purchase, `Payments.Package_ID` and `Payments.Entitlement_ID` link the payment to `Member_Packages`, and the purchase creates a positive `Credit_Ledger` event.

An entitlement means one purchased package allocation for one member—for example, 8 classes valid for 60 days. It is not the person and not the payment itself; it connects the payment to the credits that can be used.

`Classes.Recurring_Day` is blank for a one-off/pop class because it has no weekly recurrence. Its real date belongs in `Class_Sessions`.

For an outside show, create one `Events` row, list required and confirmed dancers in `Event_Rosters`, and record rehearsals/performance dates in `Event_Sessions`.

## Workbook standard

The current standard workbook does not use the old DinyX tabs such as `Dancers`, `Schedule`, or `Sessions`. The previous combined workbook is kept only as a reference/archive. The standard workbook uses `Members`, `Classes`, `Class_Sessions`, and the canonical `Attendance` and `Payments` schemas.

## Lead-to-member lifecycle

A lead is an enquiry or trial participant who has not yet joined as an official member. When the lead joins, set `Leads.Status` to `Converted`, create a `Members` record, and connect `Leads.Converted_Member_ID` to `Members.Source_Lead_ID`. Use `Member_ID` after conversion. A member may also come directly from a walk-in, crew registration, existing-data import, referral, or direct signup; use `Member_Origin` to record that source.

## Lead status history

Keep the current status in the single `Leads` row. When it changes, update that row and append the previous/new status to `Lead_Status_History`. This keeps the operational view simple while preserving the conversion funnel history.

## Open decisions before live automation

- Class room assignment and class capacity for the owner-provided weekly timetable
- Whether walk-in attendance should use a one-day entitlement or only a one-time charge
- In-house crew room access and payment rules
- Yang's exact maximum capacity above 20 people
- Who can edit attendance, credits, payments, and bookings

The owner should normally start from `START_HERE`, `Monthly_Report`, `Follow_ups`, `Events`, and approved entry forms. The remaining tabs are the backend and audit trail; they can be protected or hidden after the live automation and dashboard are added.

## Validation and calculations

Use strict dropdowns for controlled vocabulary fields such as member origin/type, statuses, payment methods, class types, rooms, booking types, event statuses, roles, and automation states. Keep names and notes as free text. Generate IDs from the rules in `ID_Rules`; do not manually invent IDs or reuse them.

Core calculated fields include member credit balance from `Credit_Ledger`, package credits granted from `Packages`, session capacity from `Classes`, session attendance count from `Attendance`, unpaid revenue from `Member_Charges`, and the monthly report summaries. Entitlement-level remaining credits and coach payout calculations should be automated only after their allocation rules are confirmed.

### Field meanings

- `Default_Payment_Rule` is the default billing treatment for a member type, not a final charge or payment. The amount owed belongs in `Member_Charges`; money received belongs in `Payments`.
- `Member_Type_History.Reason` records why a member type changed, such as `Joined_Crew`, `Left_Crew`, or `Converted_From_Trial`; put extra explanation in `Notes`.
- `Leads.Interest` is the lead's primary interest, such as Foundation, Pop-up, Workshop, or Studio Rental. Use `Notes` if the lead wants more than one thing.
- `Assigned_To` stores a staff email from `User_Roles.Email`. Automation can use that stable account to route follow-ups and notifications; it should not rely on a display name such as “Demo Admin”.
- An active in-house member is billed by the confirmed monthly studio-use rule. Use `Members.Status = on_rest` after the member gives the required advance notice; do not silently change the member type or delete history.
- One rest request may cover multiple consecutive calendar months. Store the notice date, start date, end date, and approval in `Member_Rest_Requests`; do not create one ambiguous status row without a date range.
- `on_rest` is not an exit. It does not create a new annual registration charge; registration applies again only after a member leaves and later rejoins, using the joining-half fee rule.
- Annual registration renews in January. New in-house members joining January-June pay RM120; those joining July-December pay RM60.
- The RM100 first-time trial is a seven-consecutive-day, time-based entitlement starting from `Payment_Date`, with unlimited `Fixed` classes. It excludes `Pop_Class` and `Workshop`, carries zero credits, and does not create credit deductions.
- The RM40 member walk-in rate is for official public members only. In-house members without credits purchase the RM50 / 4-credit in-house package instead.
- In-house package validity is 30/60/90 days for 4/8/12 credits. Public package validity is also 30/60/90 days for 4/8/12 credits.
- Credit deduction uses the eligible active entitlement with the earliest `Expiry_Date` first. An attendance row with `Attended=FALSE` must not deduct credit, including no-shows and late cancellations.
- The legacy duplicate `Crew` tab is hidden as `Crew_DEPRECATED`. Use `Members`, `Crew_Groups`, and `Member_Crew_Assignments` instead.
