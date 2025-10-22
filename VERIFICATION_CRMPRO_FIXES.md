# Verification Guide: CRM Organization Context Fixes

## 🎯 Quick Verification (5 minutes)

### Step 1: Open DevTools Console
```
1. Press F12 to open DevTools
2. Click "Console" tab
3. Keep it open while navigating
```

### Step 2: Navigate to CRM
```
1. Open: http://localhost:3000
2. Click: CRM in sidebar
3. Watch console for org initialization messages
```

### Expected Console Output:
```
✅ Organization context initialized: 452c0b35-1822-4890-851e-922356c812fb
🌐 Initializing API Client for CRM...
✅ Organization context ready: 452c0b35-1822-4890-851e-922356c812fb
```

### Step 3: Verify API Calls Have Header
```
1. In DevTools, click "Network" tab
2. Look for requests like:
   - GET /api/crm/leads?limit=10...
   - GET /api/crm/pipeline
3. Click on each request
4. Click "Headers" tab
5. Scroll down to "Request Headers"
6. ✅ Should see: x-organization-id: 452c0b35...
```

### Step 4: Test Sync Button
```
1. In CRM, click "Google Ads Settings" tab
2. Scroll to "3. Sincronizar Campanhas"
3. Click the "Sincronizar Campanhas" button
4. Watch console (should NOT show error)
5. Button should show spinning icon temporarily
6. After response:
   ✅ Button returns to normal state
   ✅ Either success or error message appears
   ✅ NO JavaScript errors in console
```

### Step 5: Check localStorage
```
1. In DevTools Console, paste:
   localStorage.getItem('activeOrganizationId')
2. Should output:
   "452c0b35-1822-4890-851e-922356c812fb"
3. Paste:
   window.currentOrganizationId
4. Should output:
   "452c0b35-1822-4890-851e-922356c812fb"
```

---

## 🔍 Detailed Verification

### Verification #1: Organization Initialization

**What to check**: Does app.js properly initialize organization context?

```javascript
// In Console, execute:
window.AcademyApp?.config?.appName
// Expected: "Krav Maga Academy"

// Check org ID:
window.currentOrganizationId
// Expected: "452c0b35-1822-4890-851e-922356c812fb"

// Check localStorage:
localStorage.getItem('activeOrganizationId')
// Expected: "452c0b35-1822-4890-851e-922356c812fb"

// Check ensureOrganizationContext function exists:
typeof window.ensureOrganizationContext
// Expected: "function"
```

**If any of above fails** ❌:
- Reload page: `location.reload()`
- Check app.js was saved correctly
- Verify no JavaScript errors in console before CRM loads

---

### Verification #2: API Client Gets Organization

**What to check**: Does API client receive and send organization header?

```javascript
// In Console, execute:
fetch('/api/crm/leads?limit=1')
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e))
```

**Expected result**:
```
Response: {success: true, data: [{...}], pagination: {...}}
```

**If you get empty data or error** ❌:
- Check Network tab for actual response status
- Look for error messages in console
- Verify x-organization-id header was sent

---

### Verification #3: CRM Module Loads with Organization

**What to check**: Does CRM module wait for organization before API calls?

```javascript
// Expected console sequence:
// 1. Organization initialization message
// 2. "Initializing API Client for CRM..."
// 3. "Organization context ready: 452c0b35..."
// 4. API calls with header
// 5. "Initial CRM data loaded: {leads: [...], pipelineStats: {...}}"

// If you DON'T see step 3 message:
// - Organization wait timed out
// - CRM initialized before org was available
// - Reload page and check again
```

---

### Verification #4: Button Click Handling

**What to check**: Does sync button click work without errors?

```javascript
// Step-by-step:
// 1. Look at HTML in DevTools Elements tab
// 2. Find button with text "Sincronizar Campanhas"
// 3. Note: should have onclick="crm.syncGoogleAdsCampaigns(event)"
//    NOT: onclick="crm.syncGoogleAdsCampaigns()"

// 4. Click the button
// 5. In console, should see NO errors
// 6. Network tab should show POST /api/google-ads/sync/campaigns
// 7. Response should be success or error (not 500 from missing org)
```

**If button click shows error** ❌:
```
TypeError: Cannot read properties of undefined (reading 'target')
```
- This means event parameter wasn't passed
- Check HTML onclick attribute has "event" parameter
- Reload page and try again

---

### Verification #5: Google Ads Status API

**What to check**: Does Google Ads status endpoint return data correctly?

```javascript
// In Console, execute:
fetch('/api/google-ads/auth/status')
  .then(r => r.json())
  .then(d => {
    console.log('Connected:', d.data.connected);
    console.log('Customer ID:', d.data.customerId);
    console.log('Client ID:', d.data.clientId?.substring(0, 20) + '...');
  })
  .catch(e => console.error('Error:', e))
```

**Expected result**:
```
Connected: true or false
Customer ID: 411-893-6474 or null
Client ID: 692896555152-1vavst4k3... or null
```

**If you get 400 or 500** ❌:
- Organization header missing (should be fixed now)
- Backend error (check server logs)

---

## 🚨 Troubleshooting

### Problem: Console shows "No organization ID/slug found"

**Diagnosis**:
- Organization context not being set
- App initialization not complete

