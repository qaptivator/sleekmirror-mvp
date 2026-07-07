# Pinia Stores Guide

This guide documents the three Pinia stores that handle all backend interactions for the Sleekmirror application.

## Overview

The stores are designed to:
- Handle all API interactions with the backend
- Cache data to minimize unnecessary API calls
- Manage loading and error states
- Keep the app in sync with the server (server is the source of truth)

## Stores

### 1. `useFileStore`

Handles file uploads, fetching, and blob caching.

#### Features
- **Smart Blob Caching**: Caches file blobs up to 50MB, automatically evicting least-recently-used files when full
- **Metadata Caching**: Stores file metadata for quick access
- **File Upload**: Supports multipart form uploads
- **Lazy Loading**: Fetches files only when needed

#### Usage Example

```typescript
import { useFileStore } from '~/stores'

export default {
  setup() {
    const fileStore = useFileStore()

    // Fetch list of files
    const loadFiles = async () => {
      await fileStore.fetchFiles()
      console.log(fileStore.fileList) // Array of file metadata
    }

    // Upload a file
    const handleFileUpload = async (file: File) => {
      try {
        const metadata = await fileStore.uploadFile(file)
        console.log('File uploaded:', metadata._id)
      } catch (err) {
        console.error('Upload failed:', fileStore.error)
      }
    }

    // Get file blob (cached, won't refetch if already loaded)
    const downloadFile = async (fileId: string) => {
      const blob = await fileStore.getFileBlob(fileId)
      // Use blob for display or download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileStore.getCheck(fileId)?.filename || 'file'
      a.click()
    }

    // Get file metadata
    const getMetadata = async (fileId: string) => {
      const metadata = await fileStore.getFileMetadata(fileId)
      console.log('File size:', metadata.size_bytes)
    }

    // Clear cache
    fileStore.clearCache()

    // Sync files from server
    await fileStore.syncFiles()

    return {
      loadFiles,
      handleFileUpload,
      downloadFile,
      getMetadata,
      fileStore,
    }
  },
}
```

#### State
- `files`: Map of cached files with metadata and blobs
- `fileList`: Array of file metadata (from latest server fetch)
- `loading`: Boolean indicating fetch state
- `error`: Error message if fetch fails

#### Methods
- `fetchFiles()`: Get list of all files from server
- `uploadFile(file)`: Upload a new file
- `getFileMetadata(fileId)`: Get or fetch file metadata
- `getFileBlob(fileId)`: Get or fetch file blob (with caching)
- `clearFileCache(fileId)`: Remove specific file from cache
- `clearCache()`: Clear all files from cache
- `syncFiles()`: Sync file list with server

---

### 2. `useCheckStore`

Handles check operations and result caching.

#### Features
- **Result Caching**: Caches check results to avoid refetching
- **File-based Organization**: Groups checks by file ID
- **Run Prevention**: Prevents multiple simultaneous checks
- **Lazy Loading**: Fetches individual checks as needed

#### Usage Example

```typescript
import { useCheckStore, useFileStore } from '~/stores'

export default {
  setup() {
    const checkStore = useCheckStore()
    const fileStore = useFileStore()

    // Run a check on a file
    const runCheck = async (fileId: string, contextTag: string) => {
      try {
        if (!fileStore.getFileMetadata(fileId)) {
          console.error('File not found')
          return
        }

        const check = await checkStore.runCheck(fileId, contextTag)
        console.log('Check complete:', check._id)
        console.log('Overall score:', check.overall_score)
        console.log('Verdict:', check.verdict_headline)
      } catch (err) {
        console.error('Check failed:', checkStore.error)
      }
    }

    // Get all checks for a file
    const viewFileChecks = (fileId: string) => {
      const checks = checkStore.getFileChecks(fileId)
      console.log(`File has ${checks.length} checks`)
      checks.forEach((check) => {
        console.log(`- ${check.verdict_headline} (${check.overall_score}%)`)
      })
    }

    // Get a specific check
    const getCheckDetails = async (checkId: string) => {
      const check = await checkStore.fetchCheck(checkId)
      console.log('Categories:')
      console.log('- Outfit:', check.categories.outfit.score)
      console.log('- Grooming:', check.categories.grooming.score)
      console.log('- Presentation:', check.categories.presentation.score)
      console.log('Action items:')
      check.action_checklist.forEach((item, i) => {
        console.log(`${i + 1}. ${item}`)
      })
    }

    // Check if a check is running
    watch(() => checkStore.isRunningCheck, (isRunning) => {
      if (isRunning) {
        console.log('Check in progress for file:', checkStore.runningCheckFileId)
      }
    })

    return {
      runCheck,
      viewFileChecks,
      getCheckDetails,
      checkStore,
    }
  },
}
```

#### State
- `checks`: Map of cached check results by check ID
- `checksByFile`: Map grouping check IDs by file ID
- `loading`: Boolean indicating fetch state
- `error`: Error message if operation fails
- `runningCheckFileId`: ID of file currently being checked (or null)

#### Methods
- `runCheck(fileId, contextTag)`: Execute a check on a file
- `fetchCheck(checkId)`: Get or fetch a specific check result
- `getFileChecks(fileId)`: Get all cached checks for a file
- `getCheck(checkId)`: Get a cached check by ID
- `clearFileChecksCache(fileId)`: Remove all checks for a file from cache
- `clearCache()`: Clear all checks from cache
- `syncFileChecks(fileId)`: Sync checks for a file with server

