import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: require("../public/locales/en/common.json") },
    zh: { translation: require("../public/locales/zh/common.json") },
    // 添加更多语言...
  },
  lng: "zh", // 默认语言
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
