# 🔧 Quick Fix: Frontend Not Running

## Issue
You're seeing "Cannot GET /" because:
1. You're accessing `http://localhost:5000` (backend API)
2. The frontend on port 5173 is not running properly

## ✅ Solution

### Step 1: Stop the Current Frontend Process

In the terminal running `npm run dev`, press:
```
Ctrl + C
```

### Step 2: Restart the Frontend

```bash
npm run dev
```

### Step 3: Wait for Vite to Start

You should see output like:
```
VITE v6.4.1  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Step 4: Open the Correct URL

Open your browser to:
```
http://localhost:5173
```

**NOT** `http://localhost:5000` (that's the backend API)

---

## 🎯 Quick Reference

| Server | Port | URL | Purpose |
|--------|------|-----|---------|
| **Frontend** | 5173 | http://localhost:5173 | **← Open this in browser** |
| **Backend** | 5000 | http://localhost:5000 | API only (no web interface) |

---

## 🐛 If Frontend Still Won't Start

### Check for Errors

When you run `npm run dev`, look for error messages. Common issues:

1. **Port already in use:**
   ```bash
   # Kill process on port 5173
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
   # Then restart
   npm run dev
   ```

2. **Missing dependencies:**
   ```bash
   npm install
   npm run dev
   ```

3. **Vite config issue:**
   Check if `vite.config.ts` exists and is valid

---

## 📝 Current Status

✅ **Backend:** Running on port 5000  
❌ **Frontend:** Not running on port 5173  

**Fix:** Restart the frontend with `npm run dev`

---

## 🚀 Complete Restart (If Needed)

If you want to restart everything fresh:

### Terminal 1 - Backend:
```bash
cd location-tracker-backend
npm start
```

### Terminal 2 - Frontend:
```bash
# Make sure you're in the root directory
npm run dev
```

Then open: **http://localhost:5173**

---

## ✨ Summary

**The Problem:**
- You opened `http://localhost:5000` (backend API)
- Backend shows "Cannot GET /" because it's an API, not a website
- Frontend on port 5173 is not running

**The Solution:**
1. Restart frontend: `npm run dev`
2. Open correct URL: `http://localhost:5173`

**That's it!** 🎉
