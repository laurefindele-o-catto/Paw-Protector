# PWA Implementation - Paw Protector

## Overview
Paw Protector is now a full-featured Progressive Web App (PWA) with offline capabilities, background sync, and optimistic UI updates.

## Features Implemented

### 1. **PWA Manifest** (`public/manifest.json`)
- App metadata with name, description, and theme colors
- App icons (192x192, 512x512) for installation
- Standalone display mode for app-like experience
- Portrait-primary orientation
- App shortcuts for quick access:
  - AI Assistant
  - Pet Profile
  - Skin Detection
  - Emergency Call

### 2. **Service Worker** (`public/sw.js`)
- **Cache-first strategy** for static assets (HTML, CSS, JS, images)
- **Network-first strategy** for API calls with cache fallback
- Automatic offline fallback page (`/offline`)
- Background sync registration for queued mutations
- Push notification support (ready for future enhancement)
- Automatic cache cleanup on updates

### 3. **IndexedDB Storage** (`src/utils/indexedDB.js`)
Stores offline data in structured object stores:
- **Pets**: Pet profiles and basic info
- **Chat History**: AI assistant conversations
- **Care Plans**: Personalized care recommendations
- **Pending Sync**: Queued API mutations
- **Vaccinations**: Vaccination records
- **Dewormings**: Deworming records
- **Health Metrics**: Weight, temperature, vital signs
- **Diseases**: Disease diagnoses and treatments

### 4. **Sync Service** (`src/services/syncService.js`)
- Queue management for offline mutations
- Background sync registration
- Automatic retry with exponential backoff
- Sync events dispatch for UI updates
- Specialized queue functions:
  - `queueAddPet()`, `queueUpdatePet()`
  - `queueAddVaccination()`, `queueUpdateVaccination()`
  - `queueAddDeworming()`, `queueUpdateDeworming()`
  - `queueAddMetric()`, `queueUpdateMetric()`
  - `queueChatMessage()`
  - `queueAddDisease()`, `queueUpdateDisease()`

### 5. **Offline Indicator** (`src/components/OfflineIndicator.jsx`)
- Real-time connection status banner
- Pending sync count display
- Auto-dismissible when back online
- Accessible with ARIA live regions

### 6. **Offline Fallback Page** (`src/pages/Offline.jsx`)
- Displays cached pet data
- Shows pending sync queue
- Recent chat history preview
- Retry connection button
- Auto-redirects when online

### 7. **Optimistic UI Updates**
Updated components with offline support:

#### **BasicInfoTab.jsx**
- Immediate local cache updates
- Queue mutations when offline
- Sync status indicator with spinner
- Toast notifications on sync complete/fail

#### **HealthMetricsTab.jsx**
- Offline metric recording
- Automatic sync on reconnection
- Pending status indicator

#### **VaccinationsTab.jsx**
- Offline vaccination tracking
- Queue for background sync
- Visual sync feedback

#### **DewormingTab.jsx**
- Offline deworming records
- Automatic queue management
- Sync status display

## Installation & Setup

### 1. Prerequisites
```bash
npm install
```

### 2. Add PWA Icons
Place the following icons in `/public/icons/`:
- `icon-192x192.png` (192x192px)
- `icon-512x512.png` (512x512px)
- `badge-72x72.png` (72x72px, optional)

You can generate these from your logo using tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 3. Development
```bash
npm run dev
```

**Note**: Service workers don't work in dev mode by default. To test PWA features:
```bash
npm run build
npm run preview
```

### 4. Production Build
```bash
npm run build
```

The service worker will be automatically registered in production.

## Usage

### Installing the PWA
1. Visit the app in Chrome/Edge/Safari
2. Look for "Install App" prompt in the address bar
3. Click "Install" to add to home screen
4. The app will open in standalone mode

### Offline Usage
1. Open the app while online
2. Navigate to any page to cache data
3. Go offline (airplane mode or disconnect WiFi)
4. Continue using the app with cached data
5. Make changes (add pets, metrics, vaccinations)
6. Changes are queued and shown with sync indicator
7. Reconnect to internet
8. Queued changes sync automatically

### Monitoring Sync Status
- **OfflineIndicator Banner**: Shows connection status at top
- **Pending Sync Count**: Displays number of queued actions
- **Sync Spinner**: Appears on buttons when syncing
- **Toast Notifications**: Confirms sync success/failure

