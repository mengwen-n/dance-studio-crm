# DanceFlow CRM — Business Plan

> Version: MVP v0.1 · Date: 31 July 2026

## 1. 一句话定位

DanceFlow CRM 帮助小型舞蹈工作室用低成本工具管理 **新咨询 → 试课 → 转会员 → 出勤 → 续费**，让老板每天只需要看异常和下一步，而不是翻 WhatsApp、纸本签到和多个表格。

## 2. 目标客户

第一批客户是 1–3 个分店、约 50–300 名学生、由老板或少量 admin 管理的舞蹈工作室。

他们通常已经在使用 WhatsApp、Google Sheets、Google Forms 或纸本记录，但资料没有连成一个流程。

## 3. 老板的主要问题

| 问题 | 业务后果 | MVP 解决方式 |
|---|---|---|
| 新 lead 散落在 WhatsApp / Instagram | 忘记回复，错过试课 | Lead Form + follow-up date |
| 试课后没有固定跟进 | 转化率低 | Trial follow-up automation |
| 会员到期靠人记 | 流失、收入不稳定 | Renewal watchlist + 7-day alert |
| 出勤用纸或不同表格 | 不知道谁经常缺席 | Attendance Form + member history |
| 老板每天问 admin 状态 | 管理时间被重复沟通占用 | Daily owner summary |

## 4. MVP 的业务结果

第一阶段不追求做成大型 SaaS，而是验证以下结果：

- 每个新 lead 都有编号、来源、状态和下一次动作。
- 试课结束后 2 小时内有跟进任务。
- 会员到期前 7 天会出现在老板的提醒清单。
- 每堂课可以在手机上完成签到。
- 老板每天只收到一份摘要：收入、lead、试课、出勤、续费风险。

## 5. 低成本产品架构

```text
Google Forms / WhatsApp link
              ↓
Google Sheets（Leads / Members / Attendance / Payments）
              ↓
Apps Script（ID、状态、提醒、日报、日志）
              ↓
CRM Demo / Looker Studio（老板查看和演示）
```

Google Sheets 是第一阶段的数据库，不是最终长期产品。等客户数量和流程稳定后，才考虑 Supabase、AppSheet 或定制 backend。

## 6. 收费思路

可以先用一次性 setup + 小额月费验证市场：

- Setup：资料整理、表格、表单、自动化、培训、交付文档。
- Monthly support：修复自动化、调整字段、月度报表和小改动。
- Later upgrade：多分店、会员 portal、在线付款、WhatsApp API、AI assistant。

具体价格先不写死，等第一个 studio 的实际工时和使用量记录后再定。

## 7. 暂时不做的范围

- 不在 MVP 里做复杂 accounting。
- 不在 MVP 里做完整 payroll。
- 不直接存储银行卡资料。
- 不用真实客户数据做公开 portfolio demo。
- 不为了“看起来像软件公司”先做复杂 login、权限和多租户 backend。

