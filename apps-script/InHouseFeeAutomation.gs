/**
 * Automation V8 - monthly in-house studio fees.
 *
 * One charge is created per eligible in-house member and billing month.
 * A full, approved, on-time rest month is recorded as a RM0 waived charge,
 * preserving the billing audit trail without charging the member.
 */
function installInHouseFeeTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runMonthlyInHouseFeeGeneration')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('runMonthlyInHouseFeeGeneration')
    .timeBased()
    .everyDays(1)
    .atHour(4)
    .create();
}

function runMonthlyInHouseFeeGeneration() {
  const spreadsheet = SpreadsheetApp.getActive();
  const lifecycle = runInHouseRestLifecycle_(spreadsheet, startOfDay_(new Date()));
  const fees = runInHouseFeeGenerationForPeriod_(spreadsheet, startOfMonth_(new Date()));
  return { lifecycle, fees };
}

/** Run manually near month-end to prepare the next calendar month's fees. */
function runNextMonthInHouseFeeGeneration() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return runInHouseFeeGenerationForPeriod_(SpreadsheetApp.getActive(), nextMonth);
}

/** Safe manual action: applies rest starts/ends for today. */
function runInHouseRestLifecycle() {
  return runInHouseRestLifecycle_(SpreadsheetApp.getActive(), startOfDay_(new Date()));
}

function runInHouseRestLifecycle_(spreadsheet, today) {
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.IN_HOUSE_REST_RULE_ID)) {
    return { changed: 0, skipped: 'Rule is disabled' };
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const memberSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBERS_SHEET);
    const restSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_REST_REQUESTS_SHEET);
    const memberHeaders = getHeaderMap_(memberSheet);
    const restHeaders = getHeaderMap_(restSheet);
    const members = getRecordsWithId_(memberSheet, memberHeaders, 'Member_ID');
    const rests = getRecordsWithId_(restSheet, restHeaders, 'Rest_Request_ID');
    const actions = [];

    rests.forEach(rest => {
      const field = name => rest.values[requiredColumn_(restHeaders, name)];
      const restId = asText_(field('Rest_Request_ID'));
      const memberId = asText_(field('Member_ID'));
      const restStatus = asText_(field('Status')).toLowerCase();
      const startDate = asDate_(field('Rest_Start_Date'));
      const endDate = asDate_(field('Rest_End_Date'));
      if (!restId || !memberId || !startDate || !endDate || !['approved', 'active'].includes(restStatus)) return;

      const member = members.find(item => asText_(item.values[requiredColumn_(memberHeaders, 'Member_ID')]) === memberId);
      if (!member || asText_(member.values[requiredColumn_(memberHeaders, 'Member_Type')]) !== DANCE_STUDIO_CRM.IN_HOUSE_MEMBER_TYPE) {
        actions.push({ restId, memberId, result: 'Needs manual action', note: 'Approved rest request does not match an in-house member.' });
        return;
      }

      const currentStatus = asText_(member.values[requiredColumn_(memberHeaders, 'Status')]).toLowerCase();
      const startsTodayOrEarlier = startOfDay_(startDate).getTime() <= today.getTime();
      const endsTodayOrLater = startOfDay_(endDate).getTime() >= today.getTime();
      if (startsTodayOrEarlier && endsTodayOrLater) {
        if (restStatus !== 'active') {
          restSheet.getRange(rest.rowNumber, requiredColumn_(restHeaders, 'Status') + 1).setValue('Active');
        }
        if (currentStatus === 'active') {
          setMemberRestStatus_(spreadsheet, memberSheet, memberHeaders, member, 'on_rest', restId, 'Approved rest period is active.');
          actions.push({ restId, memberId, result: 'Success', note: 'Member set to on_rest; request set to Active.' });
        }
        return;
      }

      if (startOfDay_(endDate).getTime() < today.getTime()) {
        if (restStatus !== 'completed') {
          restSheet.getRange(rest.rowNumber, requiredColumn_(restHeaders, 'Status') + 1).setValue('Completed');
        }
        const hasAnotherActiveRest = rests.some(other => {
          const otherMemberId = asText_(other.values[requiredColumn_(restHeaders, 'Member_ID')]);
          const otherStatus = asText_(other.values[requiredColumn_(restHeaders, 'Status')]).toLowerCase();
          const otherStart = asDate_(other.values[requiredColumn_(restHeaders, 'Rest_Start_Date')]);
          const otherEnd = asDate_(other.values[requiredColumn_(restHeaders, 'Rest_End_Date')]);
          return otherMemberId === memberId && ['approved', 'active'].includes(otherStatus) && otherStart && otherEnd
            && startOfDay_(otherStart).getTime() <= today.getTime() && startOfDay_(otherEnd).getTime() >= today.getTime();
        });
        if (currentStatus === 'on_rest' && !hasAnotherActiveRest) {
          setMemberRestStatus_(spreadsheet, memberSheet, memberHeaders, member, 'active', restId, 'Approved rest period ended.');
          actions.push({ restId, memberId, result: 'Success', note: 'Member returned to active; request set to Completed.' });
        }
      }
    });

    writeInHouseRestLog_(spreadsheet, actions);
    return { changed: actions.length };
  } finally {
    lock.releaseLock();
  }
}

