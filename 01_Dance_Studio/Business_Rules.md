# Dance Studio CRM — Business Rules Register

> 这份文件记录 studio 的真实运作规则。`Confirmed` 是已经知道的规则；`To confirm` 代表还需要向 owner / admin 确认，不能直接当成系统逻辑。

## 1. Terminology

### Lead

Lead 是“潜在客户”或“新咨询”，还没有正式成为 active member。来源可以是 WhatsApp、Instagram、Facebook、walk-in、referral 或 Google Form。

Lead 的生命周期通常是：

```text
New lead → Trial booked → Trial attended → Follow-up → Converted / Lost
```

### Member / Student

已经注册并可以参加 studio regular class 的人。Member 需要有 membership、class、payment 和 attendance 记录。

### In-house Crew

属于 studio 内部 crew 的成员。Crew 不是普通 trial lead，应该有独立的 registration、crew status、annual registration 和 monthly studio fee 记录。

## 2. Confirmed rules from current discussion

| Rule | Current understanding | System impact |
|---|---|---|
| In-house crew exists | Studio 需要管理内部 crew | 建立 `Crews` tab 和 crew registration flow |
| Annual registration | Crew 好像需要支付年费注册 | 记录 `Annual_Registration_Date`、`Annual_Fee`、`Next_Renewal_Date`、`Payment_Status` |
| Monthly studio fee | Crew 好像每月需要缴付 studio fee | 建立每月 fee record，不能只记录一次付款 |
| Monthly deadline | Monthly studio fee 必须在每月 20 号前缴付 | 每月 20 号前提醒，过期后进入 overdue list |

## 3. Rules to confirm before automation

以下内容必须由 studio owner / admin 确认：

- Annual registration 的正式名称、金额和有效期。
- Annual registration 是按 calendar year 还是从注册日期算 12 个月。
- Monthly studio fee 的金额是否每个 crew 相同。
- Fee 是固定金额、按出勤、按活动，还是按其他条件计算。
- 20 号是 inclusive deadline，还是必须在 19 号结束前完成。
- 逾期之后是否有 late fee、暂停训练、暂停上台或其他后果。
- 谁负责收款、谁批准 waiver、谁可以修改 payment status。
- Crew 加入、暂停、退出和重新加入的条件。
- Crew 是否同时需要参加 regular class membership。
- 年费和 monthly studio fee 是否需要 receipt。
- 是否需要通知 crew member、parent、leader 或 owner。

## 4. Suggested status values

### Crew status

```text
Applicant | Active | On hold | Suspended | Exited
```

### Payment status

```text
Pending | Paid | Partially paid | Overdue | Waived | Refunded
```

### Fee type

```text
Annual registration | Monthly studio fee | Other approved fee
```

## 5. Data privacy rule

真实 crew、学生、parent、电话号码、付款金额和收据资料属于 private operational data，不应该放进公开 GitHub portfolio。公开 demo 使用 fictional data；真实版本放在 studio 自己的 Google Drive。

