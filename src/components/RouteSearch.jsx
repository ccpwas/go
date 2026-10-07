import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeftRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useKmbData } from '../hooks/useKmbData';
import { GpsMarker } from './GpsMarker';
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
  const { routes, stops, loading, error, nearestStop, userLocation } = useKmbData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentBound, setCurrentBound] = useState('inbound'); // 'inbound' or 'outbound'
  const [routeStops, setRouteStops] = useState([]);
  const [etas, setEtas] = useState({});
  const [etaLoading, setEtaLoading] = useState(false);

  // Filter routes based on search
  const filteredRoutes = routes.filter(r =>
    // Exact match first, then startsWith, then includes to prevent '268M' from popping up first when typing '68M'
    r.route.toLowerCase() === searchTerm.toLowerCase() || r.route.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  // Get unique routes to avoid displaying multiple bounds initially
  let uniqueRoutes = [];
  const routeMap = new Map();
  for (const item of filteredRoutes) {
    if (!routeMap.has(item.route)) {
        routeMap.set(item.route, true);
        uniqueRoutes.push(item);
    }
  }

  // Sort unique routes so that exact matches are at the top
  uniqueRoutes.sort((a, b) => {
    const aExact = a.route.toLowerCase() === searchTerm.toLowerCase();
    const bExact = b.route.toLowerCase() === searchTerm.toLowerCase();
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.route.localeCompare(b.route);
  });

  // Fetch stops for a selected route
  const fetchRouteStops = async (route, bound) => {
    try {
      // Fetch the sequence of stop IDs for this route and bound
      const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${bound}/1`);
      let data = await response.json();

      // If data is empty for the requested bound, it might be a circular route or only run one way
      if (!data.data || data.data.length === 0) {
        const altBound = bound === 'inbound' ? 'outbound' : 'inbound';
        const responseAlt = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${altBound}/1`);
        data = await responseAlt.json();
        setCurrentBound(altBound); // Update UI to reflect the actual available bound
      }

      const stopSequence = data.data || [];

      // Map the sequence to coordinates and names from our cached global stops
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

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setSearchTerm(route.route);
    setEtas({});
    // Default to inbound initially
    setCurrentBound('inbound');
    fetchRouteStops(route, 'inbound');
  };

  const toggleBound = () => {
    if (!selectedRoute) return;
    const newBound = currentBound === 'inbound' ? 'outbound' : 'inbound';
    setCurrentBound(newBound);
    // When switching bounds, reset routeStops and ETAs so old ones don't linger
    setRouteStops([]);
    setEtas({});
    fetchRouteStops(selectedRoute, newBound);
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
      <div className="w-full md:w-1/3 flex flex-col h-[300px] md:h-[500px] shrink-0">
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

          {searchTerm.length > 0 && uniqueRoutes.slice(0, 50).map((route) => {
            const isSelected = selectedRoute?.route === route.route;

            // To figure out the correct destination name for the current bound, we try to find the matching route object
            // The API returns two records for each route, one for each bound.
            let displayDestEn = route.dest_en;
            let displayDestTc = route.dest_tc;
            let displayDestSc = route.dest_sc;

            if (isSelected) {
               // The KMB API bound mapping: 'O' is outbound, 'I' is inbound
               const apiBoundChar = currentBound === 'outbound' ? 'O' : 'I';
               // Find the specific route record that matches the current bound
               const matchingBoundRoute = routes.find(r => r.route === route.route && r.bound === apiBoundChar) || route;
               displayDestEn = matchingBoundRoute.dest_en;
               displayDestTc = matchingBoundRoute.dest_tc;
               displayDestSc = matchingBoundRoute.dest_sc;
            }

            return (
              <div
                key={route.route}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm'
                    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
              >
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => !isSelected && handleSelectRoute(route)}
                >
                  <div className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-sm shrink-0">
                    {route.route}
                  </div>
                  <div className="flex flex-col text-sm flex-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{t('to')}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {i18n.language === 'en' ? displayDestEn : (i18n.language === 'zh_Hans' ? displayDestSc : displayDestTc)}
                    </span>
                  </div>
                </div>

                {/* Show Switch Direction Button only when selected */}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBound();
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 py-2 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                  >
                    <ArrowLeftRight size={14} />
                    Switch Direction
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content: Map */}
      <div className="w-full md:w-2/3 h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative shrink-0">
        {!selectedRoute && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <p className="text-slate-500 font-medium px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              {t('searchRoutePlaceholder')}
            </p>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={11} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            className="map-tiles"
          />
          <MapUpdater center={mapCenter} />

          {userLocation && <GpsMarker position={userLocation} />}

          {routeStops.length > 0 && (
            <Polyline
              positions={routeStops.map(stop => [parseFloat(stop.lat), parseFloat(stop.long)])}
              color="#ef4444"
              weight={5}
              opacity={0.8}
            />
          )}

          {stops.map((stop) => {
            // Is this stop part of the selected route?
            const isRouteStop = routeStops.some(rs => rs.stop === stop.stop);
            const isNearest = nearestStop && stop.stop === nearestStop.stop;

            // Only show popups for selected route stops or the nearest stop initially
            if (!isRouteStop && !isNearest) {
              return (
                <Marker
                  key={stop.stop}
                  position={[parseFloat(stop.lat), parseFloat(stop.long)]}
                  opacity={0.3} // Fade out non-route stops
                />
              )
            }

            return (
            <Marker
              key={stop.stop}
              position={[parseFloat(stop.lat), parseFloat(stop.long)]}
              eventHandlers={{
                click: () => isRouteStop ? handleStopClick(stop.stop) : null,
              }}
              opacity={isRouteStop ? 1 : 0.8}
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
                    <div className="text-sm text-slate-500">
                      {isRouteStop ? 'Click to load ETAs' : 'Your closest stop. Search a route to see its path!'}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteSearch;
