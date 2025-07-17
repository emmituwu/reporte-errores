const { app, ipcMain } = require('electron')
const createMainWindow = require('./window')

// estado compartido entre handlers
const sharedState = {
  lastSavedVideoPath: ''
}

// registrar handlers IPC
require('./handlers/video')(ipcMain, sharedState)
require('./handlers/system')(ipcMain)
require('./handlers/report')(ipcMain)

app.whenReady().then(createMainWindow)

// cerrar aplicación cuando todas las ventanas se cierren (excepto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 