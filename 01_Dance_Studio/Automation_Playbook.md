# Dance Studio CRM — Automation Playbook

## Automation 1 — Lead capture

**Trigger:** New response in `New Lead / Trial Enquiry` Form.

**Actions:**

1. Generate `Lead_ID` such as `LD-1043`.
2. Set `Created_At` and default `Status = New lead`.
3. Set `Follow_Up_Date` to today if there is no trial date.
4. Add a row to `Automation_Log`.
5. Notify admin that a new enquiry needs a reply.

## Automation 2 — Trial follow-up

**Trigger:** Every 30 minutes; find trials that ended at least 2 hours ago.

**Conditions:** `Status = Trial attended` and `Last_Contacted_At` is blank.

**Actions:** Create a WhatsApp click-to-chat link or send an approved message, update `Status = Follow-up due`, write timestamp and log.

## Automation 3 — Renewal guard

**Trigger:** Every morning at 08:30.

**Conditions:** `Renewal_Date` is between today and today + 7 days; `Payment_Status <> Paid`.

**Actions:** Add member to the owner digest, mark alert as created, avoid duplicate alerts on the same day.

## Automation 4 — Attendance follow-up

**Trigger:** Class end time + 60 minutes.

**Conditions:** Student is `Absent` and class is not cancelled.

**Actions:** Add to follow-up list, optionally notify parent/admin, log result.

## Automation 5 — Owner daily summary

**Trigger:** Every day at 09:00.

**Summary sections:**

- Revenue collected yesterday
- New leads and overdue follow-ups
- Trials booked / attended / converted
- Renewals due in 7 days
- Attendance exceptions
- Automation errors

## Automation 6 — In-house crew annual registration reminder

**Trigger:** Daily at 08:30.

**Conditions:** `Next_Renewal_Date` is within the configured reminder window and registration is not paid / renewed.

**Actions:** Add the crew member to the owner summary, notify the responsible admin, and write the result to `Automation_Log`.

## Automation 7 — Monthly studio fee reminder

**Trigger:** Daily during the monthly fee window.

**Conditions:** A `Studio_Fees` row exists for the current month and `Payment_Status <> Paid`.

**Actions:**

1. Remind before the 20th.
2. On or after the 20th, mark the row as `Overdue` only if the owner confirms that rule.
3. Do not apply suspension, late fee, or access restrictions automatically until the business rule is confirmed.
4. Log every reminder and result.

## Safety rules

- Start with email and click-to-chat links before paying for WhatsApp API.
- Do not send more than one automated reminder to the same person in 24 hours.
- Keep message templates short, polite, and approved by the owner.
- Every run must be visible in `Automation_Log`.
- Financial rules must be confirmed by the owner before an automation can change a person's status or access.
