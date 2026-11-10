// Handwriting engine: a fat monoline script alphabet, drawn as centre-lines and stroked.
// Taken from the "fruit sticker footer" component; used by the preloader title.
// A fat monoline script, drawn as centre-lines and stroked. y points down:
// baseline 0, x-height -100, ascenders to -200, descenders to +100. Joined
// letters start at (0,-14) heading up-right and end at (advance,-14) the same
// way, so the pen never visibly lifts between them.
export const SCRIPT_STROKE = 34
export const SCRIPT_TOP = -230
export const SCRIPT_BOTTOM = 125

const IN = "M0,-14C6,-20 "
const out = (w: number) => " " + (w - 7) + ",-7 " + w + ",-14"
const outFlat = (w: number) => " " + (w - 6) + ",-12 " + w + ",-14"
// counter-clockwise bowl from its top-right corner, ending back up the right side
const bowl = (l: number, r: number) => {
  const m = (l + r) / 2
  return "C" + (m + 6) + ",-104 " + (l + 2) + ",-92 " + l + ",-52C" + (l - 1) + ",-18 " + (l + 12) + ",-3 " + (m - 2) + ",-3C" + (r - 8) + ",-3 " + (r + 2) + ",-30 " + (r + 2) + ",-62"
}
// lead-in that arcs up and over a bowl, landing on its top-right corner
const over = (l: number, r: number) => IN + (l - 2) + ",-50 " + (l + 14) + ",-88C" + (l + 26) + ",-104 " + (r - 10) + ",-104 " + r + ",-94"
// down a stem to the baseline, then out into the join
const down = (x: number, w: number) => "C" + (x - 1) + ",-60 " + (x - 4) + ",-24 " + (x - 2) + ",-12C" + x + ",-2 " + (x + 8) + ",-1 " + (x + 14) + ",-4C" + (w - 12) + ",-6" + out(w)
const stem = (x: number, top: number, w: number) => "M" + x + "," + top + down(x, w)
// an n-hump from the baseline at x0 over to a stem at x1
const arch = (x0: number, x1: number) => "C" + (x0 + 4) + ",-60 " + (x0 + 14) + ",-98 " + ((x0 + x1) / 2 + 2) + ",-98C" + (x1 + 6) + ",-98 " + (x1 + 4) + ",-70 " + (x1 + 1) + ",-44"
// a tall looped ascender rising out of the lead-in, coming back down at x
const loopUp = (x: number) => IN + (x + 18) + ",-40 " + (x + 38) + ",-108C" + (x + 52) + ",-152 " + (x + 48) + ",-200 " + (x + 26) + ",-198C" + (x + 4) + ",-196 " + (x - 2) + ",-150 " + x + ",-110"
// a looped descender from x down and back up into the join
const loopDown = (x: number, w: number) => "C" + x + ",-30 " + (x - 1) + ",30 " + (x - 6) + ",62C" + (x - 12) + ",94 " + (x - 42) + ",104 " + (x - 48) + ",82C" + (x - 54) + ",58 " + (x - 14) + ",8 " + (x + 12) + ",-6C" + (w - 12) + ",-12" + outFlat(w)
const entry = (x: number) => IN + (x - 4) + ",-50 " + x + ",-96"

