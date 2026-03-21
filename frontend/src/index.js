import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './pages/styles/global.css';
import './pages/styles/theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
