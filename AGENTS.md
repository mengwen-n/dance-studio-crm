# DanceFlow CRM — Project Rules

## Project purpose

This repository is a low-cost business automation demo for a dance studio. The product goal is to reduce owner/admin follow-up work, missed renewals, manual attendance tracking, and scattered reporting.

## Source of truth

- Business decisions and scope: `docs/00_BUSINESS_PLAN.md`
- Dance studio requirements: `01_Dance_Studio/BRD.md`
- Data model and formulas: `01_Dance_Studio/Google_Sheets_Design.md`
- Form questions: `01_Dance_Studio/Google_Form_Spec.md`
- Operational workflow: `01_Dance_Studio/Process_Flow.md`
- Automation rules: `01_Dance_Studio/Automation_Playbook.md`
- Delivery sequence: `01_Dance_Studio/Implementation_Roadmap.md`

## Working rules

1. Keep the MVP low-cost and easy for a non-technical studio owner to maintain.
2. Prefer Google Sheets + Google Forms + Apps Script before introducing a paid CRM or custom backend.
3. Do not put real customer names, phone numbers, payment data, or private studio data into the public repository.
4. Demo data must be fictional and clearly separate from production data.
5. Every new feature should map to an owner pain point, a measurable outcome, and a simple workflow.
6. Preserve the current demo's core navigation: Overview, Leads & trials, Members, Attendance, Automations, Reports, Settings.
7. Use English field names in data tabs and code; user-facing business documentation can be bilingual.
8. When connecting Google services, document permissions, owner account, trigger frequency, failure handling, and manual fallback.

## Definition of done for a workflow

A workflow is not complete until it has:

- a clear trigger;
- a source field or form question;
- an action and owner notification;
- a status or timestamp written back to the data source;
- a manual fallback when automation fails;
- a demo case using fictional data.

