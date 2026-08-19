/**
 * Procedurele oppervlakte-animaties voor de planeet-portretweergave
 * (PlanetSphere.jsx) -- puur canvas-tekenwerk, GEEN Three.js-afhankelijkheid
 * hier, zodat dit los te testen/hergebruiken is.
 *
 * 5 variant-"recepten" per planet_type (25 totaal), gekozen op basis van een
 * deterministische hash van planet_name -- dezelfde planeet toont dus altijd
 * dezelfde variant, maar verschillende planeten van hetzelfde type ogen
 * gevarieerd. Kleuren komen uit planet_color_rgb (dezelfde continue schatting
 * als op de catalogus-kaartjes), niet de categorische kleur uit
 * SystemOrbitView (die is bewust maximaal contrasterend voor een
 * overzichtsweergave met meerdere planeten -- hier draait het juist om één
 * individuele planeet).
 *
 * cloudLayer/spotPulse zijn BEWUST losgekoppeld van de as-rotatie: wolken-
 * drift en een pulserende storm zijn atmosferische verschijnselen, geen
 * rotatie van het vaste lichaam zelf -- die blijven dus animeren ongeacht
 * rotation_state, alleen de as-rotatie van de bol wordt uitgezet bij
 * "synchronous" (tidally locked). Zie PlanetSphere.jsx.
 */

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shade(rgb, f) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  return `rgb(${c(rgb[0])}, ${c(rgb[1])}, ${c(rgb[2])})`
}

function shadeA(rgb, f, a) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  return `rgba(${c(rgb[0])}, ${c(rgb[1])}, ${c(rgb[2])}, ${a})`
}

function fillBase(ctx, w, h, rgb, f = 1) {
  ctx.fillStyle = shade(rgb, f)
  ctx.fillRect(0, 0, w, h)
}

function paintBands(ctx, w, h, rgb, rng, count, contrast) {
  // Per beeldregel een eigen tint i.p.v. een fillRect PER BAND -- de
  // oorspronkelijke versie zette count harde blokken met een abrupte
  // kleursprong op elke bandgrens, wat op de bol duidelijk "geposteriseerd"/
  // blokkerig oogde. Een kleine som van sinusgolven (goedkope 1D-
  // turbulentie, met willekeurige frequentie/fase per planeet) geeft
  // vloeiend in elkaar overlopende banden die nog steeds herkenbaar
  // bandvormig zijn, net als bij Jupiter/Saturnus/de ijsreuzen.
  const freqs = [0.6 + rng() * count, 1.3 + rng() * count * 0.6, 2.1 + rng() * count * 0.3]
  const phases = [rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2]
  const weights = [0.55, 0.3, 0.15]
  for (let y = 0; y < h; y++) {
    const ny = y / h
    let wave = 0
    for (let k = 0; k < freqs.length; k++) {
      wave += weights[k] * Math.sin(ny * Math.PI * 2 * freqs[k] + phases[k])
    }
    ctx.fillStyle = shade(rgb, 1 + wave * contrast)
    ctx.fillRect(0, y, w, 1)
  }
}

