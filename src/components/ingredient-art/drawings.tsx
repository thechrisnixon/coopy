import type { ReactElement } from 'react'
import type { ArtKey } from './match'
import { C, INK } from './palette'

/**
 * Hand-drawn ingredient cartoons. Every drawing shares a 48×48 viewBox and is
 * rendered inside a <g> that sets the ink outline (see IngredientArt), so a
 * shape gets the outline by default and opts out with `stroke="none"` when
 * it's a fill-only detail (shine, seeds, pattern).
 *
 * Style rules: rounded shapes, two or three flat fills from the palette, one
 * outline weight, a white sheen for roundness. Faces only on a couple of the
 * round, friendly ones — enough to charm, not enough to get twee.
 */

const N = 'none'

/** Two dot eyes and a small smile, centred on (x, y). */
function face(x: number, y: number) {
  return (
    <>
      <circle cx={x - 3.2} cy={y} r={1.25} fill={INK} stroke={N} />
      <circle cx={x + 3.2} cy={y} r={1.25} fill={INK} stroke={N} />
      <path d={`M${x - 2} ${y + 2.4} Q${x} ${y + 4.2} ${x + 2} ${y + 2.4}`} fill={N} strokeWidth={1.4} />
    </>
  )
}

function shine(x: number, y: number, { rx = 2, ry = 3.5, rotate = -30 }: { rx?: number; ry?: number; rotate?: number } = {}) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={C.shine} stroke={N} transform={`rotate(${rotate} ${x} ${y})`} />
}

/** A detail line drawn in ink at reduced weight/opacity. */
const detail = { fill: N, strokeWidth: 1.3, strokeOpacity: 0.55 } as const

// --- proteins ------------------------------------------------------------

const drumstick = (
  <>
    <circle cx={9.5} cy={36} r={3.6} fill={C.cream} />
    <circle cx={12.5} cy={39.5} r={3.6} fill={C.cream} />
    <path d="M14.5 34 L23 25.5" strokeWidth={8} />
    <path d="M11 37.5 L23 25.5" stroke={C.cream} strokeWidth={4} />
    <ellipse cx={29} cy={19} rx={13} ry={10.5} transform="rotate(-45 29 19)" fill={C.orangeLight} />
    <path d="M22 23 Q27 26 33 23" {...detail} />
    {shine(25, 13, { rotate: -45 })}
  </>
)

const groundMeat = (
  <>
    <rect x={5} y={30} width={38} height={10} rx={5} fill={C.greyLight} />
    <path d="M9 33 C9 21 17 13 24 13 C31 13 39 21 39 33 Z" fill={C.pink} />
    <g stroke={C.redDark} strokeWidth={1.5} fill={N}>
      <path d="M15 27 q2 -2 4 0" />
      <path d="M22 21 q2 -2 4 0" />
      <path d="M27 28 q2 -2 4 0" />
      <path d="M19 31 q2 -2 4 0" />
      <path d="M29 22 q1.5 -1.5 3 0" />
    </g>
  </>
)

const steak = (
  <>
    <path d="M7 23 C7 13 19 7 30 9 C41 11 44 20 41 28 C38 37 28 41 18 39 C10 37 7 31 7 23Z" fill={C.cream} />
    <path d="M11 23 C11 15 20 11 29 12.5 C38 14 40 21 37.5 27 C35 34 27 37 19 35.5 C13 34 11 29 11 23Z" fill={C.red} stroke={N} />
    <path d="M17 20 Q23 17 27 21 T35 22" fill={N} stroke={C.cream} strokeWidth={1.6} />
    <path d="M18 29 Q24 26 30 30" fill={N} stroke={C.cream} strokeWidth={1.6} />
  </>
)

const porkChop = (
  <>
    <path d="M6 24 C6 14 16 8 27 9 C38 10 43 17 42 25 C41 34 33 40 22 40 C12 40 6 33 6 24Z" fill={C.cream} />
    <path d="M10 24 C10 16 18 12 26 12.5 C35 13 39 19 38 25 C37 32 31 36 22 36 C15 36 10 31 10 24Z" fill={C.pink} stroke={N} />
    <circle cx={31} cy={22} r={4.5} fill={C.white} />
    <circle cx={31} cy={22} r={1.6} fill={C.greyLight} stroke={N} />
    <path d="M15 27 Q20 24 24 28" fill={N} stroke={C.white} strokeWidth={1.6} />
  </>
)

