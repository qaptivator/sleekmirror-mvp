import { Dialog, App } from '@capacitor/core'

export function usePermissions() {
	const cameraPermissionAsked = ref(false)

	async function requestCameraPermission(): Promise<boolean> {
		try {
			// Check if running on native platform
			const isPlatform = !['web'].includes((window as any).__TAURI_METADATA__?.platform || 'web')
			
			// Try to use native permissions if available
			try {
				const { Permissions } = await import('@capacitor/android')
				if (!Permissions) throw new Error('Permissions not available')

				const result = await (Permissions as any).checkPermission({ alias: 'camera' })
				
				if (result.state === 'denied') {
					// Ask for permission
					const requestResult = await (Permissions as any).requestPermission({ alias: 'camera' })
					if (requestResult.state === 'granted') {
						return true
					} else if (requestResult.state === 'denied') {
						// User denied, ask again on next snap
						cameraPermissionAsked.value = true
						await showPermissionDeniedToast()
						return false
					} else if (requestResult.state === 'prompt') {
						// Permanently denied
						cameraPermissionAsked.value = true
						await showPermissionDisabledAlert()
						return false
					}
				} else if (result.state === 'granted') {
					return true
				} else if (result.state === 'prompt') {
					// Permanently denied
					cameraPermissionAsked.value = true
					await showPermissionDisabledAlert()
					return false
				}
			} catch (nativeErr) {
				// Fallback to web getUserMedia which will handle permissions itself
				console.warn('Native permissions API not available, falling back to web')
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
					stream.getTracks().forEach(track => track.stop())
					return true
				} catch (err: any) {
					if (err.name === 'NotAllowedError') {
						cameraPermissionAsked.value = true
						await showPermissionDeniedToast()
					} else if (err.name === 'NotFoundError') {
						await Dialog.alert({
							title: 'No Camera Found',
							message: 'No camera device detected on this device.',
							buttonTitle: 'OK'
						})
					}
					return false
				}
			}
		} catch (err) {
			console.error('Failed to check/request camera permission:', err)
			return false
		}
		return false
	}

	async function showPermissionDeniedToast() {
		try {
			await Dialog.alert({
				title: 'Camera Permission Needed',
				message: 'Camera access is required to scan documents and take photos for checks.',
				buttonTitle: 'OK'
			})
		} catch (err) {
			console.error('Failed to show permission denied toast:', err)
		}
	}

	async function showPermissionDisabledAlert() {
		try {
			const result = await Dialog.confirm({
				title: 'Camera Permission Disabled',
				message: 'Camera permission is disabled in your device settings. Tap "Settings" to enable it.',
				okButtonTitle: 'Settings',
				cancelButtonTitle: 'Cancel'
			})

			if (result.value) {
				// Open app settings
				await App.openUrl({
					url: 'app://settings'
				})
			}
		} catch (err) {
			console.error('Failed to show permission disabled alert:', err)
		}
	}

	return {
		cameraPermissionAsked,
		requestCameraPermission,
		showPermissionDeniedToast,
		showPermissionDisabledAlert
	}
}