function setMemberRestStatus_(spreadsheet, sheet, headers, member, newStatus, restId, reason) {
  const statusColumn = requiredColumn_(headers, 'Status') + 1;
  const oldStatus = asText_(member.values[requiredColumn_(headers, 'Status')]);
  sheet.getRange(member.rowNumber, statusColumn).setValue(newStatus);
  if (isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.AUDIT_RULE_ID)) {
    appendChangeLogRow_(spreadsheet, {
      sourceTab: DANCE_STUDIO_CRM.MEMBERS_SHEET,
      recordId: asText_(member.values[requiredColumn_(headers, 'Member_ID')]),
      fieldName: 'Status',
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy: actor_(),
      changeSource: 'Automation V8.1',
      reason: `${reason} Rest request: ${restId}`
    });
  }
}

/** Safe manual demo helper. Example: runInHouseFeeGenerationForPeriod('2026-09'). */
function runInHouseFeeGenerationForPeriod(billingPeriod) {
  const billingMonth = parseBillingPeriod_(billingPeriod);
  if (!billingMonth) throw new Error('Use billing period format YYYY-MM, for example 2026-09.');
  return runInHouseFeeGenerationForPeriod_(SpreadsheetApp.getActive(), billingMonth);
}

function runInHouseFeeGenerationForPeriod_(spreadsheet, billingMonth) {
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.IN_HOUSE_FEE_RULE_ID)) {
    return { created: 0, waived: 0, needsReview: 0, skipped: 'Rule is disabled' };
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const memberSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBERS_SHEET);
    const restSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_REST_REQUESTS_SHEET);
    const chargeSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.MEMBER_CHARGES_SHEET);
    const memberHeaders = getHeaderMap_(memberSheet);
    const restHeaders = getHeaderMap_(restSheet);
    const chargeHeaders = getHeaderMap_(chargeSheet);
    const settings = getInHouseFeeSettings_(spreadsheet);
    const periodKey = monthKey_(billingMonth);
    const members = getRecordsWithId_(memberSheet, memberHeaders, 'Member_ID');
    const rests = getRecordsWithId_(restSheet, restHeaders, 'Rest_Request_ID');
    const existingKeys = getChargeKeys_(chargeSheet, chargeHeaders);
    const results = [];

    members.forEach(member => {
      const field = name => member.values[requiredColumn_(memberHeaders, name)];
      const memberId = asText_(field('Member_ID'));
      const memberType = asText_(field('Member_Type'));
      const memberStatus = asText_(field('Status')).toLowerCase();
      if (!memberId || memberType !== DANCE_STUDIO_CRM.IN_HOUSE_MEMBER_TYPE) return;
      if (!['active', 'on_rest'].includes(memberStatus)) return;

      const chargeKey = `${memberId}|Monthly_Studio_Fee|${periodKey}`;
      if (existingKeys.has(chargeKey)) return;

      const restDecision = getRestDecisionForMonth_(rests, restHeaders, memberId, billingMonth, settings.noticeDeadlineDay);
      if (memberStatus === 'on_rest' && restDecision.type === 'none') {
        results.push({ memberId, result: 'Needs manual action', note: 'Member is on_rest but has no approved rest request for this billing month.' });
        return;
      }

      const waived = restDecision.type === 'approved';
      const lateOrPartial = ['late', 'partial'].includes(restDecision.type);
      appendInHouseFeeCharge_(chargeSheet, chargeHeaders, {
        memberId,
        billingMonth,
        periodKey,
        amountDue: waived ? settings.restFee : settings.activeFee,
        status: waived ? 'Waived' : 'Due',
        waivedReason: waived ? `Approved rest: ${restDecision.restRequestId}` : '',
        note: waived
          ? 'Automation V8: approved full-month rest; no studio fee charged.'
          : lateOrPartial
            ? `Automation V8: rest request ${restDecision.restRequestId} requires manual review; standard monthly fee created.`
            : 'Automation V8: active in-house monthly studio fee.'
      });
      existingKeys.add(chargeKey);
      results.push({
        memberId,
        result: lateOrPartial ? 'Needs manual action' : 'Success',
        note: waived ? 'RM0 waived for approved rest.' : `RM${settings.activeFee} monthly fee created.`
      });
    });

    writeInHouseFeeLog_(spreadsheet, periodKey, results);
    return {
      created: results.filter(item => item.result !== 'Needs manual action').length,
      waived: results.filter(item => item.note.includes('waived')).length,
      needsReview: results.filter(item => item.result === 'Needs manual action').length
    };
  } finally {
    lock.releaseLock();
  }
}

