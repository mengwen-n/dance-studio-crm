/**
 * Automation V3 - daily package maintenance.
 *
 * A daily trigger can call runDailyPackageMaintenance(). It only changes
 * active entitlements: expiry takes priority over zero remaining credits.
 */
function installPackageMaintenanceTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runDailyPackageMaintenance')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('runDailyPackageMaintenance')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

function runDailyPackageMaintenance() {
  const spreadsheet = SpreadsheetApp.getActive();
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.PACKAGE_MAINTENANCE_RULE_ID)) {
    return { processed: 0, changed: 0, skipped: 'Rule is disabled' };
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_PACKAGES_SHEET);
    const headers = getHeaderMap_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { processed: 0, changed: 0 };

    const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const today = startOfDay_(new Date());
    const statusColumn = requiredColumn_(headers, 'Status') + 1;
    const results = [];

    rows.forEach((row, index) => {
      const currentStatus = asText_(row[requiredColumn_(headers, 'Status')]).toLowerCase();
      if (currentStatus !== 'active') return;

      const entitlementId = asText_(row[requiredColumn_(headers, 'Entitlement_ID')]);
      const expiresAt = asDate_(row[requiredColumn_(headers, 'Expires_At')]);
      const creditsRemaining = Number(row[requiredColumn_(headers, 'Credits_Remaining')]);
      const newStatus = getPackageMaintenanceStatus_(expiresAt, creditsRemaining, today);
      if (!entitlementId || !newStatus) return;

      const rowNumber = index + 2;
      sheet.getRange(rowNumber, statusColumn).setValue(newStatus);
      results.push({ entitlementId, oldStatus: currentStatus, newStatus });

      if (isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.AUDIT_RULE_ID)) {
        appendChangeLogRow_(spreadsheet, {
          sourceTab: DANCE_STUDIO_CRM.MEMBER_PACKAGES_SHEET,
          recordId: entitlementId,
          fieldName: 'Status',
          oldValue: currentStatus,
          newValue: newStatus,
          changedBy: actor_(),
          changeSource: 'Automation V3',
          reason: newStatus === 'expired' ? 'Expiry date reached.' : 'No credits remaining.'
        });
      }
    });

    if (results.length > 0) {
      writePackageMaintenanceLog_(spreadsheet, results);
    }
    return { processed: rows.length, changed: results.length };
  } finally {
    lock.releaseLock();
  }
}

function getPackageMaintenanceStatus_(expiresAt, creditsRemaining, today) {
  if (expiresAt && startOfDay_(expiresAt).getTime() < today.getTime()) return 'expired';
  if (creditsRemaining <= 0) return 'exhausted';
  return '';
}

function writePackageMaintenanceLog_(spreadsheet, results) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.PACKAGE_MAINTENANCE_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Daily time trigger';
  values[requiredColumn_(headers, 'Record_ID')] = results.map(item => item.entitlementId).join(', ');
  values[requiredColumn_(headers, 'Action')] = 'Update active package status';
  values[requiredColumn_(headers, 'Result')] = 'Success';
  values[requiredColumn_(headers, 'Error_Message')] = '';
  values[requiredColumn_(headers, 'Notes')] = results.map(item => `${item.entitlementId}: ${item.oldStatus} → ${item.newStatus}`).join('; ');
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
