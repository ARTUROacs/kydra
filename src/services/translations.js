const fs = require('fs');
const path = require('path');

function getTranslationPath(language) {
  const langs = {
    'pt': 'pt',
    'pt-BR': 'pt',
    'en': 'en',
    'en-US': 'en'
  };
  const lang = langs[language] || 'en';
  return path.resolve(__dirname, '..', '..', 'tl', lang, 'translation.json');
}

function loadTranslation(language) {
  try {
    const filePath = getTranslationPath(language);
    if (!fs.existsSync(filePath)) {
      console.warn(`[translations] File not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const translation = JSON.parse(content);
    console.log(`[translations] Loaded ${language}:`, Object.keys(translation).length, 'keys');
    return translation;
  } catch (error) {
    console.error(`[translations] Failed to load ${language}:`, error);
    return null;
  }
}

module.exports = {
  loadTranslation,
  getTranslationPath
};
