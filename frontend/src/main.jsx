import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerBackgroundSync, syncPendingActions, listenForSyncEvents } from './services/syncService';
import { initDB } from './utils/indexedDB';

// Initialize IndexedDB
initDB().catch(console.error);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW] New service worker installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New version available! Refresh to update.');
              
              // Show update notification
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });

        // Register background sync
        registerBackgroundSync().then((supported) => {
          if (supported) {
            console.log('[SW] Background sync enabled');
          }
        });

        // Listen for sync events from service worker
        listenForSyncEvents((result) => {
          console.log('[SW] Sync completed:', result);
          
          // Dispatch event for UI updates
          window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }));
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading page...');
      window.location.reload();
    });
  });

  // Try to sync when coming back online
  window.addEventListener('online', () => {
    console.log('[Network] Back online, syncing pending actions...');
    syncPendingActions();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    
  </StrictMode>,
)
