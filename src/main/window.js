const { BrowserWindow } = require('electron')
const path = require('path')

function createMainWindow () {
  const win = new BrowserWindow({
    width: 700,
    height: 800,
    autoHideMenuBar: true, // oculta la barra de menú por defecto
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '..', '..', 'preload.js')
    }
  })

  // Aseguramos que la barra no sea visible
  win.setMenuBarVisibility(false)

  win.loadFile('views/welcome.html')
}

module.exports = createMainWindow 