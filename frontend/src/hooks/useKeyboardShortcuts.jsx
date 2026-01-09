import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for global keyboard shortcuts
 * Implements app-wide keyboard navigation and controls
 * 
 * Shortcuts:
 * - Ctrl/Cmd + K: Open chat
 * - Ctrl/Cmd + /: Toggle voice control
 * - Ctrl/Cmd + 1-9: Navigate to features
 * - Esc: Close modals/overlays
 */
export const useKeyboardShortcuts = (options = {}) => {
  const navigate = useNavigate();
  const {
    onVoiceToggle,
    onEscape,
    disabled = false,
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when typing in input fields (except Escape)
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (isTyping && e.key !== 'Escape') return;

      // Ctrl/Cmd + K - Open Chat
      if (modKey && e.key === 'k') {
        e.preventDefault();
        navigate('/assistant');
        return;
      }

      // Ctrl/Cmd + / - Toggle Voice Control
      if (modKey && e.key === '/') {
        e.preventDefault();
        if (onVoiceToggle) onVoiceToggle();
        return;
      }

      // Ctrl/Cmd + Number (1-9) - Navigate to features
      if (modKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const shortcuts = {
          '1': '/dashboard',
          '2': '/petcare',
          '3': '/assistant',
          '4': '/find-a-vet',
          '5': '/vaccination-alerts',
          '6': '/skinDiseaseDetection',
          '7': '/pet-profile',
          '8': '/profile',
          '9': '/about',
        };
        const path = shortcuts[e.key];
        if (path) navigate(path);
        return;
      }

      // Escape - Close modals/overlays
      if (e.key === 'Escape') {
        if (onEscape) {
          onEscape();
        } else {
          // Default: try to close any open modal/overlay
          const modalClose = document.querySelector('[data-modal-close]');
          if (modalClose) {
            modalClose.click();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onVoiceToggle, onEscape, disabled]);

  return null;
};

export default useKeyboardShortcuts;
