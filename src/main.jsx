import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setAuthTokenProvider } from './api/forensics'
import { fetchToken } from './lib/auth'

// Every API request mints (or reuses) a short-lived JWT, so the backend can
// attribute custody entries to a verified user instead of accepting a name the
// client made up.
setAuthTokenProvider(fetchToken)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