#### Computed
- `isRunningCheck`: Boolean, true if any check is currently running
- `runningCheckFileId`: ID of file being checked
- `checkCount`: Total number of cached checks

---

### 3. `useUserStore`

Handles user authentication and data.

#### Features
- **User Fetching**: Fetch user by identifier
- **Credit Management**: Track user credits
- **Cache Updates**: Update user data when server changes occur
- **Authorization Checks**: Verify if user has enough credits

#### Usage Example

```typescript
import { useUserStore } from '~/stores'

export default {
  setup() {
    const userStore = useUserStore()

    // Fetch current user
    const loadUser = async (identifier: string) => {
      try {
        const user = await userStore.fetchUser(identifier)
        console.log('User:', user.full_name)
        console.log('Credits available:', user.credits)
      } catch (err) {
        console.error('Failed to load user:', userStore.error)
      }
    }

    // Check if user can run a check
    const canRunCheck = () => {
      if (!userStore.isAuthenticated) {
        console.error('User not authenticated')
        return false
      }

      if (!userStore.hasEnoughCredits(1)) {
        console.error('Insufficient credits')
        return false
      }

      return true
    }

    // Update credits after an operation
    const handleCheckComplete = (newCredits: number) => {
      userStore.updateCredits(newCredits)
      console.log('Credits remaining:', userStore.credits)
    }

    // Logout
    const logout = () => {
      userStore.clearUser()
    }

    return {
      loadUser,
      canRunCheck,
      handleCheckComplete,
      logout,
      userStore,
    }
  },
}
```

#### State
- `currentUser`: The authenticated user object (or null)
- `loading`: Boolean indicating fetch state
- `error`: Error message if operation fails

#### Methods
- `fetchUser(identifier)`: Authenticate and fetch user
- `updateUserCache(updatedUser)`: Update cached user data
- `updateCredits(newCredits)`: Update user's credit balance
- `clearUser()`: Clear user data (logout)
- `getCredits()`: Get current credit balance
- `hasEnoughCredits(required)`: Check if user has enough credits

#### Computed
- `isAuthenticated`: Boolean, true if user is logged in
- `credits`: Current credit balance
- `fullName`: User's full name or 'User'

---

## Server as Source of Truth

All stores follow this principle: **The server is the source of truth**. This means:

1. After any operation that might change data (upload, run check), the server response is cached
2. To sync with the server, call the `sync*` methods or re-fetch
3. Never manually manipulate cache without server confirmation
4. On app reload, stores are cleared and must be refetched from server

## Caching Strategy

### File Blobs
- **Cache Size**: Up to 50MB
- **Eviction**: LRU (least recently used files evicted first)
- **Access**: Updated on every blob fetch
- **Manual Clear**: Use `clearFileCache(fileId)` or `clearCache()`

### File Metadata
- **Lifetime**: Cached until manually cleared
- **Sync**: Re-fetch with `fetchFiles()` or `syncFiles()`

### Check Results
- **Lifetime**: Cached indefinitely
- **Sync**: Re-fetch with `fetchCheck()` or `syncFileChecks()`

### User Data
- **Lifetime**: Cached until logout
- **Sync**: Re-fetch with `fetchUser()`

---

## Common Patterns

### Upload and Run Check Workflow

```typescript
import { useFileStore, useCheckStore, useUserStore } from '~/stores'

const fileStore = useFileStore()
const checkStore = useCheckStore()
const userStore = useUserStore()

// 1. Authenticate
await userStore.fetchUser('user@example.com')

// 2. Upload file
const fileMetadata = await fileStore.uploadFile(selectedFile)

// 3. Run check
const check = await checkStore.runCheck(fileMetadata._id, 'interview')

// 4. View results
console.log(check.overall_score)
console.log(check.categories.outfit.feedback)
```

### Load All Checks for a File

```typescript
const fileId = 'some-file-id'
const checks = checkStore.getFileChecks(fileId)

if (checks.length === 0) {
  console.log('No checks found for this file')
} else {
  checks.forEach((check) => {
    console.log(`Score: ${check.overall_score}`)
  })
}
```

### Handle Check Errors

```typescript
try {
  const check = await checkStore.runCheck(fileId, 'contextTag')
} catch (err) {
  if (err.response?.status === 402) {
    // Payment required / insufficient credits
    console.error('Not enough credits')
  } else if (err.response?.status === 404) {
    // File not found
    console.error('File not found')
  } else {
    // Generic error
    console.error(checkStore.error)
  }
}
```

---

## Best Practices

1. **Always check `isLoading` before rendering**: Shows loading states appropriately
2. **Handle errors gracefully**: Check `store.error` after operations
3. **Use computed properties**: Leverage `isAuthenticated`, `isRunningCheck`, etc.
4. **Don't manually cache**: Let the store handle caching logic
5. **Respect the server**: Always use server response as the source of truth
6. **Clear cache on logout**: Call `clearUser()`, `fileStore.clearCache()`, `checkStore.clearCache()`
7. **Monitor credits**: Check `hasEnoughCredits()` before running checks

---

## API Endpoints Reference

These stores interact with these server endpoints:

- `POST /api/files` - Upload file
- `GET /api/files` - List files
- `GET /api/files/[id].json` - Get file metadata
- `GET /api/files/[id].file` - Get file blob
- `POST /api/checks/run` - Run check
- `GET /api/checks/[id]` - Get check results
- `GET /api/users?identifier=...` - Get user
