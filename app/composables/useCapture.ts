import type { Check } from '~/types/check'

export function useCapture() {
	const fileStore = useFileStore()
	const checkStore = useCheckStore()

	const capturedPhoto = ref<string | null>(null)
	const isScanning = ref(false)
	const showResults = ref(false)
	const currentCheck = ref<Check | null>(null)
	const scanningMessage = ref('')

	const scanningMessages = [
		'Querying engine pipelines...',
		'Isolating structural geometry...',
		'Evaluating lighting contrasts...',
		'Synthesizing structural context...',
	]

	function startScanningAnimation() {
		let step = 0
		scanningMessage.value = scanningMessages[0] ?? ''
		const interval = setInterval(() => {
			step++
			if (step < scanningMessages.length) {
				scanningMessage.value = scanningMessages[step] ?? ''
			} else {
				clearInterval(interval)
			}
		}, 700)
		return interval
	}

	// THE ONE FUNCTION THAT DOES EVERYTHING
	// call this with any File object regardless of source
	async function processFile(file: File) {
		capturedPhoto.value = URL.createObjectURL(file)
		isScanning.value = true
		showResults.value = false
		currentCheck.value = null

		const interval = startScanningAnimation()

		try {
			const uploaded = await fileStore.uploadFile(file)
			const check = await checkStore.runCheck(uploaded.fileId, 'casual')

			currentCheck.value = check
			showResults.value = true
		} catch (err) {
			console.error('Check failed:', err)
		} finally {
			clearInterval(interval)
			isScanning.value = false
		}
	}

	// SOURCE A: gallery / file picker (web + android gallery)
	function triggerGalleryPicker() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.onchange = async (e: any) => {
			const file = e.target.files?.[0]
			if (file) await processFile(file)
		}
		input.click()
	}

	// SOURCE B: live camera snap (Capacitor)
	async function triggerCameraSnap(videoElement?: HTMLVideoElement) {
		if (!videoElement) {
			triggerGalleryPicker()
			return
		}

		try {
			const canvas = document.createElement('canvas')
			canvas.width = videoElement.videoWidth
			canvas.height = videoElement.videoHeight
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				triggerGalleryPicker()
				return
			}
			ctx.drawImage(videoElement, 0, 0)
			canvas.toBlob(async (blob) => {
				if (!blob) {
					triggerGalleryPicker()
					return
				}
				const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' })
				await processFile(file)
			}, 'image/jpeg', 0.9)
		} catch (err) {
			console.error('Failed to capture from video:', err)
			triggerGalleryPicker()
		}
	}

	function reset() {
		capturedPhoto.value = null
		isScanning.value = false
		showResults.value = false
		currentCheck.value = null
	}

	return {
		capturedPhoto,
		isScanning,
		showResults,
		currentCheck,
		scanningMessage,
		processFile,
		triggerGalleryPicker,
		triggerCameraSnap,
		reset,
	}
}
