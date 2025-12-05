const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const db = require('./db-postgres');
const https = require('https');
const http = require('http');
const url = require('url');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Helper: Map Postgres lowercase keys to camelCase
const mapUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    phoneNumber: u.phonenumber,
    password: u.password,
    reportingManagerEmail: u.reportingmanageremail,
    profilePic: u.profilepic,
    createdAt: u.createdat
  };
};

const mapVisit = (v) => {
  if (!v) return null;
  return {
    id: v.id,
    userName: v.username,
    clientName: v.clientname,
    companyName: v.companyname,
    checkInAddress: v.checkinaddress,
    checkInMapLink: v.checkinmaplink,
    checkInTime: v.checkintime,
    checkOutTime: v.checkouttime,
    checkOutAddress: v.checkoutaddress,
    checkOutMapLink: v.checkoutmaplink,
    locationMismatch: v.locationmismatch,
    createdAt: v.createdat
  };
};

const mapClient = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    company: c.company,
    location: c.location,
    createdAt: c.createdat
  };
};

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_API_SECRET
  }
});

// Helper: IST datetime string "YYYY-MM-DD HH:mm:ss"
function getCurrentISTString() {
  const date = new Date();
  const [d, t] = date.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).split(', ');
  const [day, month, year] = d.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${t}`;
}

// Helper: Format duration for reports
function formatTotalDuration(visits) {
  let totalMs = 0;
  visits.forEach(v => {
    if (v.checkOutTime && v.checkInTime) {
      const co = new Date(v.checkOutTime.replace(' ', 'T'));
      const ci = new Date(v.checkInTime.replace(' ', 'T'));
      totalMs += (co.getTime() - ci.getTime());
    }
  });
  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
}

// ============ GOOGLE MAPS GEOCODING API ============

// Helper function to make HTTP/HTTPS requests
function makeRequest(urlString) {
  return new Promise((resolve, reject) => {
    const urlObj = url.parse(urlString);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    protocol.get(urlObj, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Get address from lat/lng (reverse geocode)
app.get('/api/geocode', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng)
    return res.status(400).json({ error: 'lat and lng are required' });
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('✗ GOOGLE_MAPS_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }
    console.log(`[GEOCODE] Reverse geocoding: lat=${lat}, lng=${lng}`);
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const data = await makeRequest(googleUrl);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const address = data.results[0].formatted_address;
      console.log(`[GEOCODE] ✓ Address found: ${address}`);
      res.json({ address });
    } else {
      console.warn(`[GEOCODE] ✗ No address found. Status: ${data.status}`);
      return res.status(400).json({
        error: 'Geocoding failed',
        details: data.status,
        message: data.error_message
      });
    }
  } catch (error) {
    console.error(`[GEOCODE] ✗ Error: ${error.message}`);
    res.status(500).json({ error: `Geocoding failed: ${error.message}` });
  }
});

// Optional: forward geocoding (address to coords)
app.get('/api/geocode-forward', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address is required' });
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    console.log(`[GEOCODE-FWD] Forward geocoding: ${address}`);
    const data = await makeRequest(googleUrl);
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`[GEOCODE-FWD] ✓ Coords found: lat=${location.lat}, lng=${location.lng}`);
      res.json({ lat: location.lat, lng: location.lng, formatted_address: data.results[0].formatted_address });
    } else {
      console.warn(`[GEOCODE-FWD] ✗ No coordinates found for: ${address}`);
      res.status(404).json({ error: 'No coordinates found for that address' });
    }
  } catch (error) {
    console.error(`[GEOCODE-FWD] ✗ Error: ${error.message}`);
    res.status(500).json({ error: `Geocoding failed: ${error.message}` });
  }
});

// ============ USERS API ============

app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users');
    res.json(rows.map(mapUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/:userName', async (req, res) => {
  const { userName } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE name = $1', [userName]);
    if (rows.length > 0) {
      res.json({ ...mapUser(rows[0]), exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/update', async (req, res) => {
  const { name, role, phoneNumber, password, reportingManagerEmail, profilePic } = req.body;
  const istNow = getCurrentISTString();
  try {
    const result = await db.query(`
      INSERT INTO users (name, role, phoneNumber, password, reportingManagerEmail, profilePic, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(name, role) DO UPDATE SET
        phoneNumber = excluded.phoneNumber,
        password = excluded.password,
        reportingManagerEmail = excluded.reportingManagerEmail,
        profilePic = excluded.profilePic
      RETURNING id
    `, [name, role, phoneNumber, password, reportingManagerEmail, profilePic, istNow]);

    res.json({ success: true, userId: result.rows[0]?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/delete', async (req, res) => {
  const { userName } = req.body;
  try {
    await db.query('DELETE FROM users WHERE name = $1', [userName]);
    await db.query('DELETE FROM visits WHERE userName = $1', [userName]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/login', async (req, res) => {
  const { name, role, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE name = $1 AND role = $2 AND password = $3',
      [name, role, password]);
    if (rows.length > 0) {
      res.json({ success: true, user: mapUser(rows[0]) });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ VISITS API ============

app.get('/api/visits', async (req, res) => {
  const { userName, fromDate, toDate } = req.query;
  let query = 'SELECT * FROM visits WHERE 1=1';
  let params = [];
  let paramCount = 1;

  if (userName && userName !== 'all') {
    query += ` AND userName = $${paramCount}`;
    params.push(userName);
    paramCount++;
  }
  if (fromDate) {
    query += ` AND checkInTime >= $${paramCount}`;
    params.push(fromDate);
    paramCount++;
  }
  if (toDate) {
    query += ` AND checkInTime <= $${paramCount}`;
    params.push(toDate + ' 23:59:59');
    paramCount++;
  }
  query += ' ORDER BY checkInTime DESC';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows.map(mapVisit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visits/pending-checkouts', async (req, res) => {
  try {
    const settingRes = await db.query('SELECT value FROM settings WHERE key = $1', ['checkoutReminderHours']);
    const reminderHours = settingRes.rows.length > 0 ? parseInt(settingRes.rows[0].value) : 8;

    let dt = new Date();
    dt.setHours(dt.getHours() - reminderHours);
    const istStr = getCurrentISTString();

    const { rows } = await db.query(`
      SELECT * FROM visits 
      WHERE checkOutTime IS NULL 
      AND checkInTime < $1
      ORDER BY checkInTime ASC
    `, [istStr]);

    res.json(rows.map(mapVisit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check-in: Create new visit
app.post('/api/visits/create', async (req, res) => {
  const { userName, clientName, companyName, checkInAddress, checkInMapLink } = req.body;
  const istNow = getCurrentISTString();

  try {
    const visitRes = await db.query(`
      INSERT INTO visits (userName, clientName, companyName, checkInAddress, checkInMapLink, checkInTime, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [userName, clientName, companyName, checkInAddress, checkInMapLink, istNow, istNow]);

    const visitId = visitRes.rows[0].id;

    try {
      await db.query(`
        INSERT INTO clients (name, company, location, createdAt)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(name) DO UPDATE SET
          company = excluded.company,
          location = excluded.location
      `, [clientName, companyName, checkInAddress, istNow]);
    } catch (clientErr) {
      console.error('Client upsert error:', clientErr.message);
      return res.json({
        success: true,
        visitId: visitId,
        warning: 'Visit created but client location was not updated.'
      });
    }

    res.json({ success: true, visitId: visitId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check-out: Update visit
app.post('/api/visits/update', async (req, res) => {
  const { id, checkOutAddress, checkOutMapLink, locationMismatch } = req.body;
  const istNow = getCurrentISTString();
  try {
    await db.query(`
      UPDATE visits SET
        checkOutTime = $1,
        checkOutAddress = $2,
        checkOutMapLink = $3,
        locationMismatch = $4
      WHERE id = $5
    `, [istNow, checkOutAddress, checkOutMapLink, locationMismatch ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visits/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await db.query('DELETE FROM visits WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CLIENTS API ============

app.get('/api/clients', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients ORDER BY name');
    res.json(rows.map(mapClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients/create', async (req, res) => {
  const { name, company, location } = req.body;
  const istNow = getCurrentISTString();
  try {
    const result = await db.query(`
      INSERT INTO clients (name, company, location, createdAt) VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [name, company, location, istNow]);
    res.json({ success: true, clientId: result.rows[0].id });
  } catch (err) {
    if (err.message.includes('unique constraint') || err.code === '23505') {
      return res.status(400).json({ error: 'Client already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients/delete', async (req, res) => {
  const { name } = req.body;
  try {
    await db.query('DELETE FROM clients WHERE name = $1', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SETTINGS API ============

app.get('/api/settings/:key', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT value FROM settings WHERE key = $1', [req.params.key]);
    res.json({ value: rows.length > 0 ? rows[0].value : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  try {
    await db.query(`
      INSERT INTO settings (key, value) VALUES ($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, [key, value]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EMAIL REPORT ============

app.post('/api/send-report', async (req, res) => {
  const { userName, userRole, visits = [], fromDate = '', toDate = '', recipientEmail, email } = req.body;
  const totalCompleted = visits.filter(v => v.checkOutTime).length;
  const totalInProgress = visits.length - totalCompleted;
  const totalDuration = formatTotalDuration(visits);
  const totalMismatch = visits.filter(v => v.locationMismatch).length;

  let finalRecipientEmail = recipientEmail || email;
  if (!finalRecipientEmail && userName && userName !== 'All Users' && userName !== 'all') {
    try {
      const { rows } = await db.query('SELECT reportingManagerEmail FROM users WHERE name = $1', [userName]);
      if (rows.length > 0) {
        finalRecipientEmail = rows[0].reportingManagerEmail;
      }
    } catch (err) {
      console.error('Error fetching manager email:', err);
    }
  }
  if (!finalRecipientEmail) {
    return res.status(400).json({
      error: `No reporting manager email found for "${userName}".`
    });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Visit Report');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'User', key: 'userName', width: 20 },
      { header: 'Client', key: 'clientName', width: 18 },
      { header: 'Company', key: 'companyName', width: 22 },
      { header: 'Check-In Time', key: 'checkInTimeFmt', width: 18 },
      { header: 'Check-In Location', key: 'checkInAddress', width: 36 },
      { header: 'Check-In Map', key: 'checkInMapLink', width: 40 },
      { header: 'Check-Out Time', key: 'checkOutTimeFmt', width: 18 },
      { header: 'Check-Out Location', key: 'checkOutAddress', width: 36 },
      { header: 'Check-Out Map', key: 'checkOutMapLink', width: 40 },
      { header: 'Duration', key: 'duration', width: 14 },
      { header: 'Location Stat.', key: 'locationStat', width: 14 },
      { header: 'Status', key: 'status', width: 14 }
    ];

    visits.forEach((v) => {
      const date = v.checkInTime ? new Date(v.checkInTime.replace(' ', 'T')).toLocaleDateString() : '';
      const checkInTimeFmt = v.checkInTime ? new Date(v.checkInTime.replace(' ', 'T')).toLocaleTimeString() : '';
      const checkOutTimeFmt = v.checkOutTime ? new Date(v.checkOutTime.replace(' ', 'T')).toLocaleTimeString() : '';
      let duration = 'In Progress';
      if (v.checkInTime && v.checkOutTime) {
        const dms = new Date(v.checkOutTime.replace(' ', 'T')) - new Date(v.checkInTime.replace(' ', 'T'));
        const mins = Math.floor(dms / 60000);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        duration = `${hrs}h ${remMins}m`;
      }
      const locationStat = v.locationMismatch ? 'MISMATCH' : 'OK';
      const status = v.checkOutTime ? 'Completed' : 'In Progress';

      worksheet.addRow([
        date, v.userName, v.clientName || '', v.companyName || '',
        checkInTimeFmt, v.checkInAddress, v.checkInMapLink || '',
        checkOutTimeFmt, v.checkOutAddress || '', v.checkOutMapLink || '',
        duration, locationStat, status
      ]);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3857DD' } };
    const buffer = await workbook.xlsx.writeBuffer();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Location Visit Report</title></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 520px; margin: 30px auto; padding: 32px; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #3255A6;">Location Tracker Report</h2>
            <p>Hello,</p>
            <ul>
              <li><strong>User:</strong> ${userName}</li>
              <li><strong>Date Range:</strong> ${fromDate || 'All'} to ${toDate || 'All'}</li>
              <li><strong>Total Visits:</strong> ${visits.length}</li>
              <li><strong>Completed:</strong> ${totalCompleted}</li>
              <li><strong>In Progress:</strong> ${totalInProgress}</li>
              <li><strong>Total Duration:</strong> ${totalDuration}</li>
              <li><strong>Mismatches:</strong> ${totalMismatch}</li>
            </ul>
            <p>Attached Excel report includes full visit details with map links.</p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.MAILJET_FROM_EMAIL,
      to: finalRecipientEmail,
      subject: `Location Tracker Report for ${userName}`,
      html: emailHtml,
      attachments: [{
        filename: `LocationReport_${userName}_${new Date().toISOString().split('T')[0]}.xlsx`,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }]
    });

    console.log('✅ Email sent to:', finalRecipientEmail);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Email error:', err);
    res.status(500).json({ error: 'Failed to send report email.' });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://192.168.1.32:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
});