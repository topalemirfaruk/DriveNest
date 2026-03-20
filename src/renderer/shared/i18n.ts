import { Locale, TranslationDictionary, TranslationKey } from './i18n/types';
import { tr } from './i18n/locales/tr';
import { en } from './i18n/locales/en';
import { es } from './i18n/locales/es';
import { fr } from './i18n/locales/fr';
import { de } from './i18n/locales/de';
import { it } from './i18n/locales/it';
import { pt } from './i18n/locales/pt';
import { ru } from './i18n/locales/ru';
import { zh } from './i18n/locales/zh';
import { ja } from './i18n/locales/ja';
import { ko } from './i18n/locales/ko';
import { ar } from './i18n/locales/ar';

const dictionaries: Record<Locale, TranslationDictionary> = {
  tr, en, es, fr, de, it, pt, ru, zh, ja, ko, ar
};

let currentLocale: Locale = 'en';

export const setLocale = (locale: string) => {
  const code = locale.split('-')[0].toLowerCase() as Locale;
  if (dictionaries[code]) {
    currentLocale = code;
  } else {
    currentLocale = 'en';
  }
};

export const getLocale = () => currentLocale;

export const t = (key: TranslationKey, params?: Record<string, string>) => {
  let text = dictionaries[currentLocale][key] || dictionaries['en'][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
};

export type { TranslationKey };