// [advance, centre-line]. "M x,y L x,y" is a dot.
export const GLYPHS: Record<string, [number, string]> = {
  a: [100, over(18, 70) + bowl(16, 70) + stem(74, -98, 100)],
  b: [92, loopUp(16) + "C16,-60 15,-30 14,-8C24,-60 40,-98 58,-96C76,-94 76,-60 66,-30C58,-6 38,0 30,-12C40,-14 60,-14 74,-12C80,-12 86,-13 92,-14"],
  c: [80, IN + "16,-50 30,-82C42,-104 70,-104 66,-84C64,-76 58,-80 56,-84C50,-98 22,-96 16,-56C12,-24 26,-3 42,-3C58,-3" + out(80)],
  d: [100, over(18, 70) + bowl(16, 70) + stem(78, -192, 100)],
  e: [80, IN + "36,-40 52,-56C66,-72 66,-100 46,-100C24,-100 14,-74 14,-50C14,-20 28,-3 44,-3C58,-3" + out(80)],
  f: [74, loopUp(16) + "C16,-40 18,30 14,70C12,94 -6,96 -4,74C-2,50 30,-2 46,-8C62,-12" + outFlat(74)],
  g: [96, over(18, 70) + bowl(16, 70) + "M72,-98" + loopDown(72, 96)],
  h: [100, loopUp(16) + "C16,-60 15,-30 14,-2" + arch(14, 70) + down(71, 100)],
  i: [52, entry(26) + down(26, 52) + "M30,-146L30,-146"],
  j: [62, entry(26) + loopDown(26, 62) + "M32,-146L32,-146"],
  k: [96, loopUp(16) + "C16,-60 15,-30 14,-2C22,-56 40,-100 60,-98C80,-96 72,-56 30,-50C48,-44 56,-12 66,-6C72,-2 78,-3 84,-6C88,-8" + out(96)],
  l: [60, loopUp(16) + "C16,-60 14,-30 16,-14C18,-2 26,-1 32,-3C48,-6" + out(60)],
  m: [138, entry(18) + "C18,-60 16,-30 14,-2" + arch(14, 56) + "C56,-30 56,-14 56,-2" + arch(56, 108) + down(109, 138)],
  n: [102, entry(18) + "C18,-60 16,-30 14,-2" + arch(14, 72) + down(73, 102)],
  o: [92, IN + "16,-50 32,-88C30,-104 14,-84 14,-54C14,-22 28,-3 44,-3C62,-3 72,-30 70,-60C68,-90 52,-104 44,-94C38,-86 54,-74 66,-60C72,-52 80,-30 92,-14"],
  p: [96, entry(20) + "L14,92M14,-36C18,-60 28,-98 44,-98C76,-98 78,-60 68,-30C60,-6 40,0 30,-12C42,-14 62,-14 76,-13C82,-13 88,-13 96,-14"],
  q: [100, over(18, 70) + bowl(16, 70) + "M74,-98C73,-40 72,40 70,80C69,96 58,92 62,74C68,40 80,-6 100,-14"],
  r: [80, entry(18) + "C18,-60 16,-30 14,-2C20,-50 34,-90 50,-96C60,-100 64,-90 58,-82C54,-78 50,-82 52,-76C56,-50 56,-16 62,-8C66,-3" + out(80)],
  s: [76, IN + "20,-60 34,-100C40,-76 66,-54 58,-26C52,-2 22,0 10,-18C24,-6 50,-6 62,-10C66,-11" + out(76)],
  t: [72, IN + "20,-80 30,-170" + down(30, 72) + "M8,-104C24,-106 44,-108 62,-110"],
  u: [100, entry(18) + "C16,-60 12,-30 14,-16C16,-2 30,-2 42,-6C56,-12 66,-50 70,-96" + down(70, 100)],
  v: [84, entry(18) + "C18,-60 22,-10 38,-4C56,2 66,-40 64,-96C66,-60 70,-24 78,-18C80,-16 82,-15 84,-14"],
  w: [124, entry(18) + "C16,-60 14,-4 34,-4C50,-4 56,-50 58,-80C58,-50 62,-4 82,-4C98,-4 106,-50 104,-96C106,-60 110,-24 118,-18C120,-16 122,-15 124,-14"],
  x: [92, IN + "18,-60 28,-80C38,-100 54,-100 54,-80C54,-50 50,-20 60,-8C66,-2 72,-4 80,-8C84,-10" + out(92) + "M20,-10C38,-40 58,-74 78,-98"],
  y: [96, entry(18) + "C16,-60 12,-30 14,-16C16,-2 30,-2 42,-6C56,-12 66,-50 70,-96" + loopDown(70, 96)],
  z: [88, IN + "20,-60 36,-90C46,-104 70,-104 64,-80C58,-60 34,-34 18,-10C34,-30 64,-24 60,10C56,60 20,96 12,72C6,52 40,-6 70,-12C76,-13 82,-13 88,-14"],
  "!": [56, "M42,-194C38,-150 32,-96 28,-52M22,-8L22,-8"],
  "?": [72, "M10,-160C14,-196 66,-200 62,-160C60,-128 30,-112 30,-60M26,-8L26,-8"],
  ".": [36, "M16,-8L16,-8"],
  ",": [36, "M20,-8C18,10 12,22 4,30"],
  "'": [30, "M22,-192L16,-140"],
  " ": [44, ""],
}

