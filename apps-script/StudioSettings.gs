/** Shared configuration readers. Missing/ambiguous configuration stops processing. */
function studioRows_(ss, tab) {
  const sheet = ss.getSheetByName(tab);
  const headers = getHeaderMap_(sheet);
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return rows.map(row => Object.keys(headers).reduce((item, key) => {
    item[key] = row[headers[key]];
    return item;
  }, {}));
}

function studioSetting_(ss, key) {
  const matches = studioRows_(ss, 'Settings').filter(row => asText_(row.Key) === key);
  if (matches.length !== 1 || asText_(matches[0].Value) === '') {
    throw new Error(`Configuration: Settings.${key} requires exactly one non-empty value.`);
  }
  return asText_(matches[0].Value);
}

function studioNumber_(value, label, integer) {
  const number = Number(value);
  if (asText_(value) === '' || !Number.isFinite(number) || number < 0 || (integer && (!Number.isInteger(number) || number < 1))) {
    throw new Error(`Configuration: ${label} is invalid.`);
  }
  return number;
}

function studioPackage_(ss, id) {
  const matches = studioRows_(ss, 'Packages').filter(row => asText_(row.Package_ID) === id);
  if (matches.length !== 1 || asText_(matches[0].Active_Status).toLowerCase() !== 'active') {
    throw new Error(`Configuration: package ${id} must exist exactly once and be active.`);
  }
  const row = matches[0];
  return { packageId: id, amount: studioNumber_(row.Price, `${id}.Price`, false),
    validityDays: studioNumber_(row.Validity_Days, `${id}.Validity_Days`, true), memberType: asText_(row.Member_Type) };
}

function studioRoomLimit_(ss, roomId) {
  const matches = studioRows_(ss, 'Rooms').filter(row => asText_(row.Room_ID) === roomId);
  if (matches.length !== 1) throw new Error(`Configuration: room ${roomId} must exist exactly once.`);
  // One means exclusive; larger values permit only Crew_Practice sharing.
  return studioNumber_(matches[0].Max_Shared_Crew_Teams, `${roomId}.Max_Shared_Crew_Teams`, true);
}

function validateStudioConfiguration() {
  const ss = SpreadsheetApp.getActive();
  if (isRuleEnabled_(ss, DANCE_STUDIO_CRM.WALK_IN_RULE_ID)) {
    studioSetting_(ss, 'WalkIn_Allowed_Class_Types');
    ['Public', 'Walk_In', 'In_House_Crew', 'Trial'].forEach(type => getWalkInRate_(ss, type));
  }
  if (isRuleEnabled_(ss, DANCE_STUDIO_CRM.TRIAL_RULE_ID)) {
    studioPackage_(ss, studioSetting_(ss, 'Trial_Package_ID'));
    studioSetting_(ss, 'Trial_Allowed_Class_Types');
  }
  if (isRuleEnabled_(ss, DANCE_STUDIO_CRM.ROOM_CONFLICT_RULE_ID)) {
    studioRows_(ss, 'Rooms').filter(row => asText_(row.Room_ID)).forEach(row => studioRoomLimit_(ss, asText_(row.Room_ID)));
  }
  if (isRuleEnabled_(ss, DANCE_STUDIO_CRM.CLASS_SESSION_GENERATION_RULE_ID)) {
    const room = studioSetting_(ss, 'Default_Fixed_Class_Room_ID');
    if (studioRows_(ss, 'Rooms').filter(row => asText_(row.Room_ID) === room).length !== 1) throw new Error('Configuration: default room does not exist uniquely.');
  }
  return 'Enabled module configuration validated.';
}
