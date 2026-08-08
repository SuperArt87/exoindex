import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * Procedurele 3D-visualisatie van een stelsel (ster + planeten) -- geen
 * afbeeldingen, alleen data die de API toch al levert (planet_color_rgb/
 * star_color_rgb/orbit_eccentricity/rotation_state/has_rings). Afgeleid van
 * het concept in frontend-demo/OrbitDemo.jsx, maar met normalisatie i.p.v.
 * hardcoded waarden -- zie het plan-bestand voor de redenering.
 *
 * BELANGRIJK: dit is een SCHEMATISCHE weergave, geen letterlijke schaal.
 * Echte AU-afstanden en planeetstralen lopen te veel uiteen om 1-op-1 te
 * renderen (zie CONTEXT.md/SCHEMA.md-designprincipes). Ontbrekende
 * orbit_eccentricity/orbit_period_days krijgen een fallback puur voor de
 * renderwiskunde -- nooit als gemeten waarde elders getoond.
 */

const ORBIT_BASE = 4
const ORBIT_STEP = 2.4
const DAY_SCALE = 0.06

function rgbToThreeColor(rgb) {
  if (!rgb) return new THREE.Color(0xaaaaaa)
  return new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
}

function planetVisualRadius(radiusEarth) {
  const r = radiusEarth ?? 1.5
  return Math.min(1.6, Math.max(0.28, 0.22 * Math.sqrt(r) + 0.28))
}

function starVisualRadius(starRadiusSolar) {
  const r = starRadiusSolar ?? 1
  return Math.min(4, Math.max(1.5, 0.8 * Math.sqrt(r) + 1.5))
}

export default function SystemOrbitView({ planets, highlightPlanetId }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!planets || planets.length === 0) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03040a)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 16, 24)
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

    const planetObjects = sorted.map((p, index) => {
      const orbitA = ORBIT_BASE + index * ORBIT_STEP
      const ecc = Math.min(0.9, Math.max(0, p.orbit_eccentricity ?? 0))
      scene.add(makeOrbitLine(orbitA, ecc))

      const radius = planetVisualRadius(p.radius_earth)
      const color = rgbToThreeColor(p.planet_color_rgb)
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 })
      )

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

      const periodDays = p.orbit_period_days ?? orbitA * 60
      return { mesh, orbitA, ecc, periodDays, rotationState: p.rotation_state, angle: Math.random() * Math.PI * 2 }
    })

    let frameId
    const clock = new THREE.Clock()

    function animate() {
      const elapsedDays = clock.getElapsedTime() * DAY_SCALE * 100
      starMesh.rotation.y += 0.002

      planetObjects.forEach((p) => {
        const orbitSpeed = (2 * Math.PI) / p.periodDays
        p.angle = elapsedDays * orbitSpeed

        const a = p.orbitA
        const b = a * Math.sqrt(1 - p.ecc * p.ecc)
        const c = Math.sqrt(Math.max(0, a * a - b * b))
        p.mesh.position.set(a * Math.cos(p.angle) - c, 0, b * Math.sin(p.angle))

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
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [planets, highlightPlanetId])

  return <div ref={mountRef} className="w-full h-64 sm:h-80" />
}
