# Shareable Links Implementation Guide

## 🎯 Overview
This guide explains the shareable link feature implementation for When3Meet, allowing users to create events and share them via unique URLs.

---

## 🔗 How It Works

### **Link Format**
```
https://your-app.vercel.app/event/[MongoDB-ObjectId]
Example: https://your-app.vercel.app/event/507f1f77bcf9a6cd799439011
```

### **User Flow**
1. **Create Event** → User creates event → Event saved to MongoDB with unique ID
2. **Get Link** → System generates shareable link using event's MongoDB `_id`
3. **Share Link** → User copies and shares the link
4. **View Event** → Anyone with link can view event details
5. **Add Availability** → Visitors must login/register to submit availability
6. **Redirect Back** → After login, user returns to event page to submit

---

## 📁 Files Modified/Created

### **Backend Changes**

#### 1. `backend/models/event_model.js`
- Added fields: `startTime`, `endTime`, `selectedDays`, `month`, `year`, `dateRange`, `isPublic`
- These support the frontend event creation flow

#### 2. `backend/controllers/event_controller.js`
- **Updated** `createEvent`: Returns shareable link in response
- **Added** `getPublicEvent`: Public endpoint (no auth required) to fetch event details

#### 3. `backend/routes/event_routes.js`
- **Added** `GET /api/events/public/:eventId` - Public access route

#### 4. `backend/controllers/availability_controller.js`
- **Updated** `upsertAvailability`: Now uses `userId` instead of email
- **Updated** `listAvailabilitiesForEvent`: Populates user details

### **Frontend Changes**

#### 5. `src/App.jsx`
- **Added** route: `/event/:eventId` → `EventView` component

#### 6. `src/pages/EventView.jsx` (NEW)
- Displays event details from shareable link
- Shows availability grid with existing responses
- Prompts login for unauthenticated users
- Submits availability after authentication

#### 7. `src/pages/CreateEvent.jsx`
- **Updated** `create()`: Now saves to MongoDB backend
- Redirects to `/event/:eventId` after creation

#### 8. `src/pages/Login.jsx`
- **Added** redirect logic: Checks `localStorage.redirectAfterLogin`
- Returns user to event page after successful login

#### 9. `src/pages/Register.jsx`
- **Added** redirect logic: Same as Login for new users

---

## 🚀 Testing Steps

### **1. Start Backend Server**
```bash
cd backend
npm install
npm start
```
Backend should run on `http://localhost:50001`

### **2. Start Frontend**
```bash
npm install
npm run dev
```
Frontend should run on `http://localhost:5173`

### **3. Test Flow**

#### **A. Create Event & Get Link**
1. Login to your account
2. Navigate to "Create Event"
3. Fill in event details (title, times, dates)
4. Click "Create"
5. You'll be redirected to `/event/[eventId]`
6. Click "Copy link" button

#### **B. Share Link (Test as Guest)**
1. Open incognito/private browser window
2. Paste the event link
3. You should see event details WITHOUT being logged in
4. Try to add availability → Should redirect to login
5. Login or register
6. Should redirect back to event page
7. Select time slots and click "Submit availability"

#### **C. View Responses**
1. Check sidebar for list of respondents
2. Hover over colored cells to see who's available

---

## 🔐 Security Features

### **Public Access**
- Event details are viewable by anyone with the link
- `isPublic` flag controls access (default: true)
- Invalid event IDs return 404

### **Protected Actions**
- Adding availability requires authentication
- Only logged-in users can submit responses
- User identity tracked via MongoDB `userId`

### **Privacy**
- Event creators can see all responses
- Respondents see aggregated availability (colored heatmap)
- Individual names shown on hover

---

## 🗄️ Database Schema

