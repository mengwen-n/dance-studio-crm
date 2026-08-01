# DanceFlow CRM Demo

一个面向舞蹈工作室老板的低成本 CRM demo。它把最容易遗漏、但最影响收入的日常工作集中在一个运营工作台里：

- Leads & trials：记录新咨询、试课、来源和下一次跟进
- Members：查看会员状态、出勤率和即将续费的人
- Attendance：课堂签到和缺席跟进
- Automations：试课后跟进、续费预警、签到同步和老板日报
- Reports：把零散数据变成老板每天可以执行的下一步

## Business documentation

这个项目不只有 UI demo，业务和可落地方案也已经记录在：

- [Business Plan](docs/00_BUSINESS_PLAN.md)
- [Business Requirements](01_Dance_Studio/BRD.md)
- [Business Rules Register](01_Dance_Studio/Business_Rules.md)
- [Google Sheets Design](01_Dance_Studio/Google_Sheets_Design.md)
- [Google Form Specification](01_Dance_Studio/Google_Form_Spec.md)
- [Process Flow](01_Dance_Studio/Process_Flow.md)
- [Automation Playbook](01_Dance_Studio/Automation_Playbook.md)
- [Implementation Roadmap](01_Dance_Studio/Implementation_Roadmap.md)

`AGENTS.md` 是这个项目给 AI 和开发者的协作规则；它不是 business plan，而是保证以后扩展时不破坏业务方向。

## 本地打开

这是一个无构建工具的静态 demo，直接双击 `index.html` 即可打开。也可以在项目目录运行：

```powershell
python -m http.server 4173
```

然后打开 <http://localhost:4173>。

所有演示数据保存在浏览器 `localStorage`，所以新增 lead、自动化日志和签到状态会在刷新后保留。点击左侧菜单和页面内的按钮，可以完整演示一个老板日常工作流。

## 低成本落地方案

第一阶段不需要做复杂后端：

```text
Google Form / WhatsApp
          ↓
Google Sheets（Leads / Members / Attendance）
          ↓
Apps Script（触发器 + Email / WhatsApp link / Daily digest）
          ↓
Looker Studio 或这个前端 Demo
```

推荐先接入 4 个 Apps Script 流程：

1. 新 lead 写入表格后，自动生成 Lead ID 和 follow-up date。
2. 试课结束两小时后，自动提醒 staff 跟进。
3. 会员到期前 7 天，把续费名单发给老板。
4. 每天早上 9 点发送收入、试课、出勤和异常事项摘要。

## 下一步

这个 demo 的重点是让老板先看到价值，再决定是否接真实数据。下一步可以把 `app.js` 里的 seed data 替换成 Google Sheets API 或 Apps Script Web App，并保留现有页面和自动化操作流程。
