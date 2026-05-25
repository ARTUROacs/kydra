const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kydraAPI', {

    getGameDetails: (appid) =>
        ipcRenderer.invoke('steam:getGameDetails', appid),

    launchGame: (appid) =>
        ipcRenderer.invoke('steam:launchGame', appid),

    installGame: (appid) =>
        ipcRenderer.invoke('steam:installGame', appid),

    uninstallGame: (appid) =>
        ipcRenderer.invoke('steam:uninstallGame', appid),

    validateGameFiles: (appid) =>
        ipcRenderer.invoke('steam:validateGameFiles', appid),

    getAssets: (appid) =>
        ipcRenderer.invoke('steam:getAssets', appid),

    getSteamDeals: () =>
        ipcRenderer.invoke('steam:getSteamDeals'),

    openStorePage: (appid) =>
        ipcRenderer.invoke('steam:openStorePage', appid),

    loginSteam: () =>
        ipcRenderer.invoke('steam:login'),

    searchSteamGame: (query) =>
        ipcRenderer.invoke('thirdparty:searchSteamGame', query),

    getItchDeals: () =>
        ipcRenderer.invoke('itchio:getItchDeals'),

    getLatestGames: () =>
        ipcRenderer.invoke('itchio:getLatestGames'),

    selectGame: (gamePath, appid) =>
        ipcRenderer.invoke('thirdparty:selectGame', gamePath, appid),

    pickGameExecutable: () =>
        ipcRenderer.invoke('thirdparty:pickGameExecutable'),

    getGameImages: (gamePath) =>
        ipcRenderer.invoke('thirdparty:getGameImages', gamePath),

    savePreferences: (prefs) =>
        ipcRenderer.invoke('preferences:save', prefs),

    loadPreferences: () =>
        ipcRenderer.invoke('preferences:load'),

    getPreference: (key) =>
        ipcRenderer.invoke('preferences:get', key),

    setPreference: (key, value) =>
        ipcRenderer.invoke('preferences:set', key, value),

    getVersion: () =>
        ipcRenderer.invoke('app:getVersion'),

    checkUpdates: () =>
        ipcRenderer.invoke('app:checkUpdates'),

    getSponsoredHero: () =>
        ipcRenderer.invoke('get-sponsored-hero'),

    getAllTranslations: (language) =>
        ipcRenderer.invoke('translations:getAll', language)
})