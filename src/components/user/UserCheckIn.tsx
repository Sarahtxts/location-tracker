import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogIn, LogOut as LogOutIcon } from 'lucide-react';
import type { Visit } from '../../App';
import { MapView } from '../shared/MapView'; // Adjust path as needed

const API_URL = 'http://40.192.15.217:5000';

interface UserCheckInProps {
  userName: string;
}

// Helper: robust get epoch ms from date
function getDateMs(val?: string | number | null) {
  if (typeof val === 'string') return new Date(val.replace(' ', 'T')).getTime();
  if (typeof val === 'number') return val;
  return 0;
}

export function UserCheckIn({ userName }: UserCheckInProps) {
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permState, setPermState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    loadActiveVisit();

    // Load saved location from localStorage (set by LocationPermission or previous request)
    try {
      const manual = localStorage.getItem('locationTracker_manualLocation');
      if (manual) {
        const m = JSON.parse(manual);
        if (m && m.lat && m.lng) {
          setUserLocation({ lat: m.lat, lng: m.lng });
          if (m.address) setAddress(m.address);
        }
      }
    } catch (e) {
      // ignore
    }

    // AUTO-REQUEST geolocation when component mounts
    // (LocationPermission has already requested it, but we request again here for fresh coords)
    getLiveLocation();

    // Check Permissions API for geolocation status
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        (navigator.permissions as any).query({ name: 'geolocation' }).then((p: any) => {
          setPermState(p.state || 'prompt');
          p.onchange = () => setPermState(p.state || 'prompt');
        }).catch(() => setPermState('unknown'));
      } catch (e) {
        setPermState('unknown');
      }
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!activeVisit?.checkInTime) return;
    const startMs = getDateMs(activeVisit.checkInTime);
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - startMs) / 1000);
      setElapsedTime(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeVisit]);

  const loadActiveVisit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/visits?userName=${userName}`);
      if (response.ok) {
        const visits: Visit[] = await response.json();
        const active = visits.find((v: Visit) => v.userName === userName && !v.checkOutTime);
        if (active) {
          setActiveVisit(active);
          const diff = Math.floor((Date.now() - getDateMs(active.checkInTime)) / 1000);
          setElapsedTime(diff > 0 ? diff : 0);
        }
      }
    } catch (error) {
      console.error('Failed to load active visit:', error);
    }
  };

  // Geolocation from browser
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser!";
      setLocationError(errorMsg);
      alert(errorMsg);
      return;
    }
    setLocationError(null);
    console.log('Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log(`Geolocation obtained: lat=${lat}, lng=${lng}`);
          setUserLocation({ lat, lng });
          setLocationError(null);
          const addr = await reverseGeocodeViaBackend(lat, lng);
          console.log(`Setting address: ${addr}`);
          setAddress(addr);
          // persist as manual selection so other flows can use it
          try { localStorage.setItem('locationTracker_manualLocation', JSON.stringify({ lat, lng, address: addr })); } catch (e) { }
        } catch (error) {
          console.error('Error processing location:', error);
          setLocationError('Failed to process location data');
        }
      },
      (error) => {
        let errorMsg = "Permission denied!";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable it in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out.";
        }
        console.error(`Geolocation error: ${errorMsg}`);
        setLocationError(errorMsg);
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUseCurrentLocation = () => {
    getLiveLocation();
  };

  // Backend geocoding: coordinates → address
  const reverseGeocodeViaBackend = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log(`Geocoding request: lat=${lat}, lng=${lng}`);
      const response = await fetch(`${API_URL}/api/geocode?lat=${lat}&lng=${lng}`);
      console.log(`Geocoding response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`Geocoding result: ${data.address}`);
        return data.address || 'Unknown location';
      } else {
        const error = await response.json();
        console.error(`Geocoding error: ${error.error}`);
        return 'Unknown location';
      }
    } catch (error) {
      console.error('Geocoding fetch error:', error);
      return 'Unknown location';
    }
  };

  const handleCheckIn = async () => {
    if (!companyName.trim() || !userLocation) {
      alert("Enter company name & enable location");
      return;
    }
    setLoading(true);
    try {
      const checkInMapLink = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
      const response = await fetch(`${API_URL}/api/visits/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          clientName: clientName.trim() || 'N/A',
          companyName: companyName.trim(),
          checkInAddress: address,
          checkInMapLink
        })
      });
      if (response.ok) {
        await loadActiveVisit();
        setClientName('');
        setCompanyName('');
        alert('Checked in successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to check in: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeVisit) return;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const addr = await reverseGeocodeViaBackend(lat, lng);
        const checkOutMapLink = `https://maps.google.com/?q=${lat},${lng}`;

        let start = { lat: 0, lng: 0 };
        if (activeVisit.checkInMapLink) {
          const m = activeVisit.checkInMapLink.match(/q=([0-9.-]+),([0-9.-]+)/);
          if (m) start = { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
        }

        const distance = calculateDistance(start.lat, start.lng, lat, lng);

        const settingsRes = await fetch(`${API_URL}/api/settings/distanceThreshold`);
        const settingsData = await settingsRes.json();
        const threshold = settingsData.value ? parseInt(settingsData.value) : 500;
        const locationMismatch = distance > threshold;

        const response = await fetch(`${API_URL}/api/visits/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeVisit.id,
            checkOutAddress: addr,
            checkOutMapLink,
            locationMismatch
          })
        });
        if (response.ok) {
          setActiveVisit(null);
          setElapsedTime(0);
          getLiveLocation();
          if (locationMismatch) {
            alert(`⚠️ Check-out location is ${Math.round(distance)}m away from check-in location. This will be flagged as a location mismatch.`);
          } else {
            alert('Checked out successfully!');
          }
        } else {
          alert('Failed to check out');
        }
      } catch (error) {
        console.error('Check-out error:', error);
        alert('Failed to check out. Please check your connection.');
      } finally {
        setLoading(false);
      }
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatElapsedTime = (sec: number) => new Date(sec * 1000).toISOString().substring(11, 19);

  return (
    <div className="space-y-4">
      <h2 className="text-gray-900 mb-2 text-xl font-semibold">Check In / Out</h2>

      {/* Display error messages */}
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          {locationError}
        </div>
      )}

      {/* Permissions status + button to refresh/re-request geolocation */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-gray-600">Permission:</div>
        <div className={`text-sm font-medium ${permState === 'granted' ? 'text-green-600' : permState === 'denied' ? 'text-red-600' : 'text-gray-600'}`}>
          {permState}
        </div>
        <button
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Requesting...' : 'Refresh location'}
        </button>
      </div>

      {/* Embedded MapView with live location */}
      {userLocation && address && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <MapView latitude={userLocation.lat} longitude={userLocation.lng} address={address} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="space-y-2">
          <div>
            <span className="text-gray-700 text-sm">Client Name: </span>
            <span className="font-medium text-gray-900">
              {activeVisit ? activeVisit.clientName : (clientName || 'N/A')}
            </span>
          </div>
          <div>
            <span className="text-gray-700 text-sm">Company Name: </span>
            <span className="font-medium text-gray-900">
              {activeVisit ? activeVisit.companyName : (companyName || 'N/A')}
            </span>
          </div>
          {activeVisit && (
            <div>
              <span className="text-gray-700 text-sm">Checked in at: </span>
              <span className="font-medium text-gray-900">{activeVisit.checkInAddress}</span>
              <div className="mt-2">
                <span className="text-gray-700 text-sm">Duration: </span>
                <span className="font-medium text-blue-600">{formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>
          )}
          {!activeVisit && address && (
            <div>
              <span className="text-gray-700 text-sm">Current Location: </span>
              <span className="font-medium text-gray-900">{address}</span>
            </div>
          )}
        </div>
        {!activeVisit ? (
          <>
            <input
              placeholder="Client Name (optional)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="border border-gray-300 px-3 py-2 w-full rounded-lg text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Company Name *"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border border-gray-300 px-4 py-2 w-full rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <motion.button
              onClick={handleCheckIn}
              disabled={!userLocation || loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Checking In...' : 'Check In'}
            </motion.button>
          </>
        ) : (
          <motion.button
            onClick={handleCheckOut}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogOutIcon className="w-5 h-5" />
            {loading ? 'Checking Out...' : 'Check Out'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
