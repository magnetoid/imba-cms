import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerVitePreloadReload } from '@imba/core'
import './index.css'
import App from './App'

registerVitePreloadReload()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
