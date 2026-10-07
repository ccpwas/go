import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

// Create a custom DivIcon using the CSS we added
const createGpsIcon = () => {
  return L.divIcon({
    className: 'custom-gps-marker',
    html: `
      <div class="gps-container">
        <div class="gps-pulse-ring"></div>
        <div class="gps-dot"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const GpsMarker = ({ position }) => {
  const { t } = useTranslation();

  // position is passed as an array [lat, lng] from useKmbData
  if (!position || !Array.isArray(position) || position.length !== 2) return null;

  return (
    <Marker position={position} icon={createGpsIcon()}>
      <Popup>
        <div className="font-semibold text-slate-800 dark:text-slate-200">
          {t('yourLocation') || 'Your Location'}
        </div>
      </Popup>
    </Marker>
  );
};
