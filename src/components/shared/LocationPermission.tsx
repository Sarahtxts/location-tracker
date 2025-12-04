import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, CheckCircle } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';

const MAP_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

interface LocationPermissionProps {
  onPermissionGranted: () => void;
}

export function LocationPermission({ onPermissionGranted }: LocationPermissionProps) {
  const [permState, setPermState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Requesting location...');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAP_KEY, libraries: ['places'] });

  useEffect(() => {
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
  }, []);

  // AUTO-REQUEST geolocation on component mount
  useEffect(() => {
    const autoRequest = async () => {
      if (!navigator.geolocation) {
        setMessage('Geolocation not supported');
        return;
      }
      setLoading(true);
      setMessage('Requesting location access...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log(`[LocationPermission] ✓ Geolocation obtained: lat=${lat}, lng=${lng}`);
          try { localStorage.setItem('locationTracker_manualLocation', JSON.stringify({ lat, lng, address: '' })); } catch (e) {}
          setLoading(false);
          setMessage('Location granted!');
          setTimeout(() => onPermissionGranted(), 300);
        },
        (err) => {
          console.error(`[LocationPermission] ✗ Geolocation error:`, err);
          setLoading(false);
          const errorMsg = err.code === 1 ? 'Permission denied' : err.message || 'Failed to get location';
          setMessage(errorMsg);
          setPermState('denied');
          // User can still use the button or Places fallback below
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // delay slightly to ensure component is fully mounted
    const timer = setTimeout(autoRequest, 200);
    return () => clearTimeout(timer);
  }, [onPermissionGranted]);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported in this browser');
      return;
    }
    setLoading(true);
    setMessage('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log(`[LocationPermission] ✓ Manual geolocation: lat=${lat}, lng=${lng}`);
        try { localStorage.setItem('locationTracker_manualLocation', JSON.stringify({ lat, lng, address: '' })); } catch (e) {}
        setLoading(false);
        setMessage('Location granted!');
        setTimeout(() => onPermissionGranted(), 300);
      },
      (err) => {
        console.error(`[LocationPermission] ✗ Manual geolocation error:`, err);
        setLoading(false);
        const errorMsg = err.code === 1 ? 'Permission denied' : err.message || 'Failed to get location';
        setMessage(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    if (!(window as any).google) return;
    try {
      const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, { types: ['geocode'] });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';
          try { localStorage.setItem('locationTracker_manualLocation', JSON.stringify({ lat, lng, address })); } catch (e) {}
          onPermissionGranted();
        }
      });
    } catch (e) {
      // ignore
    }
  }, [isLoaded, onPermissionGranted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6"
        >
          <MapPin className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-gray-900 mb-2">Location Access</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-700">Status:</div>
            <div className={`text-sm font-medium ${permState === 'granted' ? 'text-green-600' : permState === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
              {permState}
            </div>
          </div>

          {permState !== 'granted' && (
            <>
              <button
                onClick={requestBrowserLocation}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Getting location...' : 'Request Location'}
              </button>

              <div className="text-sm text-gray-500 border-t pt-3">Or search for a place:</div>
              <input
                ref={inputRef}
                placeholder="Search an address or place"
                className="w-full border border-gray-200 rounded-md px-3 py-2"
              />
              <div className="text-xs text-gray-400">Pick a place to use as your location.</div>
            </>
          )}

          {permState === 'granted' && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Location ready!</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
