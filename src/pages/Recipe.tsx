import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@astryxdesign/core/Button'
import { getRecipe } from '../lib/recipes'
import IngredientList from '../components/IngredientList'
import Scaler from '../components/Scaler'
import './Recipe.css'

export default function Recipe() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const recipe = slug ? getRecipe(slug) : undefined

  const [multiplier, setMultiplier] = useState(1)
  const [perServing, setPerServing] = useState(false)
  const [showSources, setShowSources] = useState(false)

  if (!recipe) {
    return (
      <div className="empty">
        <p>No recipe called “{slug}”.</p>
        <Link to="/" className="backlink">← All recipes</Link>
      </div>
    )
  }

  const sourceCount = Object.keys(recipe.sources ?? {}).length
  const hasBlend = sourceCount > 1

  // Per-serving divides the 1X batch by its serving count. Guarded on `serves`
  // being present, which the Scaler also enforces by hiding the toggle.
  const effective =
    perServing && recipe.serves ? multiplier / recipe.serves : multiplier

  return (
    <article className="recipe">
      <Link to="/" className="backlink">← All recipes</Link>

      <header className="recipe__head">
        <h1 className="display recipe__title">{recipe.name}</h1>

        <div className="recipe__meta eyebrow">
          {recipe.serves && <span>Serves {recipe.serves} at 1×</span>}
          {recipe.time?.prep && <span>Prep {recipe.time.prep}</span>}
          {recipe.time?.cook && <span>Cook {recipe.time.cook}</span>}
        </div>

        {recipe.tags && (
          <div className="recipe__tags">
            {recipe.tags.map((t) => (
              <span key={t} className="recipe__tag">{t}</span>
            ))}
          </div>
        )}
      </header>

      {/* The blend panel: what makes this a blend and why. Shown for
          multi-source recipes only. */}
      {hasBlend && (
        <section className="blend">
          <h2 className="eyebrow blend__label">
            Blended from {sourceCount} sources
          </h2>
          <div className="blend__sources">
            {Object.entries(recipe.sources!).map(([key, src], i) => (
              <div key={key} className={`blend__source is-slot-${i === 0 ? 'a' : 'b'}`}>
                {/* This letter is the legend for the markers on each
                    ingredient row when "show sources" is on. */}
                <span className="blend__mark" aria-hidden="true">
                  {i === 0 ? 'A' : 'B'}
                </span>
                <h3 className="blend__name">
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noreferrer">
                      {src.name} ↗
                    </a>
                  ) : (
                    src.name
                  )}
                </h3>
                {src.role && <p className="blend__role">{src.role}</p>}
                {src.scan && (
                  <a href={src.scan} target="_blank" rel="noreferrer" className="blend__scan">
                    <img src={src.scan} alt={`Scan of ${src.name}`} loading="lazy" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="recipe__actions">
        <Button
          label="Cook this"
          variant="primary"
          size="lg"
          onClick={() => {
            // Carry the current scale into cook mode so you don't re-pick it
            // with your hands already covered in flour.
            navigate(`/cook/${recipe.slug}?x=${multiplier}`)
          }}
        />
      </div>

      <div className="recipe__body">
        <section className="recipe__col">
          <h2 className="display recipe__section">Ingredients</h2>

          <Scaler
            multiplier={multiplier}
            onMultiplier={setMultiplier}
            serves={recipe.serves}
            perServing={perServing}
            onPerServing={setPerServing}
            hasBlend={hasBlend}
            showSources={showSources}
            onShowSources={setShowSources}
          />

          <IngredientList
            ingredients={recipe.ingredients}
            sources={recipe.sources}
            multiplier={effective}
            showSources={showSources}
          />
        </section>

        <section className="recipe__col">
          {recipe.steps && (
            <>
              <h2 className="display recipe__section">Method</h2>
              <ol className="steps">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="steps__item">
                    <span className="steps__num tabular">{i + 1}</span>
                    <p className="steps__text">{step}</p>
                  </li>
                ))}
              </ol>
            </>
          )}

          {recipe.notes && (
            <>
              <h2 className="display recipe__section recipe__section--notes">
                Notes
              </h2>
              <div className="notes">
                {recipe.notes
                  .trim()
                  .split(/\n\s*\n/)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </>
          )}
        </section>
      </div>
    </article>
  )
}
