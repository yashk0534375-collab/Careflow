import React, { useEffect, useState } from 'react';
import { Hospital } from '../types';
import { apiRequest } from '../lib/api';

type SearchResponse = {
  hospitals: Hospital[];
};

const presets = ['APOLLO', 'FORTIS', 'PEDIATRICS', 'EMERGENCY'];

interface HospitalSearchProps {
  initialUserLocation?: [number, number] | null;
}

export default function HospitalSearch({ initialUserLocation }: HospitalSearchProps = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(initialUserLocation || null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(
    initialUserLocation ? 'granted' : 'prompt'
  );

  useEffect(() => {
    if (initialUserLocation) {
      setUserLocation(initialUserLocation);
      setPermissionStatus('granted');
    } else if (!('geolocation' in navigator)) {
      setPermissionStatus('denied');
    } else {
      requestLocation();
    }
  }, [initialUserLocation]);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setPermissionStatus('granted');
      },
      () => setPermissionStatus('denied'),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const runSearch = async (value = query) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;

    setLoading(true);
    setError('');

    try {
      const locationQuery = userLocation ? `&lat=${userLocation[0]}&lng=${userLocation[1]}` : '';
      const response = await apiRequest<SearchResponse>(`/hospitals/search?q=${encodeURIComponent(nextQuery)}${locationQuery}`);
      setResults(response.hospitals);
    } catch (requestError) {
      setResults([]);
      setError(requestError instanceof Error ? requestError.message : 'UNABLE TO ESTABLISH CONNECTION WITH DATABASE.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-8">
        <h1 className="display-xxl mb-4">MEDICAL FACILITY LOCATOR</h1>
        <p className="caption-text text-[#f0f0fa] max-w-2xl uppercase">
          AI-ENHANCED QUERY SYSTEM FOR IDENTIFYING REGIONAL MEDICAL INFRASTRUCTURE.
          ENABLE LOCATION SERVICES FOR PROXIMITY-BASED RESULTS.
        </p>
      </header>

      {permissionStatus !== 'granted' && (
        <div className="border border-[#3a3a3f] p-4 flex justify-between items-center bg-[#0a0a0a]">
          <div className="text-[10px] font-bold text-[#f0f0fa] uppercase tracking-wider">
            LOCATION TELEMETRY REQUIRED FOR OPTIMAL RESULTS.
          </div>
          <button onClick={requestLocation} className="text-xs font-bold uppercase tracking-wider text-white border-b border-white hover:text-[#5a5a5f] hover:border-[#5a5a5f] transition-colors">
            AUTHORIZE
          </button>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 border-b border-[#3a3a3f] pb-6 mb-6">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && runSearch()}
            placeholder="ENTER QUERY DIRECTIVE..."
            className="flex-1 bg-transparent border-none text-xl uppercase rounded-none focus:ring-0 placeholder:text-[#3a3a3f] px-0"
          />
          <button onClick={() => runSearch()} className="btn-filled whitespace-nowrap">
            {loading ? 'PROCESSING' : 'INITIATE SCAN'}
          </button>
        </div>

        <div className="flex gap-4 flex-wrap items-center">
          <span className="text-[10px] text-[#5a5a5f] uppercase tracking-wider font-bold">PRESETS:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setQuery(preset);
                void runSearch(preset);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#f0f0fa] hover:text-white"
            >
              [{preset}]
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-[#3a3a3f] p-4 text-xs font-bold uppercase tracking-wider text-red-500 bg-black">
          ERR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((hospital) => (
          <div key={hospital.id} className="card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="display-lg text-2xl">{hospital.name}</h3>
                <div className="text-[11px] font-bold border border-white px-2 py-1 uppercase tracking-widest shrink-0">
                  RATING: {hospital.rating.toFixed(1)}
                </div>
              </div>
              <p className="eyebrow mt-1 mb-4">{hospital.type || 'HOSPITAL'}</p>
              <p className="text-[11px] text-[#f0f0fa] uppercase tracking-wider mb-8">{hospital.address}</p>
            </div>

            <div className="flex gap-4 mt-auto border-t border-[#3a3a3f] pt-6">
              <button
                onClick={() => window.open(hospital.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank', 'noopener,noreferrer')}
                className="btn-ghost-sm"
              >
                COORDINATES
              </button>
              {(hospital.websiteUri || hospital.googleMapsUri) && (
                <button
                  onClick={() => window.open(hospital.websiteUri || hospital.googleMapsUri, '_blank', 'noopener,noreferrer')}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#5a5a5f] hover:text-white"
                >
                  OFFICIAL DATABANK
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="border border-[#3a3a3f] p-12 text-center text-[#5a5a5f] text-[11px] font-bold uppercase tracking-wider">
          AWAITING QUERY INPUT.
        </div>
      )}
    </div>
  );
}
