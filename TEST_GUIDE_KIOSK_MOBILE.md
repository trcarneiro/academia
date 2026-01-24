# 📱 TEST GUIDE: Check-in Kiosk Mobile

## Overview
This guide validates the mobile responsiveness of the Check-in Kiosk, specifically targeting the issues identified in the audit.

## Environment Setup
1. Open Chrome DevTools (F12) -> Device Toolbar (Ctrl+Shift+M)
2. Select "iPhone 12" or "Pixel 5" (approx 390px width)
3. Navigate to `http://localhost:3000/checkin-kiosk`

## Test Cases

### 1. Camera Layout (< 480px)
- [ ] **Visibiltiy**: Verify the camera feed is visible without scrolling.
- [ ] **Aspect Ratio**: Verify the camera container is roughly 3:4 (portrait), not squat 1:1.
- [ ] **Face Outline**: Check if the SV face overlay fits within the container and is centered.
- [ ] **Feedback**: Verify "Aguardando rosto..." text is readable (>= 1.1rem).

### 2. Dashboard Stats
- [ ] **Layout**: Verify statistics (Frequency, Classes, etc.) are stacked in 1 column or a very readable 2-column grid.
- [ ] **Readability**: Ensure numbers are large and icons are not overlapping text.

### 3. Touch Targets
- [ ] **Buttons**: Verify "Confirmar Check-in" and other primary actions have a height >= 44px.
- [ ] **Inputs**: Verify the Manual Search input is easily tappable.
- [ ] **Lists**: Start typing a name that yields results. Verify the dropdown items are tall enough to tap easily.

### 4. Course Selection
- [ ] **Cards**: Course cards should be comfortably padded.
- [ ] **Text**: Course names and numbers should be legible without zooming.

## Pass/Fail Criteria
- **PASS**: All elements are fully visible, readable, and tappable on a 375px width screen without horizontal scolling or zooming.
- **FAIL**: Overlapping elements, unreadable text, or inability to click buttons.