## Architecture

### Data Flow
```
User Action
    ↓
Check Online Status
    ↓
┌─────────────┬─────────────┐
│   Online    │   Offline   │
│             │             │
│ Send to API │ → IndexedDB │
│      ↓      │      ↓      │
│  Success    │  Queue Sync │
│      ↓      │      ↓      │
│ Update UI   │ Update UI   │
└─────────────┴─────────────┘
         ↓
    Back Online
         ↓
  Background Sync
         ↓
   Replay Queue
         ↓
    Update Server
```

### Cache Strategy

#### Static Assets (Cache-First)
- HTML pages
- JavaScript bundles
- CSS stylesheets
- Images and icons
- Fonts

#### API Calls (Network-First)
- `/api/pets/*`
- `/api/chat/*`
- `/api/vaccinations/*`
- `/api/dewormings/*`
- `/api/metrics/*`
- `/api/diseases/*`

#### Offline Fallback
- Navigation requests → `/offline` page
- API requests → JSON error response

## Testing

### Test Offline Mode
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Refresh page
4. Verify offline page loads
5. Test CRUD operations
6. Uncheck "Offline"
7. Verify sync completes

### Test Cache
1. Open DevTools → Application → Cache Storage
2. Verify caches:
   - `paw-protector-static-v1`
   - `paw-protector-dynamic-v1`
   - `paw-protector-images-v1`

### Test IndexedDB
1. Open DevTools → Application → IndexedDB
2. Expand `PawProtectorDB`
3. Verify object stores populated

### Test Background Sync
1. Add data while offline
2. Check "Pending Sync" in offline indicator
3. Go online
4. Monitor Network tab for sync requests
5. Verify pending count decreases

## Browser Support

| Browser | Version | PWA | Service Worker | IndexedDB | Background Sync |
|---------|---------|-----|----------------|-----------|-----------------|
| Chrome  | 90+     | ✅   | ✅              | ✅         | ✅               |
| Edge    | 90+     | ✅   | ✅              | ✅         | ✅               |
| Safari  | 14+     | ✅   | ✅              | ✅         | ❌               |
| Firefox | 88+     | ⚠️   | ✅              | ✅         | ❌               |

⚠️ Firefox doesn't support install prompts but works as PWA when added manually

## Best Practices

### 1. Keep Service Worker Updated
- Version cache names when updating
- Clean up old caches in `activate` event
- Test updates before deploying

### 2. Optimize Cache Size
- Cache only essential assets
- Set maximum cache age
- Implement cache eviction strategy

### 3. Handle Sync Failures
- Implement retry logic with backoff
- Show clear error messages
- Allow manual retry

### 4. Test Thoroughly
- Test on real devices
- Test offline scenarios
- Test sync edge cases
- Test with slow connections

### 5. Monitor Performance
- Track cache hit rates
- Monitor sync queue length
- Log sync failures
- Alert on critical errors

## Future Enhancements

### Planned Features
- [ ] Push notifications for vaccine reminders
- [ ] Periodic background sync for auto-updates
- [ ] Advanced caching strategies
- [ ] Offline image processing
- [ ] Conflict resolution for concurrent edits
- [ ] Differential sync for large datasets
- [ ] Network quality detection
- [ ] Predictive pre-caching

### Advanced Features
- [ ] Web Share API integration
- [ ] Media capture API for photos
- [ ] Geolocation for nearby vets
- [ ] Bluetooth for IoT pet devices
- [ ] WebRTC for video consultations

## Troubleshooting

### Service Worker Not Registering
```javascript
// Check browser console for errors
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
} else {
  console.log('Service Worker NOT supported');
}
```

### Cache Not Working
- Clear browser cache
- Unregister service worker
- Hard refresh (Ctrl+Shift+R)
- Check cache version numbers

### Sync Not Triggering
- Verify online status: `navigator.onLine`
- Check pending actions: `getPendingSyncActions()`
- Check service worker status in DevTools
- Verify background sync permission

### IndexedDB Errors
- Check quota exceeded errors
- Verify object store schemas
- Clear IndexedDB and retry
- Check browser compatibility

## Support

For issues or questions:
1. Check console for errors
2. Inspect Application tab in DevTools
3. Review service worker logs
4. Check IndexedDB data integrity

## License

This PWA implementation is part of Paw Protector - Pet Health Management System.
