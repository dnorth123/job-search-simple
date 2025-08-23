# LinkedIn Discovery Manual Testing Protocol

**Server Status**: ✅ Running at http://localhost:5173/
**Test Date**: _____________
**Tester**: _____________

## ⚠️ Important Setup Notes

### **Current Setup Status**:
- ✅ Development server running on http://localhost:5173/
- ✅ `lucide-react` dependency installed
- ✅ Environment file created (.env)
- ⚠️ **IMPORTANT**: LinkedIn Discovery will work in limited mode without Brave API key
- ⚠️ **IMPORTANT**: Supabase integration requires configuration for full functionality

### **For Full LinkedIn Discovery Testing**:
You'll need to configure:
1. **Brave Search API Key** - Get from https://brave.com/search/api/
2. **Supabase Project** - Create at https://supabase.com/ 

### **Testing Modes Available**:
- **🟡 Limited Mode** (current): Form works, LinkedIn discovery shows fallbacks
- **🟢 Full Mode** (with API keys): Complete LinkedIn discovery functionality

## 🔧 Pre-Test Setup

### 1. Environment Check
- [ ] Development server is running at http://localhost:5173/
- [ ] Browser dev tools are open (F12)
- [ ] Network tab is visible for monitoring API calls
- [ ] Console tab is visible for monitoring errors

### 2. Required Test Data
Prepare these company names for testing:
- **Well-known companies**: Microsoft, Google, Apple, Amazon
- **Medium companies**: Stripe, Figma, Notion, Linear
- **Uncommon companies**: YourLocalBusiness, TestCompany123
- **Edge cases**: "A", "", "Company with special chars !@#"

---

## 🧪 Test Scenarios

### **TEST 1: Basic LinkedIn Discovery Flow**

**Objective**: Verify core LinkedIn discovery functionality works

**Steps**:
1. Navigate to http://localhost:5173/
2. Fill out the job application form:
   - Company: "Microsoft"
   - Position: "Software Engineer"
   - Leave other fields as needed
3. Focus on the Company field and wait for LinkedIn discovery to trigger

**Expected Results**:
- [ ] LinkedIn search triggers automatically after typing "Microsoft"
- [ ] Loading spinner appears
- [ ] LinkedIn suggestions appear within 5 seconds
- [ ] At least one Microsoft LinkedIn URL is suggested
- [ ] Confidence scores are displayed (should be > 80% for Microsoft)
- [ ] Can select a LinkedIn URL from suggestions

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 2: Auto-Selection with High Confidence**

**Objective**: Test automatic selection for high-confidence matches

**Steps**:
1. Clear the form
2. Type "Google" in the Company field
3. Wait for discovery to complete

**Expected Results**:
- [ ] Search completes quickly (< 3 seconds)
- [ ] If single result with 90%+ confidence, it auto-selects
- [ ] Selected LinkedIn URL appears in the form
- [ ] Green checkmark or selection indicator appears
- [ ] No further user action required

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 3: Manual URL Entry Fallback**

**Objective**: Test manual entry when automatic discovery fails

**Steps**:
1. Type "NonExistentCompany12345" in Company field
2. Wait for discovery to complete or fail
3. Click "Enter manually" button (should appear)
4. Enter "https://linkedin.com/company/test-company" manually

**Expected Results**:
- [ ] Search returns no results or low confidence results
- [ ] "Enter manually" option appears
- [ ] Can enter custom LinkedIn URL
- [ ] Manual URL is validated (should be linkedin.com/company/...)
- [ ] Manual entry is accepted and saved

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 4: Error Handling and Recovery**

**Objective**: Test error scenarios and fallback mechanisms

**Steps**:
1. Disconnect from internet (or simulate network failure)
2. Type "Apple" in Company field
3. Reconnect internet
4. Try "Amazon" in Company field

**Expected Results**:
- [ ] Network error shows appropriate error message
- [ ] Fallback options are presented (manual entry, skip)
- [ ] After reconnection, normal functionality resumes
- [ ] No application crashes or broken states
- [ ] Error boundary catches any React errors

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 5: Performance and Debouncing**

**Objective**: Test performance optimizations and debouncing

**Steps**:
1. Type "M" then quickly type "i-c-r-o-s-o-f-t" in Company field
2. Observe network tab in browser dev tools
3. Clear field and type "Google" very quickly

**Expected Results**:
- [ ] Only final API call is made (debouncing works)
- [ ] No excessive API calls during fast typing
- [ ] Response time is reasonable (< 5 seconds)
- [ ] Loading states are smooth and not flickering
- [ ] Rate limiting prevents spam

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 6: Cache Behavior**

**Objective**: Verify caching is working correctly

**Steps**:
1. Search for "Microsoft" (first time)
2. Clear the Company field
3. Search for "Microsoft" again (second time)
4. Check browser dev tools Network tab

**Expected Results**:
- [ ] First search makes API call to Supabase edge function
- [ ] Second search uses cached results (no new API call)
- [ ] Second search is significantly faster
- [ ] Cache hit is logged in console (if monitoring enabled)

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 7: Form Integration**

**Objective**: Test LinkedIn URL integration with form submission

**Steps**:
1. Fill complete job application:
   - Company: "Stripe"
   - Position: "Product Manager"
   - Status: "Applied"
   - Applied Date: Today's date
2. Select a LinkedIn URL from suggestions
3. Submit the form (Add Job button)

