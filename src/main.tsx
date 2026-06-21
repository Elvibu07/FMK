import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UIProvider } from './contexts/UIContext';

// Force clear all cookies on localhost to prevent 431 Request Header Fields Too Large error
if (typeof window !== 'undefined') {
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // If the URL contains ?reset=1, completely nuke local storage
  if (window.location.search.includes('reset=1')) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </StrictMode>,
);
