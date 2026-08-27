/**
 * Automation V2.1 - Important field change history.
 *
 * This records selected status and critical field changes only. It does not
 * record ordinary Notes edits or every cell change.
 */
function processChangeHistoryEdit_(event) {
  const sheet = event.range.getSheet();
  const sheetName = sheet.getName();
  const fieldsToAudit = DANCE_STUDIO_CRM.AUDITED_FIELDS[sheetName] || [];
  if (sheetName === DANCE_STUDIO_CRM.CHANGE_LOG_SHEET || fieldsToAudit.length === 0) return;
  if (event.range.getNumRows() !== 1 || event.range.getNumColumns() !== 1) return;

  const headers = getHeaderMap_(sheet);
  const editedColumn = event.range.getColumn() - 1;
  const fieldName = Object.keys(headers).find(name => headers[name] === editedColumn);
  if (!fieldName || !fieldsToAudit.includes(fieldName)) return;

  const newValue = event.range.getDisplayValue();
  const oldValue = event.oldValue === undefined ? '' : String(event.oldValue);
  if (oldValue === newValue) return;

  const row = sheet.getRange(event.range.getRow(), 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const recordId = findRecordId_(headers, row);
  if (!recordId) return;

  appendChangeLogRow_(event.source, {
    sourceTab: sheetName,
    recordId,
    fieldName,
    oldValue,
    newValue,
    changedBy: actor_(),
    changeSource: 'Manual edit',
    reason: ''
  });
}

function findRecordId_(headers, row) {
  const priority = ['Member_ID', 'Payment_ID', 'Entitlement_ID', 'Attendance_ID', 'Lead_ID', 'Booking_ID', 'Event_ID', 'Class_ID'];
  for (const fieldName of priority) {
    if (fieldName in headers && asText_(row[headers[fieldName]])) return asText_(row[headers[fieldName]]);
  }
  return '';
}

function appendChangeLogRow_(spreadsheet, details) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.CHANGE_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Change_ID')] = nextId_(sheet, headers, 'Change_ID', 'CHG-');
  values[requiredColumn_(headers, 'Source_Tab')] = details.sourceTab;
  values[requiredColumn_(headers, 'Record_ID')] = details.recordId;
  values[requiredColumn_(headers, 'Field_Name')] = details.fieldName;
  values[requiredColumn_(headers, 'Old_Value')] = details.oldValue;
  values[requiredColumn_(headers, 'New_Value')] = details.newValue;
  values[requiredColumn_(headers, 'Changed_At')] = new Date();
  values[requiredColumn_(headers, 'Changed_By')] = details.changedBy;
  values[requiredColumn_(headers, 'Change_Source')] = details.changeSource;
  values[requiredColumn_(headers, 'Reason')] = details.reason;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
