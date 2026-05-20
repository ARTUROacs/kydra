const { ipcMain } = require('electron')
const preferences = require('../services/preferences')

ipcMain.handle('preferences:save', async (_, prefs) => {
    return await preferences.savePreferences(prefs)
})

ipcMain.handle('preferences:load', () => {
    return preferences.loadPreferences()
})

ipcMain.handle('preferences:get', async (_, key) => {
    return await preferences.getPreference(key)
})

ipcMain.handle('preferences:set', async (_, key, value) => {
    return await preferences.setPreference(key, value)
})