function paintCraters(ctx, w, h, rgb, rng, count) {
  // Radiale gradient i.p.v. platte fill + harde 1px stroke-rand -- geeft een
  // zacht "uitgehold" reliëf (donkerder kom, lichtere rand aan de kant van
  // het licht) in plaats van een vlak silhouet met een scherpe contourlijn.
  for (let i = 0; i < count; i++) {
    const x = rng() * w
    const y = rng() * h
    const r = 3 + rng() * 9
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r)
    grad.addColorStop(0, shadeA(rgb, 0.5, 0.85))
    grad.addColorStop(0.75, shadeA(rgb, 0.68, 0.75))
    grad.addColorStop(1, shadeA(rgb, 1.35, 0.3))
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function paintCanyons(ctx, w, h, rgb, rng, count) {
  for (let i = 0; i < count; i++) {
    const y0 = rng() * h
    ctx.strokeStyle = shadeA(rgb, 0.5, 0.8)
    ctx.lineWidth = 1.5 + rng() * 3
    ctx.beginPath()
    for (let x = 0; x <= w; x += w / 12) {
      const y = y0 + Math.sin(x * 0.05 + i) * h * 0.02 + (rng() - 0.5) * h * 0.02
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

function paintPolarCaps(ctx, w, h, size = 0.14, alpha = 0.85) {
  const capH = h * size
  let g = ctx.createLinearGradient(0, 0, 0, capH)
  g.addColorStop(0, `rgba(255,255,255,${alpha})`)
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, capH)
  g = ctx.createLinearGradient(0, h - capH, 0, h)
  g.addColorStop(0, "rgba(255,255,255,0)")
  g.addColorStop(1, `rgba(255,255,255,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, h - capH, w, capH)
}

function paintNoise(ctx, w, h, rng, alpha, cell = 4) {
  // Zachte cirkeltjes i.p.v. harde vierkante fillRect-blokjes -- die laatste
  // gaven op de bolbol een duidelijk voxel/"Minecraft"-patroon zodra de
  // textuur uitvergroot werd. De extra blur-pass in softenCanvas() vlakt dit
  // verder af, maar al ronde vormen tekenen scheelt de meeste harde randen.
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      if (rng() < 0.4) {
        ctx.fillStyle = `rgba(255,255,255,${(rng() * alpha).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

/**
 * Vlakt harde randen af (bandovergangen, ruis-stippen, kraterranden) met een
 * canvas-blurfilter -- zonder dit oogde elke variant duidelijk "blokkerig"
 * zodra de relatief kleine textuur (zie SURFACE_SIZE) uitvergroot werd over
 * de bol. Draait via een los tussencanvas omdat drawImage(canvas, ...) een
 * canvas niet naar zichzelf mag tekenen terwijl er een filter actief is.
 */
function softenCanvas(canvas, blurPx) {
  const tmp = document.createElement("canvas")
  tmp.width = canvas.width
  tmp.height = canvas.height
  tmp.getContext("2d").drawImage(canvas, 0, 0)

  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.filter = `blur(${blurPx}px)`
  ctx.drawImage(tmp, 0, 0)
  ctx.filter = "none"
}

function paintBlobs(ctx, w, h, colorCss, rng, count, size) {
  // Onregelmatige continent-achtige vlekken -- elke "blob" is een cluster
  // overlappende ellipsen i.p.v. één nette vorm, voor een organisch/
  // kustlijn-achtig silhouet i.p.v. een duidelijk geometrische vlek.
  for (let i = 0; i < count; i++) {
    const cx = rng() * w
    const cy = h * 0.12 + rng() * h * 0.76 // niet te dicht bij de polen
    const clusters = 5 + Math.floor(rng() * 5)
    ctx.fillStyle = colorCss
    for (let j = 0; j < clusters; j++) {
      const ox = (rng() - 0.5) * size
      const oy = (rng() - 0.5) * size * 0.6
      const r = size * (0.3 + rng() * 0.5)
      ctx.beginPath()
      ctx.ellipse(cx + ox, cy + oy, r, r * 0.7, rng() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function paintSwirls(ctx, w, h, rgb, rng, arms) {
  ctx.save()
  ctx.globalAlpha = 0.45
  for (let a = 0; a < arms; a++) {
    ctx.strokeStyle = shade(rgb, 1.25)
    ctx.lineWidth = 3
    ctx.beginPath()
    const cy = h * (0.25 + rng() * 0.5)
    for (let x = 0; x <= w; x += 6) {
      const y = cy + Math.sin((x / w) * Math.PI * 4 + a * 2.1) * h * 0.05
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// { build(ctx,w,h,rng,rgb) -> optioneel {spot}, cloudLayer?, cloudBandCount?,
//   cloudAlpha?, cloudSpeed?, spotPulse? }
const VARIANTS = {
  rocky: [
    {
      key: "cratered",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCraters(ctx, w, h, rgb, rng, 55)
        paintNoise(ctx, w, h, rng, 0.04)
      },
    },
    {
      key: "canyons",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCanyons(ctx, w, h, rgb, rng, 7)
        paintNoise(ctx, w, h, rng, 0.03)
      },
    },
    {
      key: "volcanic",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb, 0.42)
        paintCraters(ctx, w, h, rgb, rng, 20)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 50, size: 0.16, color: "#ff6a1a" } }
      },
      spotPulse: true,
    },
    {
      key: "polar-ice",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCraters(ctx, w, h, rgb, rng, 16)
        paintPolarCaps(ctx, w, h, 0.16)
      },
      cloudLayer: true, cloudBandCount: 3, cloudAlpha: 0.08, cloudSpeed: 0.15,
    },
    {
      key: "oceanic-clouds",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintNoise(ctx, w, h, rng, 0.05)
      },
      cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.22, cloudSpeed: 0.35,
    },
  ],
  super_earth: [
    {
      key: "cratered-highlands",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCraters(ctx, w, h, rgb, rng, 70)
        paintNoise(ctx, w, h, rng, 0.05)
      },
    },
    {
      key: "canyon-belt",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCanyons(ctx, w, h, rgb, rng, 10)
      },
      cloudLayer: true, cloudBandCount: 2, cloudAlpha: 0.1, cloudSpeed: 0.2,
    },
    {
      key: "dense-cloud-marble",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb, 1.1)
        paintNoise(ctx, w, h, rng, 0.04)
      },
      cloudLayer: true, cloudBandCount: 6, cloudAlpha: 0.32, cloudSpeed: 0.4,
    },
    {
      key: "storm-belt",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 6, 0.14)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 40, size: 0.14, color: shade(rgb, 1.5) } }
      },
      cloudLayer: true, cloudBandCount: 4, cloudAlpha: 0.16, cloudSpeed: 0.3, spotPulse: true,
    },
    {
      key: "ice-highlands",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 4, 0.1)
        paintPolarCaps(ctx, w, h, 0.22)
      },
    },
  ],
  sub_neptune: [
    {
      key: "hazy-uniform",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintNoise(ctx, w, h, rng, 0.06)
      },
      cloudLayer: true, cloudBandCount: 2, cloudAlpha: 0.18, cloudSpeed: 0.18,
    },
    {
      key: "banded-haze",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 7, 0.12)
      },
      cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.2, cloudSpeed: 0.3,
    },
    {
      key: "swirl-vortex",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintSwirls(ctx, w, h, rgb, rng, 4)
      },
      cloudLayer: true, cloudBandCount: 3, cloudAlpha: 0.14, cloudSpeed: 0.5,
    },
    {
      key: "storm-belt-teal",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 8, 0.16)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 45, size: 0.13, color: shade(rgb, 1.6) } }
      },
      spotPulse: true,
    },
    {
      key: "polar-vortex-glow",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 6, 0.1)
        paintPolarCaps(ctx, w, h, 0.18, 0.5)
      },
      cloudLayer: true, cloudBandCount: 4, cloudAlpha: 0.14, cloudSpeed: 0.22,
    },
  ],
  ice_giant: [
    {
      key: "banded-blue",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 9, 0.1)
      },
      cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.16, cloudSpeed: 0.25,
    },
    {
      key: "methane-haze",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintNoise(ctx, w, h, rng, 0.05)
      },
      cloudLayer: true, cloudBandCount: 2, cloudAlpha: 0.2, cloudSpeed: 0.15,
    },
    {
      key: "dark-storm-spot",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 6, 0.08)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 40, size: 0.15, color: shade(rgb, 0.35) } }
      },
      spotPulse: true,
    },
    {
      key: "icy-streaks",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintCanyons(ctx, w, h, rgb, rng, 8)
      },
      cloudLayer: true, cloudBandCount: 3, cloudAlpha: 0.12, cloudSpeed: 0.3,
    },
    {
      key: "aurora-glow",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 7, 0.1)
        paintPolarCaps(ctx, w, h, 0.2, 0.55)
      },
      cloudLayer: true, cloudBandCount: 4, cloudAlpha: 0.14, cloudSpeed: 0.2,
    },
  ],
  gas_giant: [
    {
      key: "jupiter-bands",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 12, 0.18)
      },
      cloudLayer: true, cloudBandCount: 8, cloudAlpha: 0.2, cloudSpeed: 0.55,
    },
    {
      key: "great-spot",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 10, 0.16)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 30, size: 0.2, color: shade(rgb, 1.7) } }
      },
      cloudLayer: true, cloudBandCount: 6, cloudAlpha: 0.16, cloudSpeed: 0.45, spotPulse: true,
    },
    {
      key: "turbulent-storm",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 9, 0.14)
        paintNoise(ctx, w, h, rng, 0.08)
      },
      cloudLayer: true, cloudBandCount: 7, cloudAlpha: 0.22, cloudSpeed: 0.6,
    },
    {
      key: "pastel-bands",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb, 1.1)
        paintBands(ctx, w, h, rgb, rng, 8, 0.08)
      },
      cloudLayer: true, cloudBandCount: 4, cloudAlpha: 0.14, cloudSpeed: 0.28,
    },
    {
      key: "dark-belts",
      build: (ctx, w, h, rng, rgb) => {
        fillBase(ctx, w, h, rgb)
        paintBands(ctx, w, h, rgb, rng, 11, 0.26)
        return { spot: { lonDeg: rng() * 360, latDeg: (rng() - 0.5) * 35, size: 0.1, color: shade(rgb, 0.4) } }
      },
      cloudLayer: true, cloudBandCount: 9, cloudAlpha: 0.18, cloudSpeed: 0.5, spotPulse: true,
    },
  ],
}

