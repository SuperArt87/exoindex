import { useEffect, useRef } from "react"
import * as THREE from "three"
import { pickPlanetVariant, buildSurfaceCanvas, buildCloudCanvas } from "../utils/planetVisuals"

/**
 * Close-up geanimeerd "portret" van ÉÉN planeet -- getoond zodra je een
 * planeetkaart vanuit de catalogus opent. Anders dan SystemOrbitView (dat
 * blijft de bredere stelsel-context met alle planeten als kleine categorisch
 * gekleurde bolletjes) draait dit om individualiteit: 5 procedureel
 * verschillende animatiestijlen per planet_type (zie planetVisuals.js),
 * gekozen op basis van planet_name zodat dezelfde planeet altijd hetzelfde
 * portret toont.
 *
 * AS-ROTATIE: alleen de vaste-lichaam-rotatie (het bolobject) wordt
 * uitgezet bij rotation_state === "synchronous" (tidally locked) of
 * onbekend (null) -- exact dezelfde regel als SystemOrbitView.jsx. Een
 * eventuele wolkenlaag/stormvlek blijft WEL animeren ongeacht tidal lock:
 * atmosferische circulatie is fysiek iets anders dan de rotatie van het
 * vaste lichaam zelf.
 */
export default function PlanetSphere({ planet }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!planet) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03040a)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 3.4)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const starGeo = new THREE.BufferGeometry()
    const starCount = 220
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 60
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 })))

    const rgb = planet.planet_color_rgb || [140, 140, 150]
    const { recipe, rng } = pickPlanetVariant(planet)
    const { canvas: surfaceCanvas, spot } = buildSurfaceCanvas(recipe, rng, rgb)
    const surfaceTexture = new THREE.CanvasTexture(surfaceCanvas)
    surfaceTexture.colorSpace = THREE.SRGBColorSpace

    // axisGroup krijgt de as-rotatie (uitgezet bij tidal lock) -- alles wat
    // WEL onvoorwaardelijk moet blijven bewegen (wolken, stormvlek-puls)
    // zit hier zelf weer NIET (direct) aan vast, zie hieronder.
    const axisGroup = new THREE.Group()
    scene.add(axisGroup)

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshStandardMaterial({ map: surfaceTexture, roughness: 0.85, metalness: 0.05 })
    )
    axisGroup.add(sphere)

    // Stormvlek: aparte, licht verhoogde mesh op het boloppervlak i.p.v. in
    // de textuur gebakken -- zo kan hij onafhankelijk pulseren (schaal +
    // helderheid) zonder dat de canvas-textuur elk frame herschilderd moet
    // worden. Hangt aan axisGroup, dus draait WEL mee met de as-rotatie
    // (een stormvlek zit vast op de planeet, alleen de puls is animatie).
    let spotMesh = null
    if (spot) {
      const lat = (spot.latDeg * Math.PI) / 180
      const lon = (spot.lonDeg * Math.PI) / 180
      const r = 1.01
      const pos = new THREE.Vector3(
        r * Math.cos(lat) * Math.cos(lon),
        r * Math.sin(lat),
        r * Math.cos(lat) * Math.sin(lon)
      )
      spotMesh = new THREE.Mesh(
        new THREE.CircleGeometry(spot.size, 24),
        new THREE.MeshBasicMaterial({ color: spot.color, transparent: true, opacity: 0.7, depthWrite: false })
      )
      spotMesh.position.copy(pos)
      spotMesh.lookAt(pos.clone().multiplyScalar(2))
      axisGroup.add(spotMesh)
    }

    // Wolkenlaag: iets grotere, transparante bol met eigen rotatiesnelheid --
    // BEWUST NIET in axisGroup, dus blijft draaien ook als de planeet zelf
    // tidally locked is (atmosferische drift != rotatie van het vaste lichaam).
    let cloudMesh = null
    if (recipe.cloudLayer) {
      const cloudCanvas = buildCloudCanvas(rng, { bandCount: recipe.cloudBandCount, alpha: recipe.cloudAlpha })
      const cloudTexture = new THREE.CanvasTexture(cloudCanvas)
      cloudTexture.colorSpace = THREE.SRGBColorSpace
      cloudTexture.wrapS = THREE.RepeatWrapping
      cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.02, 48, 48),
        new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, depthWrite: false })
      )
      scene.add(cloudMesh)
    }

    if (planet.has_rings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.35, 1.9, 64),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace),
          side: THREE.DoubleSide, transparent: true, opacity: 0.5,
        })
      )
      ring.rotation.x = Math.PI / 2.4
      scene.add(ring)
    }

    scene.add(new THREE.PointLight(0xffffff, 4, 30).translateOnAxis(new THREE.Vector3(1, 0.6, 1).normalize(), 6))
    scene.add(new THREE.AmbientLight(0x404040, 0.7))

    let frameId
    const clock = new THREE.Clock()
    const rotationState = planet.rotation_state

    function animate() {
      const t = clock.getElapsedTime()

      // As-rotatie -- alleen als de planeet ECHT om zijn as draait. Zelfde
      // snelheden/regel als SystemOrbitView.jsx voor consistentie.
      if (rotationState === "free") axisGroup.rotation.y += 0.006
      else if (rotationState === "resonant") axisGroup.rotation.y += 0.002
      // "synchronous" (tidally locked) of onbekend: geen as-rotatie.

      if (cloudMesh) cloudMesh.rotation.y += 0.0015 * (recipe.cloudSpeed ?? 0.25) * 10
      if (spotMesh && recipe.spotPulse) {
        const pulse = 1 + Math.sin(t * 1.4) * 0.12
        spotMesh.scale.setScalar(pulse)
        spotMesh.material.opacity = 0.55 + Math.sin(t * 1.4) * 0.15
      }

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
      surfaceTexture.dispose()
      sphere.geometry.dispose()
      sphere.material.dispose()
      if (cloudMesh) { cloudMesh.geometry.dispose(); cloudMesh.material.map?.dispose(); cloudMesh.material.dispose() }
      if (spotMesh) { spotMesh.geometry.dispose(); spotMesh.material.dispose() }
      renderer.dispose()
    }
  }, [planet])

  return <div ref={mountRef} className="w-full h-64 sm:h-80" />
}
