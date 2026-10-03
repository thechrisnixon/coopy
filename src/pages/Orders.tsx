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
import { TextInput } from '@astryxdesign/core/TextInput'
import { Button } from '@astryxdesign/core/Button'
import { FormLayout } from '@astryxdesign/core/FormLayout'
import { Order, type LoadedOrder } from '../lib/order'

/**
 * Weekly orders built by the /weekly-shop skill. The site is
 * public, so orders live in private storage behind `/api/orders` and the
 * family passcode (api/orders.ts). The passcode is asked for once and kept in
 * this browser's localStorage.
 *
 * Under `pnpm dev` there are no serverless functions, so when `/api/orders`
 * isn't there the page falls back to the dev-only `/__local/orders.json`
 * (vite/data-plugin.ts), which reads the local `orders/` folder.
 */

const STATUS = {
  draft: { variant: 'neutral', label: 'Draft' },
  carted: { variant: 'warning', label: 'In cart — waiting for a yes' },
  ordered: { variant: 'success', label: 'Ordered' },
  cancelled: { variant: 'error', label: 'Cancelled' },
} as const

const money = (n: number | undefined) =>
  n === undefined ? '—' : `$${n.toFixed(2)}`

const PASSCODE_KEY = 'coopy.passcode'

// Storage can throw (private mode, blocked site data) — the page must still
// work, it just asks again next visit.
function loadPasscode(): string {
  try {
    return localStorage.getItem(PASSCODE_KEY) ?? ''
  } catch {
    return ''
  }
}
function savePasscode(value: string) {
  try {
    if (value) localStorage.setItem(PASSCODE_KEY, value)
    else localStorage.removeItem(PASSCODE_KEY)
  } catch {
    // not fatal
  }
}

type RawOrder = { id: string } & Record<string, unknown>

type OrdersState =
  | { kind: 'loading' }
  | { kind: 'locked'; error?: string }
  | { kind: 'error'; error: string }
  | { kind: 'ready'; orders: LoadedOrder[] }

function toOrders(raw: RawOrder[]): LoadedOrder[] {
  return raw.flatMap((p) => {
    const parsed = Order.safeParse(p)
    // An order the skill wrote badly shouldn't hide every other week.
    return parsed.success ? [{ ...parsed.data, id: p.id }] : []
  })
}

/** True when the response is a real API answer rather than a dev-server miss. */
const isApiResponse = (r: Response) =>
  r.status !== 404 && (r.headers.get('content-type') ?? '').includes('application/json')

function useOrders() {
  const [passcode, setPasscode] = useState(loadPasscode)
  const [state, setState] = useState<OrdersState>(() =>
    // Production with no saved passcode: ask before making any request.
    passcode || import.meta.env.DEV ? { kind: 'loading' } : { kind: 'locked' },
  )

  useEffect(() => {
    if (!passcode && !import.meta.env.DEV) return
    let cancelled = false

    async function load(): Promise<OrdersState> {
      const res = await fetch('/api/orders', { headers: { 'x-coopy-passcode': passcode } })

      if (import.meta.env.DEV && !isApiResponse(res)) {
        // `vite dev` doesn't run functions — read the local orders/ folder.
        const local = await fetch('/__local/orders.json')
        return { kind: 'ready', orders: toOrders(await local.json()) }
      }

      if (res.status === 401) {
        savePasscode('')
        return {
          kind: 'locked',
          error: passcode ? "That passcode didn't work." : undefined,
        }
      }

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        return { kind: 'error', error: body?.error ?? `HTTP ${res.status}` }
      }
      return { kind: 'ready', orders: toOrders(body as RawOrder[]) }
    }

    load()
      .then((next) => {
        if (cancelled) return
        if (next.kind === 'locked') setPasscode('')
        setState(next)
      })
      .catch((err) => !cancelled && setState({ kind: 'error', error: String(err) }))

    return () => {
      cancelled = true
    }
  }, [passcode])

  const unlock = (value: string) => {
    savePasscode(value)
    setState({ kind: 'loading' })
    setPasscode(value)
  }

  return { state, unlock }
}

