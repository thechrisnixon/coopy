import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@astryxdesign/core/Button'
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl'
import { getRecipe } from '../lib/recipes'
import { formatStepParagraphs } from '../lib/format'
import IngredientList from '../components/IngredientList'
import { MULTIPLIERS, formatMultiplier } from '../lib/units'
import './Cook.css'

/**
 * Keeps the screen on while cooking. Wake Lock is unsupported on some
 * browsers and is dropped whenever the tab is backgrounded, so this
 * reacquires on visibility change rather than assuming the first grab holds.
 */
function useWakeLock(active: boolean) {
  const [held, setHeld] = useState(false)
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let cancelled = false

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        lockRef.current = lock
        setHeld(true)
        lock.addEventListener('release', () => setHeld(false))
      } catch {
        // Denied or unavailable — cook mode still works, the screen just
        // sleeps on its normal schedule.
        setHeld(false)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lockRef.current?.release()
      lockRef.current = null
    }
  }, [active])

  return held
}

export default function Cook() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const recipe = slug ? getRecipe(slug) : undefined

  const parsedX = Number(params.get('x'))
  const multiplier =
    MULTIPLIERS.includes(parsedX as (typeof MULTIPLIERS)[number]) ? parsedX : 1

  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [step, setStep] = useState(0)

  const wakeHeld = useWakeLock(Boolean(recipe))
  const steps = recipe?.steps ?? []

  useEffect(() => {
    if (steps.length === 0) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setStep((s) => Math.min(steps.length - 1, s + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setStep((s) => Math.max(0, s - 1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [steps.length])

  if (!recipe) {
    return (
      <div className="empty">
        <p>No recipe called “{slug}”.</p>
        <Link to="/" className="backlink">← All recipes</Link>
      </div>
    )
  }

  const yieldServes = recipe.serves
    ? Math.round(recipe.serves * multiplier)
    : undefined
  const hasMeta =
    yieldServes !== undefined ||
    Boolean(recipe.time?.prep) ||
    Boolean(recipe.time?.cook) ||
    Boolean(recipe.time?.total)

  function toggle(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="cook">
      <header className="cook__bar">
        <Link to={`/r/${recipe.slug}`} className="cook__exit">
          ← Done
        </Link>

        <div className="cook__heading">
          <h1 className="display cook__title">{recipe.name}</h1>
          {hasMeta && (
            <div className="cook__meta eyebrow">
              {yieldServes !== undefined && <span>Serves {yieldServes}</span>}
              {recipe.time?.prep && <span>Prep {recipe.time.prep}</span>}
              {recipe.time?.cook && <span>Cook {recipe.time.cook}</span>}
              {recipe.time?.total && <span>Total {recipe.time.total}</span>}
            </div>
          )}
        </div>

        <div className="cook__scale">
          <SegmentedControl
            label="Batch size"
            value={String(multiplier)}
            onChange={(v) => setParams({ x: v }, { replace: true })}
            size="sm"
          >
            {MULTIPLIERS.map((m) => (
              <SegmentedControlItem
                key={m}
                value={String(m)}
                label={formatMultiplier(m)}
              />
            ))}
          </SegmentedControl>
        </div>
      </header>

      <div className="cook__body">
        <section className="cook__panel cook__panel--ingredients">
          <div className="cook__panelhead">
            <h2 className="eyebrow">
              Ingredients ({checked.size}/{recipe.ingredients.length})
            </h2>
            {checked.size > 0 && (
              <button
                type="button"
                className="cook__reset"
                onClick={() => setChecked(new Set())}
              >
                Reset
              </button>
            )}
          </div>

          <IngredientList
            ingredients={recipe.ingredients}
            sources={recipe.sources}
            multiplier={multiplier}
            showSources={false}
            checkable
            checked={checked}
            onToggle={toggle}
          />
        </section>

        {steps.length > 0 && (
          <section className="cook__panel cook__panel--steps">
            <div className="cook__panelhead">
              <h2 className="eyebrow">
                Method · Step {step + 1} of {steps.length}
              </h2>

              <div className="cook__stepnav">
                <Button
                  label="Back"
                  variant="secondary"
                  size="sm"
                  isDisabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                />
                <Button
                  label="Next"
                  variant="primary"
                  size="sm"
                  isDisabled={step === steps.length - 1}
                  onClick={() =>
                    setStep((s) => Math.min(steps.length - 1, s + 1))
                  }
                />
              </div>
            </div>

            <ol className="cook__steps">
              {steps.map((s, i) => {
                const isCurrent = i === step
                const isDone = i < step
                return (
                  <li key={i} className="cook__stepItem">
                    <button
                      type="button"
                      className={[
                        'cook__stepCard',
                        isCurrent ? 'is-current' : '',
                        isDone ? 'is-done' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setStep(i)}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <span className="cook__stepNum tabular" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="cook__stepBody">
                        {formatStepParagraphs(s)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="cook__nav">
              <Button
                label="Previous step"
                variant="secondary"
                size="lg"
                isDisabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              />
              <Button
                label={
                  step < steps.length - 1
                    ? `Next: Step ${step + 2}`
                    : 'All steps done'
                }
                variant="primary"
                size="lg"
                isDisabled={step === steps.length - 1}
                onClick={() =>
                  setStep((s) => Math.min(steps.length - 1, s + 1))
                }
              />
            </div>

            {recipe.notes && (
              <div className="cook__notes" id="recipe-notes">
                <h3 className="eyebrow cook__notesHead">Cook’s Notes</h3>
                <div className="cook__notesBody">
                  {recipe.notes
                    .trim()
                    .split(/\n\s*\n/)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="cook__foot eyebrow">
        {wakeHeld ? 'Screen staying awake' : 'Screen will sleep normally'}
      </footer>
    </div>
  )
}
