import type { Check } from '~/stores/useCheckStore'

function getErrorStatus(err: unknown): number | undefined {
	if (!err || typeof err !== 'object') return undefined
	const e = err as {
		status?: number
		statusCode?: number
		response?: { status?: number }
	}
	return e.status ?? e.statusCode ?? e.response?.status
}

export function useCapture() {
	const checkStore = useCheckStore()

	const isScanning = ref(false)
	const showResults = ref(false)
	const currentCheck = ref<Check | null>(null)
	const scanningMessage = ref('')
	const errorMessage = ref('')
	const outOfScans = ref(false)

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

	// Sends the image once for analysis. The bytes are not kept after the request.
	async function processFile(file: File, contextTag: string = 'casual') {
		isScanning.value = true
		showResults.value = false
		currentCheck.value = null
		errorMessage.value = ''
		outOfScans.value = false

		const interval = startScanningAnimation()

		try {
			const check = await checkStore.runCheck(file, contextTag)
			currentCheck.value = check
			showResults.value = true
		} catch (err) {
			console.error('Check failed:', err)
			const status = getErrorStatus(err)
			if (status === 402) {
				outOfScans.value = true
				errorMessage.value =
					"You don't have any scans left. Come back tomorrow."
				useUserStore().updateCredits(0)
			} else {
				errorMessage.value =
					'The check could not finish. Try again in a moment.'
			}
		} finally {
			clearInterval(interval)
			isScanning.value = false
		}
	}

	function triggerGalleryPicker(contextTag: string = 'casual') {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.onchange = async (e: Event) => {
			const file = (e.target as HTMLInputElement).files?.[0]
			if (file) await processFile(file, contextTag)
			input.value = ''
		}
		input.click()
	}

	async function triggerCameraSnap(
		videoElement: HTMLVideoElement,
		contextTag: string = 'casual'
	) {
		try {
			const canvas = document.createElement('canvas')
			canvas.width = videoElement.videoWidth || 1280
			canvas.height = videoElement.videoHeight || 720
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				triggerGalleryPicker(contextTag)
				return
			}
			ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob(resolve, 'image/jpeg', 0.9)
			})
			canvas.width = 0
			canvas.height = 0
			if (!blob) {
				triggerGalleryPicker(contextTag)
				return
			}
			const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' })
			await processFile(file, contextTag)
		} catch (err) {
			console.error('Failed to capture from video:', err)
			triggerGalleryPicker(contextTag)
		}
	}

	function reset() {
		isScanning.value = false
		showResults.value = false
		currentCheck.value = null
		errorMessage.value = ''
		outOfScans.value = false
	}

	return {
		isScanning,
		showResults,
		currentCheck,
		scanningMessage,
		errorMessage,
		outOfScans,
		processFile,
		triggerGalleryPicker,
		triggerCameraSnap,
		reset,
	}
}