**Expected Results**:
- [ ] LinkedIn URL is included in form data
- [ ] Form submits successfully with LinkedIn data
- [ ] New job entry includes LinkedIn URL
- [ ] LinkedIn confidence score is stored
- [ ] Analytics data is recorded

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 8: Edge Cases and Validation**

**Objective**: Test edge cases and input validation

**Test Cases**:

**8a. Empty/Short Input**:
- Type "A" in Company field
- Expected: No search triggered (minimum length)

**8b. Special Characters**:
- Type "Company & Co." in Company field  
- Expected: Search works, special chars handled

**8c. Very Long Company Name**:
- Type a 100+ character company name
- Expected: Search works, results are reasonable

**8d. Invalid Manual URL**:
- Try entering "https://google.com" as manual LinkedIn URL
- Expected: Validation error, URL rejected

**Results**:
```
8a: ________________________________________________________
8b: ________________________________________________________  
8c: ________________________________________________________
8d: ________________________________________________________
```

---

### **TEST 9: Multiple Company Searches**

**Objective**: Test switching between different companies

**Steps**:
1. Search for "Microsoft"
2. Select a LinkedIn URL
3. Change Company field to "Google"
4. Select different LinkedIn URL
5. Change back to "Apple"

**Expected Results**:
- [ ] Each search works independently
- [ ] Previous selections are cleared when changing companies
- [ ] No conflicts between different searches
- [ ] State management works correctly
- [ ] No memory leaks or performance issues

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 10: Browser Compatibility**

**Objective**: Test cross-browser functionality (if multiple browsers available)

**Browsers to Test**: Chrome, Firefox, Safari, Edge

**Steps**:
1. Open application in different browsers
2. Test basic LinkedIn discovery flow
3. Check for console errors
4. Test responsive design on mobile view

**Results**:
```
Chrome: ____________________________________________________
Firefox: ___________________________________________________
Safari: ____________________________________________________
Edge: ______________________________________________________
Mobile: ____________________________________________________
```

---

## 🔍 Monitoring & Observability Tests

### **TEST 11: Development Monitoring** ⚙️

**Objective**: Verify monitoring and logging work in development

**Steps**:
1. Open browser console
2. Perform a LinkedIn search
3. Check for monitoring logs
4. Look for feature flag logs
5. Check localStorage for cached data

**Expected Results**:
- [ ] LinkedIn Discovery configuration logs appear
- [ ] Feature flag status is logged
- [ ] Search requests and responses are logged
- [ ] Performance metrics are captured
- [ ] localStorage contains cache entries

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

### **TEST 12: Error Boundary Testing**

**Objective**: Test error boundaries catch crashes gracefully

**Steps**:
1. Open React Dev Tools (if installed)
2. Try to trigger an error by:
   - Modifying localStorage to corrupt data
   - Disconnecting network mid-request
   - Using invalid API responses (if possible)

**Expected Results**:
- [ ] Error boundaries catch errors gracefully
- [ ] Fallback UI is displayed
- [ ] Application doesn't completely crash
- [ ] "Enter manually" option is still available
- [ ] Error is logged for debugging

**Actual Results**:
```
_________________________________________________________________
_________________________________________________________________
```

---

## 📊 Performance Benchmarks

### **TEST 13: Performance Metrics**

Record the following metrics during testing:

| Metric | Target | Actual | Pass/Fail |
|--------|---------|---------|-----------|
| Search Response Time | < 3 seconds | _______ | _________ |
| Cache Hit Response | < 500ms | _______ | _________ |
| Initial Page Load | < 2 seconds | _______ | _________ |
| Memory Usage | Stable | _______ | _________ |
| API Calls per Search | 1 call | _______ | _________ |

---

## 🚨 Critical Issues to Watch For

### **High Priority Issues**:
- [ ] Application crashes or white screen
- [ ] LinkedIn searches never return results  
- [ ] Form submission fails with LinkedIn data
- [ ] Excessive API calls or rate limiting
- [ ] Memory leaks or performance degradation

### **Medium Priority Issues**:
- [ ] Slow response times (> 5 seconds)
- [ ] Incorrect confidence scores
- [ ] UI flickering or poor loading states
- [ ] Cache not working properly
- [ ] Manual entry validation issues

### **Low Priority Issues**:
- [ ] Minor styling issues
- [ ] Non-critical console warnings
- [ ] Suboptimal UX flows
- [ ] Missing edge case handling

---

## 📝 Test Summary

### **Overall Test Results**:
- **Total Tests**: 13
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____

### **Critical Bugs Found**:
```
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________
```

### **Recommendations**:
```
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________
```

### **Sign-off**:
- [ ] Core functionality works as expected
- [ ] No critical bugs found
- [ ] Performance meets requirements
- [ ] Ready for further development/production

**Tester Signature**: _____________________  
**Date**: _____________________

---

## 🔧 Debugging Tips

**If LinkedIn discovery isn't working**:
1. Check browser console for errors
2. Verify BRAVE_SEARCH_API_KEY is set in .env
3. Check Network tab for failed requests
4. Verify Supabase connection is working

**If searches are slow**:
1. Check network connection
2. Verify Brave API quota isn't exceeded
3. Check if caching is working
4. Look for JavaScript errors blocking execution

**If form submission fails**:
1. Check form validation
2. Verify all required fields are filled
3. Check console for React errors
4. Verify Supabase integration is working

**Need help?**
- Check the browser console for detailed error messages
- Review the LinkedIn Discovery configuration logs
- Test with simpler company names first (Microsoft, Google, Apple)