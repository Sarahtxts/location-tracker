import { MapPin } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface MapViewProps {
  latitude: number;
  longitude: number;
  address: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem 0.75rem 0 0'
};

export function MapView({ latitude, longitude, address }: MapViewProps) {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
  console.log(`MapView: Initializing with lat=${latitude}, lng=${longitude}, address=${address}`);
  console.log(`MapView: API Key present: ${apiKey ? 'Yes' : 'No'}`);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  return (
    <div className="relative">
      <div className="w-full h-[400px] bg-gray-100 rounded-t-xl overflow-hidden">
        {loadError ? (
          <div className="flex items-center justify-center w-full h-[400px] bg-red-50">
            <div className="text-center">
              <span className="text-red-500 font-semibold block mb-2">
                Failed to load map
              </span>
              <span className="text-red-400 text-sm block">
                {loadError.message || 'Please check API key and billing'}<br/>
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: latitude, lng: longitude }}
            zoom={16}
            options={{
              disableDefaultUI: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
              zoomControl: true
            }}
          >
            <Marker position={{ lat: latitude, lng: longitude }} title={address} />
          </GoogleMap>
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center bg-blue-50">
            <div className="text-center">
              <span className="text-blue-500 font-semibold block">Loading map...</span>
              <span className="text-blue-400 text-sm block mt-1">
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <p className="text-gray-600">Current Location</p>
            <p className="text-gray-900 font-medium">{address}</p>
            <p className="text-sm text-gray-500 mt-1">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
