import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TextInput } from '@astryxdesign/core/TextInput'
import { recipes, allTags, searchRecipes } from '../lib/recipes'
import { cookbookToMarkdown } from '../lib/markdown'
import { downloadText } from '../lib/download'
import './Index.css'

export default function Index() {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const results = useMemo(
    () => searchRecipes(query, activeTags),
    [query, activeTags],
  )

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  return (
    <div className="index">
      <div className="index__lede">
        <h1 className="display index__title">
          {recipes.length} recipe{recipes.length === 1 ? '' : 's'},
          <br />
          kept properly.
        </h1>
        <div className="index__aside">
          <p className="index__blurb">
            Every quantity is stored at 1× — one batch, the way it's written —
            so it scales cleanly. Blended recipes keep a record of which source
            each decision came from.
          </p>
          {/* The archive should outlive this website. One file, plain text,
              opens anywhere. */}
          <button
            type="button"
            className="index__export"
            onClick={() =>
              downloadText('coopy-cookbook.md', cookbookToMarkdown(recipes))
            }
          >
            Download the whole cookbook (.md)
          </button>
        </div>
      </div>

      <div className="index__controls">
        <TextInput
          label="Search recipes"
          isLabelHidden
          placeholder="Search by name, ingredient, or tag…"
          value={query}
          onChange={setQuery}
          hasClear
          size="lg"
          width="100%"
        />

        {allTags.length > 0 && (
          <div className="index__tags">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`tagchip ${activeTags.includes(tag) ? 'is-active' : ''}`}
                aria-pressed={activeTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <p className="empty">Nothing matches that.</p>
      ) : (
        <ol className="index__list">
          {results.map((r) => {
            const sourceCount = Object.keys(r.sources ?? {}).length
            return (
              <li key={r.slug} className="entry">
                <Link to={`/r/${r.slug}`} className="entry__link">
                  <h2 className="display entry__name">{r.name}</h2>

                  <div className="entry__meta eyebrow">
                    {r.serves && <span>Serves {r.serves}</span>}
                    {r.time?.total && <span>{r.time.total}</span>}
                    <span>
                      {r.ingredients.length} ingredient
                      {r.ingredients.length === 1 ? '' : 's'}
                    </span>
                    {/* The blend badge is the whole reason this app exists —
                        surface it in the index, not just on the detail page. */}
                    {sourceCount > 1 && (
                      <span className="entry__blend">
                        Blend of {sourceCount}
                      </span>
                    )}
                  </div>

                  {r.tags && (
                    <div className="entry__tags">
                      {r.tags.map((t) => (
                        <span key={t} className="entry__tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
