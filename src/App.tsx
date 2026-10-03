import { Link, Outlet, useLocation } from 'react-router-dom'
import './App.css'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="shell">
      <header className="masthead">
        <Link to="/" className="masthead__brand">
          <span className="display masthead__wordmark">coopy</span>
          <span className="eyebrow masthead__tagline">The Nixon family recipes</span>
        </Link>

        <nav className="masthead__nav">
          <Link
            to="/"
            className={`masthead__link ${pathname === '/' ? 'is-current' : ''}`}
          >
            Recipes
          </Link>
          {/* /add is deliberately low-key — it's an authoring tool, not the
              front door for someone who just came to read a recipe. */}
          <Link
            to="/add"
            className={`masthead__link ${pathname === '/add' ? 'is-current' : ''}`}
          >
            Add
          </Link>
          <Link
            to="/skills"
            className={`masthead__link ${pathname === '/skills' ? 'is-current' : ''}`}
          >
            Skills
          </Link>
          <Link
            to="/plans"
            className={`masthead__link ${pathname.startsWith('/plans') ? 'is-current' : ''}`}
          >
            Plans
          </Link>
        </nav>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <footer className="colophon">
        <span className="eyebrow">
          Kept in git · thechrisnixon/coopy
        </span>
      </footer>
    </div>
  )
}
