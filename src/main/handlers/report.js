const fs = require('fs')
const path = require('path')
const os = require('os')

module.exports = (ipcMain, state) => {
  ipcMain.handle('save-error-report', async (_event, formData) => {
    try {
      // Crear estructura de carpetas: C:\Reporte de errores\fecha\usuario\
      const rootReportsDir = path.join('C:\\', 'Reporte de errores')
      if (!fs.existsSync(rootReportsDir)) {
        fs.mkdirSync(rootReportsDir, { recursive: true })
      }

      const today = new Date().toISOString().slice(0, 10)
      const reportsDir = path.join(rootReportsDir, today)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }

      const userName = os.userInfo().username
      const userDir = path.join(reportsDir, userName)
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true })
      }

      /*
       * Crear subcarpeta "Reporte N" dentro de la carpeta del usuario.
       * Cada día los reportes se numerarán de forma incremental.
       */

      // Determinar el número de reporte siguiente analizando carpetas existentes
      const existingReports = fs.readdirSync(userDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && /^Reporte \d+$/.test(dirent.name))
        .map((dirent) => parseInt(dirent.name.split(' ')[1], 10))
        .filter((num) => !isNaN(num))

      const nextReportIndex = existingReports.length ? Math.max(...existingReports) + 1 : 1
      const reportFolderName = `Reporte ${nextReportIndex}`
      const reportFolderPath = path.join(userDir, reportFolderName)

      if (!fs.existsSync(reportFolderPath)) {
        fs.mkdirSync(reportFolderPath, { recursive: true })
      }

      // Si existe una grabación pendiente, moverla a la carpeta del reporte
      if (state && state.lastSavedVideoPath) {
        try {
          const videoFileName = path.basename(state.lastSavedVideoPath)
          const destinationVideoPath = path.join(reportFolderPath, videoFileName)
          // Mover archivo
          if (fs.existsSync(state.lastSavedVideoPath)) {
            fs.renameSync(state.lastSavedVideoPath, destinationVideoPath)
            // Actualizar la ruta dentro de los datos del formulario
            formData.videoPath = destinationVideoPath
          }
        } catch (moveErr) {
          console.error('Error al mover la grabación al reporte:', moveErr)
        }
      }

      const timestamp = Date.now()

      // Guardar archivo JSON dentro de la subcarpeta
      const reportFileName = `reporte-${timestamp}.json`
      const reportPath = path.join(reportFolderPath, reportFileName)
      fs.writeFileSync(reportPath, JSON.stringify(formData, null, 2))

      // Crear archivo TXT con formato legible dentro de la subcarpeta
      const txtFileName = `reporte-${timestamp}.txt`
      const txtPath = path.join(reportFolderPath, txtFileName)
      
      const txtContent = `REPORTE DE ERROR
 ========================
 
 FECHA: ${new Date(formData.timestamp).toLocaleString('es-ES')}
 USUARIO: ${formData.userName}
 COMPUTADORA: ${formData.computerName}
 
 TIPO DE ERROR: ${formData.errorType || 'No especificado'}
 SITUACIÓN DEL ERROR: ${formData.errorSituation || 'No especificado'}
 
 DESCRIPCIÓN DEL ERROR:
 ${formData.errorDescription || 'No especificado'}
 
 VIDEO GRABADO: ${formData.videoPath || 'No se grabó video'}
 
 ========================
 Reporte generado automáticamente por el sistema de grabación de pantalla.
 `
 
      fs.writeFileSync(txtPath, txtContent, 'utf8')

      // Limpiar estado de último video guardado para nuevo reporte
      if (state) state.lastSavedVideoPath = ''

      return { success: true, reportPath, txtPath, reportFolderPath }
    } catch (error) {
      console.error('Error al guardar reporte:', error)
      return { success: false, error: error.message }
    }
  })
} 