const { BrowserWindow } = require('electron')
const path = require('path')

function createMainWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '..', '..', 'preload.js')
    }
  })

  win.loadFile('views/welcome.html')
}

module.exports = createMainWindow 