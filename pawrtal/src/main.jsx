import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from './lib/query-client';
import App from './App.jsx';
import './index.css';
import logo2 from './assets/logo2.png';

const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/png';
favicon.href = logo2;
document.head.appendChild(favicon);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClientInstance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);