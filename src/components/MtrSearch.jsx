import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Train, Search } from 'lucide-react';
import mtrData from '../data/mtr_lines.json';

const mtrLines = [
  { line: 'AEL', name_en: 'Airport Express', name_tc: '機場快綫', name_sc: '机场快线' },
  { line: 'TCL', name_en: 'Tung Chung Line', name_tc: '東涌綫', name_sc: '东涌线' },
  { line: 'TML', name_en: 'Tuen Ma Line', name_tc: '屯馬綫', name_sc: '屯马线' },
  { line: 'TKL', name_en: 'Tseung Kwan O Line', name_tc: '將軍澳綫', name_sc: '将军澳线' },
  { line: 'EAL', name_en: 'East Rail Line', name_tc: '東鐵綫', name_sc: '东铁线' },
  { line: 'SIL', name_en: 'South Island Line', name_tc: '南港島綫', name_sc: '南港岛线' },
  { line: 'TWL', name_en: 'Tsuen Wan Line', name_tc: '荃灣綫', name_sc: '荃湾线' },
  { line: 'ISL', name_en: 'Island Line', name_tc: '港島綫', name_sc: '港岛线' },
  { line: 'KTL', name_en: 'Kwun Tong Line', name_tc: '觀塘綫', name_sc: '观塘线' }
];

const MtrSearch = () => {
  const { t, i18n } = useTranslation();
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedSta, setSelectedSta] = useState('');
  const [etas, setEtas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMtrEta = async (line, sta) => {
    if (!line || !sta) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}`);
      const data = await response.json();

      if (data.status === 1 && data.data) {
        setEtas(data.data[`${line}-${sta}`]);
      } else {
        setEtas(null);
        setError("No data available.");
      }
    } catch (err) {
      setError("Failed to fetch MTR ETAs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLine && selectedSta) {
      fetchMtrEta(selectedLine, selectedSta);
    }
  }, [selectedLine, selectedSta]);

  return (
    <div className="flex flex-col gap-6 h-full p-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/30">
          <Train className="text-red-600 dark:text-red-400" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mtr')} Next Train</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Line</label>
          <select
            className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedLine}
            onChange={(e) => {
              setSelectedLine(e.target.value);
              setSelectedSta('');
              setEtas(null);
            }}
          >
            <option value="">Select Line</option>
            {mtrLines.map(line => (
              <option key={line.line} value={line.line}>
                {i18n.language === 'en' ? line.name_en : line.name_tc}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('originStation')}</label>
          <select
            className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            value={selectedSta}
            onChange={(e) => setSelectedSta(e.target.value)}
            disabled={!selectedLine}
          >
            <option value="">Select Station</option>
            {selectedLine && mtrData[selectedLine]?.stations && Object.entries(mtrData[selectedLine].stations).map(([staCode, staDetails]) => (
              <option key={staCode} value={staCode}>
                {i18n.language === 'en' ? staDetails.name_en : staDetails.name_tc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-center py-10 text-slate-500">{t('loading')}</div>}
      {error && <div className="text-center text-red-500 py-10">{error}</div>}

      {etas && !loading && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UP direction (e.g. to Central) */}
          {etas.UP && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {t('to')} {i18n.language === 'en' ? etas.UP[0]?.dest || 'Destination' : etas.UP[0]?.dest || '終點'}
              </h3>
              <div className="space-y-3">
                {etas.UP.map((train, idx) => {
                  // MTR ETA returns a time format like "2023-01-01 12:00:00"
                  const etaTime = new Date(train.time.replace(' ', 'T')).getTime();
                  const now = new Date().getTime();
                  const diffMins = Math.max(0, Math.ceil((etaTime - now) / 60000));

                  return (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        Plat {train.plat}
                      </span>
                      <span className={`font-bold text-lg ${diffMins <= 2 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {diffMins === 0 ? t('arriving') : `${diffMins} ${t('mins')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOWN direction */}
          {etas.DOWN && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {t('to')} {i18n.language === 'en' ? etas.DOWN[0]?.dest || 'Destination' : etas.DOWN[0]?.dest || '終點'}
              </h3>
              <div className="space-y-3">
                {etas.DOWN.map((train, idx) => {
                  const etaTime = new Date(train.time.replace(' ', 'T')).getTime();
                  const now = new Date().getTime();
                  const diffMins = Math.max(0, Math.ceil((etaTime - now) / 60000));

                  return (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        Plat {train.plat}
                      </span>
                      <span className={`font-bold text-lg ${diffMins <= 2 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {diffMins === 0 ? t('arriving') : `${diffMins} ${t('mins')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MtrSearch;
