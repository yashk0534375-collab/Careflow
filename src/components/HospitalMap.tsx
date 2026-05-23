import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Hospital } from '../types';
import { apiRequest } from '../lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type NearbyResponse = {
  hospitals: Hospital[];
};

interface HospitalMapProps {
  initialUserLocation?: [number, number] | null;
}

export default function HospitalMap({ initialUserLocation }: HospitalMapProps = {}) {
  const [userLocation, setUserLocation] = useState<[number, number]>(initialUserLocation || [28.6139, 77.2090]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [filter, setFilter] = useState<'all' | 'emergency' | 'top-rated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const haystack = `${hospital.name} ${hospital.address} ${hospital.type || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'emergency'
            ? hospital.emergency
            : hospital.rating >= 4.5;

      return matchesSearch && matchesFilter;
    });
  }, [filter, hospitals, searchQuery]);

  const selected = selectedHospital && filteredHospitals.some((hospital) => hospital.id === selectedHospital.id)
    ? selectedHospital
    : filteredHospitals[0] || null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userLocation,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Set Tile Layer (SpaceX dark aesthetic)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';

    const tiles = L.tileLayer(tileUrl, { attribution });
    tiles.addTo(map);
    tileLayerRef.current = tiles;
  }, []);

  // Synchronize Markers & Routing Line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.invalidateSize();

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (routingLineRef.current) {
      routingLineRef.current.remove();
      routingLineRef.current = null;
    }

    // White stark square for User Location
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="h-4 w-4 bg-white border border-[#3a3a3f]"></div>
          <div class="absolute inset-0 bg-white opacity-30 animate-ping"></div>
        </div>
      `,
      className: 'custom-user-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const userMarker = L.marker(userLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="font-bold uppercase tracking-wider text-[10px]">CURRENT COORDINATES</div>');
    markersRef.current.push(userMarker);

    const boundsCoords: [number, number][] = [userLocation];

    // Hospital Markers
    filteredHospitals.slice(0, 5).forEach((hospital) => {
      const isSelected = selected?.id === hospital.id;

      const hospIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group">
            <div class="flex items-center justify-center w-6 h-6 border ${
              isSelected 
                ? 'bg-white border-white scale-110' 
                : 'bg-black border-[#5a5a5f] group-hover:border-white'
            } transition-all duration-300">
              <span class="text-[10px] font-bold ${isSelected ? 'text-black' : 'text-white'}">H</span>
            </div>
            <div class="w-[1px] h-3 ${isSelected ? 'bg-white' : 'bg-[#5a5a5f]'}"></div>
          </div>
        `,
        className: `custom-hospital-icon-${hospital.id}`,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      });

      const marker = L.marker([hospital.lat, hospital.lng], { icon: hospIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 uppercase tracking-wider text-[10px] bg-[#0a0a0a] text-white">
            <div class="font-bold">${hospital.name}</div>
            <div class="text-[#5a5a5f] mt-1">${hospital.status === 'open' ? 'OPERATIONAL' : 'OFFLINE'}</div>
          </div>
        `);

      marker.on('click', () => {
        setSelectedHospital(hospital);
      });

      markersRef.current.push(marker);
      boundsCoords.push([hospital.lat, hospital.lng]);
    });

    // Draw routing line if a hospital is selected
    if (selected) {
      const lineCoords: [number, number][] = [userLocation, [selected.lat, selected.lng]];
      const polyline = L.polyline(lineCoords, {
        color: '#ffffff',
        weight: 1,
        dashArray: '4, 4',
        opacity: 0.8,
      }).addTo(map);
      routingLineRef.current = polyline;
    }

    if (boundsCoords.length > 1) {
      map.fitBounds(boundsCoords, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.8,
      });
    } else {
      map.setView(userLocation, 14);
    }
  }, [userLocation, filteredHospitals, selected]);

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

  useEffect(() => {
    async function loadHospitals() {
      setLoading(true);
      setError('');

      try {
        const response = await apiRequest<NearbyResponse>(`/hospitals/nearby?lat=${userLocation[0]}&lng=${userLocation[1]}`);
        setHospitals(response.hospitals);
        setSelectedHospital((current) => current || response.hospitals[0] || null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'UNABLE TO LOAD REGIONAL TOPOGRAPHY.');
      } finally {
        setLoading(false);
      }
    }

    loadHospitals();
  }, [userLocation]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a3a3f] pb-8">
        <div>
          <h1 className="display-xxl mb-4">REGIONAL MEDICAL TOPOGRAPHY</h1>
          <p className="caption-text text-[#f0f0fa] max-w-2xl uppercase">
            LIVE SENSOR DATA OF NEARBY MEDICAL INFRASTRUCTURE.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="QUERY FACILITY..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full md:w-64 bg-transparent border-b border-[#3a3a3f] rounded-none py-2 px-0 text-sm uppercase placeholder:text-[#5a5a5f] focus:border-white"
          />
          <div className="flex border border-[#3a3a3f] p-1">
            {(['all', 'emergency', 'top-rated'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === value ? 'bg-white text-black' : 'text-[#5a5a5f] hover:text-white'
                }`}
              >
                {value.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {permissionStatus === 'denied' && (
        <div className="border border-[#3a3a3f] p-4 flex justify-between items-center bg-[#0a0a0a]">
          <div className="text-[10px] font-bold text-[#f0f0fa] uppercase tracking-wider">
            LOCATION TELEMETRY REQUIRED FOR ACCURATE TOPOGRAPHY.
          </div>
          <button onClick={requestLocation} className="text-xs font-bold uppercase tracking-wider text-white border-b border-white hover:text-[#5a5a5f] hover:border-[#5a5a5f] transition-colors">
            RETRY UPLINK
          </button>
        </div>
      )}

      {permissionStatus === 'prompt' && (
        <div className="border border-[#3a3a3f] p-4 flex justify-between items-center bg-[#0a0a0a]">
          <div className="text-[10px] font-bold text-[#f0f0fa] uppercase tracking-wider">
            AUTHORIZE LOCATION SERVICES TO ESTABLISH REGIONAL TOPOGRAPHY.
          </div>
          <button onClick={requestLocation} className="text-xs font-bold uppercase tracking-wider text-white border-b border-white hover:text-[#5a5a5f] hover:border-[#5a5a5f] transition-colors">
            AUTHORIZE
          </button>
        </div>
      )}

      {error && (
        <div className="border border-[#3a3a3f] p-4 text-xs font-bold uppercase tracking-wider text-red-500 bg-black">
          ERR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
          {loading && <div className="border border-[#3a3a3f] p-6 text-[10px] font-bold text-[#5a5a5f] uppercase tracking-wider text-center animate-pulse">DOWNLOADING TOPOGRAPHY...</div>}

          {filteredHospitals.slice(0,5).map((hospital) => (
            <div
              key={hospital.id}
              onClick={() => setSelectedHospital(hospital)}
              className={`card text-left cursor-pointer transition-colors ${
                selected?.id === hospital.id ? 'border-white bg-[#0a0a0a]' : 'hover:border-white'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="display-lg text-xl leading-tight">{hospital.name}</h3>
                <div className="text-[10px] font-bold border border-[#3a3a3f] px-2 py-1 uppercase tracking-widest shrink-0">
                  RATING: {hospital.rating.toFixed(1)}
                </div>
              </div>
              <p className="text-[11px] text-[#5a5a5f] uppercase tracking-wider mb-2">
                DISTANCE: {hospital.distance.toFixed(1)} MI // TYPE: {hospital.type || 'HOSPITAL'}
              </p>
              <p className="text-[11px] text-[#f0f0fa] uppercase tracking-wider mb-6 line-clamp-2">{hospital.address}</p>
              
              <div className="flex gap-2 flex-wrap mb-6">
                <span className={`text-[10px] font-bold border px-2 py-1 uppercase tracking-widest ${
                  hospital.status === 'open' ? 'border-white text-white' : 'border-[#3a3a3f] text-[#5a5a5f]'
                }`}>
                  {hospital.status === 'open' ? 'OPERATIONAL' : 'OFFLINE'}
                </span>
                {hospital.emergency && (
                  <span className="text-[10px] font-bold border border-white bg-white text-black px-2 py-1 uppercase tracking-widest">
                    EMERGENCY
                  </span>
                )}
              </div>

              <div className="flex gap-4 border-t border-[#3a3a3f] pt-4">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    window.open(hospital.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="btn-ghost-sm w-full text-center"
                >
                  ROUTING
                </button>
              </div>
            </div>
          ))}

          {!loading && filteredHospitals.length === 0 && (
            <div className="border border-[#3a3a3f] p-12 text-center text-[#5a5a5f] text-[11px] font-bold uppercase tracking-wider">
              NO FACILITIES MATCHING CRITERIA.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 border border-[#3a3a3f] bg-[#0a0a0a] flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-[#3a3a3f] flex items-center justify-between gap-4 flex-wrap bg-black">
            <div>
              <h3 className="display-lg text-2xl">{selected?.name || 'SATELLITE VIEW'}</h3>
              <p className="text-[10px] font-bold text-[#5a5a5f] uppercase tracking-widest mt-2">
                {selected ? `${selected.address} // DISTANCE: ${selected.distance.toFixed(1)} MI` : 'TARGET LOCATION LOCKED'}
              </p>
            </div>
            {selected && (
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => window.open(selected.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, '_blank', 'noopener,noreferrer')}
                  className="text-[10px] font-bold uppercase tracking-wider text-white hover:text-[#5a5a5f] transition-colors"
                >
                  [ INITIATE ROUTE ]
                </button>
              </div>
            )}
          </div>
          
          <div className="relative flex-1 bg-black overflow-hidden z-10 p-2">
            <div ref={mapContainerRef} className="absolute inset-0 bg-[#0a0a0a]" />
          </div>
        </div>
      </div>
    </div>
  );
}
