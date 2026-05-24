const { ipcMain } = require('electron');
const translation = require('../services/translation');

ipcMain.handle('translation:getLanguages', () => {
  return translation.getLanguages();
});

ipcMain.handle('translation:getDefaultLanguage', () => {
  return translation.getDefaultLanguage();
});

ipcMain.handle('translation:getTranslation', (_, key, language, variables) => {
  return translation.getTranslation(key, language, variables);
});

ipcMain.handle('translation:getAllTranslations', (_, language) => {
  return translation.getAllTranslations(language);
});

ipcMain.handle('translation:translate', (_, key, language) => {
  return translation.translate(key, language);
});
