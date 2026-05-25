const { ipcMain } = require('electron')
const itchio = require('../providers/itchio')

ipcMain.handle('itchio:getItchDeals', async () => {
    return await itchio.getItchDeals()
})

ipcMain.handle('itchio:getLatestGames', async () => {
    return await itchio.getLatestGames()
})
