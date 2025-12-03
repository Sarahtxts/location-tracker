import { useState, useEffect } from 'react';
import { Calendar, Mail, MapPin, Clock, Search } from 'lucide-react';
import { ExportDialog } from '../shared/ExportDialog';
import type { Visit } from '../../App';

const API_URL = 'http://10.41.149.42:5000';

interface UserReportsProps {
  userName: string;
  userRole?: 'user' | 'admin';
}

// Robust date/time helper
function getDateNum(val: string | number | null | undefined) {
  if (typeof val === 'string') return new Date(val.replace(' ', 'T')).getTime();
  if (typeof val === 'number') return val;
  return 0;
}

function formatDuration(visit: Visit) {
  if (!visit.checkOutTime) return 'In Progress';
  const start = getDateNum(visit.checkInTime);
  const end = getDateNum(visit.checkOutTime);
  let minutes = Math.floor((end - start) / 60000);
  if (isNaN(minutes) || minutes < 0) minutes = 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function UserReports({ userName, userRole = 'user' }: UserReportsProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadVisits(); }, [userName]);
  useEffect(() => { filterVisits(); }, [visits, fromDate, toDate, searchQuery]);

  // Load visits from backend
  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/visits?userName=${userName}`);
      if (response.ok) {
        const allVisits: Visit[] = await response.json();
        setVisits(allVisits);
      } else {
        console.error('Failed to load visits from backend');
        alert('Failed to load visits from database');
      }
    } catch (error) {
      console.error('Error loading visits:', error);
      alert('Cannot connect to backend. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filtering: convert all checkInTime comparisons to numbers!
  const filterVisits = () => {
    let filtered = visits;
    if (fromDate) {
      const fromTimestamp = new Date(fromDate).getTime();
      filtered = filtered.filter(v => getDateNum(v.checkInTime) >= fromTimestamp);
    }
    if (toDate) {
      const toTimestamp = new Date(toDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(v => getDateNum(v.checkInTime) <= toTimestamp);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        v =>
          (v.companyName && v.companyName.toLowerCase().includes(query)) ||
          (v.clientName && v.clientName.toLowerCase().includes(query)) ||
          (v.checkInAddress && v.checkInAddress.toLowerCase().includes(query)) ||
          (v.checkOutAddress && v.checkOutAddress.toLowerCase().includes(query)) ||
          (v.userName && v.userName.toLowerCase().includes(query)) ||
          ((v.locationMismatch === true) &&
            ['mismatch', 'location mismatch', 'mismatched', 'wrong location']
              .some(kw => query.includes(kw)))
      );
    }
    setFilteredVisits(filtered);
  };

  const getDateRangeVisits = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const dayOfWeek = now.getDay(), mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today); monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      today: filteredVisits.filter(
        v => getDateNum(v.checkInTime) >= today.getTime() && getDateNum(v.checkInTime) <= todayEnd.getTime()
      ).length,
      thisWeek: filteredVisits.filter(
        v => getDateNum(v.checkInTime) >= monday.getTime() && getDateNum(v.checkInTime) <= sunday.getTime()
      ).length,
      thisMonth: filteredVisits.filter(
        v => getDateNum(v.checkInTime) >= monthStart.getTime() && getDateNum(v.checkInTime) <= monthEnd.getTime()
      ).length
    };
  };

  // Send report via backend API
  const sendReportToEmail = async () => {
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visits: filteredVisits,
          fromDate,
          toDate,
          userName,
          userRole
        }),
      });

      if (response.ok) {
        alert("Report sent to your reporting manager's email!");
      } else {
        const error = await response.json();
        alert(`Failed to send report: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending report:', err);
      alert("Could not send report. Please check your network connection.");
    }
    setSending(false);
  };

  const handleExport = () => setShowExportDialog(true);
  const dateRangeVisits = getDateRangeVisits();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">My Reports</h2>
        <p className="text-gray-600">View and export your visit history {loading && '(loading...)'}</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-2" />
          Search by Company, Client, Location or User
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search companies, clients, places or users"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-gray-900">Filter Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">Today's Visits</p>
            <p className="text-blue-900">{dateRangeVisits.today}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">This Week</p>
            <p className="text-purple-900">{dateRangeVisits.thisWeek}</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-pink-600 mb-1">This Month</p>
            <p className="text-pink-900">{dateRangeVisits.thisMonth}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 mb-1">Completed</p>
            <p className="text-indigo-900">{filteredVisits.filter(v => v.checkOutTime).length}</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={sendReportToEmail}
            disabled={filteredVisits.length === 0 || sending}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {sending ? 'Sending...' : 'Send Report to Email'}
          </button>
        </div>
      </div>

      {/* Visits List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Visit History</h3>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading visits...</p>
        ) : filteredVisits.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No visits found for the selected filters</p>
        ) : (
          <div className="space-y-3">
            {filteredVisits
              .sort((a, b) => getDateNum(b.checkInTime) - getDateNum(a.checkInTime))
              .map((visit) => (
                <div
                  key={visit.id}
                  className={`p-4 border-2 rounded-lg hover:border-blue-300 transition-colors ${
                    visit.locationMismatch
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{visit.clientName}</p>
                      <p className="text-sm text-gray-600">{visit.companyName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        visit.checkOutTime
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {visit.checkOutTime ? 'Completed' : 'In Progress'}
                      </div>
                      {visit.locationMismatch && (
                        <div className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                          ⚠ Location Mismatch
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Check-in Location</p>
                        <p className="text-gray-600">{visit.checkInAddress}</p>
                        {visit.checkInMapLink && (
                          <a 
                            href={visit.checkInMapLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                          >
                            View on map →
                          </a>
                        )}
                      </div>
                    </div>
                    {visit.checkOutAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          visit.locationMismatch ? 'text-red-500' : 'text-purple-500'
                        }`} />
                        <div>
                          <p className="text-gray-500">Check-out Location</p>
                          <p className={visit.locationMismatch ? 'text-red-600' : 'text-gray-600'}>
                            {visit.checkOutAddress}
                          </p>
                          {visit.checkOutMapLink && (
                            <a 
                              href={visit.checkOutMapLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                            >
                              View on map →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-600">
                        {new Date(getDateNum(visit.checkInTime)).toLocaleString()}
                        {visit.checkOutTime && ` - ${new Date(getDateNum(visit.checkOutTime)).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="text-gray-600">Duration</p>
                      <p className="text-purple-600">{formatDuration(visit)}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          visits={filteredVisits}
          userName={userName}
          exportType="email"
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
