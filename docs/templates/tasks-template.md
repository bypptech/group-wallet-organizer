# Task Breakdown: [FEATURE]

## Execution Flow (main)
```
1. Read plan.md
2. Extract files, entities, endpoints
3. Generate tasks with IDs and exact paths
4. Mark [P] for parallelizable tasks
5. Validate TDD ordering (tests before implementation)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD)
- [ ] T004 [P] Contract test ...
- [ ] T005 [P] Contract test ...
- [ ] T006 [P] Integration test ...
- [ ] T007 [P] Integration test ...

## Phase 3.3: Core Implementation
- [ ] T008 [P] Model in src/models/...
- [ ] T009 [P] Service in src/services/...
- [ ] T010 [P] CLI command in src/cli/...
- [ ] T011 Endpoint ...
- [ ] T012 Endpoint ...
- [ ] T013 Input validation
- [ ] T014 Error handling and logging

## Phase 3.4: Integration
- [ ] T015 Connect service to DB
- [ ] T016 Auth middleware
- [ ] T017 Request/response logging
- [ ] T018 CORS and security headers

## Phase 3.5: Polish
- [ ] T019 [P] Unit tests for validation in tests/unit/...
- [ ] T020 Performance tests (<200ms)
- [ ] T021 [P] Update docs/api.md
- [ ] T022 Remove duplication
- [ ] T023 Run manual-testing.md

## Dependencies
- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018

