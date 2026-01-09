// Sync service for managing offline queue and background sync
import apiConfig from '../config/apiConfig';
import {
  queueForSync,
  getPendingSyncActions,
  removeSyncAction,
  updateSyncActionStatus,
} from '../utils/indexedDB';

const API_BASE = apiConfig.apiUrl;

/**
 * Queue an API mutation for sync when offline
 */
export async function queueMutation(type, endpoint, method, data, options = {}) {
  const action = {
    type,
    endpoint,
    method,
    data,
    options,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const id = await queueForSync(action);
  console.log(`[SyncService] Queued ${type} for sync:`, id);

  // Try to sync immediately if online
  if (navigator.onLine) {
    setTimeout(() => syncPendingActions(), 100);
  }

  return { queued: true, id };
}

/**
 * Sync all pending actions
 */
export async function syncPendingActions() {
  if (!navigator.onLine) {
    console.log('[SyncService] Offline, skipping sync');
    return { success: false, reason: 'offline' };
  }

  const actions = await getPendingSyncActions();
  if (actions.length === 0) {
    console.log('[SyncService] No pending actions to sync');
    return { success: true, synced: 0 };
  }

  console.log(`[SyncService] Syncing ${actions.length} pending actions...`);

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Process actions in order (FIFO)
  for (const action of actions) {
    try {
      await updateSyncActionStatus(action.id, 'syncing');

      const result = await executeAction(action);

      if (result.success) {
        await removeSyncAction(action.id);
        results.success++;
        console.log(`[SyncService] Synced ${action.type}:`, action.id);

        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('sync-success', {
          detail: { action, result: result.data }
        }));
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`[SyncService] Failed to sync ${action.type}:`, error);

      action.retryCount = (action.retryCount || 0) + 1;

      // Remove after 5 failed attempts
      if (action.retryCount >= 5) {
        await removeSyncAction(action.id);
        console.log(`[SyncService] Removed ${action.type} after 5 failed attempts`);
      } else {
        await updateSyncActionStatus(action.id, 'failed', error.message);
      }

      results.failed++;
      results.errors.push({ action, error: error.message });

      // Dispatch error event
      window.dispatchEvent(new CustomEvent('sync-error', {
        detail: { action, error: error.message }
      }));
    }
  }

  console.log('[SyncService] Sync complete:', results);
  return results;
}

/**
 * Execute a single queued action
 */
async function executeAction(action) {
  const { endpoint, method, data, options } = action;
  const token = localStorage.getItem('token');

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Register background sync (if supported)
 */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pet-data');
      console.log('[SyncService] Background sync registered');
      return true;
    } catch (error) {
      console.error('[SyncService] Background sync registration failed:', error);
      return false;
    }
  }
  console.log('[SyncService] Background sync not supported');
  return false;
}

/**
 * Listen for sync events from service worker
 */
export function listenForSyncEvents(callback) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_TRIGGERED') {
        console.log('[SyncService] Sync triggered by service worker');
        syncPendingActions().then(callback);
      }
    });
  }
}

// ===== Specific mutation helpers =====

export async function queueAddPet(petData) {
  return queueMutation('add_pet', '/api/pets', 'POST', petData);
}

export async function queueUpdatePet(petId, petData) {
  return queueMutation('update_pet', `/api/pets/${petId}`, 'PUT', petData);
}

export async function queueAddVaccination(vaccinationData) {
  return queueMutation('add_vaccination', '/api/vaccinations', 'POST', vaccinationData);
}

export async function queueUpdateVaccination(vaccinationId, vaccinationData) {
  return queueMutation('update_vaccination', `/api/vaccinations/${vaccinationId}`, 'PUT', vaccinationData);
}

export async function queueAddDeworming(dewormingData) {
  return queueMutation('add_deworming', '/api/dewormings', 'POST', dewormingData);
}

export async function queueUpdateDeworming(dewormingId, dewormingData) {
  return queueMutation('update_deworming', `/api/dewormings/${dewormingId}`, 'PUT', dewormingData);
}

export async function queueAddMetric(metricData) {
  return queueMutation('add_metric', '/api/metrics', 'POST', metricData);
}

export async function queueUpdateMetric(metricId, metricData) {
  return queueMutation('update_metric', `/api/metrics/${metricId}`, 'PUT', metricData);
}

export async function queueChatMessage(chatData) {
  return queueMutation('chat_message', '/api/chat', 'POST', chatData);
}

export async function queueAddDisease(diseaseData) {
  return queueMutation('add_disease', '/api/diseases', 'POST', diseaseData);
}

export async function queueUpdateDisease(diseaseId, diseaseData) {
  return queueMutation('update_disease', `/api/diseases/${diseaseId}`, 'PUT', diseaseData);
}