const FALLBACK_TYPE = "rocky"

/**
 * Voor onze eigen 8 zonnestelselplaneten bestaan er WEL echte referentie-
 * beelden -- in tegenstelling tot de 25 generieke type-varianten hierboven
 * (die zijn bedoeld voor exoplaneten, waar geen foto's van bestaan en een
 * hash-gekozen variant dus de eerlijkste optie is) krijgen deze acht een
 * met de hand afgestemd recept + een vaste kleur die matcht met bekende
 * beelden, i.p.v. de algoritmische planet_color_rgb-schatting (die is een
 * fysische benadering, prima voor exoplaneten, maar voor Aarde/Mars/Jupiter
 * etc. hebben we betere informatie). tiltDeg past de rotatie-as zelf aan --
 * puur voor Uranus, die z'n bekende "op z'n kant liggende" aanblik dankt aan
 * een askanteling van ~98 graden i.p.v. een subtiel verschil in bandpatroon.
 */
const SOLAR_SYSTEM_RECIPES = {
  Mercury: {
    color: [148, 138, 128],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintCraters(ctx, w, h, rgb, rng, 90)
      paintNoise(ctx, w, h, rng, 0.04)
    },
  },
  Venus: {
    color: [223, 197, 139],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintSwirls(ctx, w, h, rgb, rng, 3)
    },
    cloudLayer: true, cloudBandCount: 3, cloudAlpha: 0.55, cloudSpeed: 0.08,
  },
  Earth: {
    color: [42, 92, 158],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintBlobs(ctx, w, h, "rgba(58,120,58,0.9)", rng, 4, h * 0.22)
      paintBlobs(ctx, w, h, "rgba(150,120,72,0.75)", rng, 3, h * 0.12)
      paintPolarCaps(ctx, w, h, 0.09, 0.9)
    },
    cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.3, cloudSpeed: 0.35,
  },
  Mars: {
    color: [193, 96, 55],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintCanyons(ctx, w, h, rgb, rng, 8)
      paintCraters(ctx, w, h, rgb, rng, 30)
      paintPolarCaps(ctx, w, h, 0.08, 0.8)
    },
    cloudLayer: true, cloudBandCount: 2, cloudAlpha: 0.08, cloudSpeed: 0.12,
  },
  Jupiter: {
    color: [205, 173, 138],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintBands(ctx, w, h, rgb, rng, 13, 0.2)
      return { spot: { lonDeg: rng() * 360, latDeg: -22, size: 0.16, color: "#c1502e" } }
    },
    cloudLayer: true, cloudBandCount: 8, cloudAlpha: 0.18, cloudSpeed: 0.5, spotPulse: true,
  },
  Saturn: {
    color: [222, 202, 158],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintBands(ctx, w, h, rgb, rng, 9, 0.1)
    },
    cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.12, cloudSpeed: 0.3,
  },
  Uranus: {
    color: [172, 224, 224],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintBands(ctx, w, h, rgb, rng, 5, 0.05)
    },
    cloudLayer: true, cloudBandCount: 2, cloudAlpha: 0.1, cloudSpeed: 0.15,
    tiltDeg: 97.8,
  },
  Neptune: {
    color: [59, 92, 201],
    build: (ctx, w, h, rng, rgb) => {
      fillBase(ctx, w, h, rgb)
      paintBands(ctx, w, h, rgb, rng, 8, 0.12)
      return { spot: { lonDeg: rng() * 360, latDeg: 25, size: 0.12, color: "#1c2a52" } }
    },
    cloudLayer: true, cloudBandCount: 5, cloudAlpha: 0.16, cloudSpeed: 0.35, spotPulse: true,
  },
}

