import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * Procedurele 3D-visualisatie van een stelsel (ster + planeten + leefbare
 * zone) -- geen afbeeldingen, alleen data die de API toch al levert
 * (planet_color_rgb/star_color_rgb/orbit_eccentricity/rotation_state/
 * has_rings/hz_inner_au/hz_outer_au). Afgeleid van het concept in
 * frontend-demo/OrbitDemo.jsx.
 *
 * SCHAAL: orbit-afstanden gebruiken een LOGARITMISCHE AU-schaal
 * (auToSceneDistance) i.p.v. letterlijke AU. Bewust log i.p.v. sqrt (eerdere
 * versie): bij een log-schaal geeft een gelijke VERHOUDING (bv. "planeet B
 * zit 1,87x verder dan planeet A") altijd dezelfde visuele afstand, ongeacht
 * of die verhouding zich dicht bij de ster voordoet of ver weg. Dat is
 * precies waarom Mercurius/Venus (verhouding 1,87x) bij een sqrt-schaal
 * onterecht dicht op elkaar stonden -- de vaste ORBIT_MIN-vloerwaarde
 * drukte hun relatieve afstand plat. Geverifieerd tegen ons eigen
 * zonnestelsel (het enige stelsel waar we een betrouwbare intuitie over
 * hebben) -- dat is ook de aanbevolen manier om dit soort schaalkeuzes te
 * checken bij toekomstige aanpassingen: een abstracte heuristiek ("gap >
 * planeetgrootte") is niet genoeg, toets tegen een stelsel met bekende
 * verhoudingen.
 * BELANGRIJK: dezelfde functie wordt gebruikt voor zowel planeetbanen als
 * de hz_inner_au/hz_outer_au-grenzen, zodat een planeet die volgens de
 * data binnen de leefbare zone ligt, dat ook visueel is -- de relatieve
 * verhouding blijft dus behouden, alleen de absolute schaal is comprimeerd.
 * Ontbrekende orbit_semi_major_axis_au/orbit_eccentricity krijgen een
 * fallback puur voor de renderwiskunde -- nooit als gemeten waarde elders
 * getoond (zie PlanetDetailPage.jsx).
 *
 * ANIMATIESNELHEID: gebruikt NIET de echte orbit_period_days (die blijft
 * gewoon als tekst zichtbaar in de data-secties) -- de spreiding tussen de
 * kortste en langste omlooptijd in deze catalogus is een factor ~700x
 * (Mercurius 88 dagen vs. Neptunus ~60.000 dagen), wat op scherm zou
 * betekenen dat de ene planeet flitst en de andere stilstaat. In plaats
 * daarvan wordt de snelheid afgeleid van de al-gecomprimeerde
 * schermafstand (dichterbij = sneller, net als echt, maar met een veel
 * kleinere bandbreedte).
 */

const ORBIT_MIN = 4.5
const ORBIT_LOG_SCALE = 3.0
const AU_REFERENCE = 0.01 // ondergrens (typische kortste bekende exoplaneetbaan)
const ORBIT_FALLBACK_STEP = 3.8
const ORBIT_SPEED_BASE_SECONDS = 4 // omlooptijd (in scene-seconden) op ORBIT_MIN

function auToSceneDistance(au) {
  const safeAu = Math.max(au, AU_REFERENCE)
  return ORBIT_MIN + ORBIT_LOG_SCALE * Math.max(0, Math.log(safeAu / AU_REFERENCE))
}

function sceneAngularSpeed(orbitA) {
  const periodSeconds = ORBIT_SPEED_BASE_SECONDS * Math.pow(orbitA / ORBIT_MIN, 1.5)
  return (2 * Math.PI) / periodSeconds
}

function rgbToThreeColor(rgb) {
  if (!rgb) return new THREE.Color(0xaaaaaa)
  // .setRGB(..., SRGBColorSpace) is bewust i.p.v. de kortere new THREE.Color(r,g,b) --
  // onze RGB-waarden komen uit een sRGB-blackbody-benadering (scoring.py), maar Three.js
  // interpreteert kale (r,g,b)-getallen standaard als LINEAIRE kleurwaarden. Zonder deze
  // expliciete conversie past de renderer er nog een keer een sRGB-transform overheen,
  // wat kleuren laat verwateren richting wit/grijs -- precies waarom een rode dwerg en
  // een blauwwitte ster te weinig van elkaar verschilden.
  return new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace)
}

function planetVisualRadius(radiusEarth) {
  const r = radiusEarth ?? 1.5
  return Math.min(1.6, Math.max(0.28, 0.22 * Math.sqrt(r) + 0.28))
}

function starVisualRadius(starRadiusSolar) {
  const r = starRadiusSolar ?? 1
  return Math.min(4, Math.max(1.5, 0.8 * Math.sqrt(r) + 1.5))
}

function makeCircleLine(radius, color, opacity) {
  const points = []
  for (let i = 0; i <= 128; i++) {
    const theta = (i / 128) * Math.PI * 2
    points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }))
}

