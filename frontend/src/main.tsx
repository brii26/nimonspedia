import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { notificationService } from './services/notification.js';
import { BrowserRouter } from 'react-router-dom'

notificationService.registerWorker().catch(err => console.log(err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)