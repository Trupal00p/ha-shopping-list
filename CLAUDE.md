# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an unofficial Home Assistant Todo List app built with Expo/React Native. It provides a standalone mobile app for managing multiple todo lists (including shopping lists) synchronized with Home Assistant via REST API and WebSocket connections for real-time updates. The app uses the modern Home Assistant todo integration API.

## Development Commands

### Building and Running

```bash
# Start development server with tunnel
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build APK for Android (preview)
task apk
# or: eas build --platform android --local --profile preview --output ha-shopping.apk

# Build development APK
task devbuild
# or: eas build --platform android --local --profile development --output ha-shopping.apk

# Install APK on device
task install
# or: adb install ha-shopping.apk

# List connected devices
task devices
# or: adb devices
```

### Development Proxy

For local development with Home Assistant:

```bash
npm run proxy
# or: task proxy
```

The proxy runs on port 3000 and requires `EXPO_PUBLIC_API_HOST` environment variable (typically set in `.env.local`).

## Architecture

### Core Data Flow (Offline-First)

The app implements a true offline-first architecture using React Query persistence and mutation queueing:

1. **Settings Storage** (`components/SettingContext.tsx`): Manages Home Assistant connection settings (API key, host, TLS, selected list) stored in SecureStore (mobile) or localStorage (web)

2. **Persistent Cache** (`app/_layout.tsx`):
   - React Query cache persisted to AsyncStorage
   - Todo list data rehydrated on app launch
   - 24-hour cache lifetime, 5-minute stale time
   - App works offline immediately after first load

3. **Network Detection** (`hooks/useNetworkStatus.ts`):
   - Integrates NetInfo with React Query's online manager
   - Automatically pauses queries when offline
   - Provides real-time network status to UI

4. **List Discovery** (`hooks/useTodoLists.ts`):
   - Fetches all todo.* entities from Home Assistant
   - Auto-discovers available todo lists
   - Presents friendly names in list picker
   - 5-minute cache for list metadata

5. **Real-time Synchronization** (`hooks/useTodoItems.ts`):
   - Fetches todo entity state via REST API (`/api/states/{entity_id}`)
   - Items stored in entity attributes
   - Establishes WebSocket connection to Home Assistant
   - Subscribes to `state_changed` events with randomized ID
   - Filters for selected entity_id changes
   - Invalidates React Query cache on connection and when events received
   - Handles authentication failures gracefully

6. **Offline-First Mutations** (`hooks/useTodoMutations.ts`):
   - Uses Home Assistant services API (todo.add_item, todo.update_item, todo.remove_item)
   - `networkMode: 'offlineFirst'` enables automatic queueing
   - Immediately updates local state with `_pending` flag
   - Queues mutations when offline, auto-syncs when online
   - 3 retry attempts with exponential backoff
   - Distinguishes between offline and actual failures
   - Adds timestamps for conflict resolution

7. **State Management**: React Query handles caching, persistence, and synchronization. No Redux store needed.

### Key Components

- **SettingsProvider** (`components/SettingContext.tsx`): Provides settings and HTTP request configuration throughout the app. Manages selected list state. Auto-redirects to settings page if credentials missing. Includes `setSelectedList()` helper.

- **useNetworkStatus** (`hooks/useNetworkStatus.ts`): Monitors network connectivity using NetInfo. Integrates with React Query's online manager to automatically pause/resume operations. Provides `isOnline` and `isConnected` state.

- **useTodoLists** (`hooks/useTodoLists.ts`): Fetches all todo entities from `/api/states`. Filters for `todo.*` entities. Returns array of `{id, name, entity_id}` sorted by name.

- **useTodoItems** (`hooks/useTodoItems.ts`): Custom hook that fetches items for a specific todo entity. Combines REST API data fetching (`/api/states/{entity_id}`) with WebSocket state_changed subscription. Splits items into `todo` and `completed` arrays based on status. Tracks WebSocket connection status. Returns raw `data` array for pending change tracking.

- **useTodoMutations** (`hooks/useTodoMutations.ts`): Provides three offline-first mutations using HA services API:
  - `toggle`: Call todo.update_item to change status (adds `_pending` and `_timestamp` flags)
  - `addNew`: Call todo.add_item to create item (uses temporary uid until synced)
  - `clearCompleted`: Call todo.remove_item for all completed items
  - All mutations queue when offline and auto-sync with 3 retries

