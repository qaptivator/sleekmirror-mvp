import { Camera } from '@capacitor/camera'
import { Dialog } from '@capacitor/dialog'

export function useCameraPermissions() {
	const cameraPermissionAsked = ref(false)

	async function checkOrRequestCamera(): Promise<boolean> {
		try {
			// 1. Check current permission status
			const status = await Camera.checkPermissions()

			if (status.camera === 'granted') {
				return true
			}

			// 2. Request permission if promptable
			if (
				status.camera === 'prompt' ||
				status.camera === 'prompt-with-rationale'
			) {
				const request = await Camera.requestPermissions({
					permissions: ['camera'],
				})

				if (request.camera === 'granted') {
					return true
				}
			}

			// 3. Handle denied state
			cameraPermissionAsked.value = true
			await showPermissionDeniedAlert()
			return false
		} catch (err) {
			console.error('Camera permission check failed:', err)
			return false
		}
	}

	async function showPermissionDeniedAlert() {
		await Dialog.alert({
			title: 'Camera Access Needed',
			message: 'Sleekmirror requires camera permission to capture photos.',
			buttonTitle: 'OK',
		})
	}

	return {
		cameraPermissionAsked,
		checkOrRequestCamera,
	}
}