function getInHouseFeeSettings_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.SETTINGS_SHEET);
  const headers = getHeaderMap_(sheet);
  const rows = getRecordsWithId_(sheet, headers, 'Key');
  const valueFor = key => {
    const row = rows.find(item => asText_(item.values[requiredColumn_(headers, 'Key')]) === key);
    return row ? row.values[requiredColumn_(headers, 'Value')] : '';
  };
  const activeFee = Number(valueFor('InHouse_Studio_Fee_Active'));
  const restFee = Number(valueFor('InHouse_Studio_Fee_Rest'));
  const noticeDeadlineDay = Number(valueFor('InHouse_Rest_Notice_Deadline_Day'));
  if (!Number.isFinite(activeFee) || activeFee < 0 || !Number.isFinite(restFee) || restFee < 0) {
    throw new Error('Settings must define valid InHouse_Studio_Fee_Active and InHouse_Studio_Fee_Rest amounts.');
  }
  if (!Number.isInteger(noticeDeadlineDay) || noticeDeadlineDay < 1 || noticeDeadlineDay > 31) {
    throw new Error('Settings.InHouse_Rest_Notice_Deadline_Day must be a day from 1 to 31.');
  }
  return { activeFee, restFee, noticeDeadlineDay };
}

function getRestDecisionForMonth_(rests, headers, memberId, billingMonth, deadlineDay) {
  const monthStart = startOfMonth_(billingMonth);
  const monthEnd = endOfMonth_(billingMonth);
  const deadline = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, deadlineDay);
  const relevant = rests
    .filter(item => asText_(item.values[requiredColumn_(headers, 'Member_ID')]) === memberId)
    .map(item => ({
      restRequestId: asText_(item.values[requiredColumn_(headers, 'Rest_Request_ID')]),
      status: asText_(item.values[requiredColumn_(headers, 'Status')]).toLowerCase(),
      noticeDate: asDate_(item.values[requiredColumn_(headers, 'Notice_Date')]),
      startDate: asDate_(item.values[requiredColumn_(headers, 'Rest_Start_Date')]),
      endDate: asDate_(item.values[requiredColumn_(headers, 'Rest_End_Date')])
    }))
    .filter(item => ['approved', 'active'].includes(item.status) && item.startDate && item.endDate)
    .filter(item => startOfDay_(item.startDate).getTime() <= monthEnd.getTime() && startOfDay_(item.endDate).getTime() >= monthStart.getTime());
  if (relevant.length === 0) return { type: 'none', restRequestId: '' };

  const fullMonth = relevant.find(item => startOfDay_(item.startDate).getTime() <= monthStart.getTime()
    && startOfDay_(item.endDate).getTime() >= monthEnd.getTime());
  if (!fullMonth) return { type: 'partial', restRequestId: relevant[0].restRequestId };
  if (!fullMonth.noticeDate || startOfDay_(fullMonth.noticeDate).getTime() > deadline.getTime()) {
    return { type: 'late', restRequestId: fullMonth.restRequestId };
  }
  return { type: 'approved', restRequestId: fullMonth.restRequestId };
}

