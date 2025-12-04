# SQL Server Setup Guide

## Prerequisites

Before running the Location Tracker application, you need to ensure SQL Server Express is properly installed and configured.

## Step 1: Verify SQL Server Installation

### Check if SQL Server is Installed

1. Press `Win + R` and type `services.msc`
2. Look for **SQL Server (SQLEXPRESS)** in the services list
3. If you see it, verify it's **Running**. If not, right-click and select **Start**

### If SQL Server is Not Installed

Download and install SQL Server Express from:
https://www.microsoft.com/en-us/sql-server/sql-server-downloads

Choose **Express** edition (free).

## Step 2: Enable SQL Server Services

### Start SQL Server Service

1. Open **SQL Server Configuration Manager**
   - Search for "SQL Server Configuration Manager" in Windows Start menu
   
2. Navigate to **SQL Server Services**

3. Find **SQL Server (SQLEXPRESS)** and ensure:
   - Status is **Running**
   - Start Mode is **Automatic**
   
4. If not running, right-click and select **Start**

### Enable TCP/IP Protocol

1. In SQL Server Configuration Manager, go to:
   **SQL Server Network Configuration → Protocols for SQLEXPRESS**

2. Right-click **TCP/IP** and select **Enable**

3. Restart the SQL Server service:
   - Go back to **SQL Server Services**
   - Right-click **SQL Server (SQLEXPRESS)**
   - Select **Restart**

## Step 3: Verify Connection

### Test Connection Using Command Line

Open PowerShell and run:

```powershell
sqlcmd -S localhost\SQLEXPRESS -E
```

If successful, you'll see:
```
1>
```

Type `exit` to quit.

### If Connection Fails

**Error: "Sqlcmd: Error: Microsoft ODBC Driver ... Login timeout expired"**

This means:
- SQL Server is not running, OR
- TCP/IP is not enabled, OR
- Windows Firewall is blocking the connection

**Solutions:**

1. **Check SQL Server Browser Service:**
   - Open `services.msc`
   - Find **SQL Server Browser**
   - Set to **Automatic** and **Start** it

2. **Check Firewall:**
   - Open Windows Firewall
   - Allow SQL Server through the firewall
   - Default port: 1433

3. **Verify Instance Name:**
   - Open SQL Server Configuration Manager
   - Confirm the instance name is **SQLEXPRESS**

## Step 4: Configure Windows Authentication

The application uses **Windows Authentication** (Trusted Connection).

### Verify Your Windows User Has Access

1. Open **SQL Server Management Studio (SSMS)** (if installed)
   - If not installed, you can download it from Microsoft

2. Connect to `localhost\SQLEXPRESS` using Windows Authentication

3. Expand **Security → Logins**

4. Verify your Windows user account is listed
   - It should be in the format: `COMPUTER-NAME\YourUsername`

5. If not listed, add it:
   - Right-click **Logins** → **New Login**
   - Click **Search** and add your Windows user
   - Grant **sysadmin** role

## Step 5: Alternative - Use SQL Server Authentication

If Windows Authentication doesn't work, you can switch to SQL Server Authentication:

### Enable SQL Server Authentication

1. Open SSMS and connect to your server

2. Right-click the server → **Properties**

3. Go to **Security** page

4. Select **SQL Server and Windows Authentication mode**

5. Click **OK** and restart SQL Server

### Create a SQL Login

1. In SSMS, expand **Security → Logins**

2. Right-click **Logins** → **New Login**

3. Create a new login:
   - Login name: `locationtracker`
   - Password: `YourSecurePassword123!`
   - Uncheck "Enforce password policy" for development

4. Go to **Server Roles** and check **sysadmin**

5. Click **OK**

### Update db.js Configuration

If using SQL Authentication, update `location-tracker-backend/db.js`:

```javascript
const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'LocationTrackerDB',
  user: 'locationtracker',
  password: 'YourSecurePassword123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};
```

Remove the `authentication` section and add `user` and `password` fields.

## Step 6: Test the Application

Once SQL Server is configured, run:

```bash
cd location-tracker-backend
node index.js
```

You should see:
```
✅ Database LocationTrackerDB created/verified
✅ Users table created/verified
✅ Visits table created/verified
✅ Clients table created/verified
✅ Settings table created/verified
✅ Database initialization complete
✅ Connected to SQL Server
🚀 Backend running on http://localhost:5000
📊 Database: SQL Server - LocationTrackerDB
```

## Common Issues and Solutions

### Issue 1: "Login failed for user"

**Solution:** 
- Verify Windows user has SQL Server access
- Or switch to SQL Server Authentication (see Step 5)

### Issue 2: "A network-related or instance-specific error"

**Solution:**
- Verify SQL Server service is running
- Enable TCP/IP protocol
- Start SQL Server Browser service

### Issue 3: "Connection timeout"

**Solution:**
- Check Windows Firewall settings
- Verify SQL Server is listening on the correct port
- Increase timeout in db.js (already set to 30 seconds)

### Issue 4: "Named Pipes Provider: Could not open a connection"

**Solution:**
- Enable Named Pipes in SQL Server Configuration Manager
- Restart SQL Server service

## Manual Database Creation (Optional)

If you prefer to create the database manually:

1. Open SSMS

2. Connect to `localhost\SQLEXPRESS`

3. Right-click **Databases** → **New Database**

4. Name it: `LocationTrackerDB`

5. Click **OK**

The application will still create the tables automatically on first run.

## Verification Checklist

Before running the application, verify:

- [ ] SQL Server (SQLEXPRESS) service is running
- [ ] SQL Server Browser service is running (optional but recommended)
- [ ] TCP/IP protocol is enabled
- [ ] You can connect using `sqlcmd -S localhost\SQLEXPRESS -E`
- [ ] Your Windows user has SQL Server access OR you've configured SQL Authentication
- [ ] Windows Firewall allows SQL Server connections

## Need Help?

If you're still having issues:

1. Check the error message in the terminal
2. Review SQL Server error logs:
   - Location: `C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\Log\ERRORLOG`
3. Verify SQL Server version compatibility (SQL Server 2016 or later recommended)

## Quick Start (If Everything is Configured)

```bash
# Terminal 1 - Start Backend
cd location-tracker-backend
npm start

# Terminal 2 - Start Frontend
npm run dev
```

The application will automatically:
- Create the database if it doesn't exist
- Create all required tables
- Start the API server on port 5000
- Start the frontend on port 5173
