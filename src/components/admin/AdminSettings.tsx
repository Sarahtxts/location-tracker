import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, MapPin, Save, CheckCircle, Clock, Bell } from 'lucide-react';
import { DemoDataLoader } from './DemoDataLoader';

const API_URL = 'http://10.41.149.42:5000';

const PRESET_HOUR_MINUTES = [60, 120, 180, 240, 300];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

export function AdminSettings() {
  const [distanceThreshold, setDistanceThreshold] = useState(500);
  const [checkoutReminderMinutes, setCheckoutReminderMinutes] = useState(60);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState<number>(60);
  const [saved, setSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const distanceRes = await fetch(`${API_URL}/api/settings/distanceThreshold`);
      const distanceData = await distanceRes.json();
      if (distanceData.value) setDistanceThreshold(parseInt(distanceData.value));

      const reminderRes = await fetch(`${API_URL}/api/settings/checkoutReminderHours`);
      const reminderData = await reminderRes.json();
      let minValue = parseInt(reminderData.value);
      if (minValue <= 24) minValue *= 60; // legacy support
      setCheckoutReminderMinutes(minValue);
      setCustomMode(!PRESET_HOUR_MINUTES.includes(minValue));
      setCustomValue(minValue);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setCustomMode(true);
    } else {
      const minutes = parseInt(value);
      setCheckoutReminderMinutes(minutes);
      setCustomMode(false);
      setCustomValue(minutes);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let mins = Math.max(1, Math.min(720, parseInt(e.target.value) || 1)); // 1 min to 12 hours
    setCustomValue(mins);
    setCheckoutReminderMinutes(mins);
  };

  const handleSave = async () => {
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'distanceThreshold', value: distanceThreshold.toString() })
      });

      await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'checkoutReminderHours', value: checkoutReminderMinutes.toString() })
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleDataLoaded = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-2 py-4">
      <div>
        <h2 className="text-gray-900 mb-2 text-xl font-semibold">Settings</h2>
        <p className="text-gray-600 mb-2 text-sm">Configure location tracking parameters</p>
      </div>

      {/* Demo Data Panel */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <DemoDataLoader onDataLoaded={handleDataLoaded} />
      </div>

      {/* Location Settings */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-green-600" />
          <h3 className="text-gray-900 text-lg">Location Validation</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 text-sm">
              <MapPin className="w-4 h-4 inline mr-2" />
              Maximum Check-Out Distance (meters)
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Set the acceptable distance between check-in and check-out locations.<br />
              If an employee checks out beyond this distance, it will be flagged.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="number"
                value={distanceThreshold}
                onChange={e => setDistanceThreshold(parseInt(e.target.value) || 0)}
                min="0"
                step="50"
                className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
              <span className="text-gray-700 text-sm sm:ml-2">meters</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Current: {distanceThreshold}m&nbsp;({(distanceThreshold / 1000).toFixed(2)}km)
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <h4 className="text-blue-900 mb-2 text-base">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• When an employee checks in, their location is recorded</li>
              <li>• When they check out, their location is recorded again</li>
              <li>• If the check-out location is more than {distanceThreshold}m away, it will be flagged</li>
              <li>• This helps ensure employees are checking out from the same client location</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Checkout Reminder Settings */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-orange-600" />
          <h3 className="text-gray-900 text-lg">Checkout Reminders</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 text-sm">
              <Clock className="w-4 h-4 inline mr-2" />
              Send Notification After
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Notify users if they haven't checked out within this amount of time after check-in.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={customMode ? "custom" : checkoutReminderMinutes}
                onChange={handleReminderChange}
                className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
              >
                {PRESET_HOUR_MINUTES.map(m => (
                  <option key={m} value={m}>{formatDuration(m)}</option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {customMode && (
                <input
                  type="number"
                  min={1}
                  max={720}
                  step={1}
                  value={customValue}
                  onChange={handleCustomInput}
                  className="w-28 px-4 py-3 border border-orange-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="Minutes"
                />
              )}
              <span className="text-gray-700 text-sm sm:ml-2">
                {formatDuration(checkoutReminderMinutes)}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Current: {formatDuration(checkoutReminderMinutes)}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
            <h4 className="text-orange-900 mb-2 text-base">How it works</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• System monitors all active check-ins</li>
              <li>• If a user hasn't checked out after {formatDuration(checkoutReminderMinutes)}, they'll receive a notification</li>
              <li>• Helps remind users to complete their visit tracking</li>
              <li>• Improves data accuracy and reporting</li>
            </ul>
          </div>
        </div>
      </div>

      <motion.button
        onClick={handleSave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99}}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Saved Successfully
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save All Settings
          </>
        )}
      </motion.button>

      {/* Quick Presets - Distance */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <h3 className="text-gray-900 mb-4 text-base">Quick Presets (Distance)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[100, 250, 500, 1000].map(preset => (
            <button
              key={preset}
              onClick={() => setDistanceThreshold(preset)}
              className={`py-3 px-4 rounded-lg border-2 transition-colors text-sm ${
                distanceThreshold === preset
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              {preset}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
