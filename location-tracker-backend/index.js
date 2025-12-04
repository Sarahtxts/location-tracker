const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const db = require('./db');
const https = require('https');
const http = require('http');
const url = require('url');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

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

// ============ GOOGLE MAPS GEOCODING API ============

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
    console.log(`[GEOCODE] Calling Google Maps API...`);

    const data = await makeRequest(googleUrl);

    console.log(`[GEOCODE] API response status: ${data.status}`);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const address = data.results[0].formatted_address;
      console.log(`[GEOCODE] ✓ Address found: ${address}`);
      res.json({ address });
    } else {
      console.warn(`[GEOCODE] ✗ No address found. Status: ${data.status}`);
      if (data.error_message) {
        console.warn(`[GEOCODE] Error Message: ${data.error_message}`);
      }
      // Return the error to the client so we can see it in the app
      return res.status(400).json({
        error: 'Geocoding failed',
        details: data.status,
        message: data.error_message
      });
    }
  } catch (error) {
    console.error(`[GEOCODE] ✗ Error: ${error.message}`);
    console.error(`[GEOCODE] Stack:`, error.stack);
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

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/user/:userName', (req, res) => {
  const { userName } = req.params;
  db.get('SELECT * FROM users WHERE name = ?', [userName], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json({ ...row, exists: true });
    } else {
      res.json({ exists: false });
    }
  });
});

app.post('/api/user/update', (req, res) => {
  const { name, role, phoneNumber, password, reportingManagerEmail, profilePic } = req.body;
  const istNow = getCurrentISTString();
  db.run(`
    INSERT INTO users (name, role, phoneNumber, password, reportingManagerEmail, profilePic, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, role) DO UPDATE SET
      phoneNumber = excluded.phoneNumber,
      password = excluded.password,
      reportingManagerEmail = excluded.reportingManagerEmail,
      profilePic = excluded.profilePic
  `, [name, role, phoneNumber, password, reportingManagerEmail, profilePic, istNow], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, userId: this.lastID });
  });
});

app.post('/api/user/delete', (req, res) => {
  const { userName } = req.body;
  db.run('DELETE FROM users WHERE name = ?', [userName], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM visits WHERE userName = ?', [userName], (err) => {
      if (err) console.error('Error deleting visits:', err);
    });
    res.json({ success: true });
  });
});

app.post('/api/user/login', (req, res) => {
  const { name, role, password } = req.body;
  db.get('SELECT * FROM users WHERE name = ? AND role = ? AND password = ?',
    [name, role, password], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({ success: true, user: row });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    });
});

// ============ VISITS API ============

app.get('/api/visits', (req, res) => {
  const { userName, fromDate, toDate } = req.query;
  let query = 'SELECT * FROM visits WHERE 1=1';
  let params = [];
  if (userName && userName !== 'all') {
    query += ' AND userName = ?';
    params.push(userName);
  }
  if (fromDate) {
    query += ' AND checkInTime >= ?';
    params.push(fromDate);
  }
  if (toDate) {
    query += ' AND checkInTime <= ?';
    params.push(toDate + ' 23:59:59');
  }
  query += ' ORDER BY checkInTime DESC';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/visits/pending-checkouts', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['checkoutReminderHours'], (err, row) => {
    const reminderHours = row ? parseInt(row.value) : 8;
    let dt = new Date();
    dt.setHours(dt.getHours() - reminderHours);
    const istStr = getCurrentISTString();
    db.all(`
      SELECT * FROM visits 
      WHERE checkOutTime IS NULL 
      AND checkInTime < ?
      ORDER BY checkInTime ASC
    `, [istStr], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});

// Check-in: Create new visit
app.post('/api/visits/create', (req, res) => {
  const { userName, clientName, companyName, checkInAddress, checkInMapLink } = req.body;
  const istNow = getCurrentISTString();
  db.run(`
    INSERT INTO visits (userName, clientName, companyName, checkInAddress, checkInMapLink, checkInTime, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userName, clientName, companyName, checkInAddress, checkInMapLink, istNow, istNow], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run(`
      INSERT INTO clients (name, company, location, createdAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        company = excluded.company,
        location = excluded.location
    `, [clientName, companyName, checkInAddress, istNow], (clientErr) => {
      if (clientErr) {
        console.error('Client upsert error:', clientErr.message);
        return res.json({
          success: true,
          visitId: this.lastID,
          warning: 'Visit created but client location was not updated.'
        });
      }
      res.json({ success: true, visitId: this.lastID });
    });
  });
});

// Check-out: Update visit
app.post('/api/visits/update', (req, res) => {
  const { id, checkOutAddress, checkOutMapLink, locationMismatch } = req.body;
  const istNow = getCurrentISTString();
  db.run(`
    UPDATE visits SET
      checkOutTime = ?,
      checkOutAddress = ?,
      checkOutMapLink = ?,
      locationMismatch = ?
    WHERE id = ?
  `, [istNow, checkOutAddress, checkOutMapLink, locationMismatch ? 1 : 0, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/visits/delete', (req, res) => {
  const { id } = req.body;
  db.run('DELETE FROM visits WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ CLIENTS API ============

app.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM clients ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/clients/create', (req, res) => {
  const { name, company, location } = req.body;
  const istNow = getCurrentISTString();
  db.run(`
    INSERT INTO clients (name, company, location, createdAt) VALUES (?, ?, ?, ?)
  `, [name, company, location, istNow], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Client already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, clientId: this.lastID });
  });
});

app.post('/api/clients/delete', (req, res) => {
  const { name } = req.body;
  db.run('DELETE FROM clients WHERE name = ?', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ SETTINGS API ============

app.get('/api/settings/:key', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', [req.params.key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ value: row ? row.value : null });
  });
});

app.post('/api/settings', (req, res) => {
  const { key, value } = req.body;
  db.run(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `, [key, value], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
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
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT reportingManagerEmail FROM users WHERE name = ?', [userName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (user) finalRecipientEmail = user.reportingManagerEmail;
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
  console.log(`📊 Database: locationTracker.db`);
});