function PasscodePrompt({ error, onSubmit }: { error?: string; onSubmit: (v: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <VStack gap={4}>
      <Heading level={1}>Orders</Heading>
      <Text color="secondary">
        Orders are private to the family. Enter the passcode once and this
        browser will remember it.
      </Text>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
      >
        <FormLayout>
          <TextInput
            type="password"
            label="Family passcode"
            value={value}
            onChange={setValue}
            hasAutoFocus
            width="100%"
            status={error ? { type: 'error', message: error } : undefined}
          />
          <HStack>
            <Button type="submit" variant="primary" label="Show orders" isDisabled={!value.trim()} />
          </HStack>
        </FormLayout>
      </form>
    </VStack>
  )
}

export default function Orders() {
  const { id } = useParams()
  const { state, unlock } = useOrders()

  if (state.kind === 'locked') return <PasscodePrompt error={state.error} onSubmit={unlock} />
  if (state.kind === 'error') return <Text>Couldn't load orders: {state.error}</Text>
  if (state.kind === 'loading') return <Text color="secondary">Loading orders…</Text>

  const { orders } = state
  const order = orders.find((p) => p.id === id)
  if (id && order) return <OrderDetail order={order} />

  return (
    <VStack gap={4}>
      <Heading level={1}>Orders</Heading>
      {orders.length === 0 ? (
        <Text color="secondary">
          No orders yet. Run /weekly-shop in Claude Code to build one.
        </Text>
      ) : (
        <List hasDividers>
          {orders.map((p) => (
            <ListItem
              key={p.id}
              href={`/orders/${p.id}`}
              label={p.week ? `${p.week} (built ${p.id})` : p.id}
              description={p.meals.map((m) => m.name).join(' · ') || 'No meals yet'}
              startContent={<StatusDot {...STATUS[p.status]} />}
              endContent={<Text hasTabularNumbers>{money(p.checkout?.total ?? p.checkout?.subtotal ?? subtotal(p))}</Text>}
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
function estTotal(order: LoadedOrder): number | undefined {
  const sub = order.checkout?.subtotal
  return sub === undefined ? undefined : sub + (order.checkout?.tip ?? 0)
}

/** Sum of priced lines — only a fallback, since not every line has a price. */
function subtotal(order: LoadedOrder): number | undefined {
  const priced = order.items.filter((i) => i.price !== undefined)
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

function OrderDetail({ order }: { order: LoadedOrder }) {
  const rows = useMemo<Row[]>(
    () =>
      [...order.items]
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
    [order.items],
  )

  const status = STATUS[order.status]

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Link href="/orders">← All orders</Link>
        <Heading level={1}>{order.week ?? `Order ${order.id}`}</Heading>
        <HStack gap={2} align="center">
          <StatusDot variant={status.variant} label={status.label} />
          <Text>{status.label}</Text>
        </HStack>
      </VStack>

      <MetadataList columns="multi">
        <MetadataListItem label="Items">{order.items.length}</MetadataListItem>
        <MetadataListItem label="Subtotal">
          {money(order.checkout?.subtotal ?? subtotal(order))}
        </MetadataListItem>
        <MetadataListItem label="Tip">{money(order.checkout?.tip)}</MetadataListItem>
        <MetadataListItem label={order.checkout?.total ? 'Total' : 'Est. total'}>
          {money(order.checkout?.total ?? estTotal(order))}
        </MetadataListItem>
        {order.budget !== undefined && (
          <MetadataListItem label="Budget">{money(order.budget)}</MetadataListItem>
        )}
        {order.checkout?.delivery && (
          <MetadataListItem label="Delivery">{order.checkout.delivery}</MetadataListItem>
        )}
        {order.checkout?.order_id && (
          <MetadataListItem label="Amazon order">{order.checkout.order_id}</MetadataListItem>
        )}
      </MetadataList>

      <VStack gap={2}>
        <Heading level={2}>Meals</Heading>
        <List hasDividers>
          {order.meals.map((m) => (
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

      {order.log.length > 0 && (
        <VStack gap={2}>
          <Heading level={2}>How we got here</Heading>
          <List listStyle="decimal" density="compact">
            {order.log.map((entry, n) => (
              <ListItem key={n} label={entry} />
            ))}
          </List>
        </VStack>
      )}
    </VStack>
  )
}
