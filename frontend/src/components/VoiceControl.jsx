import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useLanguage } from '../context/LanguageContext';
import { usePet } from '../context/PetContext';

/**
 * VoiceControl - Floating voice assistant widget with command recognition
 * Provides voice navigation, reading aloud, and accessibility features
 */
export default function VoiceControl() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage, t } = useLanguage();
  const { pets, selectPet, currentPetId } = usePet();

  const [isExpanded, setIsExpanded] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('');
  const [showCommands, setShowCommands] = useState(false);

  // Configure speech recognition based on current language
  const speechLang = currentLanguage === 'bn' ? 'bn-BD' : 'en-US';
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error: recognitionError,
    isSupported: isRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: speechLang,
    continuous: true, // Keep listening continuously
    interimResults: true,
  });

  const {
    isSpeaking,
    speak,
    cancel: cancelSpeech,
    isSupported: isSynthesisSupported,
  } = useSpeechSynthesis({
    lang: speechLang,
    rate: 1.0,
    pitch: 1.0,
  });

  // Voice commands mapping (English and Bangla)
  const commands = {
    navigation: {
      en: [
        { pattern: /go to dashboard|open dashboard|dashboard/i, action: () => navigate('/dashboard'), feedback: 'Opening Dashboard' },
        { pattern: /open chat|start chat|chat|assistant/i, action: () => navigate('/assistant'), feedback: 'Opening Chat Assistant' },
        { pattern: /find vet|vet finder|locate vet/i, action: () => navigate('/find-a-vet'), feedback: 'Opening Vet Finder' },
        { pattern: /skin (disease|detection)|check skin|analyze skin/i, action: () => navigate('/skinDiseaseDetection'), feedback: 'Opening Skin Disease Detection' },
        { pattern: /pet care|care guide/i, action: () => navigate('/petcare'), feedback: 'Opening Pet Care Guide' },
        { pattern: /vaccination|vaccine alert/i, action: () => navigate('/vaccination-alerts'), feedback: 'Opening Vaccination Alerts' },
        { pattern: /profile|my profile/i, action: () => navigate('/profile'), feedback: 'Opening Profile' },
        { pattern: /pet profile/i, action: () => navigate('/petprofile'), feedback: 'Opening Pet Profile' },
        { pattern: /add pet|new pet/i, action: () => navigate('/addPet'), feedback: 'Opening Add Pet' },
        { pattern: /about|about us/i, action: () => navigate('/about'), feedback: 'Opening About Page' },
      ],
      bn: [
        { pattern: /ড্যাশবোর্ড|ড্যাশবোর্ডে যাও/i, action: () => navigate('/dashboard'), feedback: 'ড্যাশবোর্ড খুলছি' },
        { pattern: /চ্যাট|চ্যাট খুলুন|সহায়ক/i, action: () => navigate('/assistant'), feedback: 'চ্যাট সহায়ক খুলছি' },
        { pattern: /ভেট খুঁজুন|ডাক্তার খুঁজুন/i, action: () => navigate('/find-a-vet'), feedback: 'ভেট ফাইন্ডার খুলছি' },
        { pattern: /চর্মরোগ|ত্বক পরীক্ষা/i, action: () => navigate('/skinDiseaseDetection'), feedback: 'চর্মরোগ নির্ণয় খুলছি' },
        { pattern: /পোষা যত্ন|যত্ন গাইড/i, action: () => navigate('/petcare'), feedback: 'পোষা যত্ন গাইড খুলছি' },
        { pattern: /টিকা|টিকার সতর্কতা/i, action: () => navigate('/vaccination-alerts'), feedback: 'টিকা সতর্কতা খুলছি' },
        { pattern: /প্রোফাইল/i, action: () => navigate('/profile'), feedback: 'প্রোফাইল খুলছি' },
        { pattern: /পোষা প্রোফাইল/i, action: () => navigate('/petprofile'), feedback: 'পোষা প্রোফাইল খুলছি' },
        { pattern: /পোষা যোগ করুন/i, action: () => navigate('/addPet'), feedback: 'পোষা যোগ খুলছি' },
      ],
    },
    actions: {
      en: [
        { pattern: /next pet|switch pet/i, action: switchToNextPet, feedback: 'Switching to next pet' },
        { pattern: /emergency|call emergency|help/i, action: () => window.location.href = 'tel:01346990244', feedback: 'Calling emergency number' },
        { pattern: /show commands|help|what can you do/i, action: () => setShowCommands(true), feedback: 'Showing available commands' },
        { pattern: /close|hide/i, action: () => setIsExpanded(false), feedback: 'Closing voice control' },
      ],
      bn: [
        { pattern: /পরবর্তী পোষা|পোষা পরিবর্তন/i, action: switchToNextPet, feedback: 'পরবর্তী পোষায় যাচ্ছি' },
        { pattern: /জরুরি|জরুরি কল|সাহায্য/i, action: () => window.location.href = 'tel:01346990244', feedback: 'জরুরি নম্বরে কল করছি' },
        { pattern: /কমান্ড দেখান|সাহায্য/i, action: () => setShowCommands(true), feedback: 'উপলব্ধ কমান্ড দেখাচ্ছি' },
        { pattern: /বন্ধ করুন/i, action: () => setIsExpanded(false), feedback: 'ভয়েস নিয়ন্ত্রণ বন্ধ করছি' },
      ],
    },
  };

  // Switch to next pet
  function switchToNextPet() {
    if (!pets || pets.length === 0) {
      speak(t('No pets available'));
      return;
    }

    const currentIndex = pets.findIndex(p => p.id === currentPetId);
    const nextIndex = (currentIndex + 1) % pets.length;
    const nextPet = pets[nextIndex];
    
    selectPet(nextPet.id);
    speak(t(`Switched to ${nextPet.name}`));
  }

  // Process voice command
  const processCommand = useCallback((text) => {
    const lowerText = text.toLowerCase().trim();
    const lang = currentLanguage === 'bn' ? 'bn' : 'en';

    // Check navigation commands
    for (const cmd of commands.navigation[lang]) {
      if (cmd.pattern.test(lowerText)) {
        setCommandFeedback(cmd.feedback);
        speak(cmd.feedback);
        cmd.action();
        return true;
      }
    }

    // Check action commands
    for (const cmd of commands.actions[lang]) {
      if (cmd.pattern.test(lowerText)) {
        setCommandFeedback(cmd.feedback);
        if (cmd.feedback) speak(cmd.feedback);
        cmd.action();
        return true;
      }
    }

    return false;
  }, [currentLanguage, pets, currentPetId]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      const recognized = processCommand(transcript);
      
      if (!recognized) {
        setCommandFeedback(t("Command not recognized. Say 'show commands' for help."));
      }
      
      // Reset after processing
      setTimeout(() => {
        resetTranscript();
        setCommandFeedback('');
      }, 3000);
    }
  }, [transcript, processCommand, resetTranscript, t]);

  // Handle mic button click
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setCommandFeedback(t('Stopped listening'));
    } else {
      setCommandFeedback('');
      startListening();
      speak(t('Listening for command'));
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      speak(t('Voice control expanded. Say a command or ask for help.'));
    }
  };

  if (!isRecognitionSupported && !isSynthesisSupported) {
    return null; // Don't render if not supported
  }

  return (
    <>
      {/* Floating Voice Control Button */}
      <div
        className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2"
        role="region"
        aria-label={t("Voice control")}
      >
        {/* Expanded Command Panel */}
        {isExpanded && (
          <div
            className="bg-white/95 backdrop-blur-md border-2 border-[#fdd142] rounded-2xl shadow-2xl p-4 w-80 animate-[slideup_0.3s_ease-out]"
            role="dialog"
            aria-label={t("Voice commands panel")}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">🎤</span>
                {t("Voice Assistant")}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-500 hover:text-slate-900 transition"
                aria-label={t("Close voice panel")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Status Display */}
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-700">
                {isListening && (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    {t("Listening...")}
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    {t("Speaking...")}
                  </div>
                )}
                {!isListening && !isSpeaking && (
                  <div className="text-slate-500">
                    {t("Ready to listen")}
                  </div>
                )}
              </div>

              {/* Live Transcript */}
              {(interimTranscript || transcript) && (
                <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs">
                  <span className="text-slate-600">{t("You said:")} </span>
                  <span className="font-medium text-slate-900">
                    {transcript || interimTranscript}
                  </span>
                </div>
              )}

              {/* Command Feedback */}
              {commandFeedback && (
                <div
                  className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700"
                  role="status"
                  aria-live="polite"
                >
                  ✓ {commandFeedback}
                </div>
              )}

              {/* Error Display */}
              {recognitionError && (
                <div
                  className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
                  role="alert"
                >
                  ⚠ {recognitionError}
                </div>
              )}
            </div>

            {/* Quick Commands */}
            <div className="space-y-2">
              <button
                onClick={() => setShowCommands(!showCommands)}
                className="w-full text-left text-sm text-slate-600 hover:text-slate-900 flex items-center justify-between"
              >
                {t("Available Commands")}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${showCommands ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCommands && (
                <div className="text-xs space-y-1 pl-2 border-l-2 border-[#fdd142] max-h-48 overflow-y-auto">
                  <p className="font-semibold text-slate-700">{t("Navigation:")}</p>
                  <p>• {t('"Go to dashboard"')}</p>
                  <p>• {t('"Open chat"')}</p>
                  <p>• {t('"Find vet"')}</p>
                  <p>• {t('"Skin detection"')}</p>
                  <p className="font-semibold text-slate-700 mt-2">{t("Actions:")}</p>
                  <p>• {t('"Next pet"')}</p>
                  <p>• {t('"Emergency call"')}</p>
                  <p>• {t('"Show commands"')}</p>
                </div>
              )}
            </div>

            {/* Main Mic Buttons in Panel */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleMicClick}
                disabled={!isRecognitionSupported}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#fdd142] text-slate-900 hover:bg-[#fdd142]/90'
                }`}
                aria-label={isListening ? t("Stop listening") : t("Start voice command")}
              >
                {isListening ? t("🛑 Stop") : t("🎤 Start")}
              </button>
              
              {isListening && (
                <button
                  onClick={() => {
                    stopListening();
                    resetTranscript();
                    setCommandFeedback('');
                  }}
                  className="px-4 py-3 rounded-xl font-semibold bg-slate-500 text-white hover:bg-slate-600 transition-all"
                  aria-label={t("Cancel and clear")}
                  title={t("Cancel and clear")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Floating Mic Button */}
        <button
          onClick={toggleExpanded}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center border-2 ${
            isListening
              ? 'bg-red-500 border-red-600 animate-pulse'
              : isSpeaking
              ? 'bg-blue-500 border-blue-600 animate-pulse'
              : 'bg-[#fdd142] border-[#fdd142] hover:bg-[#fdd142]/90'
          }`}
          aria-label={t("Toggle voice control")}
          aria-expanded={isExpanded}
          title={t("Voice Assistant (Ctrl + /)")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-slate-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {isListening ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            )}
          </svg>
          
          {/* Steady ring animation when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-red-400 opacity-75"></span>
          )}
        </button>
      </div>

      {/* Keyboard Shortcut Listener */}
      <KeyboardShortcuts
        onVoiceToggle={toggleExpanded}
        onStartListening={handleMicClick}
      />
    </>
  );
}

/**
 * Keyboard shortcuts component for accessibility
 */
function KeyboardShortcuts({ onVoiceToggle, onStartListening }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + / or Cmd + / - Toggle voice control panel
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        onVoiceToggle();
      }
      
      // Ctrl + Shift + V or Cmd + Shift + V - Start listening
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        onStartListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onVoiceToggle, onStartListening]);

  return null;
}
