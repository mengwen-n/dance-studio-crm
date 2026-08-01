# Dance Studio CRM — Business Requirements Document

## 1. Business objective

让 studio owner 用一个简单的工作台知道：今天谁需要跟进、哪堂课出勤异常、哪些会员快到期，以及本月收入和试课转化是否健康。

## 2. Users

| User | 需要完成的事 |
|---|---|
| Owner | 看摘要、处理异常、确认续费和收入 |
| Admin / receptionist | 录入 lead、安排试课、更新状态 |
| Instructor | 课堂签到、标记 late / absent |
| Parent / student | 通过表单提交咨询或试课资料 |
| Crew leader / admin | 管理 in-house crew registration、monthly fee 和状态 |

## 3. Core user stories

### Owner

- As an owner, I want to see overdue follow-ups so that no lead is silently lost.
- As an owner, I want to see renewals due in 7 days so that I can protect recurring revenue.
- As an owner, I want a morning summary so that I do not need to ask admin for updates.

### Admin

- As an admin, I want to capture a new enquiry in under one minute.
- As an admin, I want each trial to have a clear next action.
- As an admin, I want to update a member without editing formulas.

### Instructor

- As an instructor, I want to mark attendance from a phone in a few taps.
- As an instructor, I want absent students to be visible for follow-up.

## 4. MVP modules

1. Lead intake and pipeline
2. Trial booking and follow-up
3. Member directory and renewal watchlist
4. Class attendance
5. In-house crew registration and fee tracking
6. Automation log
7. Owner reports

## 5. Success metrics

| Metric | Initial target |
|---|---:|
| Lead records with next action | ≥ 95% |
| Trial follow-up sent on time | ≥ 90% |
| Renewal alerts sent before due date | 100% |
| Daily attendance capture | ≥ 95% of classes |
| Owner admin time saved | 3–5 hours/week |

## 6. Acceptance criteria

- A new form response creates a Lead ID.
- A trial status can move from New lead → Trial booked → Trial attended → Converted / Lost.
- A member expiring within 7 days appears in the renewal list.
- Attendance can be submitted from a mobile-friendly form.
- Every automated action writes a timestamp and result to `Automation_Log`.
- In-house crew annual registration and monthly studio fee can be tracked separately from regular class membership.
- Monthly studio fee due before the 20th can be identified as pending, paid, or overdue.
