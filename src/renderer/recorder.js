const { ipcRenderer } = require('electron')

let mediaRecorder
const recordedChunks = []

async function getScreenStream () {
  const sources = await ipcRenderer.invoke('get-sources')
  if (!sources || sources.length === 0) {
    throw new Error('No se encontraron fuentes de pantalla')
  }
  const screenSource = sources[0]

  return await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: screenSource.id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720
      }
    }
  })
}

async function startRecording () {
  try {
    const stream = await getScreenStream()

    let options = { mimeType: 'video/webm; codecs=vp9' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm; codecs=vp8' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' }
      }
    }

    mediaRecorder = new MediaRecorder(stream, options)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      if (recordedChunks.length === 0) {
        console.warn('No se capturó ningún dato de vídeo.')
        return
      }
      const blob = new Blob(recordedChunks, { type: recordedChunks[0].type || 'video/webm' })
      const buffer = Buffer.from(await blob.arrayBuffer())
      const result = await ipcRenderer.invoke('save-video', buffer)
      
      if (result.success) {
        console.log('Video guardado exitosamente en:', result.filePath)
        
        // Verificar si hay datos guardados del formulario
        const savedFormData = sessionStorage.getItem('formData')
        if (savedFormData) {
          // Si hay datos guardados, regresar al formulario
          window.location.href = 'form.html'
        } else {
          // Si no hay datos guardados, ir al formulario limpio
          window.location.href = 'form.html'
        }
      } else {
        console.error('Error al guardar el video:', result.error)
        alert('No se pudo guardar el video: ' + (result.error || 'Error desconocido'))
      }

      recordedChunks.length = 0
    }

    mediaRecorder.start(1000)

    // parada automática a los 2 minutos
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording()
      }
    }, 120000)

    console.log('Grabación iniciada…')
  } catch (err) {
    console.error('Error al iniciar la grabación:', err)
  }
}

function stopRecording () {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    mediaRecorder.requestData()
    console.log('Grabación detenida.')
  }
}

window.electronAPI = {
  startRecording,
  stopRecording,
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  saveErrorReport: (formData) => ipcRenderer.invoke('save-error-report', formData),
  getVideoPath: () => ipcRenderer.invoke('get-video-path'),
  deleteVideo: () => ipcRenderer.invoke('delete-video')
} 