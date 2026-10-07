import { useState, useEffect } from 'react';

// Caching to prevent refetching during session
let cachedRoutes = null;
let cachedStops = null;

// Haversine distance formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

export const useKmbData = () => {
  const [routes, setRoutes] = useState(cachedRoutes || []);
  const [stops, setStops] = useState(cachedStops || []);
  const [loading, setLoading] = useState(!cachedRoutes || !cachedStops);
  const [error, setError] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [nearestStop, setNearestStop] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (cachedRoutes && cachedStops) {
        return; // Use cache
      }

      try {
        setLoading(true);
        // Fetch all routes
        const routesResponse = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
        const routesData = await routesResponse.json();

        // Fetch all stops
        const stopsResponse = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
        const stopsData = await stopsResponse.json();

        if (routesData?.data) {
          cachedRoutes = routesData.data;
          setRoutes(routesData.data);
        }

        if (stopsData?.data) {
          cachedStops = stopsData.data;
          setStops(stopsData.data);

          // Once we have stops, try to get user location
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);

                // Find nearest stop
                let minDistance = Infinity;
                let closest = null;

                stopsData.data.forEach(stop => {
                  const dist = calculateDistance(latitude, longitude, parseFloat(stop.lat), parseFloat(stop.long));
                  if (dist < minDistance) {
                    minDistance = dist;
                    closest = stop;
                  }
                });

                setNearestStop(closest);
              },
              (err) => {
                console.log("Geolocation error or denied:", err);
              }
            );
          }
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Also handle the case where cached data exists but location isn't fetched yet
  useEffect(() => {
    if (cachedStops && !userLocation && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation([latitude, longitude]);

              let minDistance = Infinity;
              let closest = null;

              cachedStops.forEach(stop => {
                const dist = calculateDistance(latitude, longitude, parseFloat(stop.lat), parseFloat(stop.long));
                if (dist < minDistance) {
                  minDistance = dist;
                  closest = stop;
                }
              });

              setNearestStop(closest);
            },
            (err) => console.log("Geolocation error or denied:", err)
          );
    }
  }, [stops]);

  return { routes, stops, loading, error, userLocation, nearestStop };
};
