import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const root = document.getElementById('root')

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

/* Prerendered HTML is hydrated; a bare shell (dev) is rendered fresh.
   Tested on firstElementChild, not hasChildNodes — in dev the template
   still holds its <!--app-html--> comment, and a comment node would
   satisfy hasChildNodes() and send us down the hydration path. */
if (root.firstElementChild) hydrateRoot(root, tree)
else createRoot(root).render(tree)