### **Event Model**
```javascript
{
  _id: ObjectId,              // Used as shareable link ID
  title: String,
  creator: ObjectId (ref: User),
  window: {
    start: Date,
    end: Date
  },
  startTime: String,          // "09:00"
  endTime: String,            // "17:00"
  selectedDays: [Number],     // [15, 16, 17]
  month: Number,              // 0-11
  year: Number,               // 2025
  dateRange: String,          // "Jan 15 - Jan 17, 2025"
  isPublic: Boolean,          // Allow public access
  participants: [{
    user: ObjectId (ref: User)
  }],
  determinedTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Availability Model**
```javascript
{
  _id: ObjectId,
  eventId: ObjectId (ref: Event),
  userId: ObjectId (ref: User),
  slots: [String],            // ISO date strings
  timeZone: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 API Endpoints

### **Public Endpoints (No Auth Required)**
```
GET /api/events/public/:eventId
- Returns event details if isPublic=true
- Response: { success: true, event: {...} }
```

### **Protected Endpoints (Auth Required)**
```
POST /api/events
- Create new event
- Body: { title, creator, window, startTime, endTime, selectedDays, month, year, dateRange }
- Response: { success: true, event: {...}, shareableLink: "/event/[id]" }

POST /api/events/:eventId/availabilities
- Submit availability for an event
- Body: { userId, slots: [ISO strings], timeZone }
- Response: { success: true, availability: {...} }

GET /api/events/:eventId/availabilities
- Get all availabilities for an event
- Response: { success: true, availabilities: [...] }
```

---

## 🎨 UI/UX Features

### **Copy Link Button**
- One-click copy to clipboard
- Shows confirmation alert
- Works on both creator and shared views

### **Login Prompt**
- Clear button text: "Login to add availability"
- Seamless redirect flow
- Preserves event context

### **Availability Grid**
- Color intensity shows response count
- Hover tooltip displays names
- Drag-to-select time slots
- Purple highlight for current selection

### **Responsive Design**
- Uses existing `availability.css` styles
- Mobile-friendly grid layout
- Sidebar shows participant list

---

## 🐛 Troubleshooting

### **Issue: Event not found**
- Check MongoDB connection in `backend/.env`
- Verify event ID is valid MongoDB ObjectId
- Check `isPublic` flag is true

### **Issue: Can't submit availability**
- Ensure user is logged in (check localStorage)
- Verify backend API is running
- Check browser console for errors

### **Issue: Redirect not working**
- Clear localStorage and try again
- Check `redirectAfterLogin` is set correctly
- Verify React Router routes are configured

### **Issue: CORS errors**
- Update `backend/app.js` CORS settings
- Ensure `VITE_API_URL` in `.env.local` is correct
- For production, update Vercel environment variables

---

## 🚢 Deployment (Vercel)

### **Environment Variables**
Add these to Vercel project settings:

```
MONGODB_URI=mongodb+srv://...
PORT=50001
GOOGLE_CLIENT_ID=your-client-id
NODE_ENV=production
```

### **Frontend Environment**
Update `.env.production`:
```
VITE_API_URL=https://your-backend-url.vercel.app
```

### **Vercel Configuration**
Ensure `vercel.json` routes API requests correctly:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" }
  ]
}
```

---

## 📊 MongoDB Indexing (Performance)

Add these indexes for better performance:

```javascript
// In MongoDB shell or Compass
db.events.createIndex({ creator: 1, createdAt: -1 })
db.availabilities.createIndex({ eventId: 1, userId: 1 }, { unique: true })
```

---

## 🎯 Future Enhancements

### **Potential Features**
- [ ] Private events (require password)
- [ ] Event expiration dates
- [ ] Email notifications for new responses
- [ ] Export availability to CSV
- [ ] Custom URL slugs (e.g., `/event/team-meeting-jan`)
- [ ] QR code generation for easy sharing
- [ ] Anonymous responses (optional)
- [ ] Event editing by creator
- [ ] Delete/archive events

---

## 📝 Notes

### **Why MongoDB ObjectId?**
- Already generated by MongoDB
- Guaranteed unique
- URL-safe
- No extra dependencies
- 24 characters (compact)

### **Alternative: Custom IDs**
If you want shorter URLs, consider:
- **nanoid**: `npm install nanoid` → 8-12 character IDs
- **UUID**: Standard but longer (36 characters)
- **Custom slugs**: User-friendly but requires uniqueness checks

### **Backward Compatibility**
- Old localStorage-based events still work in `/availability` route
- New events use MongoDB and shareable links
- Both flows coexist without conflicts

---

## 🤝 Support

For issues or questions:
1. Check browser console for errors
2. Verify backend logs
3. Test API endpoints with Postman/Thunder Client
4. Review MongoDB data in Compass

---

**Implementation Complete! 🎉**

Your When3Meet app now supports shareable links with seamless authentication flow.