**Solution**:
1. Reload page: `location.reload()`
2. Wait 2-3 seconds for full load
3. Check console again
4. If still seeing warning:
   - Check app.js was saved correctly
   - Search for: `initializeOrganizationContext`
   - Verify ensureOrganizationContext function exists

---

### Problem: Sync button click shows "Cannot read properties of undefined"

**Diagnosis**:
- Event parameter not being passed
- Button onclick attribute incorrect

**Solution**:
1. Reload page
2. Right-click sync button → "Inspect"
3. Look at HTML:
   ```html
   ✅ Correct: <button onclick="crm.syncGoogleAdsCampaigns(event)">
   ❌ Wrong: <button onclick="crm.syncGoogleAdsCampaigns()">
   ```
4. If it shows wrong version:
   - File may not be properly saved
   - Try: `git status` to check file status
   - Try: `git diff` to see changes
   - Reload page with Ctrl+Shift+Delete (hard refresh)

---

### Problem: API returns 500 error on sync

**Diagnosis**:
- Organization header now being sent (fix worked!)
- But something else is wrong (not org-related)

**Solution**:
1. Check server logs for specific error message
2. Likely issues:
   - Google Ads credentials invalid/expired
   - Missing API scopes
   - Rate limiting from Google

**To verify it's NOT an org header issue**:
- Network tab should show: `x-organization-id: 452c0b35...`
- If header is there and still 500, it's a backend/Google issue

---

### Problem: Organization initialized but module still doesn't load data

**Diagnosis**:
- Organization context available
- But API calls still failing

**Solution**:
1. Check Network tab response status
2. Expected: 200 with data
3. Actual: 400, 401, 403, 404, or 500?

**If 401/403** (Permission/Auth error):
- Organization header is correct
- Issue is user permissions

**If 400** (Bad Request):
- Check request format
- Verify API endpoint exists

**If 500** (Server Error):
- Check server logs
- Restart server: `npm run dev`

---

## ✅ Success Criteria

The fixes are working correctly when:

```
✅ Console shows "Organization context ready" message
✅ API requests have x-organization-id header
✅ CRM data loads successfully (leads appear)
✅ Sync button can be clicked without errors
✅ Button state changes during click (spinner shows)
✅ No "Cannot read properties of undefined" errors
✅ NO "No organization ID/slug found" warnings
✅ localStorage['activeOrganizationId'] contains valid UUID
✅ window.currentOrganizationId contains valid UUID
✅ window.ensureOrganizationContext is a function
```

---

## 📊 Before/After Comparison

### BEFORE FIX

**Console Output**:
```
⚠️ No organization ID/slug found in storage or window context
🌐 GET /api/crm/leads
🌐 GET /api/crm/pipeline
[No data displayed]
```

**Network Tab**:
```
Request: GET /api/crm/leads
Headers: [NO x-organization-id header]
Response: 200 but empty data {}
```

**Button Click**:
```
Click → ERROR:
"Cannot read properties of undefined (reading 'target')"
Button hangs in disabled state
```

### AFTER FIX

**Console Output**:
```
✅ Organization context initialized: 452c0b35...
🌐 Initializing API Client for CRM...
✅ Organization context ready: 452c0b35...
🌐 GET /api/crm/leads
🌐 GET /api/crm/pipeline
✅ Initial CRM data loaded: {leads: [...]}
```

**Network Tab**:
```
Request: GET /api/crm/leads
Headers: x-organization-id: 452c0b35-1822-4890-851e-922356c812fb
Response: 200 with data [{...}, {...}]
```

**Button Click**:
```
Click → Button: disabled, spinner shows
Network: POST /api/google-ads/sync/campaigns with org header
Response: 200 or 400/500 with message
Button: re-enabled, message shown
NO ERRORS ✅
```

---

## 🎬 Video Test Script (if recording)

```
1. Open DevTools (F12)
2. Click Console tab
3. Scroll down to clear previous logs
4. Open http://localhost:3000
5. Click CRM in sidebar
6. [Pause] "Watch console for organization messages"
7. Click "Google Ads Settings" tab
8. Scroll to "Sincronizar Campanhas"
9. Click the button
10. [Pause] "Button should show spinner, no errors"
11. Wait for response
12. [Pause] "Success or error message appears"
13. Switch to Network tab
14. Show x-organization-id header in request
15. [Pause] "Header present = fix working!"
```

---

## 📞 If Tests Fail

1. **Gather Information**:
   - Copy console output (right-click → "Save as...")
   - Take screenshot of Network request headers
   - Note exact error message
   - Check timestamp in server logs

2. **Check Files Modified**:
   ```bash
   git status
   git diff public/js/core/app.js
   git diff public/js/modules/crm/index.js
   ```

3. **Verify Deployment**:
   ```bash
   npm run dev  # Restart server
   # Reload browser with Ctrl+Shift+Delete (hard refresh)
   ```

4. **Last Resort - Rollback**:
   ```bash
   git checkout public/js/core/app.js
   git checkout public/js/modules/crm/index.js
   npm run dev
   location.reload()
   ```

---

**Test Date**: 17 October 2025  
**Tester**: (You!)  
**Status**: Ready for verification  
**Expected Duration**: 5-10 minutes  

