import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Shield, MapPin, Eye, EyeOff, Smartphone } from 'lucide-react';

interface LoginPageProps {
  onLogin: (name: string, role: 'user' | 'admin') => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | null>(null);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMode === 'password') {
      if (name.trim() && password && selectedRole) {
        // In a real app, verify password against stored credentials
        const storedUsers = JSON.parse(localStorage.getItem('locationTrackerUsers') || '{}');
        const userKey = `${name.trim()}-${selectedRole}`;
        
        if (storedUsers[userKey] && storedUsers[userKey].password === password) {
          onLogin(name.trim(), selectedRole);
        } else if (!storedUsers[userKey]) {
          // First time user - create account
          storedUsers[userKey] = { password, phoneNumber: '' };
          localStorage.setItem('locationTrackerUsers', JSON.stringify(storedUsers));
          onLogin(name.trim(), selectedRole);
        } else {
          alert('Incorrect password');
        }
      }
    } else {
      // OTP login
      if (otpSent && otp === generatedOtp) {
        onLogin(name.trim(), selectedRole!);
      } else if (!otpSent) {
        alert('Please request OTP first');
      } else {
        alert('Incorrect OTP');
      }
    }
  };

  const handleSendOtp = () => {
    if (!name.trim() || !selectedRole || !phoneNumber) {
      alert('Please enter your name, select role, and enter phone number');
      return;
    }

    // Check if user exists and has registered phone number
    const storedUsers = JSON.parse(localStorage.getItem('locationTrackerUsers') || '{}');
    const userKey = `${name.trim()}-${selectedRole}`;
    
    if (storedUsers[userKey] && storedUsers[userKey].phoneNumber) {
      if (storedUsers[userKey].phoneNumber !== phoneNumber) {
        alert('Phone number does not match registered number');
        return;
      }
    }

    // Generate 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    
    // In a real app, send OTP via SMS service
    alert(`OTP sent to ${phoneNumber}: ${newOtp}\n\n(In production, this would be sent via SMS)`);
  };

  const handleForgotPassword = () => {
    if (!name.trim() || !selectedRole) {
      alert('Please enter your name and select role first');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('locationTrackerUsers') || '{}');
    const userKey = `${name.trim()}-${selectedRole}`;
    
    if (!storedUsers[userKey] || !storedUsers[userKey].phoneNumber) {
      alert('No account found. Please create an account by logging in.');
      return;
    }

    // Generate reset OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`Password reset OTP sent to ${storedUsers[userKey].phoneNumber}: ${resetOtp}\n\nEnter this OTP and create a new password.\n\n(In production, this would be sent via SMS)`);
    
    const newPassword = prompt('Enter new password:');
    const enteredOtp = prompt('Enter OTP:');
    
    if (enteredOtp === resetOtp && newPassword) {
      storedUsers[userKey].password = newPassword;
      localStorage.setItem('locationTrackerUsers', JSON.stringify(storedUsers));
      alert('Password reset successfully!');
    } else {
      alert('Password reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4"
          >
            <MapPin className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-gray-900 mb-2">Location Tracker</h1>
          <p className="text-gray-600">Track your visits and locations</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Login Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setOtpSent(false);
                setOtp('');
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                loginMode === 'password'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setPassword('');
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                loginMode === 'otp'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600'
              }`}
            >
              OTP
            </button>
          </div>

          <div>
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Enter Your Credentials
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {loginMode === 'password' ? (
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                Forgot Password?
              </button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-2">
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {!otpSent && selectedRole && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Send OTP
                </button>
              )}
            </>
          )}

          <div>
            <label className="block text-gray-700 mb-3">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setSelectedRole('user')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedRole === 'user'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedRole === 'user' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    <User className={`w-6 h-6 ${
                      selectedRole === 'user' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className={selectedRole === 'user' ? 'text-blue-700' : 'text-gray-700'}>
                    User
                  </span>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setSelectedRole('admin')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedRole === 'admin'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedRole === 'admin' ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      selectedRole === 'admin' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className={selectedRole === 'admin' ? 'text-green-700' : 'text-gray-700'}>
                    Admin
                  </span>
                </div>
              </motion.button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={
              !name.trim() || !selectedRole || 
              (loginMode === 'password' && !password) ||
              (loginMode === 'otp' && (!otpSent || !otp))
            }
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full py-4 rounded-lg transition-all ${
              name.trim() && selectedRole && 
              ((loginMode === 'password' && password) || (loginMode === 'otp' && otpSent && otp))
                ? selectedRole === 'admin'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Login
          </motion.button>

          <p className="text-sm text-gray-500 text-center">
            {loginMode === 'password' 
              ? 'First time users will be registered automatically'
              : 'OTP will be sent to your registered phone number'
            }
          </p>
        </form>
      </motion.div>
    </div>
  );
}