const sausage = (
  <>
    <path d="M9 31 Q24 12 39 31" fill={N} strokeWidth={14} />
    <path d="M9 31 Q24 12 39 31" fill={N} stroke={C.brown} strokeWidth={10} />
    <path d="M14 25 Q24 15 34 25" fill={N} stroke={C.shine} strokeWidth={2} />
    <path d="M6 34 l-2 2.5 M42 34 l2 2.5" strokeWidth={2.2} />
  </>
)

// --- dairy & eggs ----------------------------------------------------------

const egg = (
  <>
    <path d="M10 26 C6 16 15 7 25 9 C34 8 43 16 40 26 C42 36 32 42 23 40 C13 41 8 34 10 26Z" fill={C.white} />
    <circle cx={24} cy={25} r={8.5} fill={C.yellow} />
    {shine(20.5, 21, { rx: 1.6, ry: 2.6 })}
    {face(24.5, 25.5)}
  </>
)

const cheese = (
  <>
    <path d="M6 24 L34 12 L42 24 Z" fill={C.yellowLight} />
    <rect x={6} y={24} width={36} height={14} rx={1.5} fill={C.yellow} />
    <circle cx={14} cy={31} r={2.6} fill={C.orangeLight} stroke={N} />
    <circle cx={25} cy={33.5} r={2} fill={C.orangeLight} stroke={N} />
    <circle cx={35} cy={29.5} r={2.6} fill={C.orangeLight} stroke={N} />
    <ellipse cx={30} cy={19.5} rx={2.6} ry={1.3} fill={C.orangeLight} stroke={N} />
  </>
)

const milk = (
  <>
    <rect x={21} y={4.5} width={8} height={5} rx={1} fill={C.white} />
    <path d="M13 19 L19 9.5 H31 L35 19 Z" fill={C.blue} />
    <rect x={13} y={19} width={22} height={24} rx={2} fill={C.white} />
    <path d="M13 31 q5.5 -3 11 0 t11 0 V41 a2 2 0 0 1 -2 2 H15 a2 2 0 0 1 -2 -2 Z" fill={C.blue} stroke={N} />
    <rect x={13} y={19} width={22} height={24} rx={2} fill={N} />
    <circle cx={24} cy={25} r={2.4} fill={C.blue} stroke={N} />
  </>
)

const butter = (
  <>
    <ellipse cx={24} cy={37} rx={19} ry={5.5} fill={C.greyLight} />
    <path d="M34 23 L40 17 V29 L34 35 Z" fill={C.tan} />
    <path d="M10 23 L16 17 H40 L34 23 Z" fill={C.yellowLight} />
    <rect x={10} y={23} width={24} height={12} rx={1} fill={C.yellow} />
    <path d="M14 27 h8" stroke={C.shine} strokeWidth={2} />
  </>
)

// --- produce -------------------------------------------------------------

const tomato = (
  <>
    <path d="M24 14 C36 14 42 22 41 30 C40 38 32 42 24 42 C16 42 8 38 7 30 C6 22 12 14 24 14Z" fill={C.red} />
    <path d="M15 15.5 Q20 18 24 15.5 Q28 18 33 15.5 Q29.5 20.5 24 20 Q18.5 20.5 15 15.5Z" fill={C.green} />
    <path d="M24 16 Q24 11 27 8.5" fill={N} stroke={C.greenDark} strokeWidth={2.5} />
    {shine(13.5, 25, { ry: 4, rotate: 20 })}
    {face(24, 30)}
  </>
)

function smallTomato(cx: number, cy: number, r: number) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={C.red} />
      <path d={`M${cx - 3.5} ${cy - r + 1.5} L${cx} ${cy - r + 3.5} L${cx + 3.5} ${cy - r + 1.5}`} fill={N} stroke={C.greenDark} strokeWidth={2} />
      {shine(cx - r / 2.2, cy - r / 4, { rx: 1.4, ry: 2.4, rotate: 20 })}
    </>
  )
}

const cherryTomatoes = (
  <>
    <path d="M10 9 Q24 3 38 9 M17 7 L15 22 M24 5.5 V14 M31 7 L33 22" fill={N} stroke={C.greenDark} strokeWidth={2} />
    {smallTomato(24, 21, 7.5)}
    {smallTomato(14, 32, 8.5)}
    {smallTomato(33, 32, 8.5)}
  </>
)

