# The Wolves Dance Academy — Business Rules Confirmation

This document separates confirmed 2026 candidates from 2025 reference material. Do not activate fee or credit automation until the owner confirms the 2026 rules.

## Current 2026 candidate rules stated by owner

| Rule | Candidate value | Status |
|---|---:|---|
| In-house active studio-use fee | RM80 per month | Owner confirmed candidate; only while active |
| In-house rest period | Notify by the 20th for the next calendar month | Owner confirmed; system should record notice date |
| Rest-period studio fee | RM0 while on approved rest | Owner confirmed |
| In-house class credits | Not included in the RM80 studio-use fee | Owner confirmed |
| In-house 4-credit package | RM50 for 4 credits, valid 30 days | Owner confirmed |
| In-house 8-credit package | RM100 for 8 credits, valid 60 days | Owner confirmed |
| In-house 12-credit package | RM150 for 12 credits, valid 90 days | Owner confirmed |
| Public 4-credit package | RM140 for 4 credits, valid 30 days | Owner confirmed |
| Public 8-credit package | RM250 for 8 credits, valid 60 days | Owner confirmed |
| Public 12-credit package | RM330 for 12 credits, valid 90 days | Owner confirmed |
| Annual member registration fee | Fixed January renewal; RM120 for Jan-Jun joining, RM60 for Jul-Dec joining | In-house only; rest is not a new joining |
| Official public member walk-in | RM40 per regular class | Owner confirmed; public members only, not in-house |
| Non-member walk-in | RM45 per regular class | Owner confirmed |
| First-time student trial | RM100 for 7 consecutive days | Owner confirmed; unlimited regular fixed classes; excludes pop-up classes and workshops |

## Rooms and rental pricing

| Room | Size | Capacity | Hourly | Three hours | Each subsequent hour |
|---|---:|---:|---:|---:|---:|
| Yin (`ROOM-YING`) | 480 sq ft | 10 people | RM40 | RM100 | RM20 |
| Yang (`ROOM-YANG`) | 1,000 sq ft | 20+ people | RM60 | RM150 | RM30 |

For Yang, the exact maximum capacity above 20 is still to be confirmed. The subsequent-hour rate applies after the three-hour package.

## Fixed weekly class schedule

| Day | Time | Class | Coach |
|---|---|---|---|
| Monday | 20:00-21:00 | Breaking | Brandon |
| Tuesday | 19:45-20:45 | Intro Femme Choreography | Leewen |
| Tuesday | 20:00-21:00 | Girls K-pop | Crystal |
| Tuesday | 21:00-22:00 | Hip Hop | Zi Cheng |
| Tuesday | 21:00-22:00 | Femme Choreography | Leewen |
| Thursday | 20:00-21:00 | Choreography | Zee |
| Friday | 20:00-21:00 | Popping | Luois |

Room assignment and class capacity are not yet confirmed. Do not create room bookings or conflict alerts for these classes until Yin/Yang allocation is provided.

## Scheduled versus actual

- `Classes` stores the reusable class definition and recurring pattern.
- `Class_Sessions` stores the actual dated session that was scheduled.
- `Attendance` stores what actually happened for each member: attended, absent, excused, late, trial, walk-in, or in-house.
- A cancelled session remains in `Class_Sessions` with a cancelled status; it should not be treated as member attendance.

## Package pattern to confirm

Confirm separately for public and in-house members:

1. Registration fee: in-house only, with renewal fixed in January. A new member joining January-June pays RM120; a new member joining July-December pays RM60. Rest does not count as leaving, so rest does not trigger a new registration fee; leaving and rejoining does.
2. Monthly studio-use fee: RM80 while active; notify by the 20th for the next calendar month; RM0 during approved `on_rest`.
3. In-house packages: RM50 / 4 credits / 30 days; RM100 / 8 credits / 60 days; RM150 / 12 credits / 90 days.
4. Public packages: RM140 / 4 credits / 30 days; RM250 / 8 credits / 60 days; RM330 / 12 credits / 90 days.
5. In-house benefits: free/waived classes, discounted classes, room access, and booking limits.
6. Walk-in: RM40 per regular class for an official public member and RM45 for a non-member. In-house members do not use the RM40 walk-in rate; when they have no credits, they purchase the RM50 / 4-credit in-house package.
7. First-time trial: RM100 for seven consecutive days starting from `Payment_Date`, with unlimited regular fixed classes. It excludes pop-up classes and workshops. Treat it as a time-based entitlement with zero credits and do not deduct credits for eligible trial attendance.
8. Package deduction: when more than one eligible active entitlement has credits, deduct from the entitlement with the earliest `Expiry_Date` first.
9. No-show and late cancellation: do not deduct package credits when the member does not attend, including no-shows and late cancellations.

## System mapping

- Amounts owed belong in `Member_Charges`; money received belongs in `Payments`.
- A purchased allocation belongs in `Member_Packages` as an entitlement.
- Current class/package prices belong in `Class_Fees` or `Packages`.
- Historical price changes belong in `Fee_History`.
- Credit additions and deductions belong in `Credit_Ledger`.
- Do not use `Default_Payment_Rule` as the final charge; it is only the default treatment by member type.

## Current member status interpretation

- `active` in-house: monthly RM80 fee applies, subject to the confirmed billing rule.
- `on_rest`: the member remains in-house but has notified the studio; monthly fee treatment depends on the confirmed notice/grace rule.
- `inactive`: no longer active in-house; preserve the history and do not delete the member.

For implementation, one rest request may cover multiple consecutive calendar months. A notice received by the 20th can start the following calendar month; `Rest_End_Date` determines when the approved rest ends and the member can return to `active`. Confirm whether reactivation is automatic on that date or requires a staff confirmation.

Annual registration is not charged monthly. Renewal is fixed in January. A new in-house member joining January-June is charged RM120, while a July-December joiner is charged RM60. It is charged again after a member has actually left and later rejoins. `on_rest` is not an exit and does not trigger a new registration charge.

## 2025 reference

`references/TheWolves IHA ENG - 2025.pdf` is reference material only. It must not be treated as the 2026 price list until the owner confirms the differences.
