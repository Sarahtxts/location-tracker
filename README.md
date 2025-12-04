# Location Tracker App

A full-stack location tracking application with check-in/check-out functionality, Google Maps integration, and reporting features.

## Project Structure

```
Location Tracker App/
├── location-tracker-backend/    # Node.js + Express backend
│   ├── index.js                 # Main server file
│   ├── db.js                    # SQL Server database connection
│   ├── package.json             # Backend dependencies
│   └── .env                     # Environment variables (not in git)
├── src/                         # React frontend
│   ├── components/              # React components
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── package.json                 # Frontend dependencies
└── vite.config.ts              # Vite configuration
```

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Google Maps API** - Location services
- **Capacitor** - Mobile app framework

### Backend
- **Node.js** with Express
- **SQL Server** - Database (MSSQL)
- **Nodemailer** - Email functionality
- **ExcelJS** - Report generation

## Database Setup

### SQL Server Configuration

The application uses **SQL Server Express** with the following connection:
- **Server:** `localhost\SQLEXPRESS`
- **Database:** `LocationTrackerDB`
- **Authentication:** Windows Authentication (Trusted Connection)

### Database Schema

The application automatically creates the following tables on first run:

#### 1. **users** table
```sql
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) NOT NULL,
  phoneNumber NVARCHAR(20),
  password NVARCHAR(255) NOT NULL,
  reportingManagerEmail NVARCHAR(255),
  profilePic NVARCHAR(MAX),
  createdAt NVARCHAR(50),
  CONSTRAINT UC_User UNIQUE (name, role)
);
```

#### 2. **visits** table
```sql
CREATE TABLE visits (
  id INT IDENTITY(1,1) PRIMARY KEY,
  userName NVARCHAR(255) NOT NULL,
  clientName NVARCHAR(255),
  companyName NVARCHAR(255),
  checkInAddress NVARCHAR(MAX),
  checkInMapLink NVARCHAR(MAX),
  checkInTime NVARCHAR(50),
  checkOutTime NVARCHAR(50),
  checkOutAddress NVARCHAR(MAX),
  checkOutMapLink NVARCHAR(MAX),
  locationMismatch INT DEFAULT 0,
  createdAt NVARCHAR(50)
);
```

#### 3. **clients** table
```sql
CREATE TABLE clients (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL UNIQUE,
  company NVARCHAR(255),
  location NVARCHAR(MAX),
  createdAt NVARCHAR(50)
);
```

#### 4. **settings** table
```sql
CREATE TABLE settings (
  [key] NVARCHAR(255) PRIMARY KEY,
  value NVARCHAR(MAX) NOT NULL
);
```

## Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **SQL Server Express** installed and running
- **Google Maps API Key**
- **Mailjet Account** (for email reports)

### Step 1: Install Dependencies

#### Backend Dependencies
```bash
cd location-tracker-backend
npm install
```

This installs:
- express
- cors
- dotenv
- mssql (SQL Server driver)
- nodemailer
- exceljs

#### Frontend Dependencies
```bash
cd ..
npm install
```

This installs all React, Vite, and UI dependencies.

### Step 2: Configure Environment Variables

Create a `.env` file in the `location-tracker-backend` directory:

```env
# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Mailjet Email Configuration
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
MAILJET_FROM_EMAIL=your_from_email@example.com
```

### Step 3: Database Initialization

The database and tables are **automatically created** when you first run the backend server. The application will:

1. Connect to SQL Server Express
2. Create the `LocationTrackerDB` database (if it doesn't exist)
3. Create all required tables (users, visits, clients, settings)

No manual database setup is required!

## Running the Application

### Start the Backend Server

```bash
cd location-tracker-backend
npm start
```

The backend will:
- Initialize the database (first run only)
- Start the API server on `http://localhost:5000`

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

### Start the Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy).

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/user/:userName` - Get user by name
- `POST /api/user/update` - Create/update user
- `POST /api/user/delete` - Delete user
- `POST /api/user/login` - User login

### Visits
- `GET /api/visits` - Get visits (with filters)
- `GET /api/visits/pending-checkouts` - Get pending checkouts
- `POST /api/visits/create` - Create visit (check-in)
- `POST /api/visits/update` - Update visit (check-out)
- `POST /api/visits/delete` - Delete visit

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients/create` - Create client
- `POST /api/clients/delete` - Delete client

### Settings
- `GET /api/settings/:key` - Get setting by key
- `POST /api/settings` - Update setting

### Geocoding
- `GET /api/geocode?lat=&lng=` - Reverse geocode (coords to address)
- `GET /api/geocode-forward?address=` - Forward geocode (address to coords)

### Reports
- `POST /api/send-report` - Send email report with Excel attachment

## Features

### User Features
- ✅ Check-in with location capture
- ✅ Check-out with location verification
- ✅ Location mismatch detection
- ✅ Visit history
- ✅ Google Maps integration

### Admin Features
- ✅ User management
- ✅ Visit tracking and monitoring
- ✅ Client management
- ✅ Excel report generation
- ✅ Email reports to managers
- ✅ Dashboard with analytics

## Database Connection Details

The application uses **Windows Authentication** to connect to SQL Server. The connection is configured in `db.js`:

```javascript
const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'LocationTrackerDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  authentication: {
    type: 'default'  // Uses Windows Authentication
  }
};
```

## Troubleshooting

### SQL Server Connection Issues

If you encounter connection errors:

1. **Verify SQL Server is running:**
   - Open SQL Server Configuration Manager
   - Ensure SQL Server (SQLEXPRESS) service is running

2. **Enable TCP/IP:**
   - SQL Server Configuration Manager → SQL Server Network Configuration
   - Enable TCP/IP protocol

3. **Check Windows Authentication:**
   - Ensure your Windows user has access to SQL Server
   - The application uses Trusted Connection (Windows Auth)

### Port Conflicts

- Backend default port: `5000`
- Frontend default port: `5173`

Change ports in:
- Backend: `index.js` (line with `const PORT = 5000`)
- Frontend: `vite.config.ts`

## Development

### Backend Development
```bash
cd location-tracker-backend
npm run dev
```

### Frontend Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## License

ISC

## Original Design

This project is based on the Figma design: https://www.figma.com/design/qJcUF1uKdhdjXPDd8pKXul/Location-Tracker-App