const avocado = (
  <>
    <path d="M24 5 C30 5 33 11 34 17 C40 22 41 30 38 36 C35 42 29 44 24 44 C19 44 13 42 10 36 C7 30 8 22 14 17 C15 11 18 5 24 5Z" fill={C.greenDark} />
    <path d="M24 9 C28 9 30 13 31 18.5 C36 22 37 29 35 34 C32 39 28 40.5 24 40.5 C20 40.5 16 39 13 34 C11 29 12 22 17 18.5 C18 13 20 9 24 9Z" fill={C.avocadoFlesh} stroke={N} />
    <circle cx={24} cy={30} r={7} fill={C.brown} />
    {shine(21.5, 27.5, { rx: 1.6, ry: 2.4, rotate: -30 })}
  </>
)

const lime = (
  <>
    <circle cx={24} cy={24} r={17} fill={C.green} />
    <circle cx={24} cy={24} r={13.5} fill={C.greenLight} stroke={N} />
    <g stroke={C.white} strokeWidth={1.6}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M24 24 V11.5" transform={`rotate(${a} 24 24)`} />
      ))}
    </g>
    <circle cx={24} cy={24} r={2.2} fill={C.white} stroke={N} />
  </>
)

const lemon = (
  <>
    <path d="M4.5 25 Q7.5 22.5 9.5 20.5 C14 12 34 12 38.5 20.5 Q40.5 22.5 43.5 25 Q40.5 27.5 38.5 29.5 C34 38 14 38 9.5 29.5 Q7.5 27.5 4.5 25Z" fill={C.yellow} />
    <path d="M25 14.5 C27 8 33 5.5 39 6.5 C37 12 31 15 25 14.5Z" fill={C.green} />
    {shine(15, 21, { rx: 1.8, ry: 3.6, rotate: 60 })}
  </>
)

const onion = (
  <>
    <path d="M24 8 C26 14 40 20 38 32 C37 40 30 43 24 43 C18 43 11 40 10 32 C8 20 22 14 24 8Z" fill={C.tan} />
    <path d="M24 12 C19 22 17 33 21 42.5 M24 12 C29 22 31 33 27 42.5" fill={N} stroke={C.brownDark} strokeWidth={1.3} />
    <path d="M24 8 V3.5 M21 43.5 l-1.5 2 M24 43.5 v2.5 M27 43.5 l1.5 2" strokeWidth={1.8} />
    {shine(15.5, 28, { ry: 4, rotate: 10 })}
  </>
)

const garlic = (
  <>
    <path d="M24 8 C26 14 38 20 38 31 C38 39 31 42 24 42 C17 42 10 39 10 31 C10 20 22 14 24 8Z" fill={C.white} />
    <path d="M24 13 C19 21 17 32 20.5 41.5 M24 13 C29 21 31 32 27.5 41.5" {...detail} />
    <path d="M14 34 q1 -6 4 -10 M34 34 q-1 -6 -4 -10" fill={N} stroke={C.purple} strokeOpacity={0.45} strokeWidth={1.4} />
    <path d="M24 8 V4 M20 42.5 l-1 2 M24 42.5 v2.5 M28 42.5 l1 2" strokeWidth={1.8} />
  </>
)

const carrot = (
  <>
    <path d="M35 14 C33 7 37 3 41 4 C41 9 39 12 36 15Z" fill={C.green} />
    <path d="M36 15 C38 10 44 9 45 12 C42 15 39 16 36 15Z" fill={C.greenDark} />
    <path d="M28 12 C33 8 41 15 37 20.5 L13 40.5 Q8 43 8.5 38 Z" fill={C.orange} />
    <path d="M23 20 l3.5 3.5 M17.5 27 l3 3 M27.5 25.5 l2.5 2.5 M13 33.5 l2.5 2.5" {...detail} />
  </>
)

const potato = (
  <>
    <path d="M9 23 C9 14 18 9 26 10 C35 11 41 17 40 26 C39 35 31 39 23 38.5 C14 38 9 31 9 23Z" fill={C.tan} />
    <g fill={C.brownDark} stroke={N}>
      <circle cx={17} cy={19} r={1.2} />
      <circle cx={31} cy={31} r={1.2} />
      <circle cx={33} cy={17} r={1.1} />
      <circle cx={19} cy={32} r={1} />
    </g>
    {shine(16, 25, { ry: 3.5, rotate: 15 })}
    {face(25, 24)}
  </>
)

const sweetPotato = (
  <>
    <path d="M4 31 C10 22 20 16 30 15 C38 14 44 18 43 23.5 C42 29.5 34 33 25 34 C16 35 9 33.5 4 31Z" fill={C.rose} />
    <ellipse cx={40} cy={23.5} rx={3} ry={5.5} fill={C.orange} transform="rotate(-10 40 23.5)" />
    <path d="M16 25 q2 2 1 5 M27 20 q2 3 1 6" {...detail} />
    <path d="M4 31 L1.5 33" strokeWidth={1.8} />
  </>
)

