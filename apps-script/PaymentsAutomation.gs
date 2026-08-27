/**
 * Automation V2 - Payment to package entitlement.
 *
 * Paste this file into the same Apps Script project as
 * AttendanceAutomation.gs. It is dispatched by the existing single trigger.
 */

const PAYMENT_RULE_ID = 'RULE-PAY-001';
const PAYMENT_RULE_NAME = 'Payment to package entitlement';

function processPaymentEdit_(event) {
  const spreadsheet = event.source;
  if (!isRuleEnabled_(spreadsheet, PAYMENT_RULE_ID)) return;

  const sheet = event.range.getSheet();
  const headers = getHeaderMap_(sheet);
  const firstRow = event.range.getRow();
  const lastRow = firstRow + event.range.getNumRows() - 1;
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    for (let row = firstRow; row <= lastRow; row += 1) {
      processPaymentRow_(spreadsheet, sheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function processPaymentRow_(spreadsheet, paymentSheet, paymentHeaders, rowNumber) {
  const row = paymentSheet.getRange(rowNumber, 1, 1, paymentSheet.getLastColumn()).getValues()[0];
  const field = name => row[requiredColumn_(paymentHeaders, name)];
  const paymentId = asText_(field('Payment_ID'));
  const memberId = asText_(field('Member_ID'));
  const packageId = asText_(field('Package_ID'));
  const paymentType = asText_(field('Payment_Type'));
  const paymentStatus = asText_(field('Payment_Status')).toLowerCase();
  const existingEntitlementId = asText_(field('Entitlement_ID'));

  // Staff may enter a row in stages. Process only a complete, paid purchase.
  if (!paymentId || !memberId || !packageId || paymentType !== 'Package_Purchase' || paymentStatus !== 'paid' || existingEntitlementId) return;

  try {
    const packageSheet = spreadsheet.getSheetByName('Packages');
    const packageHeaders = getHeaderMap_(packageSheet);
    const packageInfo = findActivePackage_(packageSheet, packageHeaders, packageId);
    if (!packageInfo) {
      writePaymentAutomationLog_(spreadsheet, paymentId, 'Needs manual action', '', `Package ${packageId} was not found or is not active.`);
      return;
    }

    const entitlementId = nextId_(spreadsheet.getSheetByName('Member_Packages'), getHeaderMap_(spreadsheet.getSheetByName('Member_Packages')), 'Entitlement_ID', 'ENT-');
    const paidDate = asDate_(field('Paid_Date')) || new Date();
    const coverageStart = asDate_(field('Coverage_Start')) || paidDate;
    const coverageEnd = asDate_(field('Coverage_End')) || addDays_(coverageStart, packageInfo.validityDays);

    appendEntitlement_(spreadsheet, {
      entitlementId,
      memberId,
      packageId,
      purchasedAt: paidDate,
      creditsGranted: packageInfo.creditsIncluded,
      validFrom: coverageStart,
      expiresAt: coverageEnd,
      paymentId
    });

    setPaymentField_(paymentSheet, paymentHeaders, rowNumber, 'Entitlement_ID', entitlementId);
    if (!asText_(field('Credits_Granted'))) setPaymentField_(paymentSheet, paymentHeaders, rowNumber, 'Credits_Granted', packageInfo.creditsIncluded);
    if (!asDate_(field('Coverage_Start'))) setPaymentField_(paymentSheet, paymentHeaders, rowNumber, 'Coverage_Start', coverageStart);
    if (!asDate_(field('Coverage_End'))) setPaymentField_(paymentSheet, paymentHeaders, rowNumber, 'Coverage_End', coverageEnd);
    writePaymentAutomationLog_(spreadsheet, paymentId, 'Success', '', `Created ${entitlementId} with ${packageInfo.creditsIncluded} credits.`);
  } catch (error) {
    writePaymentAutomationLog_(spreadsheet, paymentId || `Payments row ${rowNumber}`, 'Error', error.message || String(error), 'No entitlement was created by this run.');
    throw error;
  }
}

function findActivePackage_(sheet, headers, packageId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const packageIdColumn = requiredColumn_(headers, 'Package_ID');
  const match = values.find(row => asText_(row[packageIdColumn]) === packageId && asText_(row[requiredColumn_(headers, 'Active_Status')]).toLowerCase() === 'active');
  if (!match) return null;
  return {
    creditsIncluded: Number(match[requiredColumn_(headers, 'Credits_Included')]),
    validityDays: Number(match[requiredColumn_(headers, 'Validity_Days')])
  };
}

function appendEntitlement_(spreadsheet, details) {
  const sheet = spreadsheet.getSheetByName('Member_Packages');
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Entitlement_ID')] = details.entitlementId;
  values[requiredColumn_(headers, 'Member_ID')] = details.memberId;
  values[requiredColumn_(headers, 'Package_ID')] = details.packageId;
  values[requiredColumn_(headers, 'Purchased_At')] = details.purchasedAt;
  values[requiredColumn_(headers, 'Credits_Granted')] = details.creditsGranted;
  values[requiredColumn_(headers, 'Credits_Remaining')] = details.creditsGranted;
  values[requiredColumn_(headers, 'Valid_From')] = details.validFrom;
  values[requiredColumn_(headers, 'Expires_At')] = details.expiresAt;
  values[requiredColumn_(headers, 'Payment_ID')] = details.paymentId;
  values[requiredColumn_(headers, 'Status')] = 'active';
  values[requiredColumn_(headers, 'Notes')] = 'Automation V2: created from paid payment.';
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function setPaymentField_(sheet, headers, rowNumber, fieldName, value) {
  sheet.getRange(rowNumber, requiredColumn_(headers, fieldName) + 1).setValue(value);
}

function writePaymentAutomationLog_(spreadsheet, recordId, result, errorMessage, notes) {
  const sheet = spreadsheet.getSheetByName('Automation_Log');
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = PAYMENT_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Payments on edit';
  values[requiredColumn_(headers, 'Record_ID')] = recordId;
  values[requiredColumn_(headers, 'Action')] = 'Create member package entitlement';
  values[requiredColumn_(headers, 'Result')] = result;
  values[requiredColumn_(headers, 'Error_Message')] = errorMessage;
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function addDays_(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
