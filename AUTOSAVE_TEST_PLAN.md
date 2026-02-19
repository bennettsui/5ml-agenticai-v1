# Autosave Functionality Test Plan

## Overview
This document outlines testing procedures for the autosave functionality implemented across three Social Content Ops modules:
1. **Content Development** - Card drafts (title, platform, format, script, objective)
2. **Interactive** - Campaign automation (polls, quizzes, contests)
3. **Calendar** - Content calendar posts (date, platform, format, pillar, status)

## Prerequisites
- Backend running: `npm start`
- Frontend running: `npm run dev`
- A test brand created in the system
- Browser dev tools open (Network tab for verifying API calls)

## Test Cases

### TEST 1: Content Development Module

#### 1.1 Manual Autosave Test
1. Navigate to: `/use-cases/social-content-ops/content-dev`
2. Select a test brand
3. Create or edit a card:
   - Title: "Test Card"
   - Platform: "IG"
   - Format: "Reel"
   - Script: "Test script content"
   - Objective: "Awareness"
4. **Expected**:
   - Card data updates in state
   - "Unsaved..." indicator appears in header (amber text)
   - After ~2 seconds, "✓ Autosaved" indicator appears (green text)
5. Open Network tab and verify:
   - POST request to `/api/social/content-dev/{brandId}` succeeds (200)
   - Request body contains the card data

#### 1.2 Page Reload Test
1. Create/edit a card (trigger autosave)
2. Wait for "Autosaved" indicator
3. Refresh the page (Cmd+R / Ctrl+R)
4. **Expected**:
   - Card data loads from database
   - Saved data matches what was entered
   - No loss of data

#### 1.3 Brand Switch Test
1. Create a card in Brand A (trigger autosave)
2. Switch to Brand B
3. Switch back to Brand A
4. **Expected**:
   - Original card data is loaded from database
   - No data loss or corruption

### TEST 2: Interactive Module

#### 2.1 Manual Autosave Test
1. Navigate to: `/use-cases/social-content-ops/interactive`
2. Select a test brand
3. Create a campaign:
   - Type: "Poll"
   - Question: "Which format do you prefer?"
   - Options: ["Reel", "Carousel", "Static"]
4. **Expected**:
   - Campaign data updates
   - "Unsaved..." indicator appears, then "✓ Autosaved" after ~2 seconds
5. Network tab verification:
   - POST to `/api/social/interactive/{brandId}` succeeds

#### 2.2 Multiple Campaigns Test
1. Create 3-5 different campaigns (polls, quizzes, contests)
2. Edit campaign #2
3. **Expected**:
   - All campaigns autosave independently
   - Each campaign's data persists correctly
   - No cross-contamination between campaigns

#### 2.3 Page Reload Test
1. Create/edit multiple campaigns
2. Wait for all autosaves to complete
3. Refresh the page
4. **Expected**:
   - All campaigns load from database
   - Data integrity maintained

### TEST 3: Calendar Module

#### 3.1 Manual Autosave Test
1. Navigate to: `/use-cases/social-content-ops/calendar`
2. Select a test brand
3. Add a post by clicking on a date cell:
   - Platform: "IG"
   - Format: "Reel"
   - Pillar: "Educate"
   - Title: "Test Post"
   - Objective: "Awareness"
   - Key Message: "Test message"
4. **Expected**:
   - Post appears in grid
   - "Unsaved..." indicator appears, then "✓ Autosaved"
5. Network verification:
   - POST to `/api/social/calendar/{brandId}` succeeds with all posts

#### 3.2 Drag-and-Drop Test
1. Create a post on March 3
2. Drag it to March 10
3. **Expected**:
   - Post moves to new date
   - Autosave triggers automatically
   - "Autosaved" indicator confirms
   - Network: POST request includes updated date

#### 3.3 AI Generate Test
1. Click "AI Generate Month" button
2. Wait for response
3. **Expected**:
   - Calendar populates with 12-16 posts
   - Autosave triggers automatically
   - All posts persist after refresh
   - Network: Multiple POST requests or single POST with all posts

### TEST 4: Error Scenarios

#### 4.1 Network Failure Simulation
1. Open Dev Tools → Network tab
2. Throttle to "Offline"
3. Make changes to a module (content-dev, interactive, or calendar)
4. **Expected**:
   - "Unsaved..." indicator remains
   - Manual "Save" button can be clicked
   - No error dialog (graceful degradation)
5. Return to online
6. **Expected**:
   - Autosave resumes and completes
   - "Autosaved" indicator appears

#### 4.2 Invalid Brand ID Test
1. Manually change URL to use invalid brand ID
2. Try to edit content
3. **Expected**:
   - API returns 400/404 error
   - Frontend gracefully handles error
   - No data corruption

### TEST 5: Cross-Module Behavior

#### 5.1 Simultaneous Editing
1. Open two browser tabs/windows
2. Tab 1: Edit content-dev card
3. Tab 2: Edit interactive campaign
4. **Expected**:
   - Both autosave independently
   - No race conditions
   - Data consistent in both tabs

#### 5.2 Concurrent Brand Access
1. User A: Select Brand X, create content-dev card
2. User B: Select Brand Y, create calendar post
3. **Expected**:
   - Data saves to correct brand
   - No cross-contamination
   - Each user's data persists independently

## Automated Test Execution

Run the automated test suite:
```bash
node test-autosave.js
```

**Expected output**:
```
🧪 Autosave Functionality Test Suite

📝 TEST 1: Content Development Autosave
  ✓ Save successful
  ✓ Load successful (X items)

🎯 TEST 2: Interactive Campaigns Autosave
  ✓ Save successful
  ✓ Load successful (X items)

📅 TEST 3: Calendar Posts Autosave
  ✓ Save successful
  ✓ Load successful (X items)

💾 TEST 4: Data Persistence Verification
  ✓ Content Development data persisted
  ✓ Interactive data persisted
  ✓ Calendar data persisted

✅ All tests passed!
```

## Checklist

### Content Development
- [ ] Manual create/edit saves data
- [ ] Page reload recovers data
- [ ] Brand switch maintains data
- [ ] Multiple cards persist independently
- [ ] Autosave indicator works correctly

### Interactive
- [ ] Manual campaign save works
- [ ] Multiple campaigns save independently
- [ ] Page reload recovers all campaigns
- [ ] Different campaign types (poll, quiz, contest) work
- [ ] Autosave indicator works correctly

### Calendar
- [ ] Manual post creation saves
- [ ] Drag-and-drop triggers autosave
- [ ] AI generate populates and saves all posts
- [ ] Page reload recovers all posts
- [ ] Calendar grid displays correctly after reload
- [ ] Autosave indicator works correctly

### General
- [ ] All three modules share consistent autosave UX
- [ ] Status indicators (Unsaved/Autosaved) appear at right times
- [ ] No console errors during normal operations
- [ ] Network tab shows correct API endpoints being called
- [ ] All 6 API endpoints respond with 200 status

## Known Issues / Limitations

None identified yet. If issues are found during testing, document them here with:
- Module affected
- Steps to reproduce
- Expected vs actual behavior
- Screenshot/video if helpful

## Sign-off

- [ ] All manual tests completed
- [ ] All automated tests passing
- [ ] No console errors
- [ ] Data persistence verified
- [ ] Cross-module behavior verified
- [ ] Ready for production deployment