const zucchini = (
  <>
    <path d="M36.5 11.5 L41 7" strokeWidth={6.5} />
    <path d="M36.5 11.5 L41 7" stroke={C.tan} strokeWidth={3} />
    <path d="M10 37 L35 13" strokeWidth={15} />
    <path d="M10 37 L35 13" stroke={C.green} strokeWidth={11} />
    <path d="M12 32 L31 14 M16 36 L35 18" stroke={C.greenLight} strokeWidth={1.5} />
  </>
)

const broccoli = (
  <>
    <path d="M19 24 L20.5 40 Q24 43 27.5 40 L29 24 Z" fill={C.greenLight} />
    <circle cx={15} cy={19} r={7.5} fill={C.green} />
    <circle cx={33} cy={19} r={7.5} fill={C.green} />
    <circle cx={24} cy={13} r={8.5} fill={C.green} />
    <circle cx={24} cy={23} r={7} fill={C.green} />
    <g fill={C.greenDark} stroke={N}>
      <circle cx={14} cy={17} r={1.1} />
      <circle cx={22} cy={10} r={1.1} />
      <circle cx={27} cy={14} r={1.1} />
      <circle cx={34} cy={18} r={1.1} />
      <circle cx={23} cy={23} r={1.1} />
    </g>
  </>
)

const cauliflower = (
  <>
    <path d="M6 22 C10 30 16 36 24 40 C20 32 14 26 6 22Z" fill={C.green} />
    <path d="M42 22 C38 30 32 36 24 40 C28 32 34 26 42 22Z" fill={C.green} />
    <circle cx={15} cy={21} r={7} fill={C.cream} />
    <circle cx={33} cy={21} r={7} fill={C.cream} />
    <circle cx={24} cy={15} r={8.5} fill={C.cream} />
    <circle cx={24} cy={25} r={7} fill={C.cream} />
    <path d="M20 37 L24 43 L28 37" fill={C.greenLight} />
  </>
)

const greens = (
  <>
    <path d="M25 43 C35 35 43 22 38 7 C28 9 22 22 25 43Z" fill={C.greenDark} />
    <path d="M22 43 C10 35 4 21 10 6 C20 8 28 22 22 43Z" fill={C.green} />
    <path d="M22 43 C19 31 15 19 10 6 M16 28 l-5 -3 M18.5 20 l5 -3 M13.5 16 l-4 -2" {...detail} />
    <path d="M25 43 C28 30 33 18 38 7" {...detail} />
  </>
)

const cabbage = (
  <>
    <circle cx={24} cy={25} r={17} fill={C.greenLight} />
    <path d="M10 33 C6 22 12 11 22 9 C15 15 13 24 16 37 Z" fill={C.green} />
    <path d="M38 33 C42 22 36 11 26 9 C33 15 35 24 32 37 Z" fill={C.green} />
    <path d="M24 12 C20 20 20 32 24 41 M24 22 l-4 -3 M24 30 l4 -3" fill={N} stroke={C.greenDark} strokeWidth={1.5} />
  </>
)

const bellPepper = (
  <>
    <path d="M12 20 C12 14 18 13 24 15 C30 13 36 14 36 20 C38 28 36 38 30 41 C27 43 25 41 24 40 C23 41 21 43 18 41 C12 38 10 28 12 20Z" fill={C.red} />
    <path d="M24 17 C23 25 23 32 24 39.5" {...detail} />
    <path d="M23 16 Q22.5 10 27 7.5" fill={N} strokeWidth={5} />
    <path d="M23 16 Q22.5 10 27 7.5" fill={N} stroke={C.green} strokeWidth={2.4} />
    {shine(16.5, 24, { ry: 4, rotate: 10 })}
  </>
)

const chili = (
  <>
    <path d="M14 13 C20 14 23 20 25 26 C28 34 33 39 41 42 C30 44.5 19.5 40 15 32 C11 26 10 18 14 13Z" fill={C.green} />
    <path d="M10 13.5 C11 9 17 9 18 13.5 C16 15.5 12 15.5 10 13.5Z" fill={C.greenDark} />
    <path d="M14 10 Q13 6 16 3.5" fill={N} strokeWidth={2.4} />
    {shine(17, 24, { ry: 4, rotate: -15 })}
  </>
)

