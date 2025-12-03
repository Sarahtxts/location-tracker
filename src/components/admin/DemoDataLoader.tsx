import { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Trash2, Users } from 'lucide-react';

const API_URL = 'http://10.41.149.42:5000';

interface DemoDataLoaderProps {
  onDataLoaded: () => void;
}

const DEMO_USERNAMES = ['John', 'Jacob', 'Sarah', 'Mike', 'Emma'];
const DEMO_CLIENTS = [
  'TCS Limited',
  'Infosys Technologies',
  'Cognizant Systems',
  'HCL Technologies',
  'Wipro Digital'
];

export function DemoDataLoader({ onDataLoaded }: DemoDataLoaderProps) {
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    if (!confirm('This will load demo data with sample visits from John, Jacob, Sarah, Mike, and Emma. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      // Demo users data
      const demoUsers = [
        { name: 'John', role: 'user', phoneNumber: '+91 9876543210', password: 'password123', reportingManagerEmail: 'manager@company.com' },
        { name: 'Jacob', role: 'user', phoneNumber: '+91 9876543211', password: 'password123', reportingManagerEmail: 'manager@company.com' },
        { name: 'Sarah', role: 'user', phoneNumber: '+91 9876543212', password: 'password123', reportingManagerEmail: 'manager@company.com' },
        { name: 'Mike', role: 'user', phoneNumber: '+91 9876543213', password: 'password123', reportingManagerEmail: 'manager@company.com' },
        { name: 'Emma', role: 'user', phoneNumber: '+91 9876543214', password: 'password123', reportingManagerEmail: 'manager@company.com' }
      ];

      for (const user of demoUsers) {
        await fetch(`${API_URL}/api/user/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
      }

      const demoClients = [
        { name: 'TCS Limited', company: 'TCS Limited', location: 'Sholinganallur, Chennai' },
        { name: 'Infosys Technologies', company: 'Infosys Technologies', location: 'Siruseri, Chennai' },
        { name: 'Cognizant Systems', company: 'Cognizant Systems', location: 'Taramani, Chennai' },
        { name: 'HCL Technologies', company: 'HCL Technologies', location: 'Guindy, Chennai' },
        { name: 'Wipro Digital', company: 'Wipro Digital', location: 'Perungudi, Chennai' }
      ];

      for (const client of demoClients) {
        await fetch(`${API_URL}/api/clients/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(client)
        });
      }

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneHour = 60 * 60 * 1000;

      // All sample visits, with check-in/check-out times and mismatches as described (see your sample spec)
      const demoVisits = [
        // John's visits
        { userName: 'John', clientName: 'TCS Limited', companyName: 'TCS Limited', checkInAddress: 'Sholinganallur, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9001,80.2279', checkInTime: now - 5 * oneDay, checkOutTime: now - 5 * oneDay + 3 * oneHour, checkOutAddress: 'Sholinganallur, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9001,80.2279', locationMismatch: 0 },
        { userName: 'John', clientName: 'Infosys Technologies', companyName: 'Infosys Technologies', checkInAddress: 'Siruseri, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.8230,80.2272', checkInTime: now - 4 * oneDay, checkOutTime: now - 4 * oneDay + 4 * oneHour, checkOutAddress: 'Taramani, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9892,80.2442', locationMismatch: 1 },
        { userName: 'John', clientName: 'Cognizant Systems', companyName: 'Cognizant Systems', checkInAddress: 'Taramani, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9892,80.2442', checkInTime: now - 3 * oneDay, checkOutTime: now - 3 * oneDay + 2 * oneHour, checkOutAddress: 'Taramani, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9892,80.2442', locationMismatch: 0 },
        { userName: 'John', clientName: 'HCL Technologies', companyName: 'HCL Technologies', checkInAddress: 'Guindy, Chennai', checkInMapLink: 'https://maps.google.com/?q=13.0067,80.2206', checkInTime: now - 2 * oneDay, checkOutTime: now - 2 * oneDay + 5 * oneHour, checkOutAddress: 'Guindy, Chennai', checkOutMapLink: 'https://maps.google.com/?q=13.0067,80.2206', locationMismatch: 0 },
        { userName: 'John', clientName: 'Wipro Digital', companyName: 'Wipro Digital', checkInAddress: 'Perungudi, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9611,80.2437', checkInTime: now - 1 * oneDay, checkOutTime: now - 1 * oneDay + 3 * oneHour, checkOutAddress: 'Perungudi, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9611,80.2437', locationMismatch: 0 },

        // Jacob's visits
        { userName: 'Jacob', clientName: 'TCS Limited', companyName: 'TCS Limited', checkInAddress: 'Sholinganallur, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9001,80.2279', checkInTime: now - 5 * oneDay, checkOutTime: now - 5 * oneDay + 2 * oneHour, checkOutAddress: 'Guindy, Chennai', checkOutMapLink: 'https://maps.google.com/?q=13.0067,80.2206', locationMismatch: 1 },
        { userName: 'Jacob', clientName: 'Infosys Technologies', companyName: 'Infosys Technologies', checkInAddress: 'Siruseri, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.8230,80.2272', checkInTime: now - 4 * oneDay, checkOutTime: now - 4 * oneDay + 3 * oneHour, checkOutAddress: 'Siruseri, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.8230,80.2272', locationMismatch: 0 },
        { userName: 'Jacob', clientName: 'Cognizant Systems', companyName: 'Cognizant Systems', checkInAddress: 'Taramani, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9892,80.2442', checkInTime: now - 3 * oneDay, checkOutTime: now - 3 * oneDay + 4 * oneHour, checkOutAddress: 'Perungudi, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9611,80.2437', locationMismatch: 1 },
        { userName: 'Jacob', clientName: 'HCL Technologies', companyName: 'HCL Technologies', checkInAddress: 'Guindy, Chennai', checkInMapLink: 'https://maps.google.com/?q=13.0067,80.2206', checkInTime: now - 2 * oneDay, checkOutTime: now - 2 * oneDay + 2 * oneHour, checkOutAddress: 'Sholinganallur, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9001,80.2279', locationMismatch: 1 },
        { userName: 'Jacob', clientName: 'Wipro Digital', companyName: 'Wipro Digital', checkInAddress: 'Perungudi, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9611,80.2437', checkInTime: now - 1 * oneDay, checkOutTime: now - 1 * oneDay + 3 * oneHour, checkOutAddress: 'Perungudi, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9611,80.2437', locationMismatch: 0 },

        // Sarah's visits
        { userName: 'Sarah', clientName: 'TCS Limited', companyName: 'TCS Limited', checkInAddress: 'Sholinganallur, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9001,80.2279', checkInTime: now - 5 * oneDay, checkOutTime: now - 5 * oneDay + 4 * oneHour, checkOutAddress: 'Sholinganallur, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9001,80.2279', locationMismatch: 0 },
        { userName: 'Sarah', clientName: 'Infosys Technologies', companyName: 'Infosys Technologies', checkInAddress: 'Siruseri, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.8230,80.2272', checkInTime: now - 4 * oneDay, checkOutTime: now - 4 * oneDay + 3 * oneHour, checkOutAddress: 'Siruseri, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.8230,80.2272', locationMismatch: 0 },
        { userName: 'Sarah', clientName: 'Cognizant Systems', companyName: 'Cognizant Systems', checkInAddress: 'Taramani, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9892,80.2442', checkInTime: now - 3 * oneDay, checkOutTime: now - 3 * oneDay + 5 * oneHour, checkOutAddress: 'Taramani, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9892,80.2442', locationMismatch: 0 },
        { userName: 'Sarah', clientName: 'HCL Technologies', companyName: 'HCL Technologies', checkInAddress: 'Guindy, Chennai', checkInMapLink: 'https://maps.google.com/?q=13.0067,80.2206', checkInTime: now - 2 * oneDay, checkOutTime: now - 2 * oneDay + 2 * oneHour, checkOutAddress: 'Guindy, Chennai', checkOutMapLink: 'https://maps.google.com/?q=13.0067,80.2206', locationMismatch: 0 },
        { userName: 'Sarah', clientName: 'Wipro Digital', companyName: 'Wipro Digital', checkInAddress: 'Perungudi, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9611,80.2437', checkInTime: now - 1 * oneDay, checkOutTime: now - 1 * oneDay + 4 * oneHour, checkOutAddress: 'Perungudi, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9611,80.2437', locationMismatch: 0 },

        // Mike's visits
        { userName: 'Mike', clientName: 'TCS Limited', companyName: 'TCS Limited', checkInAddress: 'Sholinganallur, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9001,80.2279', checkInTime: now - 3 * oneDay, checkOutTime: now - 3 * oneDay + 2 * oneHour, checkOutAddress: 'Taramani, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9892,80.2442', locationMismatch: 1 },
        { userName: 'Mike', clientName: 'Infosys Technologies', companyName: 'Infosys Technologies', checkInAddress: 'Siruseri, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.8230,80.2272', checkInTime: now - 2 * oneDay, checkOutTime: now - 2 * oneDay + 3 * oneHour, checkOutAddress: 'Perungudi, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9611,80.2437', locationMismatch: 1 },
        { userName: 'Mike', clientName: 'Cognizant Systems', companyName: 'Cognizant Systems', checkInAddress: 'Taramani, Chennai', checkInMapLink: 'https://maps.google.com/?q=12.9892,80.2442', checkInTime: now - 1 * oneDay, checkOutTime: now - 1 * oneDay + 4 * oneHour, checkOutAddress: 'Taramani, Chennai', checkOutMapLink: 'https://maps.google.com/?q=12.9892,80.2442', locationMismatch: 0 },

        // Emma - 1 active visit (currently checked in)
        { userName: 'Emma', clientName: 'HCL Technologies', companyName: 'HCL Technologies', checkInAddress: 'Guindy, Chennai', checkInMapLink: 'https://maps.google.com/?q=13.0067,80.2206', checkInTime: now - 2 * oneHour, checkOutTime: null, checkOutAddress: null, checkOutMapLink: null, locationMismatch: 0 }
      ];

      for (const visit of demoVisits) {
        // visit.checkOutTime/null test determines whether it's an active or completed visit
        const createRes = await fetch(`${API_URL}/api/visits/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: visit.userName,
            clientName: visit.clientName,
            companyName: visit.companyName,
            checkInAddress: visit.checkInAddress,
            checkInMapLink: visit.checkInMapLink,
            checkInTime: visit.checkInTime
          })
        });
        const createData = await createRes.json();
        if (visit.checkOutTime) {
          await fetch(`${API_URL}/api/visits/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: createData.visitId,
              checkOutTime: visit.checkOutTime,
              checkOutAddress: visit.checkOutAddress,
              checkOutMapLink: visit.checkOutMapLink,
              locationMismatch: visit.locationMismatch
            })
          });
        }
      }

      onDataLoaded();
      alert('Demo data loaded successfully! You can now view the reports and dashboard.');
    } catch (error) {
      console.error('Failed to load demo data:', error);
      alert('Failed to load demo data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('This will delete ONLY the demo users, demo clients, and their visits. Are you sure?')) {
      return;
    }

    setLoading(true);
    try {
      for (const userName of DEMO_USERNAMES) {
        await fetch(`${API_URL}/api/user/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName })
        });
      }
      for (const name of DEMO_CLIENTS) {
        await fetch(`${API_URL}/api/clients/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
      }
      onDataLoaded();
      alert('Demo data cleared successfully!');
    } catch (error) {
      console.error('Failed to clear demo data:', error);
      alert('Failed to clear demo data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-green-600" />
        <h3 className="text-gray-900">Demo Data Management</h3>
      </div>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-900 mb-2">Demo Employees</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>John</strong> - 5 visits (1 location mismatch at Infosys)</li>
            <li>• <strong>Jacob</strong> - 5 visits (3 location mismatches)</li>
            <li>• <strong>Sarah</strong> - 5 visits (All clean, model employee)</li>
            <li>• <strong>Mike</strong> - 3 visits (2 location mismatches)</li>
            <li>• <strong>Emma</strong> - 1 active visit (currently checked in)</li>
          </ul>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-purple-900 mb-2">Demo Clients (Chennai)</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• TCS Limited - Sholinganallur</li>
            <li>• Infosys Technologies - Siruseri</li>
            <li>• Cognizant Systems - Taramani</li>
            <li>• HCL Technologies - Guindy</li>
            <li>• Wipro Digital - Perungudi</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={handleLoadDemo}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Users className="w-5 h-5" />
            {loading ? 'Loading...' : 'Load Demo Data'}
          </motion.button>
          <motion.button
            onClick={handleClearData}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            {loading ? 'Clearing...' : 'Clear Demo Data'}
          </motion.button>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Loading demo data will add sample visits to your database.
          Clearing demo data only removes demo users, demo clients, and their visits—real data is untouched.
        </p>
      </div>
    </div>
  );
}
