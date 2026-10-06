import React, { useEffect } from 'react';
import TransitEta from './components/TransitEta';
import { requestForToken, onMessageListener } from './firebase';

function App() {
  useEffect(() => {
    // Request notification permission and get token
    requestForToken();

    // Handle foreground messages
    onMessageListener()
      .then((payload) => {
        console.log("Foreground message received:", payload);
        // You can add a toast notification here in the future
      })
      .catch((err) => console.log('failed: ', err));
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            HK Transit
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Real-time ETAs for your daily commute.
          </p>
        </div>

        <TransitEta />
      </div>
    </div>
  );
}

export default App;
