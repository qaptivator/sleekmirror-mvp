// Singleton camera stream — shared across the entire app lifecycle
// so we never lose the stream reference when the component re-renders.
let _stream: MediaStream | null = null
let _facingMode: 'user' | 'environment' = 'user'
let _flashEnabled = false
let _startPromise: Promise<boolean> | null = null
let _generation = 0 // incremented on each restart/stop to invalidate stale closures

export function useCameraStream() {
  const currentStream = useState<MediaStream | null>('camera:stream', () => null)
  const facingMode = useState<'user' | 'environment'>('camera:facingMode', () => 'user')
  const flashEnabled = useState<boolean>('camera:flash', () => false)
  const isReady = useState<boolean>('camera:ready', () => false)
  const error = useState<string | null>('camera:error', () => null)

  const isMirrored = computed(() => facingMode.value === 'user')

  function stop(videoElement?: HTMLVideoElement | null) {
    isReady.value = false
    _startPromise = null
    _generation++

    if (_stream) {
      _stream.getTracks().forEach((track) => {
        try { track.stop() } catch (e) { console.warn('track.stop error:', e) }
      })
      _stream = null
    }
    currentStream.value = null
    flashEnabled.value = false
    _flashEnabled = false

    if (videoElement) {
      videoElement.srcObject = null
    }
  }

  async function start(videoElement: HTMLVideoElement | null): Promise<boolean> {
    if (!videoElement) return false

    // If already starting, wait for that promise
    if (_startPromise) {
      return _startPromise
    }

    // Stop any existing stream cleanly first
    stop(videoElement)
    error.value = null

    const gen = _generation // capture to detect if we get cancelled mid-flight

    _startPromise = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: _facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        // If a stop/restart happened while we were waiting for getUserMedia, discard
        if (gen !== _generation) {
          stream.getTracks().forEach((t) => t.stop())
          return false
        }

        _stream = stream
        currentStream.value = stream
        videoElement.srcObject = stream

        // Ensure video plays; resolve on canplay or loadedmetadata
        await new Promise<void>((resolve) => {
          const onReady = () => {
            videoElement.removeEventListener('canplay', onReady)
            videoElement.removeEventListener('loadedmetadata', onReady)
            resolve()
          }
          if (videoElement.readyState >= 2) {
            resolve()
          } else {
            videoElement.addEventListener('canplay', onReady, { once: true })
            videoElement.addEventListener('loadedmetadata', onReady, { once: true })
          }
        })

        try {
          await videoElement.play()
        } catch (playErr) {
          console.warn('Autoplay prevented:', playErr)
        }

        if (gen !== _generation) return false

        isReady.value = true
        _startPromise = null
        return true
      } catch (err: any) {
        console.error('Camera stream failed:', err)
        error.value = err?.message || 'Failed to access camera'
        if (gen === _generation) stop(videoElement)
        _startPromise = null
        return false
      }
    })()

    return _startPromise
  }

  async function restart(videoElement: HTMLVideoElement | null): Promise<boolean> {
    // Ensure clean slate before restarting (e.g. after app foreground, camera flip)
    if (_stream) {
      _stream.getTracks().forEach((t) => { try { t.stop() } catch { /* ignore */ } })
      _stream = null
    }
    _startPromise = null
    _generation++
    isReady.value = false
    currentStream.value = null
    if (videoElement) videoElement.srcObject = null
    return start(videoElement)
  }

  async function toggleFacingMode(videoElement: HTMLVideoElement | null): Promise<void> {
    _facingMode = _facingMode === 'user' ? 'environment' : 'user'
    facingMode.value = _facingMode
    await restart(videoElement)
  }

  async function toggleFlash(): Promise<void> {
    _flashEnabled = !_flashEnabled
    flashEnabled.value = _flashEnabled
    const track = _stream?.getVideoTracks()[0]
    if (track) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: _flashEnabled }],
        })
      } catch (err) {
        console.warn('Torch not supported:', err)
        _flashEnabled = false
        flashEnabled.value = false
      }
    }
  }

  return {
    currentStream,
    facingMode,
    flashEnabled,
    isReady,
    isMirrored,
    error,
    start,
    stop,
    restart,
    toggleFacingMode,
    toggleFlash,
  }
}
