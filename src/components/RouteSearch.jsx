import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useKmbData } from '../hooks/useKmbData';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically set map view
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const RouteSearch = () => {
  const { t, i18n } = useTranslation();
  const { routes, stops, loading, error, nearestStop } = useKmbData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [etas, setEtas] = useState({});
  const [etaLoading, setEtaLoading] = useState(false);

  // Filter routes based on search
  const filteredRoutes = routes.filter(r =>
    r.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique routes to avoid displaying multiple bounds initially
  const uniqueRoutes = [];
  const map = new Map();
  for (const item of filteredRoutes) {
    if (!map.has(item.route)) {
        map.set(item.route, true);
        uniqueRoutes.push(item);
    }
  }

  // Fetch stops for a selected route
  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    setSearchTerm(route.route);
    setEtas({}); // Clear previous ETAs

    try {
      // 1. Fetch the sequence of stop IDs for this route and bound
      const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/inbound/1`);
      // NOTE: For simplicity, we hardcode inbound/outbound "1". A robust app would allow user selection.
      let data = await response.json();

      if (!data.data || data.data.length === 0) {
        // Fallback to outbound if inbound has no stops
        const responseOut = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/outbound/1`);
        data = await responseOut.json();
      }

      const stopSequence = data.data;

      // 2. Map the sequence to coordinates and names from our cached global stops
      const detailedStops = stopSequence.map(seqStop => {
        const globalStop = stops.find(s => s.stop === seqStop.stop);
        return {
          ...seqStop,
          lat: globalStop?.lat,
          long: globalStop?.long,
          name_en: globalStop?.name_en,
          name_tc: globalStop?.name_tc,
          name_sc: globalStop?.name_sc
        };
      }).filter(s => s.lat && s.long);

      setRouteStops(detailedStops);

    } catch (err) {
      console.error("Failed to fetch route stops", err);
    }
  };

  // Fetch ETAs when a stop marker is clicked
  const handleStopClick = async (stopId) => {
    setEtaLoading(true);
    try {
      const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${selectedRoute.route}/${selectedRoute.service_type}`);
      const data = await response.json();

      if (data && data.data) {
        // Get the next 3 ETAs
        const nextBuses = data.data.filter(eta => eta.eta !== null).slice(0, 3);
        setEtas({ [stopId]: nextBuses });
      }
    } catch (err) {
      console.error("Failed to fetch ETAs", err);
    } finally {
      setEtaLoading(false);
    }
  };

  const getStopName = (stop) => {
    if (i18n.language === 'en') return stop.name_en;
    if (i18n.language === 'zh_Hans') return stop.name_sc;
    return stop.name_tc;
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;
  if (error) return <div className="text-center text-red-500 py-10">{t('error')}</div>;

  let mapCenter = [22.3193, 114.1694]; // Default HK
  if (routeStops.length > 0) {
    mapCenter = [routeStops[0].lat, routeStops[0].long];
  } else if (nearestStop) {
    mapCenter = [nearestStop.lat, nearestStop.long];
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar: Search */}
      <div className="w-full md:w-1/3 flex flex-col h-[500px]">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-700 placeholder-slate-400"
            placeholder={t('searchRoutePlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {searchTerm.length > 0 && uniqueRoutes.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4">{t('noRoutesFound')}</div>
          )}

          {searchTerm.length > 0 && uniqueRoutes.slice(0, 50).map((route) => (
            <div
              key={route.route}
              onClick={() => handleSelectRoute(route)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedRoute?.route === route.route
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-sm">
                  {route.route}
                </div>
                <div className="flex flex-col text-sm">
                  <span className="text-slate-500 text-xs">{t('to')}</span>
                  <span className="font-semibold text-slate-700">
                    {i18n.language === 'en' ? route.dest_en : (i18n.language === 'zh_Hans' ? route.dest_sc : route.dest_tc)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Map */}
      <div className="w-full md:w-2/3 h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
        {!selectedRoute && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <p className="text-slate-500 font-medium px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              {t('searchRoutePlaceholder')}
            </p>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />

          {routeStops.length === 0 && nearestStop && (
            <Marker position={[nearestStop.lat, nearestStop.long]}>
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-800 mb-2 border-b pb-1">{getStopName(nearestStop)}</h3>
                  <div className="text-sm text-slate-500">Your closest stop. Search a route to see its path!</div>
                </div>
              </Popup>
            </Marker>
          )}

          {routeStops.map((stop) => (
            <Marker
              key={stop.stop}
              position={[stop.lat, stop.long]}
              eventHandlers={{
                click: () => handleStopClick(stop.stop),
              }}
            >
              <Popup className="rounded-xl">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-800 mb-2 border-b pb-1">{getStopName(stop)}</h3>

                  {etaLoading && !etas[stop.stop] ? (
                    <div className="text-sm text-slate-500">{t('loading')}</div>
                  ) : etas[stop.stop] ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t('nextBuses')}:</p>
                      {etas[stop.stop].length > 0 ? (
                        etas[stop.stop].map((etaObj, idx) => {
                          // Calculate minutes
                          const etaTime = new Date(etaObj.eta).getTime();
                          const now = new Date().getTime();
                          const diffMins = Math.max(0, Math.ceil((etaTime - now) / 60000));

                          return (
                            <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 px-2 py-1 rounded">
                              <span className="font-mono text-slate-600">{etaObj.eta.split('T')[1].substring(0,5)}</span>
                              <span className={`font-bold ${diffMins <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                                {diffMins === 0 ? t('arriving') : `${diffMins} ${t('mins')}`}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-slate-500">No ETA data</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Click to load ETAs</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteSearch;