const mushroom = (
  <>
    <path d="M17.5 26 L16.5 38.5 C16.5 42.5 31.5 42.5 31.5 38.5 L30.5 26 Z" fill={C.cream} />
    <path d="M6 26 C6 14 15 7 24 7 C33 7 42 14 42 26 C36 29.5 12 29.5 6 26Z" fill={C.brown} />
    <g fill={C.cream} stroke={N}>
      <circle cx={16} cy={17} r={2.2} />
      <circle cx={27} cy={13} r={1.8} />
      <circle cx={33} cy={21} r={2.4} />
      <circle cx={22.5} cy={22} r={1.4} />
    </g>
  </>
)

/** Kernel dots inside the upright cob ellipse at (24, 22), rx 7, ry 16. */
const CORN_KERNELS: [number, number][] = []
for (let y = 9; y <= 35; y += 3.5) {
  for (const dx of [-3.2, 0, 3.2]) {
    const x = 24 + dx + ((y - 9) / 3.5) % 2 * 1.6 - 0.8
    if (((x - 24) / 7) ** 2 + ((y - 22) / 16) ** 2 < 0.62) CORN_KERNELS.push([x, y])
  }
}

const corn = (
  <g transform="rotate(35 24 24)">
    <ellipse cx={24} cy={22} rx={7.5} ry={16.5} fill={C.yellow} />
    {CORN_KERNELS.map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r={1.25} fill={C.orange} stroke={N} />
    ))}
    <path d="M24 44 C14 40 12 30 16 19 C19 29 21 36 24 44Z" fill={C.green} />
    <path d="M24 44 C34 40 36 30 32 19 C29 29 27 36 24 44Z" fill={C.greenDark} />
  </g>
)

const BEAN = 'M-8 0 C-8 -6 -2 -8 3 -7 C8 -6 9 -1 7 2 C5 4 2 3 0 4 C-2 5 -5 6 -7 4 C-8 3 -8 2 -8 0Z'

const beans = (
  <>
    {[
      [23, 17, 5],
      [14, 31, -20],
      [33, 31, 15],
    ].map(([x, y, r]) => (
      <g key={`${x}`} transform={`translate(${x} ${y}) rotate(${r}) scale(1.25)`}>
        <path d={BEAN} fill={C.redDark} strokeWidth={1.6} />
        <ellipse cx={-3} cy={-3} rx={2.2} ry={1} fill={C.shine} stroke={N} transform="rotate(-15 -3 -3)" />
      </g>
    ))}
  </>
)

const peas = (
  <>
    <path d="M5 31 C11 20 28 13 43 13 C39 26 24 37 5 31Z" fill={C.greenDark} />
    <path d="M9 30 C15 22 28 17 39 16.5 C35 25 23 33 9 30Z" fill={C.greenLight} stroke={N} />
    <circle cx={16} cy={27} r={4.2} fill={C.green} />
    <circle cx={24} cy={23.5} r={4.2} fill={C.green} />
    <circle cx={32} cy={20} r={4} fill={C.green} />
    <path d="M43 13 q2 -4 -1 -6" fill={N} strokeWidth={1.8} />
  </>
)

// --- grains & bakes --------------------------------------------------------

const rice = (
  <>
    <path d="M9 27 C9 17 16 12.5 24 12.5 C32 12.5 39 17 39 27Z" fill={C.white} />
    <g {...detail} strokeWidth={1.1}>
      <path d="M17 21 l1.5 -1" />
      <path d="M23 17 l1.5 1" />
      <path d="M29 21 l1.5 -1" />
      <path d="M21 24 l1.5 1" />
      <path d="M33 24.5 l1 1" />
    </g>
    <path d="M5 27 H43 C43 37 34.5 43 24 43 C13.5 43 5 37 5 27Z" fill={C.blue} />
    <path d="M10 32 H38" stroke={C.white} strokeWidth={1.6} />
  </>
)

const pasta = (
  <>
    <path d="M30 22 L39 4" strokeWidth={5.5} />
    <path d="M30 22 L39 4" stroke={C.greyLight} strokeWidth={2.2} />
    <path d="M9 27 C9 19 16 14.5 24 14.5 C32 14.5 39 19 39 27Z" fill={C.yellow} />
    <g fill={N} stroke={C.orange} strokeWidth={1.5}>
      <path d="M12 24 q3 -4 6 0 t6 0 t6 0 t6 0" />
      <path d="M15 19.5 q2.5 -3 5 0 t5 0 t5 0" />
    </g>
    <path d="M5 27 H43 C43 37 34.5 43 24 43 C13.5 43 5 37 5 27Z" fill={C.red} />
    <path d="M14 27 q-1 5 2 8" fill={N} stroke={C.yellow} strokeWidth={2.6} />
    <path d="M10 32 H38" stroke={C.white} strokeOpacity={0.7} strokeWidth={1.6} />
  </>
)

