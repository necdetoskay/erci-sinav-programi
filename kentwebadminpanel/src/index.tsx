import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './utils/axiosConfig'; // Import axios config to apply globally
import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
); 