/** Kiest het animatierecept voor deze planeet: vast/herkenbaar voor de 8
 * zonnestelselplaneten, anders deterministisch (op planet_name) 1 van de 5
 * generieke type-varianten. colorOverride is null buiten het zonnestelsel --
 * de aanroeper valt dan terug op planet.planet_color_rgb. */
export function pickPlanetVariant(planet) {
  const known = planet.is_solar_system ? SOLAR_SYSTEM_RECIPES[planet.planet_name] : null
  const seed = hashString(planet.planet_name || String(planet.id ?? "planet"))
  const rng = mulberry32(seed ^ 0x9e3779b9)

  if (known) {
    return { typeKey: "solar-system", variantIndex: 0, recipe: known, rng, colorOverride: known.color }
  }

  const typeKey = VARIANTS[planet.planet_type] ? planet.planet_type : FALLBACK_TYPE
  const variants = VARIANTS[typeKey]
  const variantIndex = seed % variants.length
  return { typeKey, variantIndex, recipe: variants[variantIndex], rng, colorOverride: null }
}

// 1024x512 i.p.v. de eerdere 512x256 -- op de eerdere resolutie werden de
// tekenprimitieven (ruisstippen, bandranden) als duidelijke blokjes zichtbaar
// zodra de textuur over de bol werd uitgerekt ("Minecraft"-effect). Samen met
// softenCanvas() (blur-pass hieronder) en anisotropic filtering in
// PlanetSphere.jsx geeft dit een vloeiend oppervlak i.p.v. harde pixels.
const SURFACE_SIZE = { w: 1024, h: 512 }
// Kleiner dan voorheen (3px) -- paintBands/paintCraters zijn nu zelf al
// vloeiend (per-scanline gradient resp. radiale gradient i.p.v. harde
// fills), dus deze pass hoeft alleen nog de resterende hoekige randen
// (kraterellipsen, ruisstippen, swirl-lijnen) te verzachten zonder al het
// detail weg te vegen.
const SURFACE_BLUR_PX = 1.4

/** Bouwt het canvas voor het planeetoppervlak zelf (equirectangulair). */
export function buildSurfaceCanvas(recipe, rng, colorRgb, size = SURFACE_SIZE) {
  const canvas = document.createElement("canvas")
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext("2d")
  const extra = recipe.build(ctx, size.w, size.h, rng, colorRgb) || {}
  softenCanvas(canvas, SURFACE_BLUR_PX)
  return { canvas, spot: extra.spot }
}

/** Bouwt een transparante wolkenlaag (alpha-band + ruis) voor de atmosfeer-drift. */
export function buildCloudCanvas(rng, { bandCount = 4, alpha = 0.18 } = {}, size = SURFACE_SIZE) {
  const canvas = document.createElement("canvas")
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext("2d")
  const bandH = size.h / bandCount
  for (let i = 0; i < bandCount; i++) {
    const a = alpha * (0.4 + rng() * 0.6)
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
    ctx.fillRect(0, i * bandH, size.w, bandH * (0.4 + rng() * 0.5))
  }
  paintNoise(ctx, size.w, size.h, rng, alpha * 0.6)
  softenCanvas(canvas, SURFACE_BLUR_PX * 1.5)
  return canvas
}
