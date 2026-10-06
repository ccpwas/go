import React, { useState, useEffect } from 'react';

const TransitEta = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const json = await response.json();
        // Just take the first 10 for demonstration
        setRoutes(json.data.slice(0, 10));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">KMB Routes</h2>
        <div className="space-y-4">
          {routes.map((route, index) => (
            <div key={`${route.route}-${index}`} className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-red-500 text-white font-bold py-2 px-4 rounded-xl shadow-sm">
                  {route.route}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wider text-xs">To</span>
                  <span className="font-medium text-gray-800">{route.dest_tc || route.dest_en}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransitEta;
