/**
 * Automation V4 - create one follow-up after a trial-attended lead.
 */
function processLeadEdit_(event) {
  const spreadsheet = event.source;
  const trialFollowUpEnabled = isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.TRIAL_FOLLOW_UP_RULE_ID);
  const conversionEnabled = isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.LEAD_CONVERSION_RULE_ID);
  if (!trialFollowUpEnabled && !conversionEnabled) return;

  const sheet = event.range.getSheet();
  const headers = getHeaderMap_(sheet);
  const firstRow = event.range.getRow();
  const lastRow = firstRow + event.range.getNumRows() - 1;
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    for (let row = firstRow; row <= lastRow; row += 1) {
      if (trialFollowUpEnabled) processTrialFollowUpRow_(spreadsheet, sheet, headers, row);
      if (conversionEnabled) processLeadConversionRow_(spreadsheet, sheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function processTrialFollowUpRow_(spreadsheet, leadSheet, leadHeaders, rowNumber) {
  const row = leadSheet.getRange(rowNumber, 1, 1, leadSheet.getLastColumn()).getValues()[0];
  const field = name => row[requiredColumn_(leadHeaders, name)];
  const leadId = asText_(field('Lead_ID'));
  const status = asText_(field('Status')).toLowerCase();
  if (!leadId || status !== 'trial attended' || hasOpenTrialFollowUp_(spreadsheet, leadId)) return;

  const dueDate = asDate_(field('Follow_Up_Date')) || nextDay_(new Date());
  const assignedTo = asText_(field('Assigned_To')) || actor_();
  const followUpId = appendTrialFollowUp_(spreadsheet, {
    leadId,
    dueDate,
    assignedTo,
    leadName: asText_(field('Name'))
  });

  if (!asDate_(field('Follow_Up_Date'))) {
    leadSheet.getRange(rowNumber, requiredColumn_(leadHeaders, 'Follow_Up_Date') + 1).setValue(dueDate);
  }
  writeTrialFollowUpLog_(spreadsheet, leadId, followUpId);
}

function hasOpenTrialFollowUp_(spreadsheet, leadId) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.FOLLOW_UPS_SHEET);
  const headers = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  return rows.some(row =>
    asText_(row[requiredColumn_(headers, 'Related_Type')]) === 'Lead' &&
    asText_(row[requiredColumn_(headers, 'Related_ID')]) === leadId &&
    asText_(row[requiredColumn_(headers, 'Reason')]) === 'Trial attendance follow-up' &&
    ['open', 'in progress', 'overdue'].includes(asText_(row[requiredColumn_(headers, 'Status')]).toLowerCase())
  );
}

function appendTrialFollowUp_(spreadsheet, details) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.FOLLOW_UPS_SHEET);
  const headers = getHeaderMap_(sheet);
  const followUpId = nextId_(sheet, headers, 'Follow_Up_ID', 'FU-');
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Follow_Up_ID')] = followUpId;
  values[requiredColumn_(headers, 'Created_At')] = new Date();
  values[requiredColumn_(headers, 'Related_Type')] = 'Lead';
  values[requiredColumn_(headers, 'Related_ID')] = details.leadId;
  values[requiredColumn_(headers, 'Reason')] = 'Trial attendance follow-up';
  values[requiredColumn_(headers, 'Due_Date')] = details.dueDate;
  values[requiredColumn_(headers, 'Assigned_To')] = details.assignedTo;
  values[requiredColumn_(headers, 'Status')] = 'Open';
  values[requiredColumn_(headers, 'Notes')] = `Automation V4: follow up after trial attendance${details.leadName ? ` (${details.leadName})` : ''}.`;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
  return followUpId;
}

function writeTrialFollowUpLog_(spreadsheet, leadId, followUpId) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.TRIAL_FOLLOW_UP_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Leads on edit';
  values[requiredColumn_(headers, 'Record_ID')] = leadId;
  values[requiredColumn_(headers, 'Action')] = 'Create trial attendance follow-up';
  values[requiredColumn_(headers, 'Result')] = 'Success';
  values[requiredColumn_(headers, 'Error_Message')] = '';
  values[requiredColumn_(headers, 'Notes')] = `Created ${followUpId}.`;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function nextDay_(date) {
  const result = startOfDay_(date);
  result.setDate(result.getDate() + 1);
  return result;
}
