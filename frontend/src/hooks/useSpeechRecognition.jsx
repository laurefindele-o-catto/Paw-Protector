import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Web Speech API - Speech Recognition (voice-to-text)
 * Supports continuous and single-shot modes with multilingual support
 * 
 * @param {Object} options Configuration options
 * @param {string} options.lang - Language code (e.g., 'en-US', 'bn-BD')
 * @param {boolean} options.continuous - Whether to keep listening after user stops speaking
 * @param {boolean} options.interimResults - Whether to return interim results during speech
 * @returns {Object} Speech recognition state and controls
 */
export const useSpeechRecognition = (options = {}) => {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setIsSupported(true);
    
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalText += transcriptPiece + ' ';
        } else {
          interimText += transcriptPiece;
        }
      }

      if (finalText) {
        setTranscript(prev => (prev + finalText).trim());
        setInterimTranscript('');
      } else if (interimText) {
        setInterimTranscript(interimText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error occurred';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          // Don't show error for intentional stops
          return;
        default:
          errorMessage = `Recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      
      // Auto-restart if continuous mode and wasn't manually stopped
      if (continuous && isListeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.error('Failed to restart recognition:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [lang, continuous, interimResults]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        // Already started, ignore
        return;
      }
      console.error('Failed to start recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    isListeningRef.current = false;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop recognition:', err);
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Abort current recognition
  const abortListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    isListeningRef.current = false;
    
    try {
      recognitionRef.current.abort();
    } catch (err) {
      console.error('Failed to abort recognition:', err);
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    abortListening,
  };
};

export default useSpeechRecognition;