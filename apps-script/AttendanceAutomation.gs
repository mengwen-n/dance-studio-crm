/**
 * Dance Studio CRM - Automation V1
 *
 * Bound this script to the private Google Sheet. Install the on-edit trigger
 * with installAttendanceCreditTrigger() after testing the fictional demo data.
 */

// Legacy alias keeps existing function names compatible with the template.
const WOLVES_CRM = DANCE_STUDIO_CRM;

/**
 * Run once from the Apps Script editor. It creates an installable on-edit
 * trigger under the account that runs it.
 */
function installAttendanceCreditTrigger() {
  const spreadsheet = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onAttendanceEdit')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onAttendanceEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

/**
 * Recovery helper for a workbook that previously used an older automation.
 * Run this once after pasting the latest Code.gs. It removes every installable
 * spreadsheet on-edit trigger owned by this Apps Script project, then installs
 * exactly one current onAttendanceEdit trigger. It does not alter Sheet data.
 */
function resetAllAttendanceEditTriggers() {
  const spreadsheet = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getEventType() === ScriptApp.EventType.ON_EDIT)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onAttendanceEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

/**
 * Installable trigger entry point. Do not run this manually without an event.
 */
function onAttendanceEdit(event) {
  if (!event || !event.range || !event.source) {
    throw new Error('onAttendanceEdit must be run by an installable on-edit trigger.');
  }

  const editedSheet = event.range.getSheet();
  if (event.range.getRow() < 2) {
    return;
  }

  if (isRuleEnabled_(event.source, DANCE_STUDIO_CRM.AUDIT_RULE_ID)) {
    processChangeHistoryEdit_(event);
  }

  // One trigger dispatches the enabled CRM modules. Payment processing lives
  // in PaymentsAutomation.gs and is intentionally isolated by its rule.
  if (editedSheet.getName() === 'Payments') {
    processPaymentEdit_(event);
    processWalkInPaymentEdit_(event);
    return;
  }
  if (editedSheet.getName() === DANCE_STUDIO_CRM.LEADS_SHEET) {
    processLeadEdit_(event);
    return;
  }
  if (editedSheet.getName() === DANCE_STUDIO_CRM.ROOM_BOOKINGS_SHEET) {
    processRoomBookingEdit_(event);
    return;
  }
  if (editedSheet.getName() === DANCE_STUDIO_CRM.CLASS_SESSIONS_SHEET) {
    processClassSessionEdit_(event);
    return;
  }
  if (editedSheet.getName() !== WOLVES_CRM.ATTENDANCE_SHEET) return;

  const spreadsheet = event.source;
  const packageCreditsEnabled = isRuleEnabled_(spreadsheet, WOLVES_CRM.PACKAGE_RULE_ID);
  const walkInEnabled = isRuleEnabled_(spreadsheet, WOLVES_CRM.WALK_IN_RULE_ID);
  const trialEnabled = isRuleEnabled_(spreadsheet, WOLVES_CRM.TRIAL_RULE_ID);
  if (!packageCreditsEnabled && !walkInEnabled && !trialEnabled) {
    return;
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const headers = getHeaderMap_(editedSheet);
    const firstRow = event.range.getRow();
    const lastRow = firstRow + event.range.getNumRows() - 1;
    for (let row = firstRow; row <= lastRow; row += 1) {
      if (packageCreditsEnabled) {
        processAttendanceRow_(spreadsheet, editedSheet, headers, row);
      }
      if (walkInEnabled) {
        processWalkInAttendanceRow_(spreadsheet, editedSheet, headers, row);
      }
      if (trialEnabled) processTrialAttendanceRow_(spreadsheet, editedSheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Optional, safe helper for a staff member to retry one existing attendance row
 * after correcting missing data. It still honours RULE-PKG-001 Enabled.
 */
function retryAttendanceCreditDeduction(attendanceId) {
  const spreadsheet = SpreadsheetApp.getActive();
  if (!isRuleEnabled_(spreadsheet, WOLVES_CRM.PACKAGE_RULE_ID)) {
    throw new Error('Set Automation_Rules RULE-PKG-001 Enabled to TRUE before retrying.');
  }

  const attendanceSheet = spreadsheet.getSheetByName(WOLVES_CRM.ATTENDANCE_SHEET);
  const headers = getHeaderMap_(attendanceSheet);
  const idColumn = requiredColumn_(headers, 'Attendance_ID');
  const lastRow = attendanceSheet.getLastRow();
  const ids = attendanceSheet.getRange(2, idColumn + 1, Math.max(lastRow - 1, 0), 1).getDisplayValues();
  const index = ids.findIndex(row => row[0] === attendanceId);
  if (index === -1) {
    throw new Error(`Attendance_ID not found: ${attendanceId}`);
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    processAttendanceRow_(spreadsheet, attendanceSheet, headers, index + 2);
  } finally {
    lock.releaseLock();
  }
}

function processAttendanceRow_(spreadsheet, attendanceSheet, attendanceHeaders, rowNumber) {
  const width = attendanceSheet.getLastColumn();
  const row = attendanceSheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  const field = name => row[requiredColumn_(attendanceHeaders, name)];

  const attendanceId = asText_(field('Attendance_ID'));
  const memberId = asText_(field('Member_ID'));
  const attendanceType = asText_(field('Attendance_Type'));
  const attended = asBoolean_(field('Attended'));
  const existingCreditChange = field('Credit_Change');

  // The row is not ready yet. Do not create noisy logs while staff are typing.
  if (!attendanceId || !memberId || attendanceType !== WOLVES_CRM.PACKAGE_ATTENDANCE_TYPE || !attended) {
    return;
  }

  // A previous automated or manual allocation must never be deducted twice.
  if (Number(existingCreditChange) !== 0 && asText_(existingCreditChange) !== '') {
    return;
  }
  if (hasLedgerReference_(spreadsheet, attendanceId)) {
    writeAutomationLog_(spreadsheet, attendanceId, 'Skipped', '', 'Ledger already exists for this attendance record.');
    return;
  }

  try {
    const packageSheet = spreadsheet.getSheetByName(WOLVES_CRM.MEMBER_PACKAGES_SHEET);
    const packageHeaders = getHeaderMap_(packageSheet);
    const entitlement = findEarliestEligibleEntitlement_(packageSheet, packageHeaders, memberId);
    if (!entitlement) {
      writeAutomationLog_(spreadsheet, attendanceId, 'Needs manual action', 'No eligible active package credit found.', 'Ask the member to purchase or correct a package.');
      return;
    }

    const remainingAfter = entitlement.creditsRemaining - 1;
    packageSheet.getRange(entitlement.rowNumber, requiredColumn_(packageHeaders, 'Credits_Remaining') + 1)
      .setValue(remainingAfter);
    if (remainingAfter === 0) {
      packageSheet.getRange(entitlement.rowNumber, requiredColumn_(packageHeaders, 'Status') + 1)
        .setValue('exhausted');
    }

    appendCreditLedgerRow_(spreadsheet, {
      memberId,
      attendanceId,
      entitlementId: entitlement.entitlementId,
      balanceAfter: remainingAfter
    });

    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Package_ID', entitlement.packageId);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Entitlement_ID', entitlement.entitlementId);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Credit_Change', -1);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Amount_Charged', 0);
    setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Payment_Status', 'Paid');
    if (!field('Recorded_At')) {
      setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Recorded_At', new Date());
    }
    if (!asText_(field('Recorded_By'))) {
      setAttendanceField_(attendanceSheet, attendanceHeaders, rowNumber, 'Recorded_By', actor_());
    }

    writeAutomationLog_(spreadsheet, attendanceId, 'Success', '', `Deducted 1 credit from ${entitlement.entitlementId}; ${remainingAfter} remaining.`);
  } catch (error) {
    writeAutomationLog_(spreadsheet, attendanceId || `Attendance row ${rowNumber}`, 'Error', error.message || String(error), 'No automatic correction was made. Use the manual fallback.');
    throw error;
  }
}

function findEarliestEligibleEntitlement_(sheet, headers, memberId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const today = startOfDay_(new Date());
  const candidates = values.map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(item => asText_(item.row[requiredColumn_(headers, 'Member_ID')]) === memberId)
    .map(item => ({
      rowNumber: item.rowNumber,
      entitlementId: asText_(item.row[requiredColumn_(headers, 'Entitlement_ID')]),
      packageId: asText_(item.row[requiredColumn_(headers, 'Package_ID')]),
      creditsRemaining: Number(item.row[requiredColumn_(headers, 'Credits_Remaining')]),
      expiresAt: asDate_(item.row[requiredColumn_(headers, 'Expires_At')]),
      purchasedAt: asDate_(item.row[requiredColumn_(headers, 'Purchased_At')]),
      status: asText_(item.row[requiredColumn_(headers, 'Status')]).toLowerCase()
    }))
    .filter(item => item.entitlementId && item.packageId && item.status === 'active' && item.creditsRemaining > 0)
    .filter(item => item.expiresAt && startOfDay_(item.expiresAt).getTime() >= today.getTime())
    .sort((left, right) => {
      const expiryDifference = left.expiresAt.getTime() - right.expiresAt.getTime();
      if (expiryDifference !== 0) return expiryDifference;
      const purchaseDifference = (left.purchasedAt || new Date(8640000000000000)).getTime() - (right.purchasedAt || new Date(8640000000000000)).getTime();
      if (purchaseDifference !== 0) return purchaseDifference;
      return left.entitlementId.localeCompare(right.entitlementId);
    });

  return candidates[0] || null;
}

function appendCreditLedgerRow_(spreadsheet, details) {
  const sheet = spreadsheet.getSheetByName(WOLVES_CRM.CREDIT_LEDGER_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Ledger_ID')] = nextId_(sheet, headers, 'Ledger_ID', 'LEDGER-');
  values[requiredColumn_(headers, 'Member_ID')] = details.memberId;
  values[requiredColumn_(headers, 'Event_Date')] = new Date();
  values[requiredColumn_(headers, 'Event_Type')] = 'Attendance_Deduction';
  values[requiredColumn_(headers, 'Reference_ID')] = details.attendanceId;
  values[requiredColumn_(headers, 'Credit_Change')] = -1;
  values[requiredColumn_(headers, 'Balance_After')] = details.balanceAfter;
  values[requiredColumn_(headers, 'Recorded_By')] = actor_();
  values[requiredColumn_(headers, 'Notes')] = 'Automation V1: earliest eligible expiry first.';
  values[requiredColumn_(headers, 'Entitlement_ID')] = details.entitlementId;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function hasLedgerReference_(spreadsheet, attendanceId) {
  const sheet = spreadsheet.getSheetByName(WOLVES_CRM.CREDIT_LEDGER_SHEET);
  const headers = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const referenceColumn = requiredColumn_(headers, 'Reference_ID') + 1;
  return sheet.getRange(2, referenceColumn, lastRow - 1, 1).getDisplayValues()
    .some(row => row[0] === attendanceId);
}

function isRuleEnabled_(spreadsheet, ruleId) {
  const sheet = spreadsheet.getSheetByName(WOLVES_CRM.AUTOMATION_RULES_SHEET);
  const headers = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const ruleIdColumn = requiredColumn_(headers, 'Rule_ID');
  const enabledColumn = requiredColumn_(headers, 'Enabled');
  const rule = rows.find(row => asText_(row[ruleIdColumn]) === ruleId);
  return rule ? asBoolean_(rule[enabledColumn]) : false;
}

function writeAutomationLog_(spreadsheet, recordId, result, errorMessage, notes) {
  const sheet = spreadsheet.getSheetByName(WOLVES_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = WOLVES_CRM.PACKAGE_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Attendance on edit';
  values[requiredColumn_(headers, 'Record_ID')] = recordId;
  values[requiredColumn_(headers, 'Action')] = 'Deduct 1 package credit';
  values[requiredColumn_(headers, 'Result')] = result;
  values[requiredColumn_(headers, 'Error_Message')] = errorMessage;
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function setAttendanceField_(sheet, headers, rowNumber, fieldName, value) {
  sheet.getRange(rowNumber, requiredColumn_(headers, fieldName) + 1).setValue(value);
}

function getHeaderMap_(sheet) {
  if (!sheet) throw new Error('Required sheet was not found.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return headers.reduce((map, header, index) => {
    if (header) map[header] = index;
    return map;
  }, {});
}

function requiredColumn_(headers, fieldName) {
  if (!(fieldName in headers)) {
    throw new Error(`Missing required column: ${fieldName}`);
  }
  return headers[fieldName];
}

function nextId_(sheet, headers, idField, prefix) {
  const lastRow = sheet.getLastRow();
  const idColumn = requiredColumn_(headers, idField) + 1;
  const ids = lastRow < 2 ? [] : sheet.getRange(2, idColumn, lastRow - 1, 1).getDisplayValues();
  const expression = new RegExp(`^${escapeRegExp_(prefix)}(\\d+)$`);
  const highest = ids.reduce((currentHighest, row) => {
    const match = row[0].match(expression);
    return match ? Math.max(currentHighest, Number(match[1])) : currentHighest;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(6, '0')}`;
}

function asText_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function asBoolean_(value) {
  return value === true || asText_(value).toUpperCase() === 'TRUE';
}

function asDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function actor_() {
  const activeUser = Session.getActiveUser().getEmail();
  const effectiveUser = Session.getEffectiveUser().getEmail();
  // The fallback keeps fictional demo rows valid against the User_Roles dropdown.
  // In production, add the installer/admin email to User_Roles.
  return activeUser || effectiveUser || 'admin@example.com';
}

function escapeRegExp_(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
