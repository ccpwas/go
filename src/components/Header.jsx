import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Globe, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const hkTime = formatInTimeZone(currentTime, 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm:ss');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm mb-8 border border-white/60">
      <div className="flex items-center space-x-2 text-indigo-900 font-medium bg-indigo-50/50 px-4 py-2 rounded-xl">
        <Clock size={18} className="text-indigo-600" />
        <span className="font-mono">{hkTime} (HKT)</span>
      </div>

      <div className="flex items-center space-x-2 mt-4 sm:mt-0">
        <Globe size={18} className="text-gray-500" />
        <select
          onChange={changeLanguage}
          value={i18n.language}
          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer outline-none hover:border-indigo-300 transition-colors"
        >
          <option value="en">English</option>
          <option value="zh_Hant">繁體中文</option>
          <option value="zh_Hans">简体中文</option>
        </select>
      </div>
    </div>
  );
};

export default Header;
