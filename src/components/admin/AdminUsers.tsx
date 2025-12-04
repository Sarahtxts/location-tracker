import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Trash2, User, Shield, Smartphone, Lock, Eye, EyeOff, Mail, Edit2 } from 'lucide-react';

const API_URL = 'http://localhost:5000';

interface UserData {
  name: string;
  role: 'user' | 'admin';
  phoneNumber: string;
  password: string;
  reportingManagerEmail?: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newUser, setNewUser] = useState<UserData>({
    name: '',
    role: 'user',
    phoneNumber: '',
    password: '',
    reportingManagerEmail: ''
  });
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users from backend');
        alert('Failed to load users from database');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Cannot connect to backend. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.password) {
      alert('Please enter name and password');
      return;
    }
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    if (!newUser.reportingManagerEmail) {
      alert('Please enter reporting manager email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name.trim(),  // ✅ Changed from userName to name
          role: newUser.role,
          phoneNumber: newUser.phoneNumber,
          password: newUser.password,
          reportingManagerEmail: newUser.reportingManagerEmail
        }),
      });

      if (response.ok) {
        alert(`User "${newUser.name}" added successfully!`);
        setNewUser({ name: '', role: 'user', phoneNumber: '', password: '', reportingManagerEmail: '' });
        setShowAddDialog(false);
        loadUsers(); // Reload from database
      } else {
        const errorData = await response.json();
        alert(`Failed to add user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Could not connect to backend.\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    if (editUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUser.name,  // ✅ Changed from userName to name
          role: editUser.role,
          phoneNumber: editUser.phoneNumber,
          password: editUser.password,
          reportingManagerEmail: editUser.reportingManagerEmail
        }),
      });

      if (response.ok) {
        alert('User updated successfully!');
        setShowEditDialog(false);
        setEditUser(null);
        loadUsers(); // Reload from database
      } else {
        const errorData = await response.json();
        alert(`Failed to update user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Could not connect to backend.\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (name: string, role: 'user' | 'admin') => {
    if (!confirm(`Are you sure to delete ${name} (${role})? This will also delete all their visit records.`)) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: name }),  // Backend expects userName for delete
      });

      if (response.ok) {
        alert('User deleted successfully!');
        loadUsers(); // Reload from database
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const getUserVisitCount = async (userName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/visits?userName=${userName}`);
      if (response.ok) {
        const visits = await response.json();
        return visits.length;
      }
    } catch (error) {
      console.error('Failed to get visit count:', error);
    }
    return 0;
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        alert('✅ Backend is reachable!');
      } else {
        alert(`❌ Backend returned error status: ${response.status}`);
      }
    } catch (error: any) {
      alert(`❌ Cannot reach backend!\nError: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-3 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-gray-900 mb-1 text-xl font-semibold">User Management</h2>
          <p className="text-gray-600 text-sm">Add, edit, view, and remove users (synced with database)</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <motion.button
            onClick={testBackendConnection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >Test Backend</motion.button>
          <motion.button
            onClick={() => setShowAddDialog(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          ><UserPlus className="w-4 h-4" />Add</motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow border-l-4 border-green-600">
          <span className="text-gray-600">Total Users</span>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-gray-900 font-medium">{users.length}</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow border-l-4 border-blue-600">
          <span className="text-gray-600">Regular Users</span>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-gray-900 font-medium">{users.filter(u => u.role === 'user').length}</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow border-l-4 border-purple-600">
          <span className="text-gray-600">Administrators</span>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="text-gray-900 font-medium">{users.filter(u => u.role === 'admin').length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-gray-900 mb-4 text-base">All Users</h3>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users found. Add your first user!</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={`${user.name}-${user.role}`}
                className="flex flex-col md:flex-row items-start md:items-center gap-3 px-2 py-3 border border-gray-200 rounded-xl bg-gray-50"
              >
                <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  {user.role === 'admin'
                    ? <Shield className="w-6 h-6 text-purple-600" />
                    : <User className="w-6 h-6 text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 mt-0.5">
                    {user.phoneNumber && (
                      <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" />{user.phoneNumber}</span>
                    )}
                    <span className="flex items-center gap-1"><Lock className="w-4 h-4" />••••••••</span>
                    {user.reportingManagerEmail && (
                      <span className="flex items-center gap-1 break-all"><Mail className="w-4 h-4" />{user.reportingManagerEmail}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-row gap-2 items-center ml-0 md:ml-6">
                  <button
                    onClick={() => { setEditUser(user); setShowEditDialog(true); setShowEditPassword(false); }}
                    className="p-2 rounded-full text-blue-700 hover:bg-blue-100"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.name, user.role)}
                    className="p-2 rounded-full text-red-600 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-gray-900 font-medium">Add New User</h3>
              <button onClick={() => setShowAddDialog(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-600 text-xl">×</span>
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: 'user' })}
                    className={`p-3 rounded-lg border-2 ${newUser.role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <User className={`w-6 h-6 mx-auto mb-1 ${newUser.role === 'user' ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={newUser.role === 'user' ? 'text-blue-700' : 'text-gray-700'}>User</span>
                  </button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                    className={`p-3 rounded-lg border-2 ${newUser.role === 'admin' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                    <Shield className={`w-6 h-6 mx-auto mb-1 ${newUser.role === 'admin' ? 'text-purple-700' : 'text-gray-600'}`} />
                    <span className={newUser.role === 'admin' ? 'text-purple-700' : 'text-gray-700'}>Admin</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />Reporting Manager Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.reportingManagerEmail}
                  onChange={e => setNewUser({ ...newUser, reportingManagerEmail: e.target.value })}
                  placeholder="manager@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">This email will receive automatic reports for this user</p>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddDialog(false)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg">Cancel</button>
                <motion.button
                  onClick={handleAddUser}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editUser && showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-gray-900 font-medium">Edit User: {editUser.name}</h3>
              <button onClick={() => { setShowEditDialog(false); setEditUser(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-gray-600 text-xl">×</span>
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editUser.phoneNumber}
                  onChange={e => setEditUser({ ...editUser, phoneNumber: e.target.value } as UserData)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2"><Mail className="w-4 h-4 inline mr-1" />Reporting Manager Email</label>
                <input
                  type="email"
                  value={editUser.reportingManagerEmail || ''}
                  onChange={e => setEditUser({ ...editUser, reportingManagerEmail: e.target.value } as UserData)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editUser.password}
                    onChange={e => setEditUser({ ...editUser, password: e.target.value } as UserData)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowEditDialog(false); setEditUser(null); }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg">Cancel</button>
                <motion.button
                  onClick={handleEditUser}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
