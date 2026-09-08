# Studio configuration migration

Status: implemented locally; live workbook and Apps Script still require migration together.

`StudioSettings.gs` reads configuration, rejects missing/duplicate settings and invalid prices,
and never substitutes another studio's values. Stable table/field/status names remain the shared contract.

## Required Settings keys

| Key | Meaning |
| --- | --- |
| WalkIn_Package_Public | Active package ID for public walk-in price |
| WalkIn_Package_Walk_In | Active package ID for non-member walk-in price |
| WalkIn_Package_In_House_Crew | Package ID or explicit DISABLED |
| WalkIn_Package_Trial | Package ID or explicit DISABLED |
| WalkIn_Allowed_Class_Types | Comma-separated class types |
| Trial_Package_ID | Active trial package ID; price and validity come from Packages |
| Trial_Allowed_Class_Types | Comma-separated class types |
| Default_Fixed_Class_Room_ID | Existing room used when Classes.Room_ID is blank |

Packages requires numeric Price and positive integer Validity_Days. Walk-in package Member_Type
must match its setting. Use a new package ID for future price/validity changes so historical trial payments
retain their purchased terms. Keep referenced trial packages active for the duration of existing trials.

Rooms gains `Max_Shared_Crew_Teams`: positive integer, 1 for exclusive; greater than 1 permits
only crew practice sharing. Every other booking type remains exclusive. Existing room capacity and
rental-price columns remain data; this change does not implement rental charge calculation.

In-house fees continue to use InHouse_Studio_Fee_Active, InHouse_Studio_Fee_Rest,
and InHouse_Rest_Notice_Deadline_Day. Blank fees now fail instead of becoming zero.

## Installation

1. Back up the workbook and current scripts. Record enabled rules and pause affected rules during upgrade.
2. Add Settings keys and Rooms.Max_Shared_Crew_Teams using the studio's approved values.
3. Add StudioSettings.gs and replace Config.gs, WalkInAttendanceAutomation.gs,
   TrialAttendanceAutomation.gs, RoomBookingAutomation.gs, ScheduledClassSessionAutomation.gs,
   and InHouseFeeAutomation.gs together. Existing trigger and dispatcher names are unchanged.
4. Restore the intended rule settings and run validateStudioConfiguration in a maintenance window.
   Fix any reported configuration errors before staff resume entry. No new trigger is needed.
5. Test a fictional walk-in, trial and room conflict. Verify charge, attendance and automation log.

Rollback: restore the previous scripts and rule states. Added configuration columns can remain.
Existing payments/charges are not recalculated by this migration.

## Remaining production gaps

This migration separates configuration; it does not complete first-time trial eligibility,
refund reconciliation, duplicate attendance prevention, transaction recovery or audit coverage.
Trial still skips previously Paid attendance. Validate those separately before production sale.
Automation_Rules is the runtime switch; Feature_Flags currently describes module selection,
not a second implemented runtime gate. Turning a rule off does not remove shared-file dependencies.
