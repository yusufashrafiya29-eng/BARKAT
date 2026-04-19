import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: {
          background: 'rgba(5, 5, 5, 0.8)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        },
        success: {
          iconTheme: {
            primary: '#00f0ff',
            secondary: '#000',
          },
        },
      }} 
    />
  </React.StrictMode>,
)
