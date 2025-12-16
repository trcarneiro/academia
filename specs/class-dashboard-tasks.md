# Task List: Class Dashboard (Painel de Aula)

**Feature**: Instructor Class Dashboard (TV/Tablet Mode)
**Goal**: Provide a real-time, high-visibility dashboard for instructors to manage classes, view lesson plans, and monitor student status directly from the mat.

## Phase 1: Setup & Infrastructure
- [x] T001 Create module directory structure `public/js/modules/class-dashboard/` and `public/js/modules/class-dashboard/services/`
- [x] T002 Create CSS file `public/css/modules/class-dashboard.css` with high-contrast variables
- [x] T003 Create module entry point `public/js/modules/class-dashboard/index.js` with basic `init()` structure
- [x] T004 [P] Create service `public/js/modules/class-dashboard/services/dashboard-service.js` to mock/fetch Lesson Plan and Attendance data

## Phase 2: US1 - Dashboard Layout (TV Mode)
*Goal: Create the visual skeleton optimized for distance viewing.*
- [x] T005 [US1] Implement Main Grid Layout (Header, Main Content, Sidebar) in `index.js`
- [x] T006 [US1] Implement Header component (Class Title, Time, Instructor Name) in `index.js`
- [x] T007 [US1] Apply "TV Mode" styling (large fonts, high contrast) in `class-dashboard.css`
- [x] T008 [US1] Add "Fullscreen Mode" toggle functionality in `index.js`

## Phase 3: US2 - Timeline & Real-time Timer
*Goal: Help instructor manage class time effectively.*
- [x] T009 [US2] Implement `ClassTimer` logic in `index.js` (Total time vs Segment time)
- [x] T010 [US2] Create Visual Progress Bar component (Warmup -> Tech -> Cooldown) in `index.js`
- [x] T011 [US2] Style Progress Bar and Timer digits in `class-dashboard.css`
- [x] T012 [US2] Add visual alerts/color changes when segment time is running out

## Phase 4: US3 - Student Sidebar & Alerts
*Goal: Provide critical student info at a glance.*
- [x] T013 [US3] Implement Student List rendering logic in `index.js`
- [x] T014 [US3] Implement "Alert Logic" to identify students with injuries or "First Class" status
- [x] T015 [US3] Create Student Card component with status badges in `index.js`
- [x] T016 [US3] Style Student Sidebar for readability in `class-dashboard.css`

## Phase 5: US4 - Lesson Content Rendering
*Goal: Display the actual class content (Techniques, Warmup).*
- [x] T017 [US4] Implement "Current Phase" display logic (showing only relevant content for current time)
- [x] T018 [US4] Render "Warmup" exercises list from JSON data
- [x] T019 [US4] Render "Techniques" section with primary/secondary techniques
- [x] T020 [US4] Render "Cooldown" section
- [x] T021 [US4] Style Content Cards for maximum legibility in `class-dashboard.css`

## Phase 6: Polish & Integration
- [x] T022 Add "Next Phase" manual trigger button (in case instructor wants to skip ahead)
- [x] T023 Test responsiveness on Tablet (1024px) vs TV (1920px) resolutions
- [x] T024 Verify integration with `spa-router.js` navigation
