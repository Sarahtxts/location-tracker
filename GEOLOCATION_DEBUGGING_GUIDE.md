# Geolocation & Geocoding Debugging Guide

## Problem Summary
The map coordinates were being recorded but the location address wasn't being displayed properly. This was due to:
1. Missing frontend `.env` file with Google Maps API key
2. Insufficient error logging to diagnose issues
3. Potential API key not being passed to the frontend

## Fixes Applied

### 1. **Created Frontend `.env` File**
   - **Location**: `c:\Users\sarah\PROJECTS\Location Tracker App\.env`
   - **Content**: 
     ```
     VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1Ec-gl1zZ-bn2qGWY95BtidYkIPhDei8
     ```
   - **Why**: Vite requires environment variables to be prefixed with `VITE_` and stored in `.env` file

### 2. **Enhanced Frontend Logging** (`UserCheckIn.tsx`)
   - Added console logs to track:
     - Geolocation request initiation
     - Coordinates obtained from browser
     - Geocoding API calls and responses
     - Address setting confirmation
   - These logs help identify where the process fails

### 3. **Improved Geolocation Handler** (`UserCheckIn.tsx`)
   - Better error classification (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)
   - Detailed error messages for users
   - Console logging for debugging

### 4. **Enhanced Geocoding Function** (`UserCheckIn.tsx`)
   - Added request/response logging
   - Logs include coordinates being geocoded and resulting address
   - Better error handling with response status checking

### 5. **Backend Logging** (`location-tracker-backend/index.js`)
   - Added check to verify API key is set in environment
   - Logs reverse geocoding requests with coordinates
   - Logs Google Maps API response status
   - Logs the resulting address or error reason

### 6. **Improved MapView Component** (`MapView.tsx`)
   - Better API key verification logging
   - Enhanced error messages showing coordinates when map fails to load
   - Better loading state with coordinate display
   - Improved marker title for accessibility
   - Added `libraries: ['places']` for potential future features

## How to Debug

### Step 1: Open Browser Developer Console
- Press `F12` or `Ctrl+Shift+I` to open Developer Tools
- Go to the **Console** tab

### Step 2: Test Location Flow
1. Navigate to the User Check In page
2. Watch the console for messages:
   ```
   Requesting geolocation...
   Geolocation obtained: lat=13.041600, lng=80.210700
   Geocoding request: lat=13.041600, lng=80.210700
   Geocoding response status: 200
   Geocoding result: Ashok Nagar, Chennai, Tamil Nadu, India
   Setting address: Ashok Nagar, Chennai, Tamil Nadu, India
   ```

### Step 3: Check Backend Logs
1. Look at the backend server terminal (Node.js process)
2. Should see:
   ```
   Reverse geocoding: lat=13.041600, lng=80.210700
   Google Maps API response status: OK
   Address found: Ashok Nagar, Chennai, Tamil Nadu, India
   ```

### Step 4: Verify Map Display
- Check if Google Map appears with marker at your location
- Check for API key error messages (red banner)
- Verify address is displayed below the map

## Troubleshooting

### Issue: "Error loading Google Maps"
- Check that `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
- Verify API key has Geocoding API enabled
- Check Google Cloud Console for billing setup

### Issue: "Location permission denied"
- Grant location permission in browser settings
- For Chrome: Settings → Privacy → Site Settings → Location
- Reload the page after granting permission

### Issue: "Unknown location" displayed
- Check backend logs for geocoding errors
- Verify coordinates are being sent correctly (console logs)
- Check if backend has `GOOGLE_MAPS_API_KEY` environment variable set

### Issue: Map shows but address is "Unknown location"
- Backend geocoding API call failed
- Check backend logs for "No address found" status
- Verify internet connectivity

## Key Environment Variables

### Frontend (`c:\Users\sarah\PROJECTS\Location Tracker App\.env`)
```
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### Backend (`c:\Users\sarah\PROJECTS\Location Tracker App\location-tracker-backend\.env`)
```
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
MAILJET_API_KEY=...
MAILJET_API_SECRET=...
```

## API Endpoints

### Frontend → Backend
- **GET** `/api/geocode?lat={lat}&lng={lng}` - Reverse geocode coordinates to address
- Returns: `{ address: "formatted address" }`

### Backend → Google Maps API
- **GET** `https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={apiKey}`
- Converts coordinates to address

## Data Flow

```
Browser Geolocation API
    ↓
Frontend gets (lat, lng)
    ↓
Frontend calls /api/geocode
    ↓
Backend calls Google Maps API
    ↓
Backend returns formatted address
    ↓
Frontend displays address & map
    ↓
User sees: Map + Address + Coordinates
```

## Next Steps

1. Restart both frontend and backend
2. Open the app in browser and test location check-in
3. Monitor console logs for the flow
4. If still failing, check backend logs
5. Verify Google Cloud Console has billing enabled for Geocoding API
