/**
 * Automation V5/V6 - room availability, safe auto-confirmation, and conflict warnings.
 */
function processRoomBookingEdit_(event) {
  const spreadsheet = event.source;
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.ROOM_CONFLICT_RULE_ID)) return;

  const sheet = event.range.getSheet();
  const headers = getHeaderMap_(sheet);
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const firstRow = event.range.getRow();
    const lastRow = firstRow + event.range.getNumRows() - 1;
    for (let row = firstRow; row <= lastRow; row += 1) {
      processRoomBookingRow_(spreadsheet, sheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function processRoomBookingRow_(spreadsheet, sheet, headers, rowNumber) {
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const field = name => row[requiredColumn_(headers, name)];
  const bookingId = asText_(field('Booking_ID'));
  const roomId = asText_(field('Room_ID'));
  const bookingDate = bookingDateKey_(field('Booking_Date'));
  const startMinutes = bookingTimeMinutes_(field('Start_Time'));
  const endMinutes = bookingTimeMinutes_(field('End_Time'));
  const bookingStatus = asText_(field('Status')).toLowerCase();
  const bookingType = asText_(field('Booking_Type'));

  if (!bookingId || !roomId || !bookingDate || startMinutes === null || endMinutes === null || startMinutes >= endMinutes) return;
  if (bookingStatus === 'cancelled') {
    clearCancelledBookingConflict_(sheet, headers, rowNumber);
    return;
  }
  if (!['pending', 'confirmed'].includes(bookingStatus)) return;

  const overlaps = findBookingConflicts_(sheet, headers, bookingId, roomId, bookingDate, startMinutes, endMinutes);
  const conflicts = getRoomBookingConflicts_(studioRoomLimit_(spreadsheet, roomId), bookingType, overlaps);
  const conflictStatus = conflicts.length ? 'Conflict' : 'No conflict';
  const conflictWith = conflicts.map(item => item.bookingId).join(', ');
  const existingStatus = asText_(field('Conflict_Status'));
  const existingWith = asText_(field('Conflict_With'));

  if (existingStatus === conflictStatus && existingWith === conflictWith) return;

  sheet.getRange(rowNumber, requiredColumn_(headers, 'Conflict_Status') + 1).setValue(conflictStatus);
  sheet.getRange(rowNumber, requiredColumn_(headers, 'Conflict_With') + 1).setValue(conflictWith);

  const currentPaymentStatus = asText_(field('Payment_Status'));
  if (bookingType === DANCE_STUDIO_CRM.CREW_PRACTICE_BOOKING_TYPE && ['', 'pending'].includes(currentPaymentStatus.toLowerCase())) {
    sheet.getRange(rowNumber, requiredColumn_(headers, 'Payment_Status') + 1).setValue('Waived');
    if (isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.AUDIT_RULE_ID)) {
      appendChangeLogRow_(spreadsheet, {
        sourceTab: DANCE_STUDIO_CRM.ROOM_BOOKINGS_SHEET,
        recordId: bookingId,
        fieldName: 'Payment_Status',
        oldValue: currentPaymentStatus,
        newValue: 'Waived',
        changedBy: actor_(),
        changeSource: 'Automation V5',
        reason: 'Crew practice is not a paid rental.'
      });
    }
  }

  if (isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.AUDIT_RULE_ID)) {
    appendChangeLogRow_(spreadsheet, {
      sourceTab: DANCE_STUDIO_CRM.ROOM_BOOKINGS_SHEET,
      recordId: bookingId,
      fieldName: 'Conflict_Status',
      oldValue: existingStatus,
      newValue: conflictStatus,
      changedBy: actor_(),
      changeSource: 'Automation V5',
      reason: conflictWith ? `Overlaps ${conflictWith}.` : 'No active overlap found.'
    });
  }

  if (conflicts.length) {
    writeRoomConflictLog_(spreadsheet, bookingId, conflictWith);
    return;
  }

  safelyConfirmAvailableBooking_(sheet, headers, rowNumber, row, bookingType, bookingStatus);
}

function clearCancelledBookingConflict_(sheet, headers, rowNumber) {
  if (!('Conflict_Status' in headers)) return;
  sheet.getRange(rowNumber, requiredColumn_(headers, 'Conflict_Status') + 1).setValue('No conflict');
  if ('Conflict_With' in headers) {
    sheet.getRange(rowNumber, requiredColumn_(headers, 'Conflict_With') + 1).setValue('');
  }
}

