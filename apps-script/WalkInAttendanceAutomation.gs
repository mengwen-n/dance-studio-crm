/**
 * Dance Studio CRM - Automation V10
 *
 * Creates one payable walk-in charge from an attended, eligible fixed class.
 * The staff still record the actual money received in Payments; this module
 * only records what is owed and prevents duplicate charges for the same row.
 */

function processWalkInAttendanceRow_(spreadsheet, attendanceSheet, attendanceHeaders, rowNumber) {
  const row = attendanceSheet.getRange(rowNumber, 1, 1, attendanceSheet.getLastColumn()).getValues()[0];
  const field = name => row[requiredColumn_(attendanceHeaders, name)];
  const attendanceId = asText_(field('Attendance_ID'));
  const memberId = asText_(field('Member_ID'));
  const sessionId = asText_(field('Session_ID'));
  const attendanceType = asText_(field('Attendance_Type'));
  const memberType = asText_(field('Member_Type_At_Time'));

  if (!attendanceId || !memberId || !sessionId || attendanceType !== DANCE_STUDIO_CRM.WALK_IN_ATTENDANCE_TYPE || !asBoolean_(field('Attended'))) {
    return;
  }
  if (hasWalkInCharge_(spreadsheet, attendanceId)) {
    return;
  }

  try {
    const session = getWalkInSession_(spreadsheet, sessionId);
    if (!session) {
      writeWalkInAutomationLog_(spreadsheet, attendanceId, 'Needs manual action', '', `Session ${sessionId} was not found.`);
      return;
    }
    const allowedTypes = studioSetting_(spreadsheet, 'WalkIn_Allowed_Class_Types').split(',').map(value => value.trim());
    if (session.status === 'cancelled' || !allowedTypes.includes(session.classType)) {
      writeWalkInAutomationLog_(spreadsheet, attendanceId, 'Needs manual action', '', 'Session is cancelled or its class type is not enabled for walk-in pricing.');
      return;
    }

    const rate = getWalkInRate_(spreadsheet, memberType);
    if (!rate) {
      writeWalkInAutomationLog_(spreadsheet, attendanceId, 'Needs manual action', '', `Unsupported walk-in member type: ${memberType || '(blank)'}.`);
      return;
    }

    appendWalkInCharge_(spreadsheet, {
      attendanceId,
      memberId,
      sessionDate: session.sessionDate,
      amount: rate.amount
    });
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Package_ID', rate.packageId);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Credit_Change', 0);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Amount_Charged', rate.amount);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Payment_Status', 'Pending');
    if (!field('Recorded_At')) setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Recorded_At', new Date());
    if (!asText_(field('Recorded_By'))) setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Recorded_By', actor_());
    writeWalkInAutomationLog_(spreadsheet, attendanceId, 'Success', '', `Created a RM${rate.amount} walk-in charge; payment is pending.`);
  } catch (error) {
    writeWalkInAutomationLog_(spreadsheet, attendanceId || `Attendance row ${rowNumber}`, 'Error', error.message || String(error), 'No automatic correction was made.');
    throw error;
  }
}

function getWalkInRate_(ss, memberType) {
  const id = studioSetting_(ss, `WalkIn_Package_${memberType}`);
  if (id === 'DISABLED') return null;
  const rate = studioPackage_(ss, id);
  if (rate.memberType !== memberType) throw new Error(`Configuration: ${id} does not match member type ${memberType}.`);
  return rate;
}

function getWalkInSession_(spreadsheet, sessionId) {
  const sessionSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.CLASS_SESSIONS_SHEET);
  const sessionHeaders = getHeaderMap_(sessionSheet);
  const sessionRows = sessionSheet.getLastRow() < 2 ? [] : sessionSheet.getRange(2, 1, sessionSheet.getLastRow() - 1, sessionSheet.getLastColumn()).getValues();
  const sessionRow = sessionRows.find(row => asText_(row[requiredColumn_(sessionHeaders, 'Session_ID')]) === sessionId);
  if (!sessionRow) return null;

  const classId = asText_(sessionRow[requiredColumn_(sessionHeaders, 'Class_ID')]);
  const classSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.CLASSES_SHEET);
  const classHeaders = getHeaderMap_(classSheet);
  const classRows = classSheet.getLastRow() < 2 ? [] : classSheet.getRange(2, 1, classSheet.getLastRow() - 1, classSheet.getLastColumn()).getValues();
  const classRow = classRows.find(row => asText_(row[requiredColumn_(classHeaders, 'Class_ID')]) === classId);
  if (!classRow) return null;

  return {
    sessionDate: asDate_(sessionRow[requiredColumn_(sessionHeaders, 'Session_Date')]) || new Date(),
    status: asText_(sessionRow[requiredColumn_(sessionHeaders, 'Status')]).toLowerCase(),
    classType: asText_(classRow[requiredColumn_(classHeaders, 'Class_Type')])
  };
}

function hasWalkInCharge_(spreadsheet, attendanceId) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_CHARGES_SHEET);
  const headers = getHeaderMap_(sheet);
  if (sheet.getLastRow() < 2) return false;
  const notesColumn = requiredColumn_(headers, 'Notes') + 1;
  return sheet.getRange(2, notesColumn, sheet.getLastRow() - 1, 1).getDisplayValues()
    .some(row => row[0].indexOf(`Attendance_ID: ${attendanceId}`) !== -1);
}

function appendWalkInCharge_(spreadsheet, details) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_CHARGES_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Charge_ID')] = nextId_(sheet, headers, 'Charge_ID', 'CHG-');
  values[requiredColumn_(headers, 'Member_ID')] = details.memberId;
  values[requiredColumn_(headers, 'Charge_Type')] = 'Walk_In';
  values[requiredColumn_(headers, 'Billing_Period')] = Utilities.formatDate(details.sessionDate, Session.getScriptTimeZone(), 'yyyy-MM');
  values[requiredColumn_(headers, 'Coverage_Start')] = details.sessionDate;
  values[requiredColumn_(headers, 'Coverage_End')] = details.sessionDate;
  values[requiredColumn_(headers, 'Amount_Due')] = details.amount;
  values[requiredColumn_(headers, 'Due_Date')] = details.sessionDate;
  values[requiredColumn_(headers, 'Status')] = 'Due';
  values[requiredColumn_(headers, 'Generated_By')] = 'Automation';
  values[requiredColumn_(headers, 'Notes')] = `Automation V10. Attendance_ID: ${details.attendanceId}`;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function writeWalkInAutomationLog_(spreadsheet, recordId, result, errorMessage, notes) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.WALK_IN_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Attendance on edit';
  values[requiredColumn_(headers, 'Record_ID')] = recordId;
  values[requiredColumn_(headers, 'Action')] = 'Create walk-in charge';
  values[requiredColumn_(headers, 'Result')] = result;
  values[requiredColumn_(headers, 'Error_Message')] = errorMessage;
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