- **ListPicker** (`components/ListPicker.tsx`): Dropdown menu for selecting active todo list. Shows friendly names, checkmark on selected list. Auto-selects first list if none chosen.

- **ShoppingListView** (`components/ShoppingList.tsx`): Main list display with:
  - ListPicker at top for switching lists
  - Pull-to-refresh (triggers refetch + WebSocket reconnect)
  - Sync status banner showing pending changes count
  - Per-item sync badges for pending mutations
  - Network-aware connection status indicator

- **SyncStatusBadge** (`components/SyncStatusBadge.tsx`): Visual indicator shown on list items with unsaved changes. Uses cloud-upload icon for pending items.

### WebSocket Connection

The WebSocket connection (`hooks/useTodoItems.ts:48-135`) follows Home Assistant's WebSocket API protocol:

1. Connects to `ws[s]://HOST/api/websocket`
2. Waits for `auth_required` message
3. Sends `auth` message with access token
4. After `auth_ok`:
   - Subscribes to `state_changed` events with randomized ID
   - Filters for changes to the selected entity_id
   - Invalidates cache to sync any offline changes
5. Handles `auth_invalid` by closing connection and notifying user
6. Invalidates React Query cache when selected todo entity changes

The connection automatically closes/reopens when settings or selected list change via the `effectKey` toggle mechanism. Error messages only shown if connection was previously established.

### Navigation

Uses Expo Router with file-based routing:
- `app/index.tsx`: Main shopping list screen
- `app/settings.tsx`: Settings configuration screen
- `app/_layout.tsx`: Root layout with providers (QueryClient, Paper, Settings, Snack)

### Storage Strategy

**Settings** are stored via:
1. **Mobile**: Expo SecureStore (encrypted keychain/keystore)
2. **Web fallback**: localStorage
3. **Values**: API key, host, TLS setting, selected list entity ID
4. **Trimming**: API key and host whitespace removed on save (`components/SettingContext.tsx:77-80`)

**Todo List Data** is persisted via:
1. **AsyncStorage**: React Query cache automatically saved
2. **Throttled writes**: 1 second throttle to reduce I/O
3. **Cache keys**:
   - `todo_lists` for list metadata
   - `todo_items:{entity_id}` for each list's items
4. **Retention**: 24-hour cache lifetime (gcTime)
5. **Rehydration**: Automatic on app launch via PersistQueryClientProvider

## Important Implementation Notes

### Offline Functionality
- **True offline-first**: App works completely offline after initial data load
- **Mutation queueing**: React Query automatically queues mutations when offline
- **Auto-sync**: Queued mutations processed automatically when network restored
- **Retry strategy**: 3 attempts with exponential backoff (1s, 2s, 4s, up to 30s max)
- **Pending indicators**: `_pending` flag tracks unsynced changes, shown in UI
- **Timestamps**: `_timestamp` field enables conflict resolution (Last Write Wins)

### Data Flow
- The app redirects to `/settings` on initial launch if credentials are missing
- Pull-to-refresh triggers both REST refetch AND WebSocket reconnection
- WebSocket uses randomized subscription ID for multiple connection support
- All mutations implement optimistic updates with smart rollback:
  - Rollback only on actual failure (not when offline)
  - Show "Saved locally" message when offline
  - Show "Failed To Save" only for real errors

### UI Behavior
- Connection status shown only when WebSocket disconnected AND device is online
- Sync status banner shown when offline or when pending changes exist
- Per-item sync badges shown on items with unsaved changes
- Network state integrated with React Query's online manager for automatic query pausing

### Type Safety
- `TodoItem` type represents Home Assistant todo items:
  - `uid`: unique identifier
  - `summary`: item text
  - `status`: "needs_action" or "completed"
  - `_pending` and `_timestamp`: local-only fields
- Legacy `ShoppingItem` type kept for reference but not used
- Local-only fields not sent to server
- Server responses don't include local fields, cleared by invalidation

### Home Assistant API
- **Todo Lists**: Discovered via `/api/states`, filtered for `todo.*` entities
- **Todo Items**: Fetched from `/api/states/{entity_id}`, items in `attributes.items`
- **Mutations**: Use `/api/services/todo/{service}` with entity_id and parameters
  - `todo.add_item`: `{entity_id, item: summary}`
  - `todo.update_item`: `{entity_id, item: uid, status: "completed" | "needs_action"}`
  - `todo.remove_item`: `{entity_id, item: [uid1, uid2, ...]}`
- **WebSocket**: Subscribe to `state_changed` events, filter by entity_id
