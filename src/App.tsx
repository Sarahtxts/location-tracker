import { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { UserDashboard } from './components/user/UserDashboard';
import { UserCheckIn } from './components/user/UserCheckIn';
import { UserReports } from './components/user/UserReports';
import { UserSettings } from './components/user/UserSettings';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReports } from './components/admin/AdminReports';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminSettings } from './components/admin/AdminSettings';
import { LocationPermission } from './components/shared/LocationPermission';
import { LogOut, User, FileText, MapPin, Settings, Users } from 'lucide-react';

// Visit structure is compatible with Google Maps reporting
export interface Visit {
  id: string | number;
  userId?: string;
  userName: string;
  clientName: string;
  companyName: string;
  checkInTime: string | number;
  checkOutTime?: string | number | null;
  checkInAddress: string;
  checkInMapLink?: string | null;
  checkOutAddress?: string | null;
  checkOutMapLink?: string | null;
  latitude?: number;
  longitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  locationMismatch?: boolean | number;
}

export interface UserSession {
  name: string;
  role: 'user' | 'admin';
}

type UserView = 'dashboard' | 'checkin' | 'reports' | 'settings';
type AdminView = 'dashboard' | 'reports' | 'users' | 'settings';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [userView, setUserView] = useState<UserView>('dashboard');
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    // Load session from localStorage
    const savedSession = localStorage.getItem('locationTrackerSession');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
    // Check location permission
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    // Automatically grant permission with default location
    setHasLocationPermission(true);
    setShowPermissionDialog(false);
  };

  const handleLogin = (name: string, role: 'user' | 'admin') => {
    const newSession = { name, role };
    setSession(newSession);
    localStorage.setItem('locationTrackerSession', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('locationTrackerSession');
    setUserView('dashboard');
    setAdminView('dashboard');
  };

  const handlePermissionGranted = () => {
    setHasLocationPermission(true);
    setShowPermissionDialog(false);
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showPermissionDialog && !hasLocationPermission) {
    return <LocationPermission onPermissionGranted={handlePermissionGranted} />;
  }

  const isAdmin = session.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className={`${isAdmin ? 'bg-green-600' : 'bg-blue-500'} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              <div>
                <h1 className="font-semibold">Location Tracker</h1>
                <p className="text-sm opacity-90">{session.name} - {isAdmin ? 'Admin' : 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* User Navigation */}
      {!isAdmin && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setUserView('dashboard')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  userView === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setUserView('checkin')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  userView === 'checkin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Check In/Out
              </button>
              <button
                onClick={() => setUserView('reports')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  userView === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
              <button
                onClick={() => setUserView('settings')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  userView === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation */}
      {isAdmin && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setAdminView('dashboard')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  adminView === 'dashboard'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setAdminView('reports')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  adminView === 'reports'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
              <button
                onClick={() => setAdminView('users')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  adminView === 'users'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Users
              </button>
              <button
                onClick={() => setAdminView('settings')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  adminView === 'settings'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!isAdmin && userView === 'dashboard' && <UserDashboard userName={session.name} />}
        {!isAdmin && userView === 'checkin' && <UserCheckIn userName={session.name} />}
        {!isAdmin && userView === 'reports' && <UserReports userName={session.name} />}
        {!isAdmin && userView === 'settings' && <UserSettings userName={session.name} userRole="user" />}
        {isAdmin && adminView === 'dashboard' && <AdminDashboard />}
        {isAdmin && adminView === 'reports' && <AdminReports />}
        {isAdmin && adminView === 'users' && <AdminUsers />}
        {isAdmin && adminView === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
}
