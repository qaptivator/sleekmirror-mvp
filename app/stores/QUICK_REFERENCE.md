# Stores Quick Reference

## Import All Stores
```typescript
import { useFileStore, useCheckStore, useUserStore } from '~/stores'
```

---

## useFileStore - Files

### Upload & List
```typescript
const fileStore = useFileStore()

// Upload
const metadata = await fileStore.uploadFile(file)

// List all files
await fileStore.fetchFiles()
const files = fileStore.fileList // Array of metadata

// Get metadata for one file
const meta = await fileStore.getFileMetadata(fileId)

// Get blob (cached, won't refetch)
const blob = await fileStore.getFileBlob(fileId)
```

### Cache Management
```typescript
// Clear specific file blob from cache
fileStore.clearFileCache(fileId)

// Clear all files
fileStore.clearCache()

// Re-sync with server
await fileStore.syncFiles()

// Check cached files
const cachedIds = fileStore.cachedFileIds // Array
```

### State & Error Handling
```typescript
if (fileStore.loading) return <Spinner />
if (fileStore.error) console.error(fileStore.error)
console.log(fileStore.fileCount) // Total files
```

---

## useCheckStore - Checks

### Run & Fetch
```typescript
const checkStore = useCheckStore()

// Run a check
const check = await checkStore.runCheck(fileId, 'interview')

// Get a specific check
const check = await checkStore.fetchCheck(checkId)

// Get all checks for a file
const checks = checkStore.getFileChecks(fileId)

// Access cached check
const check = checkStore.getCheck(checkId) // or undefined
```

### Check Results
```typescript
const check = checkStore.getCheck(checkId)

// Access result properties
check.overall_score        // 0-100
check.verdict_headline     // String
check.categories.outfit.score
check.categories.grooming.feedback
check.categories.presentation.fix
check.action_checklist     // String[]
```

### Cache & Sync
```typescript
// Clear checks for a file
checkStore.clearFileChecksCache(fileId)

// Clear all checks
checkStore.clearCache()

// Sync checks (currently no bulk endpoint)
await checkStore.syncFileChecks(fileId)
```

### State & Events
```typescript
if (checkStore.isRunningCheck) {
  console.log('Checking file:', checkStore.runningCheckFileId)
}
if (checkStore.error) console.error(checkStore.error)
console.log(checkStore.checkCount) // Total checks cached
```

---

## useUserStore - User

### Authentication
```typescript
const userStore = useUserStore()

// Fetch user
await userStore.fetchUser('user@example.com')

// Check if authenticated
if (userStore.isAuthenticated) {
  console.log(userStore.fullName)
  console.log(userStore.credits)
}

// Logout
userStore.clearUser()
```

### Permissions & Credits
```typescript
// Check credits
if (userStore.hasEnoughCredits(1)) {
  // Can run check
}

const balance = userStore.getCredits()

// Update after server operation
userStore.updateCredits(newBalance)
```

### State
```typescript
if (userStore.loading) return <Spinner />
if (userStore.error) console.error(userStore.error)
```

---

## Common Workflows

### Upload & Check
```typescript
const fileStore = useFileStore()
const checkStore = useCheckStore()
const userStore = useUserStore()

// 1. Auth
await userStore.fetchUser(identifier)

// 2. Upload
const file = await fileStore.uploadFile(selectedFile)

// 3. Run check
if (userStore.hasEnoughCredits(1)) {
  const check = await checkStore.runCheck(file._id, 'interview')
  console.log(check.overall_score)
}
```

### Display File Checks
```typescript
const checks = checkStore.getFileChecks(fileId)

checks.forEach(check => {
  console.log(`${check.verdict_headline}: ${check.overall_score}%`)
  console.log('Action items:', check.action_checklist)
})
```

### Error Handling
```typescript
try {
  const check = await checkStore.runCheck(fileId, 'interview')
} catch (err) {
  if (err.response?.status === 402) {
    // Insufficient credits
  } else if (err.response?.status === 404) {
    // File not found
  } else {
    console.error(checkStore.error)
  }
}
```

---

## Reactive Patterns

### Watch for Running Check
```typescript
import { watch } from 'vue'

const checkStore = useCheckStore()

watch(() => checkStore.isRunningCheck, (isRunning) => {
  if (isRunning) {
    console.log('Check started for:', checkStore.runningCheckFileId)
  } else {
    console.log('Check completed')
  }
})
```

### Computed File Count
```typescript
import { computed } from 'vue'

const fileStore = useFileStore()
const noFiles = computed(() => fileStore.fileCount === 0)

if (noFiles.value) return <EmptyState />
```

### Watch Credits
```typescript
import { watch } from 'vue'

const userStore = useUserStore()

watch(() => userStore.credits, (newCredits) => {
  console.log('Credits updated:', newCredits)
})
```

---

## Tips & Tricks

💡 **File blobs aren't refetched** - Call `getFileBlob()` multiple times, only first fetches from server

💡 **Server is authority** - After operations, server response is always cached

💡 **Prevents double-checks** - `runCheck()` throws if check already running

💡 **No auto-refetch** - Stores don't auto-sync on init, call `sync*()` methods explicitly

💡 **Clear on logout** - Always call `clearUser()`, `clearCache()` on logout

💡 **LRU eviction** - Old file blobs automatically removed when cache fills (50MB max)

💡 **Type safety** - All data structures fully typed in TypeScript

---

## Troubleshooting

**"Check already running"** 
→ Wait for `isRunningCheck` to be false before running another

**"Not enough credits"**
→ Check `hasEnoughCredits()` before `runCheck()`

**"File not found"**
→ Verify file was uploaded successfully with `fetchFiles()`

**"Data not updated"**
→ Server is authority; refresh with `sync*()` methods

**"Blob not in cache"**
→ First access always fetches from server, subsequent calls use cache

---

## Full Documentation

See `STORES_GUIDE.md` for comprehensive docs with all methods, state, and patterns.