export default function SystemOrbitView({ planets, highlightPlanetId, onPlanetClick }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!planets || planets.length === 0) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03040a)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 28, 42)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const starGeo = new THREE.BufferGeometry()
    const starCount = 500
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 250
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 })))

    const first = planets[0]
    const starColor = rgbToThreeColor(first.star_color_rgb)
    const starMesh = new THREE.Mesh(
      new THREE.SphereGeometry(starVisualRadius(first.star_radius_solar), 32, 32),
      new THREE.MeshBasicMaterial({ color: starColor })
    )
    scene.add(starMesh)
    scene.add(new THREE.PointLight(starColor, 3, 200))
    scene.add(new THREE.AmbientLight(0x404040, 0.6))

    // Leefbare zone ("Goldilocks zone") -- zelfde AU->scene-schaal als de
    // planeetbanen, zodat de weergave consistent is met in_habitable_zone.
    if (first.hz_inner_au != null && first.hz_outer_au != null) {
      const innerR = auToSceneDistance(first.hz_inner_au)
      const outerR = auToSceneDistance(first.hz_outer_au)
      const hzBand = new THREE.Mesh(
        new THREE.RingGeometry(innerR, outerR, 128),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
      )
      hzBand.rotation.x = -Math.PI / 2
      hzBand.position.y = -0.02 // lichte offset -- voorkomt z-fighting met de banen op y=0
      scene.add(hzBand)
      scene.add(makeCircleLine(innerR, 0x4ade80, 0.7))
      scene.add(makeCircleLine(outerR, 0x4ade80, 0.7))
    }

    function makeOrbitLine(a, ecc) {
      const b = a * Math.sqrt(1 - ecc * ecc)
      const c = Math.sqrt(Math.max(0, a * a - b * b))
      const points = []
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2
        points.push(new THREE.Vector3(a * Math.cos(theta) - c, 0, b * Math.sin(theta)))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a3550, transparent: true, opacity: 0.6 }))
    }

    const sorted = [...planets].sort((p1, p2) => {
      const a1 = p1.orbit_semi_major_axis_au
      const a2 = p2.orbit_semi_major_axis_au
      if (a1 === null || a1 === undefined) return 1
      if (a2 === null || a2 === undefined) return -1
      return a1 - a2
    })

    let lastDistance = ORBIT_MIN
    const planetObjects = sorted.map((p) => {
      const orbitA = p.orbit_semi_major_axis_au != null
        ? auToSceneDistance(p.orbit_semi_major_axis_au)
        : lastDistance + ORBIT_FALLBACK_STEP
      lastDistance = orbitA

      const ecc = Math.min(0.9, Math.max(0, p.orbit_eccentricity ?? 0))
      scene.add(makeOrbitLine(orbitA, ecc))

      const radius = planetVisualRadius(p.radius_earth)
      const color = rgbToThreeColor(p.planet_color_rgb)
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 })
      )
      mesh.userData.planetId = p.id

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.18, 24, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.BackSide })
      )
      mesh.add(glow)

      if (p.has_rings) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 1.4, radius * 2.1, 48),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        )
        ring.rotation.x = Math.PI / 2.5
        mesh.add(ring)
      }

      if (String(p.id) === String(highlightPlanetId)) {
        const marker = new THREE.Mesh(
          new THREE.RingGeometry(radius * 2.5, radius * 2.8, 48),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        )
        marker.rotation.x = -Math.PI / 2
        mesh.add(marker)
      }

      scene.add(mesh)

      return {
        mesh, orbitA, ecc,
        angularSpeed: sceneAngularSpeed(orbitA),
        startAngle: Math.random() * Math.PI * 2,
        rotationState: p.rotation_state,
      }
    })

    // --- Klikbaar maken: raycasting naar planeetmeshes ---
    const raycaster = new THREE.Raycaster()
    const pointerNdc = new THREE.Vector2()
    const clickableMeshes = planetObjects.map((p) => p.mesh)

    function planetIdFromIntersection(object) {
      let obj = object
      while (obj) {
        if (obj.userData?.planetId !== undefined) return obj.userData.planetId
        obj = obj.parent
      }
      return null
    }

    function updatePointerNdc(event) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    function handleClick(event) {
      if (!onPlanetClick) return
      updatePointerNdc(event)
      raycaster.setFromCamera(pointerNdc, camera)
      const intersects = raycaster.intersectObjects(clickableMeshes, true)
      if (intersects.length > 0) {
        const planetId = planetIdFromIntersection(intersects[0].object)
        if (planetId !== null) onPlanetClick(planetId)
      }
    }

    function handlePointerMove(event) {
      updatePointerNdc(event)
      raycaster.setFromCamera(pointerNdc, camera)
      const intersects = raycaster.intersectObjects(clickableMeshes, true)
      renderer.domElement.style.cursor = intersects.length > 0 ? "pointer" : "default"
    }

    renderer.domElement.addEventListener("click", handleClick)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)

    let frameId
    const clock = new THREE.Clock()

    function animate() {
      const elapsedSeconds = clock.getElapsedTime()
      starMesh.rotation.y += 0.002

      planetObjects.forEach((p) => {
        const angle = p.startAngle + elapsedSeconds * p.angularSpeed

        const a = p.orbitA
        const b = a * Math.sqrt(1 - p.ecc * p.ecc)
        const c = Math.sqrt(Math.max(0, a * a - b * b))
        p.mesh.position.set(a * Math.cos(angle) - c, 0, b * Math.sin(angle))

        if (p.rotationState === "free") p.mesh.rotation.y += 0.03
        else if (p.rotationState === "resonant") p.mesh.rotation.y += 0.01
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    function handleResize() {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("click", handleClick)
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [planets, highlightPlanetId, onPlanetClick])

  return <div ref={mountRef} className="w-full h-64 sm:h-80" />
}
