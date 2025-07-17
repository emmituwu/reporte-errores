const fs = require('fs')
const path = require('path')
const os = require('os')

module.exports = (ipcMain) => {
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

      const timestamp = Date.now()

      // Guardar archivo JSON
      const reportFileName = `reporte-${timestamp}-${userName}.json`
      const reportPath = path.join(userDir, reportFileName)
      fs.writeFileSync(reportPath, JSON.stringify(formData, null, 2))

      // Crear archivo TXT con formato legible
      const txtFileName = `reporte-${timestamp}-${userName}.txt`
      const txtPath = path.join(userDir, txtFileName)
      
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

      return { success: true, reportPath, txtPath }
    } catch (error) {
      console.error('Error al guardar reporte:', error)
      return { success: false, error: error.message }
    }
  })
} 