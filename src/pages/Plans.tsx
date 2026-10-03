import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { StatusDot } from '@astryxdesign/core/StatusDot'
import { Token } from '@astryxdesign/core/Token'
import { Link } from '@astryxdesign/core/Link'
import { Plan, type LoadedPlan } from '../lib/plan'

/**
 * Weekly shopping plans written by the /weekly-shop skill. Dev-only: the
 * route is registered only under `pnpm dev`, and the data comes from a
 * dev-server endpoint (vite/data-plugin.ts) — plans hold prices and order
 * details, and the deployed site is public.
 */

const STATUS = {
  draft: { variant: 'neutral', label: 'Draft' },
  carted: { variant: 'warning', label: 'In cart — waiting for a yes' },
  ordered: { variant: 'success', label: 'Ordered' },
  cancelled: { variant: 'error', label: 'Cancelled' },
} as const

const money = (n: number | undefined) =>
  n === undefined ? '—' : `$${n.toFixed(2)}`

function usePlans() {
  const [state, setState] = useState<{ plans: LoadedPlan[]; error?: string }>({
    plans: [],
  })

  useEffect(() => {
    fetch('/__local/plans.json')
      .then((r) => r.json())
      .then((raw: ({ id: string } & Record<string, unknown>)[]) =>
        setState({
          plans: raw.flatMap((p) => {
            const parsed = Plan.safeParse(p)
            // A plan the skill wrote badly shouldn't hide every other week.
            return parsed.success ? [{ ...parsed.data, id: p.id }] : []
          }),
        }),
      )
      .catch((err) => setState({ plans: [], error: String(err) }))
  }, [])

  return state
}

export default function Plans() {
  const { id } = useParams()
  const { plans, error } = usePlans()
  const plan = plans.find((p) => p.id === id)

  if (error) return <Text>Couldn't load plans: {error}</Text>
  if (id && plan) return <PlanDetail plan={plan} />

  return (
    <VStack gap={4}>
      <Heading level={1}>Weekly plans</Heading>
      {plans.length === 0 ? (
        <Text color="secondary">
          No plans yet. Run /weekly-shop in Claude Code to build one.
        </Text>
      ) : (
        <List hasDividers>
          {plans.map((p) => (
            <ListItem
              key={p.id}
              href={`/plans/${p.id}`}
              label={p.week ? `${p.week} (built ${p.id})` : p.id}
              description={p.meals.map((m) => m.name).join(' · ') || 'No meals yet'}
              startContent={<StatusDot {...STATUS[p.status]} />}
              endContent={<Text hasTabularNumbers>{money(p.order?.total ?? p.order?.subtotal ?? subtotal(p))}</Text>}
            />
          ))}
        </List>
      )}
    </VStack>
  )
}

/**
 * Before the order is placed there's no real total yet: the cart subtotal
 * plus the planned tip is the honest estimate (tax and bag fees come later).
 */
function estTotal(plan: LoadedPlan): number | undefined {
  const sub = plan.order?.subtotal
  return sub === undefined ? undefined : sub + (plan.order?.tip ?? 0)
}

/** Sum of priced lines — only a fallback, since not every line has a price. */
function subtotal(plan: LoadedPlan): number | undefined {
  const priced = plan.items.filter((i) => i.price !== undefined)
  if (!priced.length) return undefined
  return priced.reduce((sum, i) => sum + i.price! * i.qty, 0)
}

type Row = {
  name: string
  qty: number
  price: string
  line: string
  category: string
  for: string
  replaced: string
}

function PlanDetail({ plan }: { plan: LoadedPlan }) {
  const rows = useMemo<Row[]>(
    () =>
      [...plan.items]
        .sort((a, b) => (a.category ?? 'other').localeCompare(b.category ?? 'other'))
        .map((i) => ({
          name: i.note ? `${i.name} — ${i.note}` : i.name,
          qty: i.qty,
          price: money(i.price),
          line: money(i.price === undefined ? undefined : i.price * i.qty),
          category: i.category ?? 'other',
          for: (i.for ?? []).join(', '),
          replaced: i.replaced ?? '',
        })),
    [plan.items],
  )

  const status = STATUS[plan.status]

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Link href="/plans">← All plans</Link>
        <Heading level={1}>{plan.week ?? `Plan ${plan.id}`}</Heading>
        <HStack gap={2} align="center">
          <StatusDot variant={status.variant} label={status.label} />
          <Text>{status.label}</Text>
        </HStack>
      </VStack>

      <MetadataList columns="multi">
        <MetadataListItem label="Items">{plan.items.length}</MetadataListItem>
        <MetadataListItem label="Subtotal">
          {money(plan.order?.subtotal ?? subtotal(plan))}
        </MetadataListItem>
        <MetadataListItem label="Tip">{money(plan.order?.tip)}</MetadataListItem>
        <MetadataListItem label={plan.order?.total ? 'Total' : 'Est. total'}>
          {money(plan.order?.total ?? estTotal(plan))}
        </MetadataListItem>
        {plan.budget !== undefined && (
          <MetadataListItem label="Budget">{money(plan.budget)}</MetadataListItem>
        )}
        {plan.order?.delivery && (
          <MetadataListItem label="Delivery">{plan.order.delivery}</MetadataListItem>
        )}
        {plan.order?.order_id && (
          <MetadataListItem label="Order">{plan.order.order_id}</MetadataListItem>
        )}
      </MetadataList>

      <VStack gap={2}>
        <Heading level={2}>Meals</Heading>
        <List hasDividers>
          {plan.meals.map((m) => (
            <ListItem
              key={m.name}
              label={[m.day, m.name].filter(Boolean).join(' — ')}
              description={m.notes}
              href={m.recipe ? `/r/${m.recipe}` : m.url}
              target={m.recipe ? undefined : '_blank'}
              endContent={
                <HStack gap={1}>
                  {m.scale && m.scale !== 1 && <Token size="sm" label={`${m.scale}×`} />}
                  <Token
                    size="sm"
                    color={m.recipe ? 'green' : m.url ? 'blue' : 'gray'}
                    label={m.recipe ? 'coopy' : m.url ? 'link' : 'one-off'}
                  />
                </HStack>
              }
            />
          ))}
        </List>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Cart</Heading>
        <Table<Row>
          data={rows}
          density="compact"
          verticalAlign="top"
          columns={[
            { key: 'category', header: 'Aisle', width: pixel(96) },
            { key: 'name', header: 'Item', width: proportional(4) },
            { key: 'qty', header: 'Qty', width: pixel(56), align: 'end' },
            { key: 'price', header: 'Each', width: pixel(80), align: 'end' },
            { key: 'line', header: 'Line', width: pixel(88), align: 'end' },
            { key: 'for', header: 'For', width: proportional(2) },
            { key: 'replaced', header: 'Replaced', width: proportional(2) },
          ]}
        />
      </VStack>

      {plan.log.length > 0 && (
        <VStack gap={2}>
          <Heading level={2}>How we got here</Heading>
          <List listStyle="decimal" density="compact">
            {plan.log.map((entry, n) => (
              <ListItem key={n} label={entry} />
            ))}
          </List>
        </VStack>
      )}
    </VStack>
  )
}
