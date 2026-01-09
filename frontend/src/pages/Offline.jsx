// Offline fallback page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPets, getChatHistory, getPendingSyncActions } from '../utils/indexedDB';

export default function Offline() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedPets, setCachedPets] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCachedData();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to dashboard when back online
      setTimeout(() => navigate('/dashboard'), 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  const loadCachedData = async () => {
    try {
      setLoading(true);
      const [pets, actions, chats] = await Promise.all([
        getPets(),
        getPendingSyncActions(),
        getChatHistory(),
      ]);

      setCachedPets(pets || []);
      setPendingActions(actions || []);
      setRecentChats((chats || []).slice(-5).reverse());
    } catch (error) {
      console.error('Error loading cached data:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = () => {
    if (navigator.onLine) {
      navigate('/dashboard');
    } else {
      // Force a check
      fetch('/api/pets', { method: 'HEAD' })
        .then(() => {
          setIsOnline(true);
          navigate('/dashboard');
        })
        .catch(() => {
          alert(t('Still offline. Please check your connection.'));
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edfdfd] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f172a] mx-auto mb-4"></div>
          <p className="text-slate-600">{t('Loading cached data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edfdfd] text-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isOnline ? t('Reconnecting...') : t('You\'re Offline')}
          </h1>
          <p className="text-slate-600 mb-6">
            {isOnline 
              ? t('Connection restored! Redirecting...')
              : t('No internet connection. You can still view your cached data.')
            }
          </p>
          
          {!isOnline && (
            <button
              onClick={retryConnection}
              className="px-6 py-3 bg-[#0f172a] text-white rounded-full font-semibold hover:bg-slate-900 transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
            >
              {t('Retry Connection')}
            </button>
          )}
        </div>

        {/* Pending Sync Count */}
        {pendingActions.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800">
                  {t('Pending Sync')} ({pendingActions.length})
                </h3>
                <p className="text-sm text-amber-700">
                  {t('Your changes will be synced automatically when you reconnect.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cached Pets */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#fdd142]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {t('Your Pets')} ({cachedPets.length})
          </h2>
          
          {cachedPets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {cachedPets.map((pet) => (
                <div key={pet.id} className="border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <img
                    src={pet.avatar_url || '/placeholder.png'}
                    alt={pet.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{pet.name}</h3>
                    <p className="text-sm text-slate-600 truncate">
                      {pet.species} · {pet.breed || 'Unknown'} · {pet.sex || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('Weight')}: {pet.weight_kg || '—'} kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              {t('No cached pets available. Add pets when online.')}
            </p>
          )}
        </section>

        {/* Queued Actions */}
        {pendingActions.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              {t('Queued Actions')}
            </h2>
            
            <div className="space-y-2">
              {pendingActions.map((action, index) => (
                <div key={action.id || index} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium capitalize">{action.type?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded">
                    {t('Pending')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Chat History */}
        {recentChats.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {t('Recent Conversations')}
            </h2>
            
            <div className="space-y-3">
              {recentChats.map((chat, index) => (
                <div key={chat.id || index} className="border-l-4 border-slate-200 pl-4 py-2">
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {chat.question || chat.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(chat.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>{t('Cached data is stored locally on your device.')}</p>
          <p>{t('All pending changes will sync automatically when you reconnect.')}</p>
        </div>
      </div>
    </div>
  );
}
