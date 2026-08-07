import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Dezelfde velden die al uit onze scoring.py/build_database.py-pipeline komen.
// Geen enkele afbeelding hier -- alleen de kleine JSON-achtige data die we
// toch al ophalen via de API.
const SYSTEM = {
  star: { color_rgb: [255, 244, 234], radius: 3.2 }, // G2V, zoals de Zon
  planets: [
    { name: "Mercury", color_rgb: [170, 140, 110], radius: 0.32, orbit_au: 6, period_days: 88, ecc: 0.206, rotation_state: "resonant", has_rings: false },
    { name: "Venus", color_rgb: [216, 178, 122], radius: 0.55, orbit_au: 8.5, period_days: 224.7, ecc: 0.007, rotation_state: "free", has_rings: false },
    { name: "Earth", color_rgb: [90, 140, 210], radius: 0.58, orbit_au: 11, period_days: 365.25, ecc: 0.0167, rotation_state: "free", has_rings: false },
    { name: "Mars", color_rgb: [170, 100, 70], radius: 0.42, orbit_au: 14, period_days: 687, ecc: 0.093, rotation_state: "free", has_rings: false },
    { name: "Hot Jupiter (WASP-39 b)", color_rgb: [230, 160, 110], radius: 1.4, orbit_au: 19, period_days: 4.06 * 20, ecc: 0.0, rotation_state: "synchronous", has_rings: true },
  ],
};

const AU_TO_SCENE = 1; // schaal al toegepast in orbit_au hierboven, voor leesbaarheid van de demo
const DAY_SCALE = 0.08; // simulatiesnelheid: hoger = snellere animatie

function rgbToThreeColor([r, g, b]) {
  return new THREE.Color(r / 255, g / 255, b / 255);
}

export default function OrbitDemo() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03040a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 22, 32);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Sterrenveld op de achtergrond -- ook volledig procedureel, geen skybox-afbeelding
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 300;
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4 })));

    // --- Ster ---
    const starColor = rgbToThreeColor(SYSTEM.star.color_rgb);
    const starMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SYSTEM.star.radius, 32, 32),
      new THREE.MeshBasicMaterial({ color: starColor })
    );
    scene.add(starMesh);
    scene.add(new THREE.PointLight(starColor, 3, 200));
    scene.add(new THREE.AmbientLight(0x404040, 0.6));

    // Baanlijnen (ellips, o.b.v. echte eccentriciteit -- geen cirkels)
    function makeOrbitLine(a, ecc) {
      const b = a * Math.sqrt(1 - ecc * ecc);
      const c = Math.sqrt(a * a - b * b); // focuspunt-offset zodat de ster op een brandpunt staat
      const points = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(a * Math.cos(theta) - c, 0, b * Math.sin(theta)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a3550, transparent: true, opacity: 0.6 }));
    }

    // --- Planeten ---
    const planetObjects = SYSTEM.planets.map((p) => {
      scene.add(makeOrbitLine(p.orbit_au, p.ecc));

      const color = rgbToThreeColor(p.color_rgb);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius, 24, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 })
      );

      // Atmosfeer-gloed: gewoon een iets grotere, doorzichtige sphere --
      // geen textuur nodig, puur procedureel
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius * 1.18, 24, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.BackSide })
      );
      mesh.add(glow);

      if (p.has_rings) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.2, 48),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = Math.PI / 2.5;
        mesh.add(ring);
      }

      scene.add(mesh);
      return { ...p, mesh, angle: Math.random() * Math.PI * 2 };
    });

    let frameId;
    const clock = new THREE.Clock();

    function animate() {
      const elapsedDays = clock.getElapsedTime() * DAY_SCALE * 100;

      starMesh.rotation.y += 0.002;

      planetObjects.forEach((p) => {
        // Baanbeweging -- snelheid direct afgeleid van period_days, zoals de echte fysica
        const orbitSpeed = (2 * Math.PI) / p.period_days;
        p.angle = elapsedDays * orbitSpeed;

        const a = p.orbit_au, ecc = p.ecc;
        const b = a * Math.sqrt(1 - ecc * ecc);
        const c = Math.sqrt(a * a - b * b);
        p.mesh.position.set(a * Math.cos(p.angle) - c, 0, b * Math.sin(p.angle));

        // Eigen rotatie -- afhankelijk van rotation_state uit ons schema
        if (p.rotation_state === "free") p.mesh.rotation.y += 0.03;
        else if (p.rotation_state === "resonant") p.mesh.rotation.y += 0.01;
        // "synchronous": geen rotatie t.o.v. de ster (getijde-vergrendeld)
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800">
        <h1 className="text-slate-100 text-lg font-medium tracking-tight">
          Exo Index -- procedurele animatie, nul afbeeldingen
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Elke planeet is een gekleurde sphere o.b.v. <code className="text-slate-400">planet_color_rgb</code>,
          bewegend op basis van <code className="text-slate-400">orbit_semi_major_axis_au</code>,{" "}
          <code className="text-slate-400">orbit_eccentricity</code> en{" "}
          <code className="text-slate-400">rotation_state</code> -- geen enkel databestand gedownload.
        </p>
      </div>
      <div ref={mountRef} className="flex-1 min-h-0" />
    </div>
  );
}
