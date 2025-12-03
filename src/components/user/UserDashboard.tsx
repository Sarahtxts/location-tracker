import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Clock, AlertTriangle, Bell } from 'lucide-react';
import type { Visit } from '../../App';

const API_URL = 'http://10.41.149.42:5000';

interface UserDashboardProps {
  userName: string;
}

function getDateNum(val: string | number | null | undefined): number {
  if (typeof val === 'string') return new Date(val.replace(' ', 'T')).getTime();
  if (typeof val === 'number') return val;
  return 0;
}
function getVisitDuration(visit: Visit) {
  if (!visit.checkInTime || !visit.checkOutTime) return 'In Progress';
  const start = getDateNum(visit.checkInTime);
  const end = getDateNum(visit.checkOutTime);
  let minutes = Math.floor((end - start) / 60000);
  if (isNaN(minutes) || minutes < 0) minutes = 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

export function UserDashboard({ userName }: UserDashboardProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(60); // fallback: 1 hour (60m)

  useEffect(() => {
    loadVisits();
    loadReminderSetting();
    const interval = setInterval(loadVisits, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userName]);

  // Load visits from backend
  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/visits?userName=${userName}`);
      if (response.ok) {
        const allVisits: Visit[] = await response.json();
        setVisits(allVisits);
        const active = allVisits.find(v => !v.checkOutTime);
        setActiveVisit(active || null);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notification reminder minutes dynamically from backend
  const loadReminderSetting = async () => {
    try {
      const reminderRes = await fetch(`${API_URL}/api/settings/checkoutReminderHours`);
      const reminderData = await reminderRes.json();
      if (reminderData.value) setReminderMinutes(parseInt(reminderData.value));
    } catch {
      setReminderMinutes(60);
    }
  };

  // Check if active visit is overdue
  const nowTs = Date.now();
  const isOverdue =
    activeVisit &&
    nowTs - getDateNum(activeVisit.checkInTime) > reminderMinutes * 60 * 1000;
  const activeElapsedMins = activeVisit
    ? Math.floor((nowTs - getDateNum(activeVisit.checkInTime)) / 60000)
    : 0;
  const elapsedHours = Math.floor(activeElapsedMins / 60);
  const elapsedMins = activeElapsedMins % 60;

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
      today: visits.filter(v =>
        getDateNum(v.checkInTime) >= today.getTime() && getDateNum(v.checkInTime) <= todayEnd.getTime()
      ).length,
      thisWeek: visits.filter(v =>
        getDateNum(v.checkInTime) >= monday.getTime() && getDateNum(v.checkInTime) <= sunday.getTime()
      ).length,
      thisMonth: visits.filter(v =>
        getDateNum(v.checkInTime) >= monthStart.getTime() && getDateNum(v.checkInTime) <= monthEnd.getTime()
      ).length
    };
  };

  const dateRangeVisits = getDateRangeVisits();
  const mismatchVisits = visits.filter(v => v.locationMismatch);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Welcome back, {userName}!</h2>
        <p className="text-gray-600">Here's your activity overview {loading && '(updating...)'}</p>
      </div>

      {/* Overdue Checkout Reminder */}
      {isOverdue && activeVisit && (
        <div className="bg-orange-100 border-l-4 border-orange-400 rounded-xl p-4 mb-4 flex items-start gap-4">
          <Bell className="w-6 h-6 text-orange-700 mt-1" />
          <div>
            <p className="font-semibold text-orange-700">
              Reminder: You haven't checked out for more than {formatDuration(reminderMinutes)}!
            </p>
            <p className="text-sm text-orange-900 mt-1">
              <strong>{activeVisit.clientName}</strong> ({activeVisit.companyName})<br />
              Checked in at: {new Date(getDateNum(activeVisit.checkInTime)).toLocaleString()}<br />
              <span className="italic">Elapsed: {elapsedHours}h {elapsedMins}m</span>
            </p>
            <p className="text-sm text-orange-800 mt-2">
              Please remember to check out when you complete your visit.
            </p>
          </div>
        </div>
      )}

      {/* Visits Stats */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Visits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500"
          >
            <p className="text-sm text-blue-700 mb-1">Today</p>
            <p className="text-blue-900">{dateRangeVisits.today}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-purple-50 rounded-xl border-l-4 border-purple-500"
          >
            <p className="text-sm text-purple-700 mb-1">This Week</p>
            <p className="text-purple-900">{dateRangeVisits.thisWeek}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-pink-50 rounded-xl border-l-4 border-pink-500"
          >
            <p className="text-sm text-pink-700 mb-1">This Month</p>
            <p className="text-pink-900">{dateRangeVisits.thisMonth}</p>
          </motion.div>
        </div>
      </div>

      {/* Active Visit Card */}
      {activeVisit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6 cursor-pointer transition-colors"
          style={{
            background: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(147, 51, 234))',
            color: 'white'
          }}
          onClick={() => setSelectedVisit(activeVisit)}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <h3 style={{ color: 'white', fontWeight: '600' }}>Active Visit in Progress</h3>
          </div>
          <div className="space-y-2" style={{ color: 'white' }}>
            <p><span style={{ opacity: 0.8 }}>Client:</span> {activeVisit.clientName}</p>
            <p><span style={{ opacity: 0.8 }}>Company:</span> {activeVisit.companyName}</p>
            <p><span style={{ opacity: 0.8 }}>Location:</span> {activeVisit.checkInAddress}</p>
            <p>
              <span style={{ opacity: 0.8 }}>Started:</span>{' '}
              {new Date(getDateNum(activeVisit.checkInTime)).toLocaleString()}
            </p>
          </div>
        </motion.div>
      )}

      {/* Location Mismatches */}
      {mismatchVisits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-6"
          style={{
            background: 'linear-gradient(to bottom right, rgb(220, 38, 38), rgb(185, 28, 28))',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6" style={{ color: 'white' }} />
            <h3 style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>
              Location Mismatches: {mismatchVisits.length}
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
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')
                }
                onClick={() => setSelectedVisit(visit)}
              >
                <div className="mb-2">
                  <p style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                    {visit.clientName}
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
                  {new Date(getDateNum(visit.checkInTime)).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Visits */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Recent Visits</h3>
        {visits.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No visits yet. Check in to start tracking!
          </p>
        ) : (
          <div className="space-y-3">
            {visits
              .slice(-5)
              .reverse()
              .map(visit => (
                <div
                  key={visit.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <div className="flex-1">
                    <p className="text-gray-900">{visit.clientName}</p>
                    <p className="text-sm text-gray-600">{visit.companyName}</p>
                    <p className="text-sm text-gray-500 mt-1">{visit.checkInAddress}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{new Date(getDateNum(visit.checkInTime)).toLocaleDateString()}</p>
                    {visit.checkOutTime && (
                      <p className="text-purple-600">{getVisitDuration(visit)}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVisit(null)}
          style={{ overflowY: 'auto' }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-gray-900 text-lg font-semibold">Visit Details</h3>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Client Name</p>
                  <p className="text-gray-900 text-sm font-medium">{selectedVisit.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-gray-900 text-sm font-medium">{selectedVisit.companyName}</p>
                </div>
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
                    <MapPin
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        selectedVisit.locationMismatch ? 'text-red-500' : 'text-purple-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Check-out Location</p>
                      <p
                        className={`text-sm ${
                          selectedVisit.locationMismatch ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {selectedVisit.checkOutAddress}
                      </p>
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
                      {selectedVisit.locationMismatch && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠ Location mismatch detected
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Check-in Time</p>
                    <p className="text-gray-900 text-sm">
                      {new Date(getDateNum(selectedVisit.checkInTime)).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedVisit.checkOutTime && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Check-out Time</p>
                        <p className="text-gray-900 text-sm">
                          {new Date(getDateNum(selectedVisit.checkOutTime)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg text-purple-600 font-semibold">
                        {getVisitDuration(selectedVisit)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center pt-2">
                <div
                  className={`px-4 py-2 rounded-full ${
                    selectedVisit.checkOutTime
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedVisit.checkOutTime ? 'Completed' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
