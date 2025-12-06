import { useState, useEffect } from 'react';
import { Calendar, Mail, MapPin, Clock, Filter, Search } from 'lucide-react';
import type { Visit } from '../../App';

const API_URL = 'http://40.192.15.217:5000';

// Robust date/time conversion helper
function getDateNum(val: string | number | null | undefined) {
  if (typeof val === 'string') return new Date(val.replace(' ', 'T')).getTime();
  if (typeof val === 'number') return val;
  return 0;
}

// Duration string helper
function formatDuration(visit: Visit) {
  if (!visit.checkInTime || !visit.checkOutTime) return 'In Progress';
  const start = getDateNum(visit.checkInTime);
  const end = getDateNum(visit.checkOutTime);
  let minutes = Math.floor((end - start) / 60000);
  if (isNaN(minutes) || minutes < 0) minutes = 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function AdminReports() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => { loadVisits(); }, []);
  useEffect(() => { filterVisits(); }, [visits, fromDate, toDate, selectedUser, searchQuery]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/visits`);
      if (response.ok) setVisits(await response.json());
      else alert('Failed to load visits from database');
    } catch {
      alert('Cannot connect to backend. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced: If search contains "mismatch"/keywords, show only mismatches
  const filterVisits = () => {
    let filtered = visits;
    if (selectedUser !== 'all') filtered = filtered.filter(v => v.userName === selectedUser);
    if (fromDate) {
      const fromTs = new Date(fromDate).getTime();
      filtered = filtered.filter(v => getDateNum(v.checkInTime) >= fromTs);
    }
    if (toDate) {
      const toTs = new Date(toDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(v => getDateNum(v.checkInTime) <= toTs);
    }
    const query = searchQuery.trim().toLowerCase();
    const mismatchKeywords = ['mismatch', 'location mismatch', 'mismatched', 'wrong location'];
    if (query) {
      if (mismatchKeywords.some(kw => query.includes(kw))) {
        filtered = filtered.filter(v => v.locationMismatch);
      } else {
        filtered = filtered.filter(v =>
          (v.companyName && v.companyName.toLowerCase().includes(query)) ||
          (v.clientName && v.clientName.toLowerCase().includes(query)) ||
          (v.checkInAddress && v.checkInAddress.toLowerCase().includes(query)) ||
          (v.checkOutAddress && v.checkOutAddress.toLowerCase().includes(query)) ||
          (v.userName && v.userName.toLowerCase().includes(query))
        );
      }
    }
    setFilteredVisits(filtered);
  };

  // Date range bins
  const getDateRangeVisits = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const dow = now.getDay(), mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today); monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      today: filteredVisits.filter(v => getDateNum(v.checkInTime) >= today.getTime() && getDateNum(v.checkInTime) <= todayEnd.getTime()).length,
      thisWeek: filteredVisits.filter(v => getDateNum(v.checkInTime) >= monday.getTime() && getDateNum(v.checkInTime) <= sunday.getTime()).length,
      thisMonth: filteredVisits.filter(v => getDateNum(v.checkInTime) >= monthStart.getTime() && getDateNum(v.checkInTime) <= monthEnd.getTime()).length
    };
  };

  // Email Export (all visits including mismatches in filteredVisits)
  const handleExport = async () => {
    if (!email) return alert('Please enter an email address.');
    setSending(true);
    try {
      const resp = await fetch(`${API_URL}/api/send-report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visits: filteredVisits,
          fromDate,
          toDate,
          userName: selectedUser === 'all' ? 'All Users' : selectedUser,
          email
        }),
      });
      resp.ok ? alert('Admin report sent to email!') : alert(`Failed to send report: ${(await resp.json()).error || 'Unknown error'}`);
    } catch {
      alert('Failed to send report. Please check your network connection.');
    }
    setSending(false);
  };

  const uniqueUsers = Array.from(new Set(visits.map(v => v.userName)));
  const dateRangeVisits = getDateRangeVisits();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">All Reports</h2>
        <p className="text-gray-600">View and export all employee visit data</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-2" />
          Search by Company, Client, Location, User or "mismatch"
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder='Search companies, clients, places, users or type "mismatch"'
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Filter Reports</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">User</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Today's Visits</p>
            <p className="text-green-900">{dateRangeVisits.today}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">This Week</p>
            <p className="text-blue-900">{dateRangeVisits.thisWeek}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">This Month</p>
            <p className="text-purple-900">{dateRangeVisits.thisMonth}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 mb-1">Completed</p>
            <p className="text-orange-900">{filteredVisits.filter(v => v.checkOutTime).length}</p>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={filteredVisits.length === 0 || sending}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
                  className={`p-4 border-2 rounded-lg hover:border-green-300 transition-colors ${visit.locationMismatch ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">{visit.userName}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-gray-700">{visit.clientName}</p>
                      </div>
                      <p className="text-sm text-gray-600">{visit.companyName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm ${visit.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
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
                      <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Check-in Location</p>
                        <p className="text-gray-600">{visit.checkInAddress}</p>
                        {visit.checkInMapLink && (
                          <a
                            href={visit.checkInMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View on map →
                          </a>
                        )}
                      </div>
                    </div>
                    {visit.checkOutAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${visit.locationMismatch ? 'text-red-500' : 'text-purple-500'}`} />
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
                              className="text-blue-600 hover:underline text-xs"
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
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
