const { BrowserWindow, desktopCapturer } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

module.exports = (ipcMain, state) => {
  // obtener fuentes de pantalla
  ipcMain.handle('get-sources', async () => {
    return await desktopCapturer.getSources({ types: ['screen'] })
  })
  
  // guardar video capturado
  ipcMain.handle('save-video', async (_event, buffer) => {
    try {
      const rootReportsDir = path.join('C:\\', 'Reporte de errores')
      if (!fs.existsSync(rootReportsDir)) {
        fs.mkdirSync(rootReportsDir, { recursive: true })
      }

      const today = new Date().toISOString().slice(0, 10)
      const reportsDir = path.join(rootReportsDir, today)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }

      // NUEVO: crear carpeta por usuario dentro de la carpeta de la fecha
      const userName = os.userInfo().username
      const userDir = path.join(reportsDir, userName)
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true })
      }

      const filePath = path.join(userDir, `grabacion-${Date.now()}.webm`)
      fs.writeFileSync(filePath, buffer)

      // actualizar estado compartido
      if (state) state.lastSavedVideoPath = filePath

      // cargar formulario en la ventana principal
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) mainWindow.loadFile('views/form.html')

      return { success: true, filePath }
    } catch (error) {
      console.error('Error al guardar video:', error)
      return { success: false, error: error.message }
    }
  })

  // proporcionar la última ruta guardada
  ipcMain.handle('get-video-path', () => state?.lastSavedVideoPath || '')

  // eliminar video guardado
  ipcMain.handle('delete-video', async () => {
    try {
      if (state && state.lastSavedVideoPath && fs.existsSync(state.lastSavedVideoPath)) {
        fs.unlinkSync(state.lastSavedVideoPath)
        state.lastSavedVideoPath = ''
      }
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar video:', error)
      return { success: false, error: error.message }
    }
  })
} 