const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const preferences = require('./src/services/preferences')

if (!fs.existsSync(preferences.prefsPath)) {
    preferences.savePreferences(preferences.DEFAULT_PREFERENCES)
} else {
    preferences.loadPreferences()
}
function createWindow() {
    const window = new BrowserWindow({

        width: 1280,
        height: 720,
        minWidth: 900,
        minHeight: 500,
        show: false,

        title: 'Kydra',

        icon: path.join(__dirname, 'art', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })

    window.loadFile(path.join(__dirname, 'src/renderer/index.html'))

    window.setBackgroundColor('#0d0d0d')
    window.center()

    window.once('ready-to-show', () => {
        window.show()
    })

    window.setMenu(null)

}

app.whenReady().then(() => {
    require('./src/ipc/steam.ipc')
    require('./src/ipc/preferences.ipc')
    require('./src/ipc/thirdparty.ipc')

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
