import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, X, MapPin, Clock } from 'lucide-react';
import type { Visit } from '../../App';

const API_URL = 'http://localhost:5000';

// Robust duration function
function formatDuration(visit: Visit) {
  if (!visit.checkInTime || !visit.checkOutTime) return 'In Progress';
  const start = typeof visit.checkInTime === 'string'
    ? new Date(visit.checkInTime.replace(' ', 'T'))
    : new Date(visit.checkInTime);
  const end = typeof visit.checkOutTime === 'string'
    ? new Date(visit.checkOutTime.replace(' ', 'T'))
    : new Date(visit.checkOutTime);
  let minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  if (isNaN(minutes) || minutes < 0) minutes = 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function AdminDashboard() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/visits`);
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      } else {
        console.error('Failed to load visits from backend');
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    activeVisits: visits.filter(v => !v.checkOutTime).length,
    locationMismatches: visits.filter(v => v.locationMismatch).length,
  };

  const recentActivity = visits.slice().sort((a, b) =>
    (new Date(b.checkInTime).getTime()) - (new Date(a.checkInTime).getTime())
  ).slice(0, 10);

  const mismatchVisits = visits.filter(v => v.locationMismatch);

  const getDateNum = (v: Visit, field: keyof Visit) => {
    const val = v[field];
    if (typeof val === 'string') return new Date(val.replace(' ', 'T')).getTime();
    if (typeof val === 'number') return val;
    return 0;
  };
  const getDateRangeVisits = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      today: visits.filter(v =>
        getDateNum(v, 'checkInTime') >= today.getTime() && getDateNum(v, 'checkInTime') <= todayEnd.getTime()
      ).length,
      thisWeek: visits.filter(v =>
        getDateNum(v, 'checkInTime') >= monday.getTime() && getDateNum(v, 'checkInTime') <= sunday.getTime()
      ).length,
      thisMonth: visits.filter(v =>
        getDateNum(v, 'checkInTime') >= monthStart.getTime() && getDateNum(v, 'checkInTime') <= monthEnd.getTime()
      ).length,
    };
  };
  const dateRangeVisits = getDateRangeVisits();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">Overview of all user activities {loading && '(updating...)'}</p>
      </div>

      {/* Active Visits */}
      {stats.activeVisits > 0 && (
        <div
          className="rounded-xl shadow-lg p-6"
          style={{
            background: 'linear-gradient(to bottom right, rgb(5, 150, 105), rgb(4, 120, 87))',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6" style={{ color: 'white' }} />
            <h3 style={{ color: 'white', fontWeight: '600' }}>Active Visits: {stats.activeVisits}</h3>
          </div>
          <div className="space-y-3">
            {visits.filter(v => !v.checkOutTime).map(visit => (
              <div
                key={visit.id}
                className="rounded-lg p-4 cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onClick={() => setSelectedVisit(visit)}
              >
                <p className="mb-1" style={{ fontWeight: '600', color: 'white' }}>{visit.userName} at {visit.clientName}</p>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{visit.companyName}</p>
                <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{visit.checkInAddress}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Mismatches */}
      {mismatchVisits.length > 0 && (
        <div
          className="rounded-xl shadow-lg p-6"
          style={{
            background: 'linear-gradient(to bottom right, rgb(220, 38, 38), rgb(185, 28, 28))',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6" style={{ color: 'white' }} />
            <h3 style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>
              Location Mismatches Detected: {mismatchVisits.length}
            </h3>
          </div>
          <div className="space-y-3">
            {mismatchVisits.map(visit => (
              <div
                key={visit.id}
                className="rounded-lg p-4 cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onClick={() => setSelectedVisit(visit)}
              >
                <div className="mb-2">
                  <p style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                    {visit.userName} • {visit.clientName}
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                    {visit.companyName}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5" style={{ fontSize: '12px' }}>
                  <div className="flex items-start gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="break-words">Check-in: {visit.checkInAddress}</span>
                  </div>
                  <div className="flex items-start gap-2" style={{ color: 'rgb(254, 202, 202)' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="break-words">Check-out: {visit.checkOutAddress}</span>
                  </div>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '8px' }}>
                  {new Date(visit.checkInTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits Stats */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Visits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-green-50 rounded-xl border-l-4 border-green-600">
            <p className="text-sm text-green-700 mb-1">Today</p>
            <p className="text-green-900">{dateRangeVisits.today}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-blue-50 rounded-xl border-l-4 border-blue-600">
            <p className="text-sm text-blue-700 mb-1">This Week</p>
            <p className="text-blue-900">{dateRangeVisits.thisWeek}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 bg-purple-50 rounded-xl border-l-4 border-purple-600">
            <p className="text-sm text-purple-700 mb-1">This Month</p>
            <p className="text-purple-900">{dateRangeVisits.thisMonth}</p>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity with duration column */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((visit) => (
              <div key={visit.id} className={`flex items-start justify-between p-4 rounded-lg transition-colors cursor-pointer ${visit.locationMismatch ? 'bg-red-50 border-2 border-red-200 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => setSelectedVisit(visit)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">{visit.userName}</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-700">{visit.clientName}</p>
                    {visit.locationMismatch && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">⚠ Location Mismatch</span>}
                  </div>
                  <p className="text-sm text-gray-600">{visit.companyName}</p>
                  <p className="text-sm text-gray-500 mt-1">{visit.checkInAddress}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">{new Date(visit.checkInTime).toLocaleDateString()}</p>
                  <p className="text-gray-500">{new Date(visit.checkInTime).toLocaleTimeString()}</p>
                  <p className="text-purple-600 font-semibold mt-1">{formatDuration(visit)}</p>
                  {visit.checkOutTime ? (
                    <p className="text-green-600 mt-1">Completed</p>
                  ) : (
                    <div className="flex items-center gap-1 text-blue-600 mt-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">User Summary</h3>
        <div className="space-y-3">
          {Array.from(new Set(visits.map(v => v.userName))).map(userName => {
            const userVisits = visits.filter(v => v.userName === userName);
            const completedVisits = userVisits.filter(v => v.checkOutTime);
            const totalDuration = completedVisits.reduce((sum, v) => {
              const start = typeof v.checkInTime === 'string'
                ? new Date(v.checkInTime.replace(' ', 'T'))
                : new Date(v.checkInTime);
              const end = typeof v.checkOutTime === 'string'
                ? new Date(v.checkOutTime.replace(' ', 'T'))
                : new Date(v.checkOutTime as number);
              let min = Math.floor((end.getTime() - start.getTime()) / 60000);
              if (isNaN(min) || min < 0) min = 0;
              return sum + min;
            }, 0);
            const hours = Math.floor(totalDuration / 60);
            const mins = totalDuration % 60;
            return (
              <div
                key={userName}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={() => setSelectedUser(userName)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-900 font-medium">{userName}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">{userVisits.length} visits</span>
                    <span className="text-purple-600">{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}</span>
                  </div>
                </div>
                {userVisits.find(v => !v.checkOutTime) && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" /><span>Currently active</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVisit(null)} style={{ overflowY: 'auto' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-gray-900 text-lg font-semibold">Visit Details</h3>
              <button onClick={() => setSelectedVisit(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Employee</p><p className="text-gray-900 text-sm font-medium">{selectedVisit.userName}</p></div>
                <div><p className="text-sm text-gray-500">Client Name</p><p className="text-gray-900 text-sm font-medium">{selectedVisit.clientName}</p></div>
                <div className="col-span-2"><p className="text-sm text-gray-500">Company</p><p className="text-gray-900 text-sm font-medium">{selectedVisit.companyName}</p></div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Check-in Location</p>
                    <p className="text-gray-900 text-sm">{selectedVisit.checkInAddress}</p>
                    {selectedVisit.checkInMapLink && (
                      <a
                        href={selectedVisit.checkInMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                      >
                        View on map →
                      </a>
                    )}
                  </div>
                </div>
                {selectedVisit.checkOutAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedVisit.locationMismatch ? 'text-red-500' : 'text-purple-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Check-out Location</p>
                      <p className={`text-sm ${selectedVisit.locationMismatch ? 'text-red-600' : 'text-gray-900'}`}>{selectedVisit.checkOutAddress}</p>
                      {selectedVisit.checkOutMapLink && (
                        <a
                          href={selectedVisit.checkOutMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                        >
                          View on map →
                        </a>
                      )}
                      {selectedVisit.locationMismatch && <p className="text-sm text-red-600 mt-1">⚠ Location mismatch detected</p>}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1"><p className="text-sm text-gray-500">Check-in Time</p><p className="text-gray-900 text-sm">{new Date(selectedVisit.checkInTime).toLocaleString()}</p></div>
                </div>
                {selectedVisit.checkOutTime && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div className="flex-1"><p className="text-sm text-gray-500">Check-out Time</p><p className="text-gray-900 text-sm">{new Date(selectedVisit.checkOutTime).toLocaleString()}</p></div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg text-purple-600 font-semibold">{formatDuration(selectedVisit)}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center pt-2">
                <div className={`px-4 py-2 rounded-full ${selectedVisit.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{selectedVisit.checkOutTime ? 'Completed' : 'In Progress'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Visits Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-2 sm:p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', minHeight: 0, display: 'block' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 text-lg font-semibold">{selectedUser}'s Visits</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-3" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {visits
                .filter(v => v.userName === selectedUser)
                .sort((a, b) => getDateNum(b, 'checkInTime') - getDateNum(a, 'checkInTime'))
                .map((visit) => (
                  <div
                    key={visit.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all shadow-sm ${visit.locationMismatch ? 'bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:shadow-md' : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md'}`}
                    onClick={() => { setSelectedUser(null); setSelectedVisit(visit); }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">{visit.clientName}</h4>
                        <p className="text-sm text-gray-600">{visit.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {visit.locationMismatch && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-red-500 text-white rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Mismatch
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          visit.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {visit.checkOutTime ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Check-in</p>
                          <p className="text-sm text-gray-700">{visit.checkInAddress}</p>
                        </div>
                      </div>
                      {visit.checkOutAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${visit.locationMismatch ? 'text-red-500' : 'text-purple-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Check-out</p>
                            <p className={`text-sm ${visit.locationMismatch ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                              {visit.checkOutAddress}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">
                          {new Date(visit.checkInTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} • {new Date(visit.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      < span className="text-sm font-semibold text-purple-600">
                        {formatDuration(visit)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
