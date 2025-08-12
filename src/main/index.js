require('dotenv').config()
const { app, ipcMain } = require('electron')
const path = require('path')
const createMainWindow = require('./window')

// Hot reload en desarrollo
if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(path.join(__dirname, '..', '..'), {
    electron: require(path.join(__dirname, '..', '..', 'node_modules', 'electron')),
    awaitWriteFinish: true
  })
}

// estado compartido entre handlers
const sharedState = {
  lastSavedVideoPath: ''
}



// registrar handlers IPC
require('./handlers/video')(ipcMain, sharedState)
require('./handlers/system')(ipcMain)
require('./handlers/report')(ipcMain, sharedState)

app.whenReady().then(createMainWindow)

// cerrar aplicación cuando todas las ventanas se cierren (excepto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 