# Complete Shareable Link Flow - Testing Guide

## Current Implementation Status

### ✅ What's Working:

1. **Event Creation**
   - User must be logged in
   - Backend generates unique eventId and adminToken
   - Navigates to `/availability/:eventId?admin=:adminToken`

2. **Shareable Link**
   - Copy link button copies participant link (without admin token)
   - Format: `http://localhost:5173/availability/:eventId`

3. **View Event (No Login Required)**
   - Anyone can open the link
   - Event loads from database
   - Shows existing responses
   - Can see heatmap

4. **Login Prompt**
   - When user clicks on grid to select slots → Login prompt appears
   - Current URL saved to `returnTo` in localStorage
   - Redirects to `/login`

5. **After Login**
   - User is redirected back to event page
   - Can now select slots
   - Can submit availability

6. **Submit Availability**
   - Saves to database with userId
   - Reloads responses from database
   - Name appears in responses list

## Test Flow:

### Test 1: Create Event (Logged In User)
1. ✅ Login at `http://localhost:5173/login`
2. ✅ Navigate to `/create`
3. ✅ Fill in event details
4. ✅ Click "Create"
5. ✅ Should navigate to `/availability/:eventId?admin=:adminToken`
6. ✅ Event grid should be visible

### Test 2: Copy and Share Link
1. ✅ Click "Copy link" button
2. ✅ Link copied: `http://localhost:5173/availability/:eventId` (no admin token)
3. ✅ Open link in new incognito/private window

### Test 3: View Event (Not Logged In)
1. ✅ Paste link in new browser
2. ✅ Event page loads
3. ✅ Can see event title, dates, time grid
4. ✅ Can see existing responses (if any)
5. ✅ Can see heatmap colors

### Test 4: Try to Add Availability (Not Logged In)
1. ✅ Click on any time slot in the grid
2. ✅ Alert appears: "Please login to add your availability"
3. ✅ Redirected to `/login`
4. ✅ Current URL saved to localStorage as `returnTo`

### Test 5: Login and Return
1. ✅ Login with credentials
2. ✅ After successful login, automatically redirected back to event page
3. ✅ Event grid is visible
4. ✅ Can now click and select time slots

### Test 6: Submit Availability
1. ✅ Select time slots by clicking/dragging
2. ✅ Click "Add availability" button
3. ✅ Availability submitted to database
4. ✅ Name appears in "Responses" list
5. ✅ Heatmap updates with new availability

## Backend Endpoints Used:

- `GET /api/events/:eventId` - Load event details
- `GET /api/events/:eventId/availabilities` - Load existing responses
- `PUT /api/events/:eventId/availabilities` - Submit availability
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration

## Data Flow:

```
1. User A creates event
   ↓
2. Backend generates eventId + adminToken
   ↓
3. User A gets admin link: /availability/:eventId?admin=:token
   ↓
4. User A copies participant link: /availability/:eventId
   ↓
5. User B opens link (not logged in)
   ↓
6. Event loads from database (no login required)
   ↓
7. User B clicks on grid
   ↓
8. Login prompt appears
   ↓
9. User B logs in
   ↓
10. Redirected back to event page
    ↓
11. User B selects slots and submits
    ↓
12. Availability saved to database
    ↓
13. Both User A and User B see updated responses
```

## Key Files:

1. **src/pages/Availability.jsx**
   - Lines 335-345: Login check in `handleCellMouseDown`
   - Lines 177-183: Login check in `addAvailability`
   - Lines 33-77: Event loading from database

2. **src/pages/Login.jsx**
   - Lines 47-56: Return to saved URL after login

3. **backend/controllers/availability_controller.js**
   - `upsertAvailability`: Saves user availability
   - `listAvailabilitiesForEvent`: Gets all availabilities

4. **backend/models/availability_model.js**
   - Stores slots as `[[Number]]` (arrays of slot indices)

## Troubleshooting:

### Issue: "User ID not found"
**Solution**: Login check now happens BEFORE slot selection (line 335-345)

### Issue: Responses don't show in new browser
**Solution**: Responses load from database, not localStorage (line 48-62)

### Issue: Not redirected back after login
**Solution**: `returnTo` is saved and used in Login.jsx (line 47-56)

### Issue: Name doesn't appear in responses
**Solution**: Backend populates userId with userName (availability_controller.js)

## Environment Variables:

**Local (.env.local):**
```
VITE_API_URL=http://localhost:50001
```

**Backend (backend/.env):**
```
MONGODB_URI=mongodb+srv://...
PORT=50001
GOOGLE_CLIENT_ID=...
```

## Testing Checklist:

- [ ] Backend running on port 50001
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Can create event when logged in
- [ ] Can copy participant link
- [ ] Can view event without login
- [ ] Login prompt appears when clicking grid
- [ ] Redirected back after login
- [ ] Can select slots after login
- [ ] Can submit availability
- [ ] Name appears in responses
- [ ] Responses visible in different browser
