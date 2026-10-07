import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import TransitEta from './components/TransitEta';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('route'); // 'route' or 'stop'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Header />

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight sm:text-5xl drop-shadow-sm">
            {t('appTitle')}
          </h1>
          <p className="mt-4 text-lg text-slate-500 font-medium">
            {t('appSubtitle')}
          </p>
        </div>

        {/* Tab Slider UI */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl shadow-sm inline-flex border border-slate-200">
            <button
              onClick={() => setActiveTab('route')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'route'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('searchByRoute')}
            </button>
            <button
              onClick={() => setActiveTab('stop')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'stop'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('searchByStop')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 min-h-[600px]">
          {activeTab === 'route' ? (
            <TransitEta type="route" />
          ) : (
            <TransitEta type="stop" />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
