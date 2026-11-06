import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { installStaticApiFallback } from './firebase/staticApiFallback.ts';
import './index.css';

installStaticApiFallback();

// Register the PWA Service Worker immediately so Android Chrome installability criteria are met without delay
try {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {});
      }
    },
    onRegisterError(error) {
      console.warn('[YourBby PWA] Service worker registration error:', error);
    },
  });
} catch {
  // Fallback direct registration for static production environments
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
