const { ipcMain } = require('electron')
const getSponsoredHero = require('../api/sponsored/get')

ipcMain.handle('get-sponsored-hero', async () => {
    return await getSponsoredHero.loadHero()
})