export type ScriptStroke = { d: string; len: number }
export type ScriptGlyph = { ch: string; x: number; strokes: ScriptStroke[]; dots: [number, number][] }

// Accents fold onto their base letter (adiós → adios), curly quotes onto '.
export const normalise = (word: string) =>
  word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2018\u2019]/g, "'").toLowerCase()

export const supports = (word: string) => [...normalise(word)].every((ch) => ch in GLYPHS)

// Length of an M/L/C path, flattening each curve into short chords.
export const pathLength = (d: string) => {
  const nums = (d.match(/-?\d*\.?\d+/g) || []).map(Number)
  const cmds = d.match(/[MLC]/g) || []
  let i = 0
  let x = 0
  let y = 0
  let len = 0
  for (const c of cmds) {
    if (c === "M") {
      x = nums[i++]
      y = nums[i++]
    } else if (c === "L") {
      const nx = nums[i++]
      const ny = nums[i++]
      len += Math.hypot(nx - x, ny - y)
      x = nx
      y = ny
    } else {
      const p = nums.slice(i, i + 6)
      i += 6
      let px = x
      let py = y
      for (let k = 1; k <= 16; k++) {
        const t = k / 16
        const u = 1 - t
        const qx = u * u * u * x + 3 * u * u * t * p[0] + 3 * u * t * t * p[2] + t * t * t * p[4]
        const qy = u * u * u * y + 3 * u * u * t * p[1] + 3 * u * t * t * p[3] + t * t * t * p[5]
        len += Math.hypot(qx - px, qy - py)
        px = qx
        py = qy
      }
      x = p[4]
      y = p[5]
    }
  }
  return len
}

export const layoutWord = (word: string) => {
  const glyphs: ScriptGlyph[] = []
  let x = 0
  for (const ch of normalise(word)) {
    const g = GLYPHS[ch] ?? GLYPHS[" "]
    const strokes: ScriptStroke[] = []
    const dots: [number, number][] = []
    for (const sub of g[1].split(/(?=M)/)) {
      if (!sub) continue
      const dot = sub.match(/^M(-?[\d.]+),(-?[\d.]+)L\1,\2$/)
      if (dot) dots.push([+dot[1], +dot[2]])
      else strokes.push({ d: sub, len: pathLength(sub) })
    }
    glyphs.push({ ch, x, strokes, dots })
    x += g[0]
  }
  return { glyphs, width: x }
}

// Pen timing: a constant speed along every stroke, a short lift between them.
export const PEN_SPEED = 1700
export const PEN_LIFT = 0.05
export const timeWord = (glyphs: ScriptGlyph[]) => {
  let t = 0
  return {
    glyphs: glyphs.map((g) => {
      const strokes = g.strokes.map((s) => {
        const at = { ...s, delay: t, dur: Math.max(0.08, s.len / PEN_SPEED) }
        t += at.dur + PEN_LIFT
        return at
      })
      const dots = g.dots.map((p) => {
        const at = { x: p[0], y: p[1], delay: t }
        t += 0.08
        return at
      })
      return { ...g, strokes, dots }
    }),
    total: t,
  }
}

// Clamp a sticker's offset so its centre stays inside the footer.
export const clampOffset = (v: number, min: number, max: number) => (min > max ? (min + max) / 2 : Math.min(max, Math.max(min, v)))

// One tick of a damped spring. Returns the new [position, velocity].
export const spring = (x: number, v: number, target: number, k: number, damp: number) => {
  const nv = (v + (target - x) * k) * damp
  return [x + nv, nv] as const
}
