import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { DataProvider } from './context/DataContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