const bread = (
  <>
    <path d="M10 40.5 V22 C6 20 6 10 16 9 C20 6 28 6 32 9 C42 10 42 20 38 22 V40.5 Z" fill={C.brown} />
    <path d="M13 37.5 V20.5 C10 19 10 13 17 12 C21 9.5 27 9.5 31 12 C38 13 38 19 35 20.5 V37.5 Z" fill={C.tanLight} stroke={N} />
    <g fill={C.tan} stroke={N}>
      <circle cx={19} cy={20} r={1} />
      <circle cx={27} cy={27} r={1} />
      <circle cx={22} cy={31} r={0.9} />
      <circle cx={30} cy={18} r={0.9} />
    </g>
  </>
)

const muffin = (
  <>
    <path d="M12 26 L36 26 L33 42.5 L15 42.5 Z" fill={C.pink} />
    <path d="M18 27 L19 42 M24 27 V42 M30 27 L29 42" stroke={C.redDark} strokeOpacity={0.4} strokeWidth={1.3} />
    <path d="M9 27 C7 18 14 10.5 24 10.5 C34 10.5 41 18 39 27 C36 29.5 12 29.5 9 27Z" fill={C.brown} />
    <g fill={C.blue} stroke={N}>
      <circle cx={17} cy={20} r={1.8} />
      <circle cx={26} cy={15.5} r={1.8} />
      <circle cx={31} cy={22.5} r={1.8} />
    </g>
    {shine(15, 16, { rx: 1.6, ry: 3, rotate: 45 })}
  </>
)

const pancakes = (
  <>
    <ellipse cx={24} cy={40} rx={20} ry={4.5} fill={C.greyLight} />
    <rect x={7} y={31} width={34} height={7} rx={3.5} fill={C.tan} />
    <rect x={8} y={25} width={32} height={7} rx={3.5} fill={C.tan} />
    <rect x={7.5} y={19} width={33} height={7} rx={3.5} fill={C.tan} />
    <path d="M10 20 C14 18 34 18 38 20 C39 22 37 24 36 24 C35 24 35 27 33.5 27 C32 27 32 23 30 23 H18 C16 23 16 28 14 28 C12 28 12.5 23 11 23 C9 23 9 21 10 20Z" fill={C.brown} />
    <rect x={20} y={13} width={8} height={5.5} rx={1.2} fill={C.yellow} />
  </>
)

const cinnamonRoll = (
  <>
    <circle cx={24} cy={25} r={17} fill={C.tan} />
    <path d="M24 25 a2 2 0 0 1 4 0 a4 4 0 0 1 -8 0 a6 6 0 0 1 12 0 a8 8 0 0 1 -16 0 a10 10 0 0 1 20 0" fill={N} stroke={C.brownDark} strokeWidth={2.4} />
    <path d="M12 15 q4 4 8 0 t8 0 t8 0" fill={N} stroke={C.white} strokeWidth={2.4} />
  </>
)

const dumpling = (
  <>
    <path d="M6 32 C9 34 39 34 42 32 C40 37 8 37 6 32Z" fill={C.tan} />
    <path d="M6 31 C6 21 16 14 24 14 C32 14 42 21 42 31 C36 35 12 35 6 31Z" fill={C.cream} />
    <path d="M16 18 q1.5 4 0 8 M24 15 q1.5 5 0 9 M32 18 q-1.5 4 0 8" {...detail} />
    <path d="M18 9 q-2 -2 0 -4 M26 9 q-2 -2 0 -4" {...detail} />
  </>
)

// --- fruit ---------------------------------------------------------------

const banana = (
  <>
    <path d="M10 12 C6 32 22 44 41 35 C42 33 41 31 39 31 C27 33 19 26 16 12 Z" fill={C.yellow} />
    <path d="M13 14 C12 28 22 37 37 34" fill={N} stroke={C.orange} strokeOpacity={0.6} strokeWidth={1.3} />
    <path d="M13 12 L12.5 7" strokeWidth={4.5} />
    <path d="M13 12 L12.5 7" stroke={C.brown} strokeWidth={1.8} />
    <circle cx={41} cy={33} r={1.3} fill={INK} stroke={N} />
  </>
)

function blueberry(cx: number, cy: number) {
  return (
    <>
      <circle cx={cx} cy={cy} r={8} fill={C.blue} />
      <path d={`M${cx - 2} ${cy - 5.5} l2 1.5 l2 -1.5`} fill={N} strokeWidth={1.4} />
      {shine(cx - 3.5, cy + 1, { rx: 1.4, ry: 2.4, rotate: 20 })}
    </>
  )
}

