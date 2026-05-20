const { ipcMain } = require('electron')
const steam = require('../providers/steam')
const steamLogin = require('../services/steam-login')

ipcMain.handle('steam:getGameDetails', async (_, appid) => {
    return await steam.getGameDetails(appid)
})

ipcMain.handle('steam:launchGame', async (_, appid) => {
    return await steam.launchGame(appid)
})

ipcMain.handle('steam:installGame', async (_, appid) => {
    return await steam.installGame(appid)
})

ipcMain.handle('steam:uninstallGame', async (_, appid) => {
    return await steam.uninstallGame(appid)
})

ipcMain.handle('steam:validateGameFiles', async (_, appid) => {
    return await steam.validateGameFiles(appid)
})

ipcMain.handle('steam:getAssets', (_, appid) => {
    return steam.getSteamAssets(appid)
})

ipcMain.handle('steam:getSteamDeals', async () => {
    return await steam.getSteamDeals()
})

ipcMain.handle('steam:openStorePage', async (_, appid) => {
    return await steam.openStorePage(appid)
})

ipcMain.handle('steam:login', async () => {
    return await steamLogin.login()
})