function appendInHouseFeeCharge_(sheet, headers, details) {
  const rowNumber = lastNonBlankIdRow_(sheet, headers, 'Charge_ID') + 1;
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Charge_ID')] = nextId_(sheet, headers, 'Charge_ID', 'CHG-');
  values[requiredColumn_(headers, 'Member_ID')] = details.memberId;
  values[requiredColumn_(headers, 'Charge_Type')] = 'Monthly_Studio_Fee';
  values[requiredColumn_(headers, 'Billing_Period')] = details.periodKey;
  values[requiredColumn_(headers, 'Coverage_Start')] = startOfMonth_(details.billingMonth);
  values[requiredColumn_(headers, 'Coverage_End')] = endOfMonth_(details.billingMonth);
  values[requiredColumn_(headers, 'Amount_Due')] = details.amountDue;
  values[requiredColumn_(headers, 'Due_Date')] = startOfMonth_(details.billingMonth);
  values[requiredColumn_(headers, 'Status')] = details.status;
  values[requiredColumn_(headers, 'Waived_Reason')] = details.waivedReason;
  values[requiredColumn_(headers, 'Generated_By')] = 'Automation';
  values[requiredColumn_(headers, 'Notes')] = details.note;
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  ['Coverage_Start', 'Coverage_End', 'Due_Date'].forEach(name => sheet
    .getRange(rowNumber, requiredColumn_(headers, name) + 1)
    .setNumberFormat('yyyy-mm-dd'));
}

function getChargeKeys_(sheet, headers) {
  return new Set(getRecordsWithId_(sheet, headers, 'Charge_ID')
    .map(item => `${asText_(item.values[requiredColumn_(headers, 'Member_ID')])}|${asText_(item.values[requiredColumn_(headers, 'Charge_Type')])}|${asText_(item.values[requiredColumn_(headers, 'Billing_Period')])}`));
}

function getRecordsWithId_(sheet, headers, idField) {
  const idColumn = requiredColumn_(headers, idField) + 1;
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (rowCount === 0) return [];
  const values = sheet.getRange(2, 1, rowCount, sheet.getLastColumn()).getValues();
  return values
    .map((row, index) => ({ values: row, rowNumber: index + 2 }))
    .filter(item => asText_(item.values[idColumn - 1]));
}

function lastNonBlankIdRow_(sheet, headers, idField) {
  const records = getRecordsWithId_(sheet, headers, idField);
  return records.length ? records[records.length - 1].rowNumber : 1;
}

function startOfMonth_(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth_(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function monthKey_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
}

function parseBillingPeriod_(value) {
  const match = asText_(value).match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? new Date(year, month - 1, 1) : null;
}

function writeInHouseFeeLog_(spreadsheet, periodKey, results) {
  if (results.length === 0) return;
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  const needsReview = results.filter(item => item.result === 'Needs manual action');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.IN_HOUSE_FEE_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Daily time trigger';
  values[requiredColumn_(headers, 'Record_ID')] = periodKey;
  values[requiredColumn_(headers, 'Action')] = 'Create monthly in-house studio fee charges';
  values[requiredColumn_(headers, 'Result')] = needsReview.length ? 'Needs manual action' : 'Success';
  values[requiredColumn_(headers, 'Error_Message')] = '';
  values[requiredColumn_(headers, 'Notes')] = results.map(item => `${item.memberId}: ${item.note}`).join('; ');
  sheet.getRange(lastNonBlankIdRow_(sheet, headers, 'Run_ID') + 1, 1, 1, values.length).setValues([values]);
}

function writeInHouseRestLog_(spreadsheet, actions) {
  if (actions.length === 0) return;
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  const needsReview = actions.filter(item => item.result === 'Needs manual action');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.IN_HOUSE_REST_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Daily time trigger';
  values[requiredColumn_(headers, 'Record_ID')] = actions.map(item => item.restId).join(', ');
  values[requiredColumn_(headers, 'Action')] = 'Apply approved rest start/end statuses';
  values[requiredColumn_(headers, 'Result')] = needsReview.length ? 'Needs manual action' : 'Success';
  values[requiredColumn_(headers, 'Error_Message')] = '';
  values[requiredColumn_(headers, 'Notes')] = actions.map(item => `${item.memberId}: ${item.note}`).join('; ');
  sheet.getRange(lastNonBlankIdRow_(sheet, headers, 'Run_ID') + 1, 1, 1, values.length).setValues([values]);
}