function safelyConfirmAvailableBooking_(sheet, headers, rowNumber, row, bookingType, bookingStatus) {
  if (bookingStatus !== 'pending') return;
  const paymentStatus = asText_(row[requiredColumn_(headers, 'Payment_Status')]).toLowerCase();
  const isCrewPractice = bookingType === DANCE_STUDIO_CRM.CREW_PRACTICE_BOOKING_TYPE;
  const isPaidRental = bookingType === 'Rental' && paymentStatus === 'paid';
  const isFixedClass = bookingType === 'Fixed_Class';
  if (isCrewPractice || isPaidRental || isFixedClass) {
    sheet.getRange(rowNumber, requiredColumn_(headers, 'Status') + 1).setValue('confirmed');
  }
}

/** Re-check active bookings in a time window after a class is cancelled or moved. */
function reconcileRoomBookingAvailability_(spreadsheet, roomId, bookingDate, startMinutes, endMinutes) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.ROOM_BOOKINGS_SHEET);
  const headers = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  rows.forEach((row, index) => {
    const rowRoom = asText_(row[requiredColumn_(headers, 'Room_ID')]);
    const rowDate = bookingDateKey_(row[requiredColumn_(headers, 'Booking_Date')]);
    const rowStart = bookingTimeMinutes_(row[requiredColumn_(headers, 'Start_Time')]);
    const rowEnd = bookingTimeMinutes_(row[requiredColumn_(headers, 'End_Time')]);
    const rowStatus = asText_(row[requiredColumn_(headers, 'Status')]).toLowerCase();
    if (rowRoom !== roomId || rowDate !== bookingDate || !['pending', 'confirmed'].includes(rowStatus)) return;
    if (rowStart === null || rowEnd === null || !(startMinutes < rowEnd && rowStart < endMinutes)) return;
    processRoomBookingRow_(spreadsheet, sheet, headers, index + 2);
  });
}

function findBookingConflicts_(sheet, headers, bookingId, roomId, bookingDate, startMinutes, endMinutes) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  return rows.map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(item => asText_(item.row[requiredColumn_(headers, 'Booking_ID')]) !== bookingId)
    .filter(item => asText_(item.row[requiredColumn_(headers, 'Room_ID')]) === roomId)
    .filter(item => bookingDateKey_(item.row[requiredColumn_(headers, 'Booking_Date')]) === bookingDate)
    .filter(item => ['pending', 'confirmed'].includes(asText_(item.row[requiredColumn_(headers, 'Status')]).toLowerCase()))
    .map(item => ({
      bookingId: asText_(item.row[requiredColumn_(headers, 'Booking_ID')]),
      bookingType: asText_(item.row[requiredColumn_(headers, 'Booking_Type')]),
      startMinutes: bookingTimeMinutes_(item.row[requiredColumn_(headers, 'Start_Time')]),
      endMinutes: bookingTimeMinutes_(item.row[requiredColumn_(headers, 'End_Time')])
    }))
    .filter(item => item.bookingId && item.startMinutes !== null && item.endMinutes !== null)
    .filter(item => startMinutes < item.endMinutes && item.startMinutes < endMinutes);
}

function getRoomBookingConflicts_(maxTeams, bookingType, overlaps) {
  const isSharedCrewPractice = maxTeams > 1 && bookingType === DANCE_STUDIO_CRM.CREW_PRACTICE_BOOKING_TYPE;
  if (!isSharedCrewPractice) return overlaps;

  const exclusiveOverlaps = overlaps.filter(item => item.bookingType !== DANCE_STUDIO_CRM.CREW_PRACTICE_BOOKING_TYPE);
  if (exclusiveOverlaps.length > 0) return exclusiveOverlaps;

  // The incoming booking is included in the maximum. Two existing teams plus
  // this booking equals the allowed three; a third existing team is a conflict.
  return overlaps.length >= maxTeams ? overlaps : [];
}

function bookingDateKey_(value) {
  const text = asText_(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;
  const british = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (british) return `${british[3]}-${british[2].padStart(2, '0')}-${british[1].padStart(2, '0')}`;
  return '';
}

function bookingTimeMinutes_(value) {
  const text = asText_(value);
  const time = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!time) return null;
  const hours = Number(time[1]);
  const minutes = Number(time[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function writeRoomConflictLog_(spreadsheet, bookingId, conflictWith) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.ROOM_CONFLICT_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Room_Bookings on edit';
  values[requiredColumn_(headers, 'Record_ID')] = bookingId;
  values[requiredColumn_(headers, 'Action')] = 'Flag overlapping room booking';
  values[requiredColumn_(headers, 'Result')] = 'Needs manual action';
  values[requiredColumn_(headers, 'Error_Message')] = '';
  values[requiredColumn_(headers, 'Notes')] = `Conflicts with ${conflictWith}. Booking was not cancelled automatically.`;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
