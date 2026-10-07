import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import TransitEta from './components/TransitEta';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('route');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-8 px-2 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
        <div className="max-w-5xl mx-auto">
          <Header />

          {/* Tab Slider UI */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] inline-flex flex-wrap justify-center border border-slate-100 dark:border-slate-700/50 gap-1 sm:gap-0">
              <button
                onClick={() => setActiveTab('route')}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === 'route'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {t('searchByRoute')}
              </button>
              <button
                onClick={() => setActiveTab('stop')}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === 'stop'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {t('searchByStop')}
              </button>
              <button
                onClick={() => setActiveTab('mtr')}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === 'mtr'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {t('mtr')}
              </button>
              <button
                onClick={() => setActiveTab('trip')}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === 'trip'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {t('tripPlan')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700/50 min-h-[600px] flex flex-col transition-colors duration-200">
            <TransitEta type={activeTab} />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
