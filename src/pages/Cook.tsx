import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@astryxdesign/core/Button'
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl'
import { getRecipe } from '../lib/recipes'
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

  if (!recipe) {
    return (
      <div className="empty">
        <p>No recipe called “{slug}”.</p>
        <Link to="/" className="backlink">← All recipes</Link>
      </div>
    )
  }

  const steps = recipe.steps ?? []

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

        <h1 className="display cook__title">{recipe.name}</h1>

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
        <section className="cook__panel">
          <div className="cook__panelhead">
            <h2 className="eyebrow">Ingredients</h2>
            {checked.size > 0 && (
              <button
                type="button"
                className="cook__reset"
                onClick={() => setChecked(new Set())}
              >
                Reset ({checked.size})
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
                Step {step + 1} of {steps.length}
              </h2>
            </div>

            <p className="cook__step">{steps[step]}</p>

            <div className="cook__nav">
              <Button
                label="Back"
                variant="secondary"
                size="lg"
                isDisabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              />
              <Button
                label="Next"
                variant="primary"
                size="lg"
                isDisabled={step === steps.length - 1}
                onClick={() =>
                  setStep((s) => Math.min(steps.length - 1, s + 1))
                }
              />
            </div>

            <ol className="cook__dots" aria-label="Steps">
              {steps.map((_, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={`cook__dot ${i === step ? 'is-current' : ''} ${i < step ? 'is-done' : ''}`}
                    onClick={() => setStep(i)}
                    aria-label={`Step ${i + 1}`}
                    aria-current={i === step}
                  />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <footer className="cook__foot eyebrow">
        {wakeHeld ? 'Screen staying awake' : 'Screen will sleep normally'}
      </footer>
    </div>
  )
}