const berries = (
  <>
    {blueberry(24, 17)}
    {blueberry(15, 31)}
    {blueberry(33, 31)}
  </>
)

const strawberry = (
  <>
    <path d="M24 42 C14 38 8 28 9 20 C10 14 16 13 24 15 C32 13 38 14 39 20 C40 28 34 38 24 42Z" fill={C.red} />
    <g fill={C.yellowLight} stroke={N}>
      {[
        [17, 22],
        [24, 21],
        [31, 22],
        [20, 29],
        [28, 29],
        [24, 35],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={0.9} ry={1.4} />
      ))}
    </g>
    <path d="M14 15 Q19 11.5 24 15 Q29 11.5 34 15 Q30 19.5 24 18.5 Q18 19.5 14 15Z" fill={C.green} />
    <path d="M24 15 V9" strokeWidth={2.2} />
  </>
)

const apple = (
  <>
    <path d="M24 15 C30 10 40 12 40 24 C40 34 33 42 28 42 C26 42 25 41 24 41 C23 41 22 42 20 42 C15 42 8 34 8 24 C8 12 18 10 24 15Z" fill={C.red} />
    <path d="M24 15 Q24 10 26 7" fill={N} stroke={C.brownDark} strokeWidth={2.6} />
    <path d="M26 10.5 C28 5 34 4.5 37 6.5 C34 11 29 12 26 10.5Z" fill={C.green} />
    {shine(14, 22, { ry: 4, rotate: 20 })}
  </>
)

const pumpkin = (
  <>
    <ellipse cx={14.5} cy={29} rx={9} ry={12} fill={C.orange} />
    <ellipse cx={33.5} cy={29} rx={9} ry={12} fill={C.orange} />
    <ellipse cx={24} cy={29} rx={9} ry={13} fill={C.orangeLight} />
    <path d="M22 17 Q21.5 10 26 7.5 L28 10 Q25.5 12.5 26 17Z" fill={C.brownDark} />
    <path d="M27 12 q6 -3 9 1" fill={N} stroke={C.greenDark} strokeWidth={1.6} />
  </>
)

/** Oat grains along a curved stalk: [x, y, angle]. */
const OAT_GRAINS: [number, number, number][] = [
  [16, 34, -40],
  [24, 31, 35],
  [18.5, 25.5, -40],
  [26.5, 22.5, 35],
  [21.5, 17.5, -35],
  [29.5, 14.5, 40],
  [28.5, 7.5, 20],
]

const oats = (
  <>
    <path d="M17 45 C19 32 23 20 29 9" fill={N} stroke={C.brown} strokeWidth={2.4} />
    {OAT_GRAINS.map(([x, y, a]) => (
      <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={2.8} ry={5.2} fill={C.tanLight} strokeWidth={1.6} transform={`rotate(${a} ${x} ${y})`} />
    ))}
  </>
)

const peanut = (
  <g transform="rotate(35 24 24)">
    <path d="M24 5 C31.5 5 34.5 11.5 32.5 17.5 C31.5 20.5 31.5 23.5 33.5 26.5 C36.5 33 32 43 24 43 C16 43 11.5 33 14.5 26.5 C16.5 23.5 16.5 20.5 15.5 17.5 C13.5 11.5 16.5 5 24 5Z" fill={C.tan} />
    <g fill={C.brown} stroke={N}>
      {[
        [21, 11],
        [27, 13],
        [23, 17],
        [20, 30],
        [27, 29],
        [24, 35],
        [21, 38],
        [28, 36],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} />
      ))}
    </g>
  </g>
)

// --- pantry & aromatics ----------------------------------------------------

const honey = (
  <>
    <path d="M12 18 H36 C40.5 24 40.5 36 36 42 H12 C7.5 36 7.5 24 12 18Z" fill={C.orange} />
    <rect x={13} y={11} width={22} height={7} rx={2} fill={C.brown} />
    <path d="M15.5 18 V22.5 Q15.5 25.5 17.5 25.5 Q19.5 25.5 19.5 22.5 V18 Z" fill={C.orangeLight} />
    <rect x={18} y={27} width={12} height={9} rx={2} fill={C.cream} />
    <path d="M24 29 l2.4 1.4 v2.8 l-2.4 1.4 l-2.4 -1.4 v-2.8 Z" fill={C.yellow} strokeWidth={1.2} />
    <path d="M11.5 25 Q10.5 31 12 36" fill={N} stroke={C.shine} strokeWidth={2} />
  </>
)

