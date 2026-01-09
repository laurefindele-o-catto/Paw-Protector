import React from 'react';

/**
 * SkipToContent - Accessibility component for keyboard navigation
 * Allows keyboard users to skip navigation and jump directly to main content
 * Appears on Tab focus, hidden otherwise
 */
export default function SkipToContent() {
  const handleSkip = (e) => {
    e.preventDefault();
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-[#fdd142] focus:text-slate-900 focus:font-semibold focus:rounded-lg focus:shadow-xl focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2 focus:outline-none transition-all"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
