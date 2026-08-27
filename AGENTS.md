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
9. Use the relevant available skill when a task matches one, especially Google Sheets, browser research, spreadsheets, documents, or presentations. Read that skill's `SKILL.md` before taking the related action and follow its verification workflow.
10. Prefer existing skills, project templates, and connector workflows when they reduce repeated work. Do not install a new plugin or skill unless the task requires a capability that is not already available.
11. Keep reusable business rules and neutral data models in `01_Dance_Studio/`. Keep studio-specific names, prices, rooms, schedules, and confirmed operating rules in the relevant numbered studio folder.
12. A task may use multiple skills when its work crosses domains. Select the smallest complete skill set, read every selected `SKILL.md` before acting, use them in a clear order, and record any material effect in the handoff.

## Definition of done for a workflow

A workflow is not complete until it has:

- a clear trigger;
- a source field or form question;
- an action and owner notification;
- a status or timestamp written back to the data source;
- a manual fallback when automation fails;
- a demo case using fictional data.

## Skills and tool-assisted work

When a task involves an external service or a specialised artifact, use the matching skill before acting. Examples:

- Google Sheets / Drive: use the Google Sheets or Google Drive skill; verify the exact workbook, tabs, ranges, and permissions before writing.
- Public web or Instagram research: use the browser or web research capability; treat social media as a reference source and confirm operational rules with the studio owner.
- Local spreadsheet files: use the Spreadsheets skill and verify formulas and layout.
- Word, PDF, slides, or other document artifacts: use the matching document, PDF, or presentations skill and perform its required render/verification step.

For multi-skill work, use this sequence:

1. Research or inspect the source material.
2. Read the skills needed for the source and destination artifacts.
3. Build or edit the artifact using the destination skill.
4. Verify the result using the relevant connector, renderer, test, or visual check.
5. Record the source, permissions, assumptions, and manual fallback.

Skills are implementation guidance, not a replacement for project rules. Project privacy, scope, and source-of-truth rules remain mandatory.

