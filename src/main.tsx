import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Theme } from '@astryxdesign/core/theme'
import { stoneTheme } from '@astryxdesign/theme-stone/built'

// Order matters: reset, then Astryx base, then the Stone theme, then our fonts
// and palette overrides last so they win inside the same cascade layer.
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-stone/theme.css'
import './theme/fonts.css'
import './theme/coopy.css'

import App from './App'
import Index from './pages/Index'
import Recipe from './pages/Recipe'
import Cook from './pages/Cook'
import Add from './pages/Add'
import Plans from './pages/Plans'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Light-only: this gets read in bright kitchens, and a dark editorial
        palette would undercut the paper-and-ink premise. */}
    <Theme theme={stoneTheme} mode="light">
      <BrowserRouter>
        <Routes>
          {/* Cook mode sits outside the shell — it's full-bleed by design. */}
          <Route path="/cook/:slug" element={<Cook />} />
          <Route element={<App />}>
            <Route path="/" element={<Index />} />
            <Route path="/r/:slug" element={<Recipe />} />
            <Route path="/add" element={<Add />} />
            {/* Shopping plans are local-only (prices, order details) — the
                route doesn't exist in the public build. */}
            {import.meta.env.DEV && (
              <>
                <Route path="/plans" element={<Plans />} />
                <Route path="/plans/:id" element={<Plans />} />
              </>
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </Theme>
  </StrictMode>,
)
