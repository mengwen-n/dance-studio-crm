# Project structure

The root-level folders are shared and reusable. Numbered studio folders contain studio-specific overrides.

```text
dance-studio-crm/
├─ docs/                         # overall business/product documentation
├─ 01_Dance_Studio/              # reusable dance-studio template and neutral rules
├─ config/                       # reusable CSV templates: features, validation, IDs
├─ google-sheets/                 # reusable Google Sheets schema and operating notes
├─ skills/                       # project-local AI skills and business context
├─ 02_The_Wolves_Dance_Academy/  # Wolves-specific requirements and enabled features
└─ 03_Studio_B/                  # future Studio B-specific configuration
```

## Placement rule

- Put reusable, studio-neutral rules in `01_Dance_Studio/`, `config/`, `google-sheets/`, or `skills/`.
- Put overall business/product documentation in `docs/`.
- Put Wolves names, rooms, crews, prices, schedules, and confirmed policies in `02_The_Wolves_Dance_Academy/`.
- Future studios get their own numbered folder, such as `03_Studio_B/`.
- Keep real member, phone, payment, and booking data in the studio's private Google Sheet, not in the repo.

The repo contains the reusable template and configuration. The live feature choices are stored in each studio's private `Feature_Flags` tab.
