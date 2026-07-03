'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface EmergencyService {
  name: string;
  icon: React.ReactNode;
  searchType: string;
  description: string;
}

export default function EmergencySupportModule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emergencyServices: EmergencyService[] = [
    {
      name: 'Nearby Hospitals',
      icon: <MapPin className="w-6 h-6" />,
      searchType: 'hospitals',
      description: 'Find nearby hospitals and medical centers',
    },
    {
      name: 'Nearby Doctors',
      icon: <MapPin className="w-6 h-6" />,
      searchType: 'doctors',
      description: 'Locate nearby healthcare professionals',
    },
    {
      name: 'Ambulance Services',
      icon: <MapPin className="w-6 h-6" />,
      searchType: 'ambulance services',
      description: 'Find emergency ambulance services',
    },
  ];

  const handleEmergencySearch = async (searchType: string) => {
    setLoading(true);
    setError(null);

    try {
      // Request user's geolocation
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err)
        );
      });

      const { latitude, longitude } = position;

      // Open Google Maps with the search query
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
        searchType
      )}/@${latitude},${longitude},15z`;

      window.open(mapsUrl, '_blank');
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please enable location access.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information is unavailable.');
        } else {
          setError('Error getting your location. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Emergency Support</h2>
        <p className="text-muted-foreground">
          Quick access to emergency services and healthcare facilities near you
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {emergencyServices.map((service) => (
          <div
            key={service.searchType}
            className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
              <div className="text-primary">{service.icon}</div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-2">{service.name}</h3>
            <p className="text-muted-foreground text-sm mb-6">{service.description}</p>

            <Button
              onClick={() => handleEmergencySearch(service.searchType)}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Getting Location...' : 'Find Nearby'}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This feature requires location permission. Your location is only used
          to find nearby services and is not stored.
        </p>
      </div>
    </div>
  );
}
