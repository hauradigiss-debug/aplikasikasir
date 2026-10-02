import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { PrinterProvider } from './context/PrinterContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PrinterProvider>
        <App />
      </PrinterProvider>
    </ThemeProvider>
  </StrictMode>,
);
