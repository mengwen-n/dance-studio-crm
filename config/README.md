# Feature configuration

The repo stores reusable defaults; each studio's live choices belong in its own Google Sheet `Feature_Flags` tab.

- `feature_flags.template.csv` defines which modules exist and their default state.
- `tab_modules.template.csv` maps each Google Sheets tab to one module.
- Do not create a separate conflicting enable/disable switch in every tab.
- `Feature_Flags` describes module selection. The currently implemented runtime switches are in `Automation_Rules`; they are not automatically synchronized.
- When a module is disabled, Apps Script should hide or leave its tabs unused and skip its forms, menus, reports, and automations.
- Hidden tabs are for usability, not security. Use a separate workbook per studio for data isolation.
