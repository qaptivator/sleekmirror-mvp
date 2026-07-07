# Pinia Stores - Implementation Summary

Three comprehensive Pinia stores have been created in `app/stores/` to handle all backend interactions for the Sleekmirror application.

## Files Created

```
app/stores/
├── index.ts                   # Central export file
├── useFileStore.ts            # File management and caching
├── useCheckStore.ts           # Check operations and results
├── useUserStore.ts            # User authentication and data
└── STORES_GUIDE.md            # Comprehensive documentation
```

## Quick Overview

### `useFileStore` - File Management
- **Upload files** with multipart form support
- **Cache blobs** (up to 50MB with LRU eviction)
- **Fetch metadata** for file listings
- **Lazy load** file content only when needed

**Key Methods:**
- `uploadFile(file)` - Upload new file
- `getFileBlob(fileId)` - Get cached or fetch file blob
- `fetchFiles()` - Get list of all files
- `syncFiles()` - Sync with server

### `useCheckStore` - Check Management
- **Run checks** on files (prevents simultaneous checks)
- **Cache results** to avoid refetching
- **Organize checks** by file ID
- **Track running state** for UI feedback

**Key Methods:**
- `runCheck(fileId, contextTag)` - Execute check
- `fetchCheck(checkId)` - Get check results
- `getFileChecks(fileId)` - Get all checks for file
- `isRunningCheck` - Computed property for UI

### `useUserStore` - User Management
- **Authenticate users** by identifier
- **Track credits** for operations
- **Verify authorization** before checks
- **Cache user data** until logout

**Key Methods:**
- `fetchUser(identifier)` - Authenticate user
- `hasEnoughCredits(required)` - Check authorization
- `updateCredits(newCredits)` - Update balance
- `clearUser()` - Logout

## Architecture Principles

1. **Server is Authority**: Server response is always cached as source of truth
2. **Smart Caching**: File blobs use LRU eviction, metadata cached indefinitely
3. **Error Handling**: Each store tracks loading/error states
4. **Type Safety**: Full TypeScript interfaces for all data structures
5. **Lazy Loading**: Data fetched only when explicitly requested
6. **No Side Effects**: Stores don't auto-fetch on instantiation

## Usage Pattern

```typescript
// 1. Import stores
import { useFileStore, useCheckStore, useUserStore } from '~/stores'

export default {
  setup() {
    const fileStore = useFileStore()
    const checkStore = useCheckStore()
    const userStore = useUserStore()

    // 2. Authenticate
    await userStore.fetchUser('user@example.com')

    // 3. Upload file
    const file = await fileStore.uploadFile(selectedFile)

    // 4. Run check
    const check = await checkStore.runCheck(file._id, 'interview')

    // 5. Access cached data
    console.log(check.overall_score)
  }
}
```

## Caching Strategy

### File Blobs (Smart Cache)
- **Max Size**: 50MB total
- **Eviction**: LRU when full
- **Access Tracking**: Updated on every access
- **Manual Clear**: `clearFileCache()` or `clearCache()`

### File Metadata
- **Cached**: Until `clearCache()` called
- **Sync**: Re-fetch with `fetchFiles()`

### Check Results
- **Cached**: Indefinitely
- **Organized**: By file ID for quick lookup
- **Sync**: Re-fetch with `fetchCheck()`

### User Data
- **Cached**: Until `clearUser()` called
- **Updates**: Manual via `updateUserCache()`

## Preventing Common Issues

✅ **Always check loading state** before rendering
```typescript
if (fileStore.loading) return <LoadingSpinner />
```

✅ **Handle errors appropriately**
```typescript
if (fileStore.error) console.error(fileStore.error)
```

✅ **Use computed properties** for reactive UI
```typescript
watch(() => checkStore.isRunningCheck, (isRunning) => {
  // Update UI
})
```

✅ **Never bypass caching logic** - let stores manage it

✅ **Clear cache on logout**
```typescript
userStore.clearUser()
fileStore.clearCache()
checkStore.clearCache()
```

## API Endpoints Used

| Endpoint | Store | Method | Purpose |
|----------|-------|--------|---------|
| POST /api/files | fileStore | uploadFile() | Upload file |
| GET /api/files | fileStore | fetchFiles() | List files |
| GET /api/files/[id].json | fileStore | getFileMetadata() | File metadata |
| GET /api/files/[id].file | fileStore | getFileBlob() | Download blob |
| POST /api/checks/run | checkStore | runCheck() | Execute check |
| GET /api/checks/[id] | checkStore | fetchCheck() | Get results |
| GET /api/users | userStore | fetchUser() | Authenticate |

## Build Status

✅ **Build Successful**
- All TypeScript files compile without errors
- Pinia integration working correctly
- Ready for production use

## Next Steps

1. **Integrate stores into components** - Import and use in pages/components
2. **Add authentication flow** - Use `useUserStore.fetchUser()` on app load
3. **Build file upload UI** - Use `useFileStore.uploadFile()`
4. **Display check results** - Use `useCheckStore.runCheck()` and access results
5. **Add loading/error UI** - Monitor `store.loading` and `store.error`

## Documentation

See `app/stores/STORES_GUIDE.md` for:
- Detailed usage examples for each store
- Common patterns and workflows
- Best practices and tips
- API reference for all methods
