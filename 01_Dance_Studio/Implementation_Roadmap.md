# Dance Studio CRM — Implementation Roadmap

## Phase 0 — Demo (current)

**Goal:** Show the owner the workflow before connecting real data.

- Static CRM interface
- Fictional sample data
- Clickable automations and reports
- Business requirements and data design

## Phase 0.5 — Discovery and rules confirmation

**Goal:** Understand the studio completely enough that the system reflects real operations.

- Separate regular students / members from in-house crew.
- Confirm annual registration rule and amount.
- Confirm monthly studio fee amount and the 20th deadline.
- Confirm overdue consequences, waivers, receipts, and responsible people.
- Test the status names with owner and admin before creating live automations.

This phase is required before turning on payment or suspension automations. Unknown rules stay marked `To confirm` rather than being guessed.

## Phase 1 — Working no-code MVP

**Goal:** Run one studio with Google Workspace only.

1. Create one Google Drive folder and one workbook.
2. Create the five Google Forms / workflows in `Google_Form_Spec.md`, including crew registration and monthly fee payment.
3. Add formula views and protected ranges.
4. Add Apps Script for IDs, status changes, reminders, and log.
5. Train one admin and one instructor.
6. Run for two weeks with a manual fallback.

## Phase 2 — Owner dashboard

**Goal:** Make the data easy to read on iPad.

- Connect the dashboard to Google Sheets or Looker Studio.
- Add owner-only report views.
- Add a mobile shortcut / hosted URL.
- Capture before/after time saved and conversion rate.

## Phase 3 — Productized template

**Goal:** Reuse the solution for other studios.

- Clean sample data and screenshots.
- Create a setup checklist.
- Create a client handover document.
- Parameterize studio name, classes, timezone, and messages.

## Phase 4 — Optional paid upgrades

- WhatsApp Business API
- Online payment reconciliation
- Parent/member portal
- Multi-branch permissions
- AI-assisted lead reply and owner Q&A

## Immediate next decision

The next practical choice is whether to build the real Google Workspace version for:

- one real dance studio with real workflow testing; or
- a fictional portfolio demo using sample data only.

The technical structure supports both, but real customer data must never enter the public GitHub repository.
