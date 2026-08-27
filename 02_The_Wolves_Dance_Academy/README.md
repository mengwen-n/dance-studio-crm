# The Wolves Dance Academy CRM

This folder contains the studio-specific requirements and implementation notes for The Wolves Dance Academy.

The reusable dance-studio business model remains in `01_Dance_Studio/`. This folder adapts that model to The Wolves' known workflow without storing real member names, phone numbers, payment records, or private studio data in the repository.

## Current scope

- Public members, leads, trials, and follow-ups
- Fixed classes, pop classes, and workshops
- Attendance for package credit, walk-in, trial, free, absent, and excused cases
- Automatic credit balance updates through a credit ledger
- In-house crew members and their studio access
- Room booking for Ying and Yang
- Studio rental bookings and conflict checking
- Charges due, payments received, coach payout, daily summaries, and automation logs

## Recommended low-cost backend

`Google Forms + Google Sheets + Apps Script`

The existing `dinyx-crew-system` spreadsheet is a useful reference for in-house crew, sessions, attendance, payments, and coach payout. It should remain separate from the new production workbook, which should be named `The Wolves Dance Academy CRM`.

## Planned workbook tabs

`Settings`, `Members`, `Leads`, `Packages`, `Member_Packages`, `Member_Charges`, `Payments`, `Credit_Ledger`, `Classes`, `Class_Sessions`, `Attendance`, `Rooms`, `Room_Bookings`, `Crew_Groups`, `Member_Crew_Assignments`, `Follow_ups`, `Automation_Log`, and `Monthly_Report`.

## Source reference

Public course information: https://www.instagram.com/thewolves_dance_academy/

Instagram is a discovery/reference source. The final timetable, prices, credit rules, and booking rules must be confirmed by the studio owner before automation is activated.
