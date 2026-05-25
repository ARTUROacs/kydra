const { ipcMain } = require('electron');
const translations = require('../services/translations');

ipcMain.handle('translations:getAll', (_, language) => {
  return translations.loadTranslation(language);
});
