import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App.jsx'
import { headFor, ALL_ROUTES } from './seo.js'

export function render(url) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  )
  return { html, head: headFor(url) }
}

export const routes = ALL_ROUTES
