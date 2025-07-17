const os = require('os')

module.exports = (ipcMain) => {
  ipcMain.handle('get-system-info', () => ({
    computerName: os.hostname(),
    userName: os.userInfo().username
  }))
} 