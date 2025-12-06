import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Download, Mail, CheckCircle } from 'lucide-react';

import { Visit } from '../../App';

interface ExportDialogProps {
  visits: Visit[];
  userName: string;
  exportType: 'file' | 'email';
  onClose: () => void;
}

// If a Google Maps link exists in the visit object, use it; otherwise use the address
const getLocationLink = (mapLink?: string | null, address?: string | null) =>
  mapLink && mapLink.trim().length > 0
    ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer">${address || mapLink}</a>`
    : address || 'N/A';

export function ExportDialog({ visits, userName, exportType, onClose }: ExportDialogProps) {
  const [email, setEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Default email from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('locationTrackerCurrentUser');
    if (currentUser) {
      const userData = JSON.parse(localStorage.getItem('locationTrackerUsers') || '{}');
      if (userData[currentUser]?.email) {
        setEmail(userData[currentUser].email);
      }
    }
  }, []);

  // Format duration
  const formatDuration = (visit: Visit) => {
    if (!visit.checkOutTime) return 'In Progress';
    const start =
      typeof visit.checkInTime === 'string'
        ? new Date(visit.checkInTime.replace(' ', 'T')).getTime()
        : visit.checkInTime;
    const end =
      typeof visit.checkOutTime === 'string'
        ? new Date(visit.checkOutTime.replace(' ', 'T')).getTime()
        : visit.checkOutTime;
    const minutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // CSV export
  const generateExcelCSV = () => {
    const totalDuration = visits.reduce((sum, visit) => {
      if (visit.checkOutTime) {
        const start =
          typeof visit.checkInTime === 'string'
            ? new Date(visit.checkInTime.replace(' ', 'T')).getTime()
            : visit.checkInTime;
        const end =
          typeof visit.checkOutTime === 'string'
            ? new Date(visit.checkOutTime.replace(' ', 'T')).getTime()
            : visit.checkOutTime;
        return sum + Math.floor((end - start) / 60000);
      }
      return sum;
    }, 0);

    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;

    let csv = 'Location Tracker Report\n';
    csv += `User,${userName}\n`;
    csv += `Generated,${new Date().toLocaleString()}\n`;
    csv += `Total Visits,${visits.length}\n`;
    csv += `Completed,${visits.filter(v => v.checkOutTime).length}\n`;
    csv += `Total Duration,${hours}h ${mins}m\n\n`;
    csv += 'Date,User,Client,Company,Check-In Time,Check-In Location,Check-Out Time,Check-Out Location,Duration,Location Status,Status\n';

    visits.forEach(visit => {
      const checkInDate = new Date(visit.checkInTime);
      const checkOutDate = visit.checkOutTime ? new Date(visit.checkOutTime as string) : null;
      const duration = formatDuration(visit);
      const status = visit.checkOutTime ? 'Completed' : 'In Progress';
      const locationStatus = visit.locationMismatch ? 'MISMATCH' : 'OK';

      csv += `"${checkInDate.toLocaleDateString()}",`;
      csv += `"${visit.userName}",`;
      csv += `"${visit.clientName}",`;
      csv += `"${visit.companyName}",`;
      csv += `"${checkInDate.toLocaleString()}",`;
      csv += `"${visit.checkInAddress}",`;
      csv += `"${checkOutDate ? checkOutDate.toLocaleString() : 'N/A'}",`;
      csv += `"${visit.checkOutAddress || 'N/A'}",`;
      csv += `"${duration}",`;
      csv += `"${locationStatus}",`;
      csv += `"${status}"\n`;
    });

    return csv;
  };

  // HTML report (table contains Google Maps links if present)
  const generateHTMLReport = () => {
    const totalDuration = visits.reduce((sum, visit) => {
      if (visit.checkOutTime) {
        const start =
          typeof visit.checkInTime === 'string'
            ? new Date(visit.checkInTime.replace(' ', 'T')).getTime()
            : visit.checkInTime;
        const end =
          typeof visit.checkOutTime === 'string'
            ? new Date(visit.checkOutTime.replace(' ', 'T')).getTime()
            : visit.checkOutTime;
        return sum + Math.floor((end - start) / 60000);
      }
      return sum;
    }, 0);

    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Location Tracker Report - ${userName}</title>
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; max-width:800px; margin:0 auto;padding:40px 20px;color:#333;}
    h1 { color: #1f2937; border-bottom:3px solid #3b82f6; padding-bottom:10px; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
    .summary-item { background: white; padding: 15px; border-radius: 6px; }
    .summary-label { color: #6b7280; font-size: 14px; margin-bottom: 5px; }
    .summary-value { color: #1f2937; font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px;}
    th { background: #3b82f6; color: white; padding: 12px; text-align: left;}
    td { padding:12px; border-bottom:1px solid #e5e7eb;}
    tr:hover { background: #f9fafb; }
    .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;}
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-active { background: #dbeafe; color: #1e40af;}
    .footer {margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align:center;}
    a { color: #2563eb; text-decoration: underline;}
  </style>
</head>
<body>
  <h1>Location Tracker Report</h1>
  <div class="summary">
    <h2 style="margin-top: 0;">Report Summary</h2>
    <p><strong>User:</strong> ${userName}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Visits</div><div class="summary-value">${visits.length}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Completed</div><div class="summary-value">${visits.filter(v => v.checkOutTime).length}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Duration</div><div class="summary-value">${hours}h ${mins}m</div>
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>User</th>
        <th>Client</th>
        <th>Company</th>
        <th>Check-In Location</th>
        <th>Check-Out Location</th>
        <th>Duration</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${visits
        .map(
          visit => `
        <tr>
          <td>${new Date(visit.checkInTime).toLocaleDateString()}</td>
          <td>${visit.userName}</td>
          <td>${visit.clientName}</td>
          <td>${visit.companyName}</td>
          <td>${visit.checkInMapLink ? `<a href="${visit.checkInMapLink}" target="_blank">${visit.checkInAddress}</a>` : visit.checkInAddress || 'N/A'}</td>
          <td>${visit.checkOutMapLink ? `<a href="${visit.checkOutMapLink}" target="_blank">${visit.checkOutAddress ?? 'N/A'}</a>` : visit.checkOutAddress ?? 'N/A'}</td>
          <td>${formatDuration(visit)}</td>
          <td>
            <span class="status ${visit.checkOutTime ? 'status-completed' : 'status-active'}">
              ${visit.checkOutTime ? 'Completed' : 'In Progress'}
            </span>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>This report was generated by Location Tracker App</p>
    <p>Report contains ${visits.length} visit${visits.length !== 1 ? 's' : ''}</p>
  </div>
</body>
</html>`.trim();
  };

  // CSV Download logic
  const handleDownloadCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent = generateExcelCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `location-report-${userName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExporting(false);
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1000);
  };

  // Email "send" handler (opens default mail client for demo)
  const handleSendEmail = () => {
    if (!email.trim()) {
      alert('Please enter an email address to send the report to.');
      return;
    }
    setExporting(true);
    setTimeout(() => {
      const subject = `Location Tracker Report - ${userName}`;
      const body = encodeURIComponent(
        `Please find your location tracker report attached.\n\nReport Summary:\n- Total Visits: ${visits.length}\n- Completed: ${visits.filter(
          v => v.checkOutTime
        ).length}\n\nThis is a simulated email. In a production app, this would send via a backend service.`
      );

      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setExporting(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendEmail();
  };

  useEffect(() => {
    if (exportType === 'file' && !success) {
      handleDownloadCSV();
    }
    // eslint-disable-next-line
  }, [exportType]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-gray-900">
            {exportType === 'file' ? 'Download Report' : 'Email Report'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <p className="text-gray-900">
                {exportType === 'file'
                  ? 'Report downloaded successfully!'
                  : `Email sent successfully to ${email}!`}
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-gray-600 mb-2">Report Details</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">User:</span>{' '}
                    <span className="text-gray-900">{userName}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Total Visits:</span>{' '}
                    <span className="text-gray-900">{visits.length}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Date Range:</span>{' '}
                    <span className="text-gray-900">
                      {visits.length > 0
                        ? `${new Date(
                          Math.min(...visits.map(v =>
                            typeof v.checkInTime === 'string'
                              ? new Date(v.checkInTime.replace(' ', 'T')).getTime()
                              : v.checkInTime
                          ))
                        ).toLocaleDateString()} - ${new Date(
                          Math.max(...visits.map(v =>
                            typeof v.checkInTime === 'string'
                              ? new Date(v.checkInTime.replace(' ', 'T')).getTime()
                              : v.checkInTime
                          ))
                        ).toLocaleDateString()}`
                        : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
              {exportType === 'email' && (
                <div>
                  <label className="block text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email address to send report"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Report will be sent to this email address
                  </p>
                </div>
              )}
              <motion.button
                type={exportType === 'file' ? 'button' : 'submit'}
                onClick={exportType === 'file' ? handleDownloadCSV : undefined}
                disabled={exporting || (exportType === 'email' && !email.trim())}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : exportType === 'file' ? (
                  <>
                    <Download className="w-5 h-5" />
                    Download CSV Report
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Email Report
                  </>
                )}
              </motion.button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