/** A teardrop leaf with its tip at the origin, pointing up. */
const LEAF = 'M0 0 C-5 -4 -5.5 -10 0 -13 C5.5 -10 5 -4 0 0Z'

const herbs = (
  <>
    <path d="M24 44 L14 20 M24 44 V14 M24 44 L34 20" fill={N} stroke={C.greenDark} strokeWidth={2} />
    {[
      [14, 21, -30],
      [24, 15, 0],
      [34, 21, 30],
      [18, 30, -55],
      [30, 30, 55],
    ].map(([x, y, a]) => (
      <path key={`${x}-${y}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${a})`} fill={C.green} strokeWidth={1.6} />
    ))}
    <rect x={20.5} y={35} width={7} height={4} rx={1} fill={C.purple} strokeWidth={1.6} />
  </>
)

const ginger = (
  <>
    <path d="M6 31 C4 26 8 22 13 23.5 L16 16 C17 12 22 12 22.5 16 L23 22 C25 19 30 18 32 21 L36 15.5 C38 12.5 42.5 14.5 41 18 L37 26 C38 32 32 36 26 34 C21 37.5 10 37 6 31Z" fill={C.tanLight} />
    <ellipse cx={19.3} cy={14.6} rx={3.1} ry={2} fill={C.yellowLight} transform="rotate(-10 19.3 14.6)" strokeWidth={1.5} />
    <path d="M12 28 q1 3 0 5 M20 25 q1.5 3 0 6 M29 25 q1 3 0 5" fill={N} stroke={C.brown} strokeWidth={1.4} />
  </>
)

const chocolate = (
  <g transform="rotate(-12 24 24)">
    <rect x={12} y={6} width={24} height={34} rx={2} fill={C.brownDark} />
    <g fill={C.brown} stroke={N}>
      {[0, 1].flatMap((i) =>
        [0, 1].map((j) => <rect key={`${i}-${j}`} x={14.5 + i * 10.5} y={8.5 + j * 8} width={8.5} height={6} rx={1} />),
      )}
    </g>
    <path d="M10 26 L13 23.5 L16 26 L19 23.5 L22 26 L25 23.5 L28 26 L31 23.5 L34 26 L38 23.5 V42 H10 Z" fill={C.red} />
    <path d="M14 33 h20" stroke={C.cream} strokeWidth={2} />
  </g>
)

// --- fallbacks -----------------------------------------------------------

const pot = (
  <>
    <path d="M14 9 q-2 -2 0 -4 M34 9 q-2 -2 0 -4" {...detail} />
    <path d="M3.5 25 H8 M40 25 H44.5" strokeWidth={4} />
    <path d="M8 22 H40 V36 C40 40 37 42.5 33 42.5 H15 C11 42.5 8 40 8 36Z" fill={C.orange} />
    <path d="M6 22 C6 16 14 13 24 13 C34 13 42 16 42 22Z" fill={C.orangeLight} />
    <rect x={20.5} y={9} width={7} height={4.5} rx={2} fill={C.brownDark} />
    <path d="M12 30 h12" stroke={C.shine} strokeWidth={2} />
  </>
)

const whisk = (
  <g transform="rotate(40 24 24)">
    <rect x={21} y={30} width={6} height={15} rx={3} fill={C.tan} />
    <rect x={21.5} y={27.5} width={5} height={4} rx={1} fill={C.greyLight} />
    <g fill={N} strokeWidth={1.6}>
      <path d="M24 28 C13 21 13 4 24 4 C35 4 35 21 24 28" />
      <path d="M24 28 C18.5 21 18.5 6 24 4 C29.5 6 29.5 21 24 28" />
      <path d="M24 28 V4" />
    </g>
  </g>
)

export const DRAWINGS: Record<ArtKey, ReactElement> = {
  drumstick,
  groundMeat,
  steak,
  porkChop,
  sausage,
  egg,
  cheese,
  milk,
  butter,
  tomato,
  cherryTomatoes,
  avocado,
  lime,
  lemon,
  onion,
  garlic,
  carrot,
  potato,
  sweetPotato,
  zucchini,
  broccoli,
  cauliflower,
  greens,
  cabbage,
  bellPepper,
  chili,
  mushroom,
  corn,
  beans,
  peas,
  rice,
  pasta,
  bread,
  muffin,
  pancakes,
  cinnamonRoll,
  dumpling,
  banana,
  berries,
  strawberry,
  apple,
  pumpkin,
  oats,
  peanut,
  honey,
  herbs,
  ginger,
  chocolate,
  pot,
  whisk,
}
