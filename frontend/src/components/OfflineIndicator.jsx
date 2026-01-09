// Offline indicator banner
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getPendingSyncActions } from '../utils/indexedDB';

export default function OfflineIndicator() {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initial check
    updatePendingCount();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 2000);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleSWMessage = (event) => {
    if (event.data && event.data.type === 'SYNC_TRIGGERED') {
      updatePendingCount();
    }
  };

  const updatePendingCount = async () => {
    try {
      const actions = await getPendingSyncActions();
      setPendingCount(actions.length);
    } catch (error) {
      console.error('Error getting pending sync count:', error);
    }
  };

  // Don't show banner if online and no pending items
  if (isOnline && pendingCount === 0 && !showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showBanner ? 'translate-y-0' : isOnline && pendingCount === 0 ? '-translate-y-full' : 'translate-y-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`px-4 py-3 shadow-lg ${
          isOnline
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {pendingCount > 0
                    ? t(`Back online! Syncing ${pendingCount} pending action(s)...`)
                    : t('You\'re back online!')
                  }
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {t('No internet connection')}
                  {pendingCount > 0 && ` • ${pendingCount} ${t('pending action(s)')}`}
                </span>
              </>
            )}
          </div>

          {showBanner && (
            <button
              onClick={() => setShowBanner(false)}
              className="text-white hover:text-gray-200 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
              aria-label={t('Close notification')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
