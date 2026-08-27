/** Automation V12: validate paid seven-day trials; credits are never used. */
function processTrialAttendanceRow_(ss, sheet, headers, rowNumber) {
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const f = name => row[requiredColumn_(headers, name)];
  const id = asText_(f('Attendance_ID'));
  if (!id || !asBoolean_(f('Attended')) || asText_(f('Attendance_Type')) !== 'Trial' || asText_(f('Payment_Status')) === 'Paid') return;
  const memberId = asText_(f('Member_ID'));
  const session = getWalkInSession_(ss, asText_(f('Session_ID')));
  const payment = findTrialPayment_(ss, memberId);
  if (!session || !payment || session.status === 'cancelled' || session.classType !== 'Fixed') return writeTrialLog_(ss,id,'Needs manual action','No valid paid trial or eligible Fixed class.');
  const start = startOfDay_(payment); const end = addDays_(start, 6); const date = startOfDay_(session.sessionDate);
  if (date < start || date > end) return writeTrialLog_(ss,id,'Needs manual action','Class date is outside the paid seven-day trial period.');
  setAttendanceField_(sheet,headers,rowNumber,'Package_ID',DANCE_STUDIO_CRM.TRIAL_PACKAGE_ID);
  setAttendanceField_(sheet,headers,rowNumber,'Credit_Change',0);
  setAttendanceField_(sheet,headers,rowNumber,'Amount_Charged',0);
  setAttendanceField_(sheet,headers,rowNumber,'Payment_Status','Paid');
  if (!f('Recorded_At')) setAttendanceField_(sheet,headers,rowNumber,'Recorded_At',new Date());
  if (!asText_(f('Recorded_By'))) setAttendanceField_(sheet,headers,rowNumber,'Recorded_By',actor_());
  writeTrialLog_(ss,id,'Success','Validated paid seven-day trial; no credit deducted.');
}
function findTrialPayment_(ss, memberId) {
  const s=ss.getSheetByName(DANCE_STUDIO_CRM.PAYMENTS_SHEET), h=getHeaderMap_(s); if(s.getLastRow()<2)return null;
  const r=s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().find(x=>asText_(x[requiredColumn_(h,'Member_ID')])===memberId&&asText_(x[requiredColumn_(h,'Package_ID')])===DANCE_STUDIO_CRM.TRIAL_PACKAGE_ID&&asText_(x[requiredColumn_(h,'Payment_Type')])==='Trial'&&asText_(x[requiredColumn_(h,'Payment_Status')]).toLowerCase()==='paid');
  return r ? (asDate_(r[requiredColumn_(h,'Paid_Date')])||null) : null;
}
function writeTrialLog_(ss,id,result,notes) { const s=ss.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET),h=getHeaderMap_(s),v=Array(s.getLastColumn()).fill(''); v[requiredColumn_(h,'Run_ID')]=nextId_(s,h,'Run_ID','RUN-');v[requiredColumn_(h,'Run_At')]=new Date();v[requiredColumn_(h,'Automation_Name')]=DANCE_STUDIO_CRM.TRIAL_RULE_NAME;v[requiredColumn_(h,'Trigger')]='Attendance on edit';v[requiredColumn_(h,'Record_ID')]=id;v[requiredColumn_(h,'Action')]='Validate trial attendance';v[requiredColumn_(h,'Result')]=result;v[requiredColumn_(h,'Notes')]=notes;s.getRange(s.getLastRow()+1,1,1,v.length).setValues([v]); }
