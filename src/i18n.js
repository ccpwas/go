import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appTitle: "HK Transit",
      appSubtitle: "Real-time ETAs for your daily commute.",
      searchByRoute: "Search by Route",
      searchByStop: "Search by Stop",
      searchRoutePlaceholder: "Enter route (e.g., 1A)",
      searchStopPlaceholder: "Enter stop name...",
      loading: "Loading...",
      error: "Error loading data.",
      noRoutesFound: "No routes found.",
      noStopsFound: "No stops found.",
      to: "To",
      mins: "mins",
      arriving: "Arriving",
      selectStopMap: "Select a stop on the map to see ETAs",
      eta: "ETA",
      nextBuses: "Next Buses",
      language: "Language",
      route: "Route",
      mtr: "MTR",
      tripPlan: "Trip Planning",
      originStation: "Origin Station",
      destStation: "Destination Station",
      startPoint: "Start Point",
      endPoint: "End Point",
      addWaypoint: "Add Waypoint",
      calculate: "Calculate Route"
    }
  },
  zh_Hant: {
    translation: {
      appTitle: "香港交通",
      appSubtitle: "您的日常通勤實時到站時間。",
      searchByRoute: "按路線搜尋",
      searchByStop: "按車站搜尋",
      searchRoutePlaceholder: "輸入路線 (例如: 1A)",
      searchStopPlaceholder: "輸入車站名稱...",
      loading: "載入中...",
      error: "載入資料時發生錯誤。",
      noRoutesFound: "找不到路線。",
      noStopsFound: "找不到車站。",
      to: "往",
      mins: "分鐘",
      arriving: "即將抵達",
      selectStopMap: "在地圖上選擇車站查看到站時間",
      eta: "預計到達時間",
      nextBuses: "下一班車",
      language: "語言",
      route: "路線",
      mtr: "港鐵",
      tripPlan: "行程規劃",
      originStation: "起點站",
      destStation: "終點站",
      startPoint: "起點",
      endPoint: "終點",
      addWaypoint: "新增途經點",
      calculate: "計算路線"
    }
  },
  zh_Hans: {
    translation: {
      appTitle: "香港交通",
      appSubtitle: "您的日常通勤实时到站时间。",
      searchByRoute: "按路线搜索",
      searchByStop: "按车站搜索",
      searchRoutePlaceholder: "输入路线 (例如: 1A)",
      searchStopPlaceholder: "输入车站名称...",
      loading: "加载中...",
      error: "加载数据时发生错误。",
      noRoutesFound: "找不到路线。",
      noStopsFound: "找不到车站。",
      to: "往",
      mins: "分钟",
      arriving: "即将抵达",
      selectStopMap: "在地图上选择车站查看到站时间",
      eta: "预计到达时间",
      nextBuses: "下一班车",
      language: "语言",
      route: "路线",
      mtr: "港铁",
      tripPlan: "行程规划",
      originStation: "起点站",
      destStation: "终点站",
      startPoint: "起点",
      endPoint: "终点",
      addWaypoint: "新增途经点",
      calculate: "计算路线"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
