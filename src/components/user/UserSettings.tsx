import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone, Lock, CheckCircle, Eye, EyeOff, Mail
} from 'lucide-react';

const API_URL = 'http://10.41.149.42:5000';

interface UserSettingsProps {
  userName: string;
  userRole: 'user' | 'admin';
}

function getInitials(name: string) {
  return name ? name[0].toUpperCase() : '';
}

export function UserSettings({ userName, userRole }: UserSettingsProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reportingManagerEmail, setReportingManagerEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storedPassword, setStoredPassword] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, [userName, userRole]);

  // ✅ Load user settings from backend
  const loadUserSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const users = await response.json();
        const user = users.find((u: any) => u.name === userName && u.role === userRole);
        if (user) {
          setPhoneNumber(user.phoneNumber || '');
          setReportingManagerEmail(user.reportingManagerEmail || '');
          setStoredPassword(user.password || '');
        }
      } else {
        console.error('Failed to load user settings');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update user settings via backend API
  const updateUserSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          role: userRole,
          phoneNumber,
          reportingManagerEmail,
          password: storedPassword // Keep existing password
        })
      });

      if (response.ok) {
        alert('Settings updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update settings: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Change password via backend API
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    if (storedPassword && storedPassword !== currentPassword) {
      alert('Current password is incorrect');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          role: userRole,
          phoneNumber,
          reportingManagerEmail,
          password: newPassword
        })
      });

      if (response.ok) {
        setStoredPassword(newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
        alert('Password changed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to change password: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save phone/email settings (admin only)
  const handleSaveSettings = async () => {
    if (userRole !== 'admin') {
      alert('Only admins can update these settings');
      return;
    }
    await updateUserSettings();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-2 py-6">
      <div>
        <h2 className="text-gray-900 mb-2 text-xl font-semibold">Profile Settings</h2>
        <p className="text-gray-600 text-base">Manage your account information {loading && '(loading...)'}</p>
      </div>

      {/* Profile Avatar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6 mb-4">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto md:mx-0 select-none
              ${userRole === 'admin' ? 'bg-green-100' : 'bg-blue-100'}`}
            style={{ overflow: 'hidden' }}
          >
            <span className="text-4xl font-bold text-blue-700">
              {getInitials(userName)}
            </span>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4 text-center md:text-left">
            <h3 className="text-gray-900 text-lg font-semibold">{userName}</h3>
            <p className="text-sm text-gray-600 capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Phone, Reporting Email */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className={`w-6 h-6 ${userRole === 'admin' ? 'text-green-600' : 'text-blue-600'}`} />
          <h3 className="text-gray-900">Contact Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Registered Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              disabled={userRole !== 'admin'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                userRole === 'admin'
                  ? 'focus:ring-blue-500 focus:border-transparent'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            />
            <p className="text-sm text-gray-500 mt-2">
              Only admin can change the phone number.
            </p>
          </div>
          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Reporting Manager Email
            </label>
            <input
              type="email"
              value={reportingManagerEmail}
              onChange={e => setReportingManagerEmail(e.target.value)}
              placeholder="manager@email.com"
              disabled={userRole !== 'admin'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                userRole === 'admin'
                  ? 'focus:ring-green-500 focus:border-transparent'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            />
            <p className="text-sm text-gray-500 mt-2">
              {userRole === 'admin'
                ? 'Only admins can update the reporting manager email.'
                : 'Contact your admin to change this field.'}
            </p>
          </div>

          {/* Save Settings Button (Admin Only) */}
          {userRole === 'admin' && (
            <motion.button
              onClick={handleSaveSettings}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Contact Information'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className={`w-6 h-6 ${userRole === 'admin' ? 'text-green-600' : 'text-blue-600'}`} />
          <h3 className="text-gray-900">Change Password</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <motion.button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              currentPassword && newPassword && confirmPassword && !loading
                ? userRole === 'admin'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white`}
          >
            {passwordSaved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Password Changed
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {loading ? 'Changing...' : 'Change Password'}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
