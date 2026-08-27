/**
 * Automation V7 - each day, create fixed class sessions exactly seven days ahead.
 * A session is created only once for a Class_ID and date. V6 then reserves its room.
 */
function installSevenDayClassSessionTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runSevenDayClassSessionGenerator')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('runSevenDayClassSessionGenerator')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

function runSevenDayClassSessionGenerator() {
  const spreadsheet = SpreadsheetApp.getActive();
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.CLASS_SESSION_GENERATION_RULE_ID)) return;

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const classSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.CLASSES_SHEET);
    const sessionSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.CLASS_SESSIONS_SHEET);
    const classHeaders = getHeaderMap_(classSheet);
    const sessionHeaders = getHeaderMap_(sessionSheet);
    const targetDate = addDays_(startOfDay_(new Date()), 7);
    const targetDay = weekdayName_(targetDate);
    const existingKeys = classSessionKeys_(sessionSheet, sessionHeaders);
    const lastRow = classSheet.getLastRow();
    if (lastRow < 2) return;
    const classes = classSheet.getRange(2, 1, lastRow - 1, classSheet.getLastColumn()).getDisplayValues();
    let created = 0;
    let skippedIncomplete = 0;

    classes.forEach(row => {
      const field = name => row[requiredColumn_(classHeaders, name)];
      const classId = asText_(field('Class_ID'));
      const classType = asText_(field('Class_Type'));
      const activeStatus = asText_(field('Active_Status')).toLowerCase();
      const recurringDay = asText_(field('Recurring_Day'));
      const roomId = asText_(field('Room_ID')) || DANCE_STUDIO_CRM.DEFAULT_FIXED_CLASS_ROOM_ID;
      const startTime = asText_(field('Start_Time'));
      const endTime = asText_(field('End_Time'));
      if (!classId || classType !== 'Fixed' || activeStatus !== 'active' || recurringDay !== targetDay) return;
      if (bookingTimeMinutes_(startTime) === null || bookingTimeMinutes_(endTime) === null) {
        skippedIncomplete += 1;
        return;
      }
      const key = `${classId}|${dateKeyFromDate_(targetDate)}`;
      if (existingKeys.has(key)) return;

      const rowNumber = appendScheduledClassSession_(sessionSheet, sessionHeaders, {
        classId,
        coachId: asText_(field('Coach_ID')),
        roomId,
        startTime,
        endTime,
        targetDate
      });
      existingKeys.add(key);
      created += 1;
      if (isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.CLASS_ROOM_SYNC_RULE_ID)) {
        syncClassSessionRoomBooking_(spreadsheet, sessionSheet, sessionHeaders, rowNumber);
      }
    });

    writeClassSessionGenerationLog_(spreadsheet, dateKeyFromDate_(targetDate), created, skippedIncomplete);
  } finally {
    lock.releaseLock();
  }
}

function appendScheduledClassSession_(sheet, headers, details) {
  // Capacity and Attendance_Count formulas are prefilled down the tab, so
  // getLastRow() can be 1000 even when only a few actual sessions exist.
  // Append after the final non-empty Session_ID instead.
  const rowNumber = lastRecordRow_(sheet, headers, 'Session_ID') + 1;
  if (rowNumber > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rowNumber - sheet.getMaxRows());
  }
  // Row 2 is the stable session template: it preserves Capacity and Attendance_Count formulas.
  sheet.getRange(2, 1, 1, sheet.getLastColumn()).copyTo(sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()));
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Session_ID')] = nextId_(sheet, headers, 'Session_ID', 'SES-');
  values[requiredColumn_(headers, 'Class_ID')] = details.classId;
  values[requiredColumn_(headers, 'Session_Date')] = details.targetDate;
  values[requiredColumn_(headers, 'Start_Time')] = details.startTime;
  values[requiredColumn_(headers, 'End_Time')] = details.endTime;
  values[requiredColumn_(headers, 'Room_ID')] = details.roomId;
  values[requiredColumn_(headers, 'Coach_ID')] = details.coachId;
  values[requiredColumn_(headers, 'Status')] = 'planned';
  values[requiredColumn_(headers, 'Notes')] = 'Automation V7: generated seven days ahead from fixed class schedule.';
  ['Session_ID', 'Class_ID', 'Session_Date', 'Start_Time', 'End_Time', 'Room_ID', 'Coach_ID', 'Status', 'Notes']
    .forEach(name => sheet.getRange(rowNumber, requiredColumn_(headers, name) + 1).setValue(values[requiredColumn_(headers, name)]));
  sheet.getRange(rowNumber, requiredColumn_(headers, 'Session_Date') + 1).setNumberFormat('yyyy-mm-dd');
  return rowNumber;
}

function lastRecordRow_(sheet, headers, idField) {
  const idColumn = requiredColumn_(headers, idField) + 1;
  const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  const ids = sheet.getRange(2, idColumn, rowCount, 1).getDisplayValues();
  for (let index = ids.length - 1; index >= 0; index -= 1) {
    if (asText_(ids[index][0])) return index + 2;
  }
  return 1;
}

function classSessionKeys_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  return new Set(sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues()
    .map(row => `${asText_(row[requiredColumn_(headers, 'Class_ID')])}|${bookingDateKey_(row[requiredColumn_(headers, 'Session_Date')])}`));
}

function weekdayName_(date) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}

function addDays_(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function dateKeyFromDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function writeClassSessionGenerationLog_(spreadsheet, targetDate, created, skippedIncomplete) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.CLASS_SESSION_GENERATION_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Daily time trigger';
  values[requiredColumn_(headers, 'Record_ID')] = targetDate;
  values[requiredColumn_(headers, 'Action')] = 'Create fixed class sessions seven days ahead';
  values[requiredColumn_(headers, 'Result')] = 'Success';
  values[requiredColumn_(headers, 'Notes')] = `Created ${created}; skipped ${skippedIncomplete} incomplete fixed schedules.`;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
