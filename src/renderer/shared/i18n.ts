import { Locale, TranslationDictionary, TranslationKey } from './types';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { it } from './locales/it';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { ar } from './locales/ar';

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

export { TranslationKey };
