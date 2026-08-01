# Dance Studio CRM — Google Form Specification

Google Forms 是输入层。员工不应该直接修改复杂的 Google Sheets，避免破坏公式和字段。

## Form A — New Lead / Trial Enquiry

建议公开链接给 website、Instagram bio、WhatsApp quick reply 或 QR code。

| Question | Type | Required | Writes to |
|---|---|---:|---|
| Full name | Short answer | Yes | Leads.Name |
| Phone number | Short answer | Yes | Leads.Phone |
| Email | Short answer | No | Leads.Email |
| Interested class | Dropdown | Yes | Leads.Interest |
| Preferred trial date | Date | Yes | Leads.Trial_Date |
| How did you hear about us? | Multiple choice | Yes | Leads.Source |
| Message / notes | Paragraph | No | Leads.Notes |

Apps Script on submit: create `Lead_ID`, set `Status = New lead`, set `Follow_Up_Date`, notify admin.

## Form B — Class Attendance

建议 instructor 或 admin 使用手机填写；如果以后需要更快，可以换成 AppSheet 或带预填链接的 form。

| Question | Type | Required | Writes to |
|---|---|---:|---|
| Class | Dropdown | Yes | Attendance.Class_ID |
| Member name | Dropdown | Yes | Attendance.Member_Name |
| Attendance status | Multiple choice | Yes | Attendance.Attendance_Status |
| Check-in time | Timestamp | Automatic | Attendance.Check_In_Time |
| Notes | Short answer | No | Attendance.Notes |

## Form C — Payment / Renewal Update

只给 owner/admin 使用，不公开。

| Question | Type | Required | Writes to |
|---|---|---:|---|
| Member name | Dropdown | Yes | Payments.Member_Name |
| Amount | Short answer | Yes | Payments.Amount |
| Plan | Dropdown | Yes | Payments.Plan |
| Payment method | Dropdown | Yes | Payments.Payment_Method |
| Payment status | Multiple choice | Yes | Payments.Payment_Status |
| Receipt reference | Short answer | No | Payments.Receipt_Reference |

Apps Script on submit: update `Members.Payment_Status`, update `Renewal_Date` when paid, write to `Automation_Log`.

## Form D — In-house Crew Registration

这个 form 不应该和普通 trial enquiry 混合。可以给 crew leader / admin 使用，或在 crew onboarding 时使用。

| Question | Type | Required | Writes to |
|---|---|---:|---|
| Full name | Short answer | Yes | Crews.Name |
| Phone number | Short answer | Yes | Crews.Phone |
| Email | Short answer | No | Crews.Email |
| Crew name | Dropdown / short answer | Yes | Crews.Crew_Name |
| Crew role | Dropdown | Yes | Crews.Crew_Role |
| Annual registration date | Date | Yes | Crews.Annual_Registration_Date |
| Annual registration payment status | Multiple choice | Yes | Studio_Fees.Payment_Status |
| Notes | Paragraph | No | Crews.Notes |

## Form E — Monthly Studio Fee Payment

只给 owner、admin 或获授权的 crew leader 使用。

| Question | Type | Required | Writes to |
|---|---|---:|---|
| Crew member | Dropdown | Yes | Studio_Fees.Crew_ID |
| Fee month | Month / dropdown | Yes | Studio_Fees.Fee_Month |
| Amount | Short answer | Yes | Studio_Fees.Amount |
| Payment date | Date | Yes | Studio_Fees.Paid_Date |
| Payment status | Multiple choice | Yes | Studio_Fees.Payment_Status |
| Receipt reference | Short answer | No | Studio_Fees.Receipt_Reference |
| Notes / waiver approval | Paragraph | No | Studio_Fees.Notes |

The form should show the rule clearly: `Monthly studio fee must be paid by the 20th`, but the system must only apply late consequences after the owner confirms them in `Business_Rules.md`.

## Form design principles

- 每个 form 控制在 5–7 个核心问题。
- 不让用户输入 status、ID、timestamp 等系统字段。
- 每个 form response 必须可以追溯回原始 response row。
- 先用表单验证流程，等稳定后再考虑 API 或 custom UI。
