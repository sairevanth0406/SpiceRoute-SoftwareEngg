import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';     // ← Note: './app' not './App'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);