const stack: Array<() => void> = []

function remove(close: () => void) {
	const index = stack.lastIndexOf(close)
	if (index >= 0) stack.splice(index, 1)
}

export function consumeBack() {
	const close = stack[stack.length - 1]
	if (!close) return false
	close()
	return true
}

// Register a close action while `isActive()` is true. The last one opened
// runs first, so a sheet on top of another sheet closes before the one under it.
export function useBackHandler(isActive: () => boolean, close: () => void) {
	watch(
		isActive,
		(on) => {
			remove(close)
			if (on) stack.push(close)
		},
		{ immediate: true }
	)
	onScopeDispose(() => remove(close))
}
