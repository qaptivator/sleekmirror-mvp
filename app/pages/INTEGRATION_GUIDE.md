# Index Page - Stores Integration Guide

This guide shows how to connect the index page to the Pinia stores for real backend interactions.

## Current State

The page currently uses **mock data**:
- Hardcoded check results
- Demo image from Unsplash
- No backend communication

## Step 1: Add Store Imports

Replace the top of the script setup section with:

```typescript
import { useFileStore, useCheckStore, useUserStore } from '~/stores'

// Initialize stores
const fileStore = useFileStore()
const checkStore = useCheckStore()
const userStore = useUserStore()
```

## Step 2: Replace Mock Data with Real Store State

Instead of the hardcoded `checkResult`, use:

```typescript
const checkResult = computed(() => {
  const activeCheck = checkStore.getCheck(lastCheckId.value)
  return activeCheck || mockCheckResult // fallback to mock
})

// Track the last check ID
const lastCheckId = ref<string>('')
```

## Step 3: Update File Upload Handler

Replace `handleFileUpload()` with:

```typescript
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    // 1. Upload file to backend
    const metadata = await fileStore.uploadFile(file)
    
    // 2. Create preview from file
    const reader = new FileReader()
    reader.onload = (e) => {
      capturedPhoto.value = e.target?.result as string
      
      // 3. Start scanning
      startScanningWithFile(metadata._id)
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error('Upload failed:', fileStore.error)
    // Show error toast to user
  }

  if (fileInput.value) fileInput.value.value = ''
}

async function startScanningWithFile(fileId: string) {
  // Show scanning UI
  isScanning.value = true
  showResults.value = false
  renderContent.value = false
  renderBars.value = false

  // Let user see scanning messages
  let currentStep = 0
  scanningMessage.value = scanningMessages[0]

  const segmentInterval = setInterval(() => {
    currentStep++
    if (currentStep < scanningMessages.length) {
      scanningMessage.value = scanningMessages[currentStep]
    } else {
      clearInterval(segmentInterval)

      // 4. Run the check
      runCheckOnFile(fileId)
    }
  }, 700)
}

async function runCheckOnFile(fileId: string) {
  try {
    // Check if user has enough credits
    if (!userStore.hasEnoughCredits(1)) {
      console.error('Insufficient credits')
      isScanning.value = false
      return
    }

    // Run the check
    const check = await checkStore.runCheck(
      fileId,
      selectedContext.value.toLowerCase()
    )

    // Store the check ID for display
    lastCheckId.value = check._id

    // Update user credits (server will handle deduction)
    userStore.updateCredits(check.credits_remaining || 0)

    // Show results
    isScanning.value = false
    showResults.value = true

    // Initialize checklist
    checklistState.value = new Array(check.action_checklist.length).fill(false)
  } catch (err) {
    console.error('Check failed:', checkStore.error)
    isScanning.value = false
    // Show error to user
  }
}
```

## Step 4: Update Demo Capture

Replace `handleCaptureSimulation()` with:

```typescript
async function handleCaptureSimulation() {
  // Fetch the demo image
  const demoImageUrl =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000'

  // Create a fake file for upload (for demo purposes)
  const response = await fetch(demoImageUrl)
  const blob = await response.blob()
  const demoFile = new File([blob], 'demo.jpg', { type: 'image/jpeg' })

  // Upload and process
  await handleFileUpload({ target: { files: [demoFile] } } as any)
}
```

## Step 5: Add User Authentication

Add to component setup:

```typescript
onMounted(async () => {
  try {
    // Initialize with authenticated user
    // This should come from your auth system
    const identifier = 'user@example.com' // from auth context
    await userStore.fetchUser(identifier)

    // Verify user has credits
    if (!userStore.isAuthenticated) {
      console.error('User not authenticated')
      // Redirect to login
    }
  } catch (err) {
    console.error('Auth failed:', userStore.error)
  }
})
```

## Step 6: Add Loading and Error States

Update the results section to handle errors:

```typescript
// In template, update results display:
<div v-if="checkStore.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
  <p class="text-red-400 text-sm">{{ checkStore.error }}</p>
  <button @click="resetLayoutTray" class="mt-2 text-red-500 text-xs underline">
    Dismiss
  </button>
</div>

<!-- Loading state -->
<div v-if="checkStore.isRunningCheck" class="text-center py-8">
  <p class="text-cream/60 text-sm">Check in progress...</p>
</div>
```

## Step 7: Add Credit Display

Add to header:

```typescript
<div class="absolute top-4 right-4 text-xs text-cream/60">
  Credits: {{ userStore.credits }}
</div>
```

## Complete Integration Example

Here's a minimal complete example:

```typescript
import { useFileStore, useCheckStore, useUserStore } from '~/stores'
import { onMounted, computed } from 'vue'

export default {
  setup() {
    const fileStore = useFileStore()
    const checkStore = useCheckStore()
    const userStore = useUserStore()

    const lastCheckId = ref('')
    const selectedContext = ref('Interview')

    // Initialize on mount
    onMounted(async () => {
      await userStore.fetchUser('user@example.com')
    })

    // Display check from store
    const checkResult = computed(() => {
      if (lastCheckId.value) {
        const check = checkStore.getCheck(lastCheckId.value)
        if (check) return check
      }
      return mockCheckResult
    })

    // Upload and run check
    async function handleFileUpload(event) {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        // Upload
        const metadata = await fileStore.uploadFile(file)

        // Show preview
        const reader = new FileReader()
        reader.onload = (e) => {
          capturedPhoto.value = e.target.result
          // Run check
          runCheck(metadata._id)
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error('Failed:', fileStore.error)
      }
    }

    // Run the actual check
    async function runCheck(fileId) {
      isScanning.value = true

      // Scan animation...
      setTimeout(async () => {
        try {
          const check = await checkStore.runCheck(
            fileId,
            selectedContext.value.toLowerCase()
          )
          lastCheckId.value = check._id
          isScanning.value = false
          showResults.value = true
        } catch (err) {
          console.error('Check failed:', checkStore.error)
          isScanning.value = false
        }
      }, 2800)
    }

    return {
      handleFileUpload,
      checkResult,
      userStore,
      checkStore,
      // ... other returns
    }
  }
}
```

## Environment Setup

Make sure your `.env` file has:

```
NUXT_MONGODB_URI=mongodb://...
NUXT_OPENAI_API_KEY=sk-...
```

## Testing Checklist

- [ ] User can authenticate
- [ ] User can select context (Interview/Casual/Formal)
- [ ] File upload works
- [ ] Demo snap works with real check
- [ ] Scanning animation shows
- [ ] Check results display correctly
- [ ] Score animations work
- [ ] Categories expand/collapse
- [ ] Checklist state persists
- [ ] Credits update after check
- [ ] Error messages show on failure
- [ ] Can retake multiple photos

## Common Issues

### "Store not initialized"
Make sure imports are correct and stores are exported from `~/stores`

### "File upload fails"
Check that `fileStore.uploadFile()` is implemented and backend is running

### "Check returns mock data"
Verify backend check endpoint is returning real data (not mocked)

### "Animations don't trigger"
Ensure `triggerTweens()` is called after results sheet enters

## Next: Real API Integration

Once stores are working, you can:
1. Enable real OpenAI analysis
2. Add credit system
3. Implement user profiles
4. Add history/saved checks
5. Share results functionality
