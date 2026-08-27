/**
 * Automation V9 - create one Member record when a Lead is marked Converted.
 * It never creates a second member from the same lead and stops for possible
 * phone/email duplicates so an admin can decide whether records should merge.
 */
function processLeadConversionRow_(spreadsheet, leadSheet, leadHeaders, rowNumber) {
  const lead = leadSheet.getRange(rowNumber, 1, 1, leadSheet.getLastColumn()).getValues()[0];
  const field = name => lead[requiredColumn_(leadHeaders, name)];
  const leadId = asText_(field('Lead_ID'));
  const status = asText_(field('Status')).toLowerCase();
  const convertedMemberId = asText_(field('Converted_Member_ID'));
  if (!leadId || status !== 'converted' || convertedMemberId) return;

  const memberSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBERS_SHEET);
  const memberHeaders = getHeaderMap_(memberSheet);
  const existing = getLeadConversionMemberMatch_(memberSheet, memberHeaders, leadId, field('Phone'), field('Email'));
  if (existing.type === 'lead_link') {
    leadSheet.getRange(rowNumber, requiredColumn_(leadHeaders, 'Converted_Member_ID') + 1).setValue(existing.memberId);
    writeLeadConversionLog_(spreadsheet, leadId, 'Success', '', `Linked existing member ${existing.memberId} already associated with this lead.`);
    return;
  }
  if (existing.type === 'contact_duplicate') {
    writeLeadConversionLog_(spreadsheet, leadId, 'Needs manual action', '', `Possible existing member ${existing.memberId} has the same phone or email. Link or merge manually.`);
    return;
  }

  const memberType = memberTypeFromLeadInterest_(field('Interest'));
  const memberId = appendConvertedMember_(memberSheet, memberHeaders, {
    leadId,
    name: asText_(field('Name')),
    phone: asText_(field('Phone')),
    email: asText_(field('Email')),
    memberType
  });
  leadSheet.getRange(rowNumber, requiredColumn_(leadHeaders, 'Converted_Member_ID') + 1).setValue(memberId);
  writeLeadConversionLog_(spreadsheet, leadId, 'Success', '', `Created ${memberId} as ${memberType}.`);
}

function getLeadConversionMemberMatch_(sheet, headers, leadId, phone, email) {
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return { type: 'none' };
  const rows = sheet.getRange(2, 1, rowCount, sheet.getLastColumn()).getValues();
  const targetPhone = asText_(phone);
  const targetEmail = asText_(email).toLowerCase();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const memberId = asText_(row[requiredColumn_(headers, 'Member_ID')]);
    if (!memberId) continue;
    if (asText_(row[requiredColumn_(headers, 'Source_Lead_ID')]) === leadId) return { type: 'lead_link', memberId };
    const samePhone = targetPhone && asText_(row[requiredColumn_(headers, 'Phone')]) === targetPhone;
    const sameEmail = targetEmail && asText_(row[requiredColumn_(headers, 'Email')]).toLowerCase() === targetEmail;
    if (samePhone || sameEmail) return { type: 'contact_duplicate', memberId };
  }
  return { type: 'none' };
}

function appendConvertedMember_(sheet, headers, details) {
  const rowNumber = lastConvertedMemberRow_(sheet, headers) + 1;
  const memberId = nextId_(sheet, headers, 'Member_ID', 'M-');
  const set = (fieldName, value) => sheet.getRange(rowNumber, requiredColumn_(headers, fieldName) + 1).setValue(value);
  set('Member_ID', memberId);
  set('Joined_At', new Date());
  set('Name', details.name);
  set('Phone', details.phone);
  set('Email', details.email);
  set('Member_Type', details.memberType);
  set('Status', 'active');
  set('Notes', `Automation V9: converted from ${details.leadId}.`);
  set('Source_Lead_ID', details.leadId);
  set('Member_Origin', 'Lead_Conversion');
  sheet.getRange(rowNumber, requiredColumn_(headers, 'Joined_At') + 1).setNumberFormat('yyyy-mm-dd');
  return memberId;
}

function lastConvertedMemberRow_(sheet, headers) {
  const idColumn = requiredColumn_(headers, 'Member_ID') + 1;
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return 1;
  const ids = sheet.getRange(2, idColumn, rowCount, 1).getDisplayValues();
  for (let index = ids.length - 1; index >= 0; index -= 1) {
    if (asText_(ids[index][0])) return index + 2;
  }
  return 1;
}

function memberTypeFromLeadInterest_(interest) {
  return asText_(interest).toLowerCase() === 'in-house crew'
    ? DANCE_STUDIO_CRM.IN_HOUSE_MEMBER_TYPE
    : 'Public';
}

function writeLeadConversionLog_(spreadsheet, leadId, result, errorMessage, notes) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.LEAD_CONVERSION_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Leads on edit';
  values[requiredColumn_(headers, 'Record_ID')] = leadId;
  values[requiredColumn_(headers, 'Action')] = 'Create or link converted member';
  values[requiredColumn_(headers, 'Result')] = result;
  values[requiredColumn_(headers, 'Error_Message')] = errorMessage;
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
