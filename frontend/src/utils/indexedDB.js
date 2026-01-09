// IndexedDB wrapper for offline storage

const DB_NAME = 'PawProtectorDB';
const DB_VERSION = 1;

// Object stores
const STORES = {
  PETS: 'pets',
  CHAT_HISTORY: 'chatHistory',
  CARE_PLANS: 'carePlans',
  PENDING_SYNC: 'pendingSync',
  VACCINATIONS: 'vaccinations',
  DEWORMINGS: 'dewormings',
  METRICS: 'healthMetrics',
  DISEASES: 'diseases',
};

let dbInstance = null;

/**
 * Initialize IndexedDB connection
 */
export async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('IndexedDB upgrade needed, creating stores...');

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PETS)) {
        const petStore = db.createObjectStore(STORES.PETS, { keyPath: 'id' });
        petStore.createIndex('userId', 'user_id', { unique: false });
        petStore.createIndex('species', 'species', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CHAT_HISTORY)) {
        const chatStore = db.createObjectStore(STORES.CHAT_HISTORY, { keyPath: 'id', autoIncrement: true });
        chatStore.createIndex('petId', 'petId', { unique: false });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CARE_PLANS)) {
        const careStore = db.createObjectStore(STORES.CARE_PLANS, { keyPath: 'id', autoIncrement: true });
        careStore.createIndex('petId', 'petId', { unique: false });
        careStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.VACCINATIONS)) {
        const vacStore = db.createObjectStore(STORES.VACCINATIONS, { keyPath: 'id' });
        vacStore.createIndex('petId', 'pet_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DEWORMINGS)) {
        const dewormStore = db.createObjectStore(STORES.DEWORMINGS, { keyPath: 'id' });
        dewormStore.createIndex('petId', 'pet_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.METRICS)) {
        const metricStore = db.createObjectStore(STORES.METRICS, { keyPath: 'id' });
        metricStore.createIndex('petId', 'pet_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DISEASES)) {
        const diseaseStore = db.createObjectStore(STORES.DISEASES, { keyPath: 'id' });
        diseaseStore.createIndex('petId', 'pet_id', { unique: false });
      }
    };
  });
}

/**
 * Generic get operation
 */
export async function getFromStore(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic get all operation
 */
export async function getAllFromStore(storeName, indexName = null, indexValue = null) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    let request;
    if (indexName && indexValue !== null) {
      const index = store.index(indexName);
      request = index.getAll(indexValue);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic put/update operation
 */
export async function putInStore(storeName, data) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic delete operation
 */
export async function deleteFromStore(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear entire store
 */
export async function clearStore(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== Pet-specific operations =====

export async function savePets(pets) {
  const promises = pets.map(pet => putInStore(STORES.PETS, pet));
  return Promise.all(promises);
}

export async function getPets(userId = null) {
  if (userId) {
    return getAllFromStore(STORES.PETS, 'userId', userId);
  }
  return getAllFromStore(STORES.PETS);
}

export async function getPet(petId) {
  return getFromStore(STORES.PETS, petId);
}

// ===== Chat history operations =====

export async function saveChatMessage(message) {
  return putInStore(STORES.CHAT_HISTORY, {
    ...message,
    timestamp: message.timestamp || Date.now(),
  });
}

export async function getChatHistory(petId = null) {
  if (petId) {
    return getAllFromStore(STORES.CHAT_HISTORY, 'petId', petId);
  }
  return getAllFromStore(STORES.CHAT_HISTORY);
}

// ===== Care plans operations =====

export async function saveCarePlan(plan) {
  return putInStore(STORES.CARE_PLANS, {
    ...plan,
    date: plan.date || new Date().toISOString(),
  });
}

export async function getCarePlans(petId = null) {
  if (petId) {
    return getAllFromStore(STORES.CARE_PLANS, 'petId', petId);
  }
  return getAllFromStore(STORES.CARE_PLANS);
}

// ===== Pending sync operations =====

export async function queueForSync(action) {
  return putInStore(STORES.PENDING_SYNC, {
    ...action,
    timestamp: Date.now(),
    status: 'pending',
  });
}

export async function getPendingSyncActions() {
  return getAllFromStore(STORES.PENDING_SYNC);
}

export async function removeSyncAction(id) {
  return deleteFromStore(STORES.PENDING_SYNC, id);
}

export async function updateSyncActionStatus(id, status, error = null) {
  const action = await getFromStore(STORES.PENDING_SYNC, id);
  if (action) {
    action.status = status;
    action.lastAttempt = Date.now();
    if (error) action.error = error;
    return putInStore(STORES.PENDING_SYNC, action);
  }
}

// ===== Health data operations =====

export async function saveVaccinations(vaccinations, petId) {
  const promises = vaccinations.map(vac => putInStore(STORES.VACCINATIONS, { ...vac, pet_id: petId }));
  return Promise.all(promises);
}

export async function getVaccinations(petId) {
  return getAllFromStore(STORES.VACCINATIONS, 'petId', petId);
}

export async function saveDewormings(dewormings, petId) {
  const promises = dewormings.map(dew => putInStore(STORES.DEWORMINGS, { ...dew, pet_id: petId }));
  return Promise.all(promises);
}

export async function getDewormings(petId) {
  return getAllFromStore(STORES.DEWORMINGS, 'petId', petId);
}

export async function saveMetrics(metrics, petId) {
  const promises = metrics.map(metric => putInStore(STORES.METRICS, { ...metric, pet_id: petId }));
  return Promise.all(promises);
}

export async function getMetrics(petId) {
  return getAllFromStore(STORES.METRICS, 'petId', petId);
}

export async function saveDiseases(diseases, petId) {
  const promises = diseases.map(disease => putInStore(STORES.DISEASES, { ...disease, pet_id: petId }));
  return Promise.all(promises);
}

export async function getDiseases(petId) {
  return getAllFromStore(STORES.DISEASES, 'petId', petId);
}

// ===== Utility functions =====

export async function getDBSize() {
  const db = await initDB();
  let totalSize = 0;

  for (const storeName of Object.values(STORES)) {
    if (db.objectStoreNames.contains(storeName)) {
      const items = await getAllFromStore(storeName);
      const storeSize = new Blob([JSON.stringify(items)]).size;
      totalSize += storeSize;
    }
  }

  return totalSize;
}

export async function clearAllData() {
  const promises = Object.values(STORES).map(store => clearStore(store));
  return Promise.all(promises);
}

export { STORES };
