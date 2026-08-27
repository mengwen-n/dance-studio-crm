# Dance Studio CRM Template Evolution

`01_Dance_Studio/` is the reusable template. Studio-specific folders such as `02_The_Wolves_Dance_Academy/` are implementation profiles built from it.

## What belongs in the template

- Neutral member, lead, class, attendance, payment, and automation concepts
- Package and credit-ledger patterns
- Room and booking patterns
- Generic follow-up and notification rules
- Generic Google Sheets tab structures and formulas
- Privacy, permission, failure-handling, and manual-fallback rules

## What stays in a studio profile

- Studio name and branding
- Actual Instagram timetable and class names
- Room names such as Ying and Yang
- Prices, package rules, credit expiry, and payment policy
- In-house crew arrangements
- Confirmed staff, coach, and owner details
- Real production spreadsheet links and data

## Promotion workflow

1. Capture the studio-specific workflow in its numbered folder.
2. Test it with fictional data and a manual fallback.
3. Identify which fields, tabs, formulas, and automations are reusable.
4. Promote only those neutral pieces into `01_Dance_Studio/`.
5. Keep the studio's names, values, and private details in its own folder or private Google Drive.

The Wolves pilot should therefore improve the template, but should not copy The Wolves' private or brand-specific details into the template.
