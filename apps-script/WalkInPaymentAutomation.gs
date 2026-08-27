/**
 * Dance Studio CRM - Automation V11
 *
 * A paid Walk_In payment is matched by its Attendance_ID. The payment must
 * equal the charge amount; then the linked Member_Charges and Attendance rows
 * are marked Paid. It never creates a package entitlement.
 */

function processWalkInPaymentEdit_(event) {
  const spreadsheet = event.source;
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.WALK_IN_PAYMENT_RULE_ID)) return;
  const paymentSheet = event.range.getSheet();
  const headers = getHeaderMap_(paymentSheet);
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const firstRow = event.range.getRow();
    const lastRow = firstRow + event.range.getNumRows() - 1;
    for (let row = firstRow; row <= lastRow; row += 1) {
      processWalkInPaymentRow_(spreadsheet, paymentSheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function processWalkInPaymentRow_(spreadsheet, paymentSheet, paymentHeaders, rowNumber) {
  const row = paymentSheet.getRange(rowNumber, 1, 1, paymentSheet.getLastColumn()).getValues()[0];
  const field = name => row[requiredColumn_(paymentHeaders, name)];
  const paymentId = asText_(field('Payment_ID'));
  const memberId = asText_(field('Member_ID'));
  const attendanceId = asText_(field('Attendance_ID'));
  const paymentType = asText_(field('Payment_Type'));
  const paymentStatus = asText_(field('Payment_Status')).toLowerCase();
  const amountPaid = Number(field('Amount_Paid'));
  if (!paymentId || !memberId || !attendanceId || paymentType !== 'Walk_In' || paymentStatus !== 'paid') return;

  try {
    const attendance = findAttendanceForWalkInPayment_(spreadsheet, attendanceId);
    if (!attendance) {
      writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', `Attendance ${attendanceId} was not found.`);
      return;
    }
    if (attendance.memberId !== memberId || attendance.attendanceType !== DANCE_STUDIO_CRM.WALK_IN_ATTENDANCE_TYPE) {
      writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', 'Payment member or attendance type does not match the referenced walk-in attendance.');
      return;
    }

    const charge = findWalkInChargeForAttendance_(spreadsheet, attendanceId);
    if (!charge) {
      writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', `No V10 walk-in charge was found for ${attendanceId}.`);
      return;
    }
    if (charge.status === 'paid' && charge.paymentId === paymentId && attendance.paymentStatus === 'Paid') return;
    if (charge.status === 'paid' && charge.paymentId !== paymentId) {
      writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', `Charge ${charge.chargeId} is already paid by ${charge.paymentId || 'another payment'}.`);
      return;
    }
    if (Number.isNaN(amountPaid) || amountPaid !== charge.amountDue) {
      writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', `Amount paid RM${amountPaid} does not equal charge ${charge.chargeId} (RM${charge.amountDue}).`);
      return;
    }

    charge.sheet.getRange(charge.rowNumber, requiredColumn_(charge.headers, 'Payment_ID') + 1).setValue(paymentId);
    charge.sheet.getRange(charge.rowNumber, requiredColumn_(charge.headers, 'Status') + 1).setValue('Paid');
    attendance.sheet.getRange(attendance.rowNumber, requiredColumn_(attendance.headers, 'Payment_Status') + 1).setValue('Paid');
    writeWalkInPaymentAutomationLog_(spreadsheet, paymentId, 'Success', '', `Marked ${charge.chargeId} and ${attendanceId} as Paid.`);
  } catch (error) {
    writeWalkInPaymentAutomationLog_(spreadsheet, paymentId || `Payments row ${rowNumber}`, 'Error', error.message || String(error), 'No walk-in charge or attendance status was changed.');
    throw error;
  }
}

function findAttendanceForWalkInPayment_(spreadsheet, attendanceId) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.ATTENDANCE_SHEET);
  const headers = getHeaderMap_(sheet);
  if (sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const index = rows.findIndex(row => asText_(row[requiredColumn_(headers, 'Attendance_ID')]) === attendanceId);
  if (index === -1) return null;
  const row = rows[index];
  return {
    sheet, headers, rowNumber: index + 2,
    memberId: asText_(row[requiredColumn_(headers, 'Member_ID')]),
    attendanceType: asText_(row[requiredColumn_(headers, 'Attendance_Type')]),
    paymentStatus: asText_(row[requiredColumn_(headers, 'Payment_Status')])
  };
}

function findWalkInChargeForAttendance_(spreadsheet, attendanceId) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_CHARGES_SHEET);
  const headers = getHeaderMap_(sheet);
  if (sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const index = rows.findIndex(row => asText_(row[requiredColumn_(headers, 'Notes')]).indexOf(`Attendance_ID: ${attendanceId}`) !== -1);
  if (index === -1) return null;
  const row = rows[index];
  return {
    sheet, headers, rowNumber: index + 2,
    chargeId: asText_(row[requiredColumn_(headers, 'Charge_ID')]),
    amountDue: Number(row[requiredColumn_(headers, 'Amount_Due')]),
    paymentId: asText_(row[requiredColumn_(headers, 'Payment_ID')]),
    status: asText_(row[requiredColumn_(headers, 'Status')]).toLowerCase()
  };
}

function writeWalkInPaymentAutomationLog_(spreadsheet, recordId, result, errorMessage, notes) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.WALK_IN_PAYMENT_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Payments on edit';
  values[requiredColumn_(headers, 'Record_ID')] = recordId;
  values[requiredColumn_(headers, 'Action')] = 'Mark walk-in charge and attendance paid';
  values[requiredColumn_(headers, 'Result')] = result;
  values[requiredColumn_(headers, 'Error_Message')] = errorMessage;
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
