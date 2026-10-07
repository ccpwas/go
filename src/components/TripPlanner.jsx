import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Map as MapIcon, Loader2, Bus } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';
import { findTransitRoutes } from '../utils/transitEngine';
import { useKmbData } from '../hooks/useKmbData';
import { GpsMarker } from './GpsMarker';

// Ensure leafet assets are properly loaded
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to center map on new routes
const MapUpdater = ({ routePath }) => {
  const map = useMap();
  useEffect(() => {
    if (routePath && routePath.length > 0) {
      const bounds = L.latLngBounds(routePath);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePath, map]);
  return null;
};

const TripPlanner = () => {
  const { t, i18n } = useTranslation();
  const kmbData = useKmbData();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const [transitRoutes, setTransitRoutes] = useState([]);
  const [selectedTransitIndex, setSelectedTransitIndex] = useState(0);

  // Helper function to geocode text into coordinates using Nominatim API
  const geocodeAddress = async (address) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Hong Kong')}`);
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    throw new Error(`Could not find location: ${address}`);
  };

  const handleCalculate = async () => {
    if (!start || !end) return;
    setCalculating(true);
    setError('');
    setTransitRoutes([]);
    setSelectedTransitIndex(0);

    try {
      // 1. Geocode Start and End
      const startCoord = await geocodeAddress(start);
      const endCoord = await geocodeAddress(end);

      // 2. Run Transit Engine
      const foundRoutes = findTransitRoutes(startCoord, endCoord, kmbData);

      if (foundRoutes.length === 0) {
        throw new Error('No direct KMB routes found between these locations.');
      }

      setTransitRoutes(foundRoutes);

    } catch (err) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-4">
      {/* Sidebar: Inputs */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-indigo-100 rounded-full dark:bg-indigo-900/30">
            <MapIcon className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transit Planner</h2>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">

          {/* Start Point */}
          <div className="flex items-center space-x-3">
            <MapPin className="text-emerald-500 shrink-0" size={20} />
            <input
              type="text"
              placeholder={t('startPoint') || 'Origin'}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* End Point */}
          <div className="flex items-center space-x-3">
            <Navigation className="text-red-500 shrink-0" size={20} />
            <input
              type="text"
              placeholder={t('endPoint') || 'Destination'}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating || !start || !end}
            className="mt-2 w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl shadow-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {calculating ? (
              <><Loader2 className="animate-spin" size={20} /> {t('calculating')}</>
            ) : (
              t('calculateRoute')
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 mt-4">
          {transitRoutes.map((route, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedTransitIndex(idx)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTransitIndex === idx
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500 text-white font-bold px-2 py-1 rounded text-sm">
                    {route.route}
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
                    ~{route.estTimeMins} mins
                  </span>
                </div>
                <Bus size={18} className="text-slate-400" />
              </div>

              <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Board:</span>
                    {i18n.language === 'en' ? route.boardStop?.name_en : route.boardStop?.name_tc}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Alight:</span>
                    {i18n.language === 'en' ? route.alightStop?.name_en : route.alightStop?.name_tc}
                  </div>
                </div>

                <div className="text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  {route.stopsCount} stops
                </div>
              </div>
            </div>
          ))}
          {transitRoutes.length === 0 && calculating === false && error === '' && (
            <div className="text-center text-slate-500 text-sm py-8">
              Enter origin and destination to find transit routes.
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map */}
      <div className="w-full md:w-2/3 h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-900 relative shrink-0">

        {transitRoutes.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <MapIcon size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              Enter locations to generate transit route
            </p>
          </div>
        )}

        <MapContainer center={[22.3193, 114.1694]} zoom={12} className="h-full w-full z-0" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            className="map-tiles"
          />

          {kmbData?.userLocation && <GpsMarker position={kmbData.userLocation} />}

          {transitRoutes.length > 0 && transitRoutes[selectedTransitIndex] && (
            <>
              <MapUpdater routePath={transitRoutes[selectedTransitIndex].path} />
              <Polyline
                positions={transitRoutes[selectedTransitIndex].path}
                color="#FF3B30"
                weight={5}
                opacity={0.8}
              />

              {transitRoutes[selectedTransitIndex].boardStop && (
                <Marker position={[parseFloat(transitRoutes[selectedTransitIndex].boardStop.lat), parseFloat(transitRoutes[selectedTransitIndex].boardStop.long)]}>
                  <Popup>Board Here: {transitRoutes[selectedTransitIndex].boardStop.name_en}</Popup>
                </Marker>
              )}

              {transitRoutes[selectedTransitIndex].alightStop && (
                <Marker position={[parseFloat(transitRoutes[selectedTransitIndex].alightStop.lat), parseFloat(transitRoutes[selectedTransitIndex].alightStop.long)]}>
                  <Popup>Alight Here: {transitRoutes[selectedTransitIndex].alightStop.name_en}</Popup>
                </Marker>
              )}
            </>
          )}

        </MapContainer>
      </div>
    </div>
  );
};

export default TripPlanner;
