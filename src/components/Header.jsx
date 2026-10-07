import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInTimeZone } from 'date-fns-tz';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Command } from 'lucide-react';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Prevent hydration mismatch for next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const hkTime = formatInTimeZone(currentTime, 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm:ss');

  if (!mounted) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10 w-full px-4 mt-4">
      {/* Container simulating the "Island" */}
      <div className="flex flex-wrap items-center justify-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700/50">

        {/* GO! Icon / Home */}
        <div
          onClick={() => window.location.href = '/go/'}
          className="flex items-center justify-center h-12 px-4 gap-2 rounded-full bg-slate-50 dark:bg-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shrink-0"
        >
          <Command className="text-indigo-600 dark:text-indigo-400" size={20} />
          <span className="font-bold text-slate-800 dark:text-white">GO!</span>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-700 rounded-full p-1 h-12">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Sun size={20} />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Monitor size={20} />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Moon size={20} />
          </button>
        </div>

        {/* Date/Time (Text directly on island) */}
        <div className="hidden md:flex items-center justify-center px-4 h-12 text-sm font-mono font-medium text-slate-600 dark:text-slate-300 bg-transparent">
          {hkTime} HKT
        </div>

        {/* Language Switch */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-700 rounded-full p-1 h-12">
          <button
            onClick={() => changeLanguage('en')}
            className={`flex items-center justify-center px-3 h-10 rounded-full text-sm font-semibold transition-all ${i18n.language === 'en' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('zh_Hant')}
            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${i18n.language === 'zh_Hant' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            繁
          </button>
          <button
            onClick={() => changeLanguage('zh_Hans')}
            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${i18n.language === 'zh_Hans' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            简
          </button>
        </div>
      </div>

      {/* Date/Time for Mobile (Below the island to save space) */}
      <div className="md:hidden flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 shadow-sm border border-slate-100 dark:border-slate-700/50">
        {hkTime} HKT
      </div>
    </div>
  );
};

export default Header;
