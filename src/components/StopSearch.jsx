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
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
};

const StopSearch = () => {
  const { t, i18n } = useTranslation();
  const { stops, loading, error, nearestStop } = useKmbData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [etas, setEtas] = useState({});
  const [etaLoading, setEtaLoading] = useState(false);

  // Track if we've auto-selected the nearest stop
  const [autoSelected, setAutoSelected] = useState(false);

  const getStopName = (stop) => {
    if (!stop) return "";
    if (i18n.language === 'en') return stop.name_en;
    if (i18n.language === 'zh_Hans') return stop.name_sc;
    return stop.name_tc;
  };

  // Auto-select nearest stop once available
  useEffect(() => {
    if (nearestStop && !selectedStop && !autoSelected) {
      setSelectedStop(nearestStop);
      setAutoSelected(true);
      handleStopClick(nearestStop);
    }
  }, [nearestStop, selectedStop, autoSelected]);

  // Filter stops based on search term
  const filteredStops = stops.filter(s => {
    if (searchTerm.length === 0) return false;
    const term = searchTerm.toLowerCase();
    return s.name_en?.toLowerCase().includes(term) ||
           s.name_tc?.includes(term) ||
           s.name_sc?.includes(term);
  });

  const handleSelectStop = (stop) => {
    setSelectedStop(stop);
    setSearchTerm(getStopName(stop));
    handleStopClick(stop);
  };

  // Fetch all ETAs for the clicked stop
  const handleStopClick = async (stop) => {
    if (!stop) return;
    setEtaLoading(true);
    setSelectedStop(stop);

    try {
      const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stop.stop}`);
      const data = await response.json();

      if (data && data.data) {
        // Group ETAs by route
        const groupedEtas = {};
        data.data.forEach(eta => {
          if (!eta.eta) return;
          if (!groupedEtas[eta.route]) {
            groupedEtas[eta.route] = {
              dest_en: eta.dest_en,
              dest_tc: eta.dest_tc,
              dest_sc: eta.dest_sc,
              times: []
            };
          }
          groupedEtas[eta.route].times.push(eta);
        });

        // Sort times and take next 3 for each route
        Object.keys(groupedEtas).forEach(route => {
          groupedEtas[route].times.sort((a, b) => new Date(a.eta) - new Date(b.eta));
          groupedEtas[route].times = groupedEtas[route].times.slice(0, 3);
        });

        setEtas({ [stop.stop]: groupedEtas });
      }
    } catch (err) {
      console.error("Failed to fetch ETAs", err);
    } finally {
      setEtaLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;
  if (error) return <div className="text-center text-red-500 py-10">{t('error')}</div>;

  const mapCenter = selectedStop ? [selectedStop.lat, selectedStop.long] : [22.3193, 114.1694];

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
            placeholder={t('searchStopPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {searchTerm.length > 0 && filteredStops.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4">{t('noStopsFound')}</div>
          )}

          {filteredStops.slice(0, 50).map((stop) => (
            <div
              key={stop.stop}
              onClick={() => handleSelectStop(stop)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedStop?.stop === stop.stop
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{getStopName(stop)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Map */}
      <div className="w-full md:w-2/3 h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
        <MapContainer center={mapCenter} zoom={selectedStop ? 16 : 11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />

          {selectedStop && (
            <Marker
              position={[selectedStop.lat, selectedStop.long]}
              eventHandlers={{
                click: () => handleStopClick(selectedStop),
              }}
            >
              <Popup className="rounded-xl min-w-[200px]" autoPan={false}>
                <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <h3 className="font-bold text-slate-800 mb-3 border-b pb-2 sticky top-0 bg-white z-10">
                    {getStopName(selectedStop)}
                  </h3>

                  {etaLoading && !etas[selectedStop.stop] ? (
                    <div className="text-sm text-slate-500">{t('loading')}</div>
                  ) : etas[selectedStop.stop] && Object.keys(etas[selectedStop.stop]).length > 0 ? (
                    <div className="space-y-4">
                      {Object.keys(etas[selectedStop.stop]).map(route => {
                        const routeInfo = etas[selectedStop.stop][route];
                        const dest = i18n.language === 'en' ? routeInfo.dest_en : (i18n.language === 'zh_Hans' ? routeInfo.dest_sc : routeInfo.dest_tc);

                        return (
                          <div key={route} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">{route}</span>
                              <span className="text-xs text-slate-600 truncate">{t('to')} {dest}</span>
                            </div>
                            <div className="space-y-1">
                              {routeInfo.times.map((etaObj, idx) => {
                                const etaTime = new Date(etaObj.eta).getTime();
                                const now = new Date().getTime();
                                const diffMins = Math.max(0, Math.ceil((etaTime - now) / 60000));

                                return (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="font-mono text-slate-500">{etaObj.eta.split('T')[1].substring(0,5)}</span>
                                    <span className={`font-bold ${diffMins <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                                      {diffMins === 0 ? t('arriving') : `${diffMins} ${t('mins')}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No ETA data</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default StopSearch;
