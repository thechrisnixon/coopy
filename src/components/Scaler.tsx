import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl'
import { Switch } from '@astryxdesign/core/Switch'
import { MULTIPLIERS, formatMultiplier } from '../lib/units'
import './Scaler.css'

type Props = {
  multiplier: number
  onMultiplier: (m: number) => void
  /** Present only when the recipe declares `serves`. */
  serves?: number
  perServing: boolean
  onPerServing: (v: boolean) => void
  /** Blend controls are hidden entirely for single-source recipes. */
  hasBlend: boolean
  showSources: boolean
  onShowSources: (v: boolean) => void
}

export default function Scaler({
  multiplier,
  onMultiplier,
  serves,
  perServing,
  onPerServing,
  hasBlend,
  showSources,
  onShowSources,
}: Props) {
  const yieldServes = serves ? Math.round(serves * multiplier) : undefined

  return (
    <div className="scaler">
      <div className="scaler__row">
        <span className="eyebrow scaler__legend">Batch</span>
        <SegmentedControl
          label="Batch size"
          value={String(multiplier)}
          onChange={(v) => onMultiplier(Number(v))}
        >
          {MULTIPLIERS.map((m) => (
            <SegmentedControlItem
              key={m}
              value={String(m)}
              label={formatMultiplier(m)}
            />
          ))}
        </SegmentedControl>

        {yieldServes !== undefined && !perServing && (
          <span className="scaler__yield eyebrow">Serves {yieldServes}</span>
        )}
      </div>

      <div className="scaler__toggles">
        {/* Per-serving is only meaningful when we know the serving count —
            without it we'd be dividing by a number we don't have. */}
        {serves !== undefined && (
          <Switch
            label="Per serving"
            value={perServing}
            onChange={onPerServing}
            size="sm"
          />
        )}

        {hasBlend && (
          <Switch
            label="Show sources"
            value={showSources}
            onChange={onShowSources}
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
