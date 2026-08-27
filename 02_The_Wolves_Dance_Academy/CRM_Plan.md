# The Wolves Dance Academy — CRM Plan

## Objective

Reduce daily owner/admin work by centralising class schedules, attendance, credits, payments, room bookings, and follow-ups.

## Phase 1 — Minimum viable operations

Use Google Sheets as the source of truth, Google Forms for staff input, and Apps Script for automation.

### Core workflows

1. Record a lead or trial.
2. Book the student into a fixed class, pop class, or workshop.
3. Record attendance as package, walk-in, trial, free, absent, or excused.
4. Deduct one credit only when the attendance rule says to do so.
5. Record every credit change in `Credit_Ledger`.
6. Create follow-ups for trial conversion, low credits, inactive members, and overdue payments.
7. Book Ying or Yang for classes, crew use, workshops, or rental.
8. Block overlapping bookings for the same room.
9. Produce a daily owner summary and monthly report.

## Phase 2 — Automation

- Trial follow-up reminders
- Low-credit reminders
- Payment and overdue reminders
- Daily attendance summary
- Room booking conflict alerts
- Coach payout calculation
- Monthly revenue and attendance report
- WhatsApp click-to-chat links

## Phase 3 — Product template

- Staff roles and permissions
- Multiple rooms or branches
- Online payments
- Calendar integration
- WhatsApp Business API
- Member portal or mobile app

## Important rule

Do not place real customer or payment data in this repository. Production data belongs in the private Google Sheets workbook.
