/**
 * Automation V6 - every planned or confirmed class session reserves its room.
 * Cancelling the session cancels only the generated booking, then releases the
 * time window for any other pending booking to be reconsidered.
 */
function processClassSessionEdit_(event) {
  const spreadsheet = event.source;
  if (!isRuleEnabled_(spreadsheet, DANCE_STUDIO_CRM.CLASS_ROOM_SYNC_RULE_ID)) return;
  const sessionSheet = event.range.getSheet();
  const headers = getHeaderMap_(sessionSheet);
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const firstRow = event.range.getRow();
    const lastRow = firstRow + event.range.getNumRows() - 1;
    for (let row = firstRow; row <= lastRow; row += 1) {
      syncClassSessionRoomBooking_(spreadsheet, sessionSheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function syncClassSessionRoomBooking_(spreadsheet, sessionSheet, sessionHeaders, rowNumber) {
  const row = sessionSheet.getRange(rowNumber, 1, 1, sessionSheet.getLastColumn()).getDisplayValues()[0];
  const field = name => row[requiredColumn_(sessionHeaders, name)];
  const sessionId = asText_(field('Session_ID'));
  const roomId = asText_(field('Room_ID'));
  const sessionDate = bookingDateKey_(field('Session_Date'));
  const startMinutes = bookingTimeMinutes_(field('Start_Time'));
  const endMinutes = bookingTimeMinutes_(field('End_Time'));
  const status = asText_(field('Status')).toLowerCase();
  if (!sessionId || !roomId || !sessionDate || startMinutes === null || endMinutes === null || startMinutes >= endMinutes) return;

  const bookingSheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.ROOM_BOOKINGS_SHEET);
  const bookingHeaders = getHeaderMap_(bookingSheet);
  const matchingRow = findClassSessionBookingRow_(bookingSheet, bookingHeaders, sessionId);

  if (status === 'cancelled') {
    if (matchingRow) {
      bookingSheet.getRange(matchingRow, requiredColumn_(bookingHeaders, 'Status') + 1).setValue('cancelled');
      clearCancelledBookingConflict_(bookingSheet, bookingHeaders, matchingRow);
      reconcileRoomBookingAvailability_(spreadsheet, roomId, sessionDate, startMinutes, endMinutes);
      writeClassRoomSyncLog_(spreadsheet, sessionId, 'Released room after class cancellation.');
    }
    return;
  }
  if (!['planned', 'confirmed'].includes(status)) return;

  if (matchingRow) {
    updateGeneratedClassBooking_(bookingSheet, bookingHeaders, matchingRow, row, sessionHeaders);
  } else {
    appendGeneratedClassBooking_(bookingSheet, bookingHeaders, row, sessionHeaders);
  }
  const bookingRow = matchingRow || bookingSheet.getLastRow();
  processRoomBookingRow_(spreadsheet, bookingSheet, bookingHeaders, bookingRow);
  reconcileRoomBookingAvailability_(spreadsheet, roomId, sessionDate, startMinutes, endMinutes);
  writeClassRoomSyncLog_(spreadsheet, sessionId, 'Created or updated a confirmed fixed-class room booking.');
}

function findClassSessionBookingRow_(sheet, headers, sessionId) {
  if (!('Booking_Source' in headers) || !('Source_Reference' in headers)) {
    throw new Error('Room_Bookings requires Booking_Source and Source_Reference columns for V6.');
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  const found = rows.findIndex(row =>
    asText_(row[requiredColumn_(headers, 'Booking_Source')]) === DANCE_STUDIO_CRM.CLASS_BOOKING_SOURCE &&
    asText_(row[requiredColumn_(headers, 'Source_Reference')]) === sessionId
  );
  return found === -1 ? 0 : found + 2;
}

function updateGeneratedClassBooking_(sheet, headers, rowNumber, sessionRow, sessionHeaders) {
  const session = name => sessionRow[requiredColumn_(sessionHeaders, name)];
  const updates = {
    Room_ID: session('Room_ID'), Booking_Type: 'Fixed_Class', Booking_Date: bookingDateKey_(session('Session_Date')),
    Start_Time: session('Start_Time'), End_Time: session('End_Time'), Booked_By: session('Coach_ID'),
    Status: 'confirmed', Payment_Status: 'Waived', Notes: 'Automation V6: generated from Class_Sessions.',
    Booking_Source: DANCE_STUDIO_CRM.CLASS_BOOKING_SOURCE, Source_Reference: session('Session_ID')
  };
  Object.keys(updates).forEach(name => sheet.getRange(rowNumber, requiredColumn_(headers, name) + 1).setValue(updates[name]));
}

function appendGeneratedClassBooking_(sheet, headers, sessionRow, sessionHeaders) {
  const session = name => sessionRow[requiredColumn_(sessionHeaders, name)];
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Booking_ID')] = nextId_(sheet, headers, 'Booking_ID', 'BOOK-');
  values[requiredColumn_(headers, 'Room_ID')] = session('Room_ID');
  values[requiredColumn_(headers, 'Booking_Type')] = 'Fixed_Class';
  values[requiredColumn_(headers, 'Booking_Date')] = bookingDateKey_(session('Session_Date'));
  values[requiredColumn_(headers, 'Start_Time')] = session('Start_Time');
  values[requiredColumn_(headers, 'End_Time')] = session('End_Time');
  values[requiredColumn_(headers, 'Booked_By')] = session('Coach_ID');
  values[requiredColumn_(headers, 'Status')] = 'confirmed';
  values[requiredColumn_(headers, 'Payment_Status')] = 'Waived';
  values[requiredColumn_(headers, 'Notes')] = 'Automation V6: generated from Class_Sessions.';
  values[requiredColumn_(headers, 'Booking_Source')] = DANCE_STUDIO_CRM.CLASS_BOOKING_SOURCE;
  values[requiredColumn_(headers, 'Source_Reference')] = session('Session_ID');
  values[requiredColumn_(headers, 'Requested_At')] = new Date();
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function writeClassRoomSyncLog_(spreadsheet, sessionId, notes) {
  const sheet = spreadsheet.getSheetByName(DANCE_STUDIO_CRM.AUTOMATION_LOG_SHEET);
  const headers = getHeaderMap_(sheet);
  const values = Array(sheet.getLastColumn()).fill('');
  values[requiredColumn_(headers, 'Run_ID')] = nextId_(sheet, headers, 'Run_ID', 'RUN-');
  values[requiredColumn_(headers, 'Run_At')] = new Date();
  values[requiredColumn_(headers, 'Automation_Name')] = DANCE_STUDIO_CRM.CLASS_ROOM_SYNC_RULE_NAME;
  values[requiredColumn_(headers, 'Trigger')] = 'Class_Sessions on edit';
  values[requiredColumn_(headers, 'Record_ID')] = sessionId;
  values[requiredColumn_(headers, 'Action')] = 'Synchronise fixed-class room booking';
  values[requiredColumn_(headers, 'Result')] = 'Success';
  values[requiredColumn_(headers, 'Notes')] = notes;
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}
