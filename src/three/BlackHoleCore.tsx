import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type SectionMood = {
  energy: number;
  glow: number;
  ringSpeed: number;
  particleDensity: number;
  fog: number;
  drift: number;
  distortion: number;
  starDensity: number;
};

type AsteroidState = {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  height: number;
  size: number;
  spin: number;
  wobble: number;
  seed: number;
  pull: number;
};

type BlackHoleCoreProps = {
  activeSection?: string;
  isActive?: boolean;
};

const SECTION_MOODS: Record<string, SectionMood> = {
  home: { energy: 1.12, glow: 1.18, ringSpeed: 1.1, particleDensity: 0.9, fog: 1, drift: 0.9, distortion: 1.18, starDensity: 1.08 },
  about: { energy: 0.86, glow: 0.9, ringSpeed: 0.82, particleDensity: 0.6, fog: 0.75, drift: 0.6, distortion: 0.9, starDensity: 0.78 },
  journey: { energy: 0.92, glow: 1, ringSpeed: 0.9, particleDensity: 0.68, fog: 0.82, drift: 0.7, distortion: 0.98, starDensity: 0.9 },
  education: { energy: 0.88, glow: 0.94, ringSpeed: 0.86, particleDensity: 0.62, fog: 0.78, drift: 0.64, distortion: 0.92, starDensity: 0.84 },
  skills: { energy: 1, glow: 1.05, ringSpeed: 0.96, particleDensity: 0.76, fog: 0.88, drift: 0.76, distortion: 1.02, starDensity: 0.96 },
  projects: { energy: 1.08, glow: 1.16, ringSpeed: 1.12, particleDensity: 0.9, fog: 0.98, drift: 0.86, distortion: 1.2, starDensity: 1.1 },
  experience: { energy: 0.94, glow: 1, ringSpeed: 0.9, particleDensity: 0.7, fog: 0.84, drift: 0.7, distortion: 1, starDensity: 0.92 },
  achievements: { energy: 0.9, glow: 0.96, ringSpeed: 0.86, particleDensity: 0.66, fog: 0.8, drift: 0.66, distortion: 0.96, starDensity: 0.88 },
  contact: { energy: 0.82, glow: 0.88, ringSpeed: 0.8, particleDensity: 0.56, fog: 0.72, drift: 0.6, distortion: 0.88, starDensity: 0.8 },
};

function getSectionMood(section: string) {
  return SECTION_MOODS[section] ?? SECTION_MOODS.home;
}

function pseudoRandom(value: number) {
  const raw = Math.sin(value) * 43758.5453123;
  return raw - Math.floor(raw);
}

function buildField(count: number, radius: number, depth: number, seed: number) {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = pseudoRandom(index * 1.73 + seed) * Math.PI * 2;
    const distance = radius * (0.32 + pseudoRandom(index * 2.47 + seed * 2.11) * 0.68);
    const lift = (pseudoRandom(index * 4.37 + seed * 1.33) - 0.5) * depth;
    const drift = (pseudoRandom(index * 5.41 + seed * 2.07) - 0.5) * depth * 0.5;

    positions[index * 3] = Math.cos(angle) * distance;
    positions[index * 3 + 1] = lift;
    positions[index * 3 + 2] = Math.sin(angle) * distance + drift;
  }

  return positions;
}

function buildAsteroids(count: number) {
  return Array.from({ length: count }, (_, index): AsteroidState => {
    const radius = 2.3 + (index % 6) * 0.24 + pseudoRandom(index * 1.2) * 0.35;
    return {
      angle: (index / count) * Math.PI * 2,
      radius,
      baseRadius: radius,
      speed: 0.18 + (index % 5) * 0.05,
      height: (pseudoRandom(index * 2.3) - 0.5) * 1.2,
      size: 0.12 + pseudoRandom(index * 4.7) * 0.18,
      spin: pseudoRandom(index * 3.1) * 2,
      wobble: 0.4 + pseudoRandom(index * 1.7) * 0.6,
      seed: pseudoRandom(index * 6.1) * Math.PI * 2,
      pull: 0,
    };
  });
}

