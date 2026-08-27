# Google Sheets Backend

This folder contains local schema notes and build documentation for the private Google Sheets backend.

The live standard workbook is in Google Drive:

`The Wolves Dance Academy CRM - Standard`

Do not store real member names, phone numbers, payments, or bookings in this folder or in the public repository.

## Locations

- Reusable business template: `01_Dance_Studio/`
- The Wolves business context: `02_The_Wolves_Dance_Academy/`
- Local Google Sheets notes: this folder
- Live production data: private Google Drive workbook

The earlier `The Wolves Dance Academy CRM` workbook is a combined transition/reference copy. Use the `- Standard` workbook for the current schema.

## Ledger

A ledger is an append-only history of transactions. For credits, each package purchase, class deduction, refund, expiry, or correction is a new row in `Credit_Ledger`. The system should never silently overwrite past credit events.
