import { assertJwtSecrets } from '../utils/jwt'

export default defineNitroPlugin(() => {
	if (import.meta.prerender) return
	assertJwtSecrets(useRuntimeConfig())
})