export function BlackHoleCore({ activeSection = 'home', isActive = false }: BlackHoleCoreProps) {
  const mood = getSectionMood(activeSection);
  const rootRef = useRef<THREE.Group>(null);
  const singularityRef = useRef<THREE.Mesh>(null);
  const horizonRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.Mesh>(null);
  const distortionRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.SpotLight>(null);
  const starFieldRef = useRef<THREE.Points>(null);
  const dustFieldRef = useRef<THREE.Points>(null);
  const sparklePrimaryRef = useRef<THREE.Points>(null);
  const sparkleSecondaryRef = useRef<THREE.Points>(null);
  const asteroidRef = useRef<THREE.InstancedMesh>(null);
  const blendRef = useRef(isActive ? 1 : 0);
  const targetPointer = useRef(new THREE.Vector2(0, 0));
  const smoothPointer = useRef(new THREE.Vector2(0, 0));
  const hoverStrength = useRef(0);
  const clickStrength = useRef(0);
  const pullStrength = useRef(0);
  const cursorBoost = useRef(0);
  const shockwaveStrength = useRef(0);
  const cameraKick = useRef(0);

  const asteroidStates = useMemo(() => buildAsteroids(26), []);
  const asteroidTemp = useMemo(() => new THREE.Object3D(), []);

  const starField = useMemo(() => buildField(140, 8.2, 6.4, 0.4), []);
  const dustField = useMemo(() => buildField(80, 5.2, 4.4, 1.7), []);

  const triggerInteraction = () => {
    if (!isActive) return;
    clickStrength.current = 1;
    pullStrength.current = 1;
    shockwaveStrength.current = 1;
    cursorBoost.current = 1;
    cameraKick.current = 1;
    asteroidStates.forEach((asteroid) => {
      asteroid.pull = 1;
    });
  };

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      targetPointer.current.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
      cursorBoost.current = 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event);
      if (event.button !== 0) return;
      triggerInteraction();
    };

    const handleBlur = () => {
      cursorBoost.current = 0;
      hoverStrength.current = 0;
    };

    window.addEventListener('pointermove', updatePointer);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive]);

  useFrame((state, delta) => {
    blendRef.current = THREE.MathUtils.damp(blendRef.current, isActive ? 1 : 0, 2.4, delta);
    const blend = blendRef.current;

    if (rootRef.current) {
      rootRef.current.visible = blend > 0.02;
      rootRef.current.scale.setScalar(0.9 + blend * 0.1);
      rootRef.current.position.z = THREE.MathUtils.lerp(rootRef.current.position.z, -0.1 + (1 - blend) * 0.6, 0.06);
    }

    const pointerStrength = THREE.MathUtils.clamp(hoverStrength.current + cursorBoost.current * 0.4, 0, 1) * blend;
    smoothPointer.current.lerp(targetPointer.current, 0.06 + pointerStrength * 0.06);

    hoverStrength.current = THREE.MathUtils.damp(hoverStrength.current, 0, 2.1, delta);
    clickStrength.current = THREE.MathUtils.damp(clickStrength.current, 0, 1.2, delta);
    pullStrength.current = THREE.MathUtils.damp(pullStrength.current, 0, 0.9, delta);
    cursorBoost.current = THREE.MathUtils.damp(cursorBoost.current, 0, 1.4, delta);
    shockwaveStrength.current = THREE.MathUtils.damp(shockwaveStrength.current, 0, 1.1, delta);
    cameraKick.current = THREE.MathUtils.damp(cameraKick.current, 0, 1.3, delta);

    const elapsed = state.clock.elapsedTime;
    const energy = mood.energy;
    const ringSpin = mood.ringSpeed * (1 + clickStrength.current * 1.4 + shockwaveStrength.current * 0.8);
    const glowBoost = mood.glow * (1 + clickStrength.current * 0.9);

    if (rootRef.current) {
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, smoothPointer.current.y * -0.18, 0.08);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, smoothPointer.current.x * 0.22 + elapsed * 0.08, 0.08);
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, smoothPointer.current.x * 0.12, 0.06);
      rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, smoothPointer.current.x * 0.35 * mood.drift, 0.06);
      rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, smoothPointer.current.y * 0.25 * mood.drift, 0.06);
    }

    if (singularityRef.current) {
      const scale = 1 + clickStrength.current * 0.22 + shockwaveStrength.current * 0.1;
      singularityRef.current.scale.setScalar(scale);
    }

    if (horizonRef.current) {
      const scale = 1.12 + glowBoost * 0.06 + clickStrength.current * 0.16;
      horizonRef.current.scale.setScalar(scale);
      horizonRef.current.rotation.y = elapsed * 0.12 + smoothPointer.current.x * 0.2;
      const material = horizonRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.75 * blend;
      material.emissiveIntensity = 1.6 * glowBoost * blend;
    }

    if (distortionRef.current) {
      distortionRef.current.rotation.y = elapsed * 0.08 + smoothPointer.current.x * 0.3;
      distortionRef.current.scale.setScalar(1.48 + mood.distortion * 0.08 + shockwaveStrength.current * 0.18);
      const material = distortionRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.35 + glowBoost * 0.08) * blend;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = smoothPointer.current.y * 0.3;
      ringRef.current.rotation.y = elapsed * 0.25 * ringSpin + smoothPointer.current.x * 0.12;
      ringRef.current.rotation.z = elapsed * 0.08;
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.85 + glowBoost * 0.08) * blend;
      material.emissiveIntensity = 2.2 * glowBoost * blend;
    }

    if (plasmaRef.current) {
      plasmaRef.current.rotation.x = smoothPointer.current.y * 0.25 + Math.sin(elapsed * 0.2) * 0.1;
      plasmaRef.current.rotation.y = -elapsed * 0.42 * ringSpin + smoothPointer.current.x * 0.18;
      plasmaRef.current.rotation.z = elapsed * 0.12;
      plasmaRef.current.scale.setScalar(1 + clickStrength.current * 0.2);
      const material = plasmaRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.7 + glowBoost * 0.12) * blend;
      material.emissiveIntensity = 2.8 * glowBoost * blend;
    }

    if (shockwaveRef.current) {
      shockwaveRef.current.scale.setScalar(1.2 + shockwaveStrength.current * 1.6 + clickStrength.current * 0.6);
      shockwaveRef.current.rotation.z = elapsed * 0.2;
      const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.4 + shockwaveStrength.current * 0.6) * blend;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, (0.32 + energy * 0.22) * blend, 0.08);
    }

    if (keyRef.current) {
      keyRef.current.position.x = THREE.MathUtils.lerp(keyRef.current.position.x, smoothPointer.current.x * 2.4, 0.08);
      keyRef.current.position.y = THREE.MathUtils.lerp(keyRef.current.position.y, smoothPointer.current.y * 1.8 + 0.4, 0.08);
      keyRef.current.intensity = THREE.MathUtils.lerp(keyRef.current.intensity, (1.4 + energy * 0.4) * blend, 0.08);
    }

    if (rimRef.current) {
      rimRef.current.position.x = THREE.MathUtils.lerp(rimRef.current.position.x, smoothPointer.current.x * 3.2, 0.08);
      rimRef.current.position.y = THREE.MathUtils.lerp(rimRef.current.position.y, smoothPointer.current.y * 2.4 + 0.8, 0.08);
      rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, (2.6 + energy * 0.9) * blend, 0.08);
    }

    if (starFieldRef.current) {
      starFieldRef.current.rotation.y = elapsed * 0.02 + smoothPointer.current.x * 0.08;
      starFieldRef.current.rotation.x = elapsed * 0.01 + smoothPointer.current.y * 0.04;
      const material = starFieldRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.55 + mood.starDensity * 0.2) * blend;
    }

    if (dustFieldRef.current) {
      dustFieldRef.current.rotation.y = elapsed * 0.03 + smoothPointer.current.x * 0.1;
      dustFieldRef.current.rotation.x = elapsed * 0.02 + smoothPointer.current.y * 0.06;
      const material = dustFieldRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.38 + mood.particleDensity * 0.2) * blend;
    }

    if (sparklePrimaryRef.current) {
      const material = sparklePrimaryRef.current.material as THREE.Material & { opacity?: number };
      material.opacity = (0.65 + mood.particleDensity * 0.15) * blend;
    }

    if (sparkleSecondaryRef.current) {
      const material = sparkleSecondaryRef.current.material as THREE.Material & { opacity?: number };
      material.opacity = (0.5 + mood.particleDensity * 0.12) * blend;
    }

    if (asteroidRef.current) {
      asteroidStates.forEach((asteroid, index) => {
        asteroid.pull = Math.max(asteroid.pull, pullStrength.current * 0.9);
        asteroid.pull = THREE.MathUtils.damp(asteroid.pull, 0, 0.7, delta);

        const pullBoost = asteroid.pull * (0.6 + asteroid.size * 2);
        asteroid.radius = THREE.MathUtils.lerp(asteroid.radius, asteroid.baseRadius, 0.02);
        asteroid.radius = Math.max(0.55, asteroid.radius - pullBoost * delta);
        asteroid.angle += delta * asteroid.speed * (1 + asteroid.pull * 2.2 + clickStrength.current * 0.8);

        if (asteroid.radius <= 0.58 && asteroid.pull > 0.2) {
          asteroid.radius = asteroid.baseRadius * (0.9 + pseudoRandom(index * elapsed) * 0.3);
          asteroid.pull = 0;
          shockwaveStrength.current = Math.max(shockwaveStrength.current, 0.8);
        }

        const wobble = Math.sin(elapsed * asteroid.wobble + asteroid.seed) * 0.12;
        const x = Math.cos(asteroid.angle) * (asteroid.radius + wobble);
        const z = Math.sin(asteroid.angle) * (asteroid.radius + wobble * 0.6);
        const y = asteroid.height + Math.sin(elapsed * 0.6 + asteroid.seed) * 0.1;

        asteroidTemp.position.set(x, y, z);
        asteroidTemp.rotation.set(elapsed * 0.4 + asteroid.spin, elapsed * 0.6 + asteroid.spin, elapsed * 0.3 + asteroid.spin);
        asteroidTemp.scale.setScalar(asteroid.size * (1 + asteroid.pull * 0.4));
        asteroidTemp.updateMatrix();
        asteroidRef.current.setMatrixAt(index, asteroidTemp.matrix);
      });
      asteroidRef.current.instanceMatrix.needsUpdate = true;
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, smoothPointer.current.x * 0.2 + cameraKick.current * 0.03, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, smoothPointer.current.y * 0.14 + cameraKick.current * 0.02, 0.04);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 5.15 - clickStrength.current * 0.5 - shockwaveStrength.current * 0.2, 0.04);
    state.camera.lookAt(0, 0, 0);
  });

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isActive) return;
    hoverStrength.current = 1;
    const { x, y } = event.point;
    targetPointer.current.set(THREE.MathUtils.clamp(x / 1.8, -1, 1), THREE.MathUtils.clamp(y / 1.8, -1, 1));
    cursorBoost.current = 1;
  };

  const handlePointerOver = () => {
    if (!isActive) return;
    hoverStrength.current = 1;
  };

  const handlePointerOut = () => {
    if (!isActive) return;
    hoverStrength.current = 0;
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isActive) return;
    event.stopPropagation();
    triggerInteraction();
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isActive) return;
    event.stopPropagation();
    triggerInteraction();
  };

  return (
    <group ref={rootRef}>
      <ambientLight ref={ambientRef} intensity={0.5} color="#221134" />
      <pointLight ref={keyRef} position={[0, 0, 3.5]} intensity={1.6} color="#6d28d9" distance={12} decay={2} />
      <spotLight ref={rimRef} position={[2, 5, 6]} angle={0.35} penumbra={0.9} intensity={2.8} color="#22d3ee" distance={18} decay={1.6} />

      <points ref={starFieldRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starField, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#e9d5ff" transparent opacity={0.7} depthWrite={false} sizeAttenuation />
      </points>

      <points ref={dustFieldRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustField, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#67e8f9" transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>

      <mesh ref={distortionRef} scale={1.5}>
        <sphereGeometry args={[1.12, 64, 64]} />
        <MeshDistortMaterial color="#3b105a" transparent opacity={0.35} distort={0.35} speed={2} roughness={0.3} metalness={0.8} />
      </mesh>

      <mesh
        ref={horizonRef}
        onPointerMove={handlePointerMove}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.96, 64, 64]} />
        <meshStandardMaterial color="#07030e" emissive="#5b21b6" emissiveIntensity={1.4} transparent opacity={0.75} roughness={0.2} metalness={0.6} />
      </mesh>

      <mesh ref={singularityRef}>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshBasicMaterial color="#020103" />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.08, 24, 220]} />
        <meshStandardMaterial color="#5b21b6" emissive="#22d3ee" emissiveIntensity={2.4} roughness={0.1} metalness={0.9} transparent opacity={0.9} />
      </mesh>

      <mesh ref={plasmaRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.48, 0.045, 16, 200]} />
        <meshStandardMaterial color="#22d3ee" emissive="#a855f7" emissiveIntensity={2.8} roughness={0.2} metalness={0.8} transparent opacity={0.7} />
      </mesh>

      <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.02, 10, 140]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.4} />
      </mesh>

      <instancedMesh ref={asteroidRef} args={[undefined, undefined, asteroidStates.length]}>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#0f172a" emissive="#3b0764" emissiveIntensity={0.6} roughness={0.4} metalness={0.6} />
      </instancedMesh>

      <Sparkles ref={sparklePrimaryRef} count={36} speed={0.25} size={1.2} scale={[5.2, 5.2, 5.2]} color="#e9d5ff" opacity={0.7} />
      <Sparkles ref={sparkleSecondaryRef} count={22} speed={0.18} size={0.9} scale={[4.2, 4.2, 4.2]} color="#67e8f9" opacity={0.55} />

      {isActive ? <Environment preset="night" /> : null}
    </group>
  );
}
