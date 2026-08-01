# Dance Studio CRM — Process Flow

## Main operating loop

```text
New enquiry
   ↓ Google Form / manual capture
Lead created + Lead_ID
   ↓ admin books trial
Trial booked
   ↓ class attendance submitted
Trial attended / absent
   ↓ 2-hour automation
Follow-up due → WhatsApp / email prompt
   ↓ owner or admin updates result
Converted → Member created → Renewal watchlist
Lost → reason recorded for learning
```

## Owner's daily routine

```text
09:00  Receive daily summary
   ↓
Check overdue follow-ups
   ↓
Check renewals due in 7 days
   ↓
Check today's classes and attendance gaps
   ↓
Make only the exceptions / decisions
```

## In-house crew fee flow

```text
Crew applicant / existing member
        ↓ crew registration
Annual registration recorded
        ↓ monthly fee cycle
Monthly studio fee row created
        ↓ before the 20th
Pending → Paid
        ↓ after the 20th, only if owner confirms the rule
Overdue → owner/admin review
```

Crew fees stay separate from regular class membership fees so the studio can answer three different questions:

- Is this person an active in-house crew member?
- Has this year's registration been paid?
- Has this month's studio fee been paid before the 20th?

## Status transitions

| Current | Next | Who / trigger |
|---|---|---|
| New lead | Trial booked | Admin |
| Trial booked | Trial attended | Attendance form |
| Trial booked | No-show | Attendance form / end-of-day check |
| Trial attended | Follow-up due | Apps Script after 2 hours |
| Follow-up due | Converted | Admin / owner |
| Follow-up due | Lost | Admin / owner with reason |
| Converted | Member active | Apps Script / admin |

## Exception handling

- If a form fails: admin records the item in a temporary `Manual_Queue` tab.
- If Apps Script fails: error is written to `Automation_Log` and owner receives a failure email.
- If a WhatsApp message cannot be sent automatically: system creates a click-to-chat link; staff sends manually.
- If a member has no matching ID: do not create a duplicate silently; send to a review queue.
