import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Analytics from './analytics'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.hash.startsWith('#analytics') ? <Analytics /> : <App />}
  </React.StrictMode>,
)
