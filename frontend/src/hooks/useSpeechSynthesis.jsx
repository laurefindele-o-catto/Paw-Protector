import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Web Speech API - Speech Synthesis (text-to-speech)
 * Supports multilingual voices with rate and pitch controls
 * 
 * @param {Object} options Configuration options
 * @param {string} options.lang - Language code (e.g., 'en-US', 'bn-BD')
 * @param {number} options.rate - Speech rate (0.1 to 10, default 1)
 * @param {number} options.pitch - Speech pitch (0 to 2, default 1)
 * @param {number} options.volume - Speech volume (0 to 1, default 1)
 * @returns {Object} Speech synthesis state and controls
 */
export const useSpeechSynthesis = (options = {}) => {
  const {
    lang = 'en-US',
    rate = 1,
    pitch = 1,
    volume = 1,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [error, setError] = useState(null);

  const synthRef = useRef(null);
  const currentUtteranceRef = useRef(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      setError('Speech synthesis is not supported in this browser');
      return;
    }

    setIsSupported(true);
    synthRef.current = window.speechSynthesis;

    // Load available voices
    const loadVoices = () => {
      const availableVoices = synthRef.current.getVoices();
      setVoices(availableVoices);

      // Auto-select voice matching the language
      const preferredVoice = availableVoices.find(voice => 
        voice.lang.startsWith(lang.split('-')[0])
      ) || availableVoices[0];

      setSelectedVoice(preferredVoice);
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [lang]);

  // Speak text
  const speak = useCallback((text, options = {}) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply configuration
    utterance.lang = options.lang || lang;
    utterance.rate = options.rate !== undefined ? options.rate : rate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : pitch;
    utterance.volume = options.volume !== undefined ? options.volume : volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      
      let errorMessage = 'Speech synthesis error occurred';
      
      switch (event.error) {
        case 'canceled':
          // Don't show error for intentional cancellations
          return;
        case 'interrupted':
          errorMessage = 'Speech was interrupted';
          break;
        case 'audio-busy':
          errorMessage = 'Audio system is busy. Please try again.';
          break;
        case 'audio-hardware':
          errorMessage = 'Audio hardware error occurred';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech synthesis';
          break;
        case 'synthesis-unavailable':
          errorMessage = 'Speech synthesis is unavailable';
          break;
        case 'synthesis-failed':
          errorMessage = 'Speech synthesis failed';
          break;
        case 'not-allowed':
          errorMessage = 'Speech synthesis permission denied';
          break;
        default:
          errorMessage = `Synthesis error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [lang, rate, pitch, volume, selectedVoice]);

  // Pause speech
  const pause = useCallback(() => {
    if (!synthRef.current || !isSpeaking || isPaused) return;
    
    try {
      synthRef.current.pause();
    } catch (err) {
      console.error('Failed to pause speech:', err);
    }
  }, [isSpeaking, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (!synthRef.current || !isSpeaking || !isPaused) return;
    
    try {
      synthRef.current.resume();
    } catch (err) {
      console.error('Failed to resume speech:', err);
    }
  }, [isSpeaking, isPaused]);

  // Cancel speech
  const cancel = useCallback(() => {
    if (!synthRef.current) return;
    
    try {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    } catch (err) {
      console.error('Failed to cancel speech:', err);
    }
  }, []);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // Change voice
  const changeVoice = useCallback((voiceURI) => {
    const voice = voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [voices]);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    error,
    speak,
    pause,
    resume,
    cancel,
    togglePause,
    changeVoice,
  };
};

export default useSpeechSynthesis;
