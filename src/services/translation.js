const fs = require('fs');
const path = require('path');

const AVAILABLE_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  pt: { name: 'Português', flag: '🇧🇷' }
};

const DEFAULT_LANGUAGE = 'pt';
let translations = {};

function loadTranslations() {
  translations = {};
  const translationsDir = path.resolve(__dirname, '..', '..', 'tl');
  
  Object.keys(AVAILABLE_LANGUAGES).forEach(lang => {
    const filePath = path.join(translationsDir, lang, 'translation.json');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      translations[lang] = JSON.parse(content);
    } catch (error) {
      console.error(`[translation] failed to load ${lang}:`, error);
      translations[lang] = {};
    }
  });
}

function getLanguages() {
  return AVAILABLE_LANGUAGES;
}

function getDefaultLanguage() {
  return DEFAULT_LANGUAGE;
}

function translate(key, language = DEFAULT_LANGUAGE, defaultValue = key) {
  if (!translations[language]) return defaultValue;
  
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value && typeof value === 'string' ? value : defaultValue;
}

function interpolate(text, variables = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
}

function getTranslation(key, language = DEFAULT_LANGUAGE, variables = {}) {
  const text = translate(key, language);
  return variables && Object.keys(variables).length > 0 
    ? interpolate(text, variables)
    : text;
}

function getAllTranslations(language = DEFAULT_LANGUAGE) {
  return translations[language] || {};
}

loadTranslations();

module.exports = {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  loadTranslations,
  getLanguages,
  getDefaultLanguage,
  translate,
  getTranslation,
  getAllTranslations,
  interpolate
};
