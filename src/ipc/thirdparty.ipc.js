const { ipcMain, dialog } = require('electron')
const thirdparty = require('../providers/thirdparty')

ipcMain.handle('thirdparty:searchSteamGame', async (_, query) => {
    return await thirdparty.searchSteamGame(query)
})

ipcMain.handle('thirdparty:selectGame', async (_, gamePath, appid) => {
    return await thirdparty.selectGame(gamePath, appid)
})

ipcMain.handle('thirdparty:getGameImages', async (_, gamePath) => {
    return thirdparty.getGameImages(gamePath)
})

ipcMain.handle('thirdparty:pickGameExecutable', async () => {

    const result = await dialog.showOpenDialog({
        title: 'Select Game Executable',
        properties: ['openFile'],
        filters: [
            {
                name: 'Executables',
                extensions: ['exe']
            }
        ]
    })

    if (result.canceled) {
        return null
    }

    return result.filePaths[0]
})

ipcMain.handle('thirdparty:getInstalledGames', async () => {
    return thirdparty.getInstalledGames()
})