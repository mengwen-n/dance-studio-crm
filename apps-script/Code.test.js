const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const sandbox = {
  console,
  Date,
  Object,
  Array,
  Number,
  String,
  Math,
  RegExp,
  JSON,
  SpreadsheetApp: {},
  ScriptApp: {},
  LockService: {},
  Session: {
    getActiveUser: () => ({ getEmail: () => 'test@example.com' }),
    getScriptTimeZone: () => 'Asia/Kuala_Lumpur'
  },
  Utilities: {
    formatDate: (date, timezone, pattern) => pattern === 'yyyy-MM'
      ? date.toISOString().slice(0, 7)
      : date.toISOString().slice(0, 10)
  }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('apps-script/Config.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/StudioSettings.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/AttendanceAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/PackageMaintenanceAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/RoomBookingAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/ClassSessionBookingAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/ScheduledClassSessionAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/InHouseFeeAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/LeadConversionAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/WalkInAttendanceAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/WalkInPaymentAutomation.gs', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('apps-script/TrialAttendanceAutomation.gs', 'utf8'), sandbox);

function mockSheet(headers, rows) {
  const grid = [headers, ...rows];
  return {
    getLastRow: () => grid.length,
    getLastColumn: () => headers.length,
    getRange: (row, column, numberOfRows, numberOfColumns) => ({
      getValues: () => grid
        .slice(row - 1, row - 1 + numberOfRows)
        .map(sourceRow => sourceRow.slice(column - 1, column - 1 + numberOfColumns)),
      getDisplayValues: () => grid
        .slice(row - 1, row - 1 + numberOfRows)
        .map(sourceRow => sourceRow.slice(column - 1, column - 1 + numberOfColumns).map(value => String(value)))
    })
  };
}

const headers = [
  'Entitlement_ID', 'Member_ID', 'Package_ID', 'Purchased_At', 'Credits_Granted',
  'Credits_Remaining', 'Valid_From', 'Expires_At', 'Payment_ID', 'Status', 'Notes'
];
const sheet = mockSheet(headers, [
  ['ENT-LATER', 'M-001', 'PKG-PUB-8', new Date('2026-08-01'), 8, 3, new Date('2026-08-01'), new Date('2026-12-31'), 'PAY-1', 'active', ''],
  ['ENT-SOON', 'M-001', 'PKG-PUB-4', new Date('2026-08-01'), 4, 1, new Date('2026-08-01'), new Date('2026-09-01'), 'PAY-2', 'active', ''],
  ['ENT-EXPIRED', 'M-001', 'PKG-PUB-4', new Date('2026-01-01'), 4, 4, new Date('2026-01-01'), new Date('2026-01-31'), 'PAY-3', 'active', ''],
  ['ENT-ZERO', 'M-001', 'PKG-PUB-4', new Date('2026-08-01'), 4, 0, new Date('2026-08-01'), new Date('2026-09-01'), 'PAY-4', 'active', '']
]);

const savedDate = sandbox.Date;
sandbox.Date = class extends savedDate {
  constructor(...args) {
    super(...(args.length ? args : ['2026-08-25T10:00:00']));
  }
  static now() { return new savedDate('2026-08-25T10:00:00').getTime(); }
};

const selected = sandbox.findEarliestEligibleEntitlement_(sheet, sandbox.getHeaderMap_(sheet), 'M-001');
assert.equal(selected.entitlementId, 'ENT-SOON');
assert.equal(selected.packageId, 'PKG-PUB-4');
assert.equal(selected.creditsRemaining, 1);
assert.equal(sandbox.asBoolean_('TRUE'), true);
assert.equal(sandbox.asBoolean_('FALSE'), false);
assert.equal(sandbox.asBoolean_(true), true);
assert.equal(sandbox.getPackageMaintenanceStatus_(new savedDate('2026-08-24'), 4, new savedDate('2026-08-25')), 'expired');
assert.equal(sandbox.getPackageMaintenanceStatus_(new savedDate('2026-09-30'), 0, new savedDate('2026-08-25')), 'exhausted');
assert.equal(sandbox.getPackageMaintenanceStatus_(new savedDate('2026-09-30'), 4, new savedDate('2026-08-25')), '');
assert.equal(sandbox.bookingDateKey_('26/08/2026'), '2026-08-26');
assert.equal(sandbox.bookingTimeMinutes_('20:30'), 1230);
assert.equal(sandbox.bookingTimeMinutes_('25:00'), null);
assert.equal(sandbox.weekdayName_(new savedDate('2026-08-31T10:00:00')), 'Monday');
assert.equal(sandbox.dateKeyFromDate_(sandbox.addDays_(new savedDate('2026-08-25T10:00:00'), 7)), '2026-09-01');
assert.equal(sandbox.monthKey_(new savedDate('2026-09-15T10:00:00')), '2026-09');
assert.equal(sandbox.parseBillingPeriod_('2026-09').getMonth(), 8);
assert.equal(sandbox.parseBillingPeriod_('2026-13'), null);
assert.equal(sandbox.endOfMonth_(new savedDate('2026-02-15T10:00:00')).getDate(), 28);
assert.equal(sandbox.startOfMonth_(new savedDate('2026-09-15T10:00:00')).getDate(), 1);
assert.equal(sandbox.memberTypeFromLeadInterest_('In-house Crew'), 'In_House_Crew');
assert.equal(sandbox.memberTypeFromLeadInterest_('Foundation'), 'Public');
const studio = (price, roomLimit) => ({ getSheetByName: name => ({
  Settings: mockSheet(['Key', 'Value'], [['WalkIn_Package_Public', 'CUSTOM-WALK'], ['WalkIn_Package_In_House_Crew', 'DISABLED']]),
  Packages: mockSheet(['Package_ID', 'Price', 'Validity_Days', 'Member_Type', 'Active_Status'], [['CUSTOM-WALK', price, 1, 'Public', 'active']]),
  Rooms: mockSheet(['Room_ID', 'Max_Shared_Crew_Teams'], [['ROOM-CUSTOM', roomLimit]])
})[name] });
assert.equal(sandbox.getWalkInRate_(studio(27, 2), 'Public').amount, 27);
assert.equal(sandbox.getWalkInRate_(studio(63, 4), 'Public').amount, 63);
assert.equal(sandbox.getWalkInRate_(studio(27, 2), 'In_House_Crew'), null);
assert.throws(() => sandbox.getWalkInRate_(studio(27, 2), 'Walk_In'), /Configuration/);
assert.throws(() => sandbox.getWalkInRate_(studio('', 2), 'Public'), /Configuration/);
assert.throws(() => sandbox.studioRoomLimit_(studio(27, ''), 'ROOM-CUSTOM'), /Configuration/);
assert.equal(sandbox.studioRoomLimit_(studio(27, 2), 'ROOM-CUSTOM'), 2);
assert.equal(
  sandbox.getRoomBookingConflicts_(3, 'Crew_Practice', [
    { bookingId: 'B-1', bookingType: 'Crew_Practice' },
    { bookingId: 'B-2', bookingType: 'Crew_Practice' }
  ]).length,
  0
);
assert.equal(
  sandbox.getRoomBookingConflicts_(3, 'Crew_Practice', [
    { bookingId: 'B-1', bookingType: 'Fixed_Class' }
  ]).length,
  1
);

assert.equal(sandbox.getRoomBookingConflicts_(1, 'Crew_Practice', [{bookingType:'Crew_Practice'}]).length, 1);
assert.equal(sandbox.getRoomBookingConflicts_(2, 'Crew_Practice', [{bookingType:'Crew_Practice'}, {bookingType:'Crew_Practice'}]).length, 2);
const duplicates = {getSheetByName: () => mockSheet(['Key','Value'], [['x','a'],['x','b']])};
assert.throws(() => sandbox.studioSetting_(duplicates, 'x'), /exactly one/);
const trialPayments = {getSheetByName: () => mockSheet(
  ['Member_ID','Package_ID','Payment_Type','Payment_Status','Paid_Date','Amount_Paid'],
  [['M-TEST','CUSTOM-TRIAL','Trial','Paid','2026-09-01',19]])};
assert.equal(sandbox.findTrialPayment_(trialPayments, 'M-TEST', {packageId:'CUSTOM-TRIAL',amount:20}), null);
assert.ok(sandbox.findTrialPayment_(trialPayments, 'M-TEST', {packageId:'CUSTOM-TRIAL',amount:19}));
console.log('Automation smoke and studio configuration tests passed.');
