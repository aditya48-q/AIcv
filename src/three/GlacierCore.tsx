import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, MeshTransmissionMaterial, Sparkles, useTexture } from '@react-three/drei';
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

type IceFragmentState = {
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

type GlacierCoreProps = {
  activeSection?: string;
  isActive?: boolean;
};

const PROFILE_IMAGE_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1a-nHQZMmyZdXKypbFqUqXbxRGvmORRRRLQ&s';

const SECTION_MOODS: Record<string, SectionMood> = {
  home: { energy: 1.12, glow: 1.08, ringSpeed: 1.05, particleDensity: 0.86, fog: 1, drift: 0.9, distortion: 1.1, starDensity: 1.05 },
  about: { energy: 0.86, glow: 0.86, ringSpeed: 0.82, particleDensity: 0.58, fog: 0.78, drift: 0.62, distortion: 0.9, starDensity: 0.78 },
  journey: { energy: 0.92, glow: 0.94, ringSpeed: 0.9, particleDensity: 0.66, fog: 0.82, drift: 0.7, distortion: 0.98, starDensity: 0.9 },
  education: { energy: 0.88, glow: 0.9, ringSpeed: 0.86, particleDensity: 0.6, fog: 0.78, drift: 0.64, distortion: 0.92, starDensity: 0.84 },
  skills: { energy: 1, glow: 1, ringSpeed: 0.96, particleDensity: 0.74, fog: 0.88, drift: 0.76, distortion: 1.02, starDensity: 0.96 },
  projects: { energy: 1.08, glow: 1.1, ringSpeed: 1.08, particleDensity: 0.86, fog: 0.98, drift: 0.86, distortion: 1.14, starDensity: 1.08 },
  experience: { energy: 0.94, glow: 0.96, ringSpeed: 0.9, particleDensity: 0.68, fog: 0.84, drift: 0.7, distortion: 1, starDensity: 0.92 },
  achievements: { energy: 0.9, glow: 0.92, ringSpeed: 0.86, particleDensity: 0.64, fog: 0.8, drift: 0.66, distortion: 0.96, starDensity: 0.88 },
  contact: { energy: 0.82, glow: 0.86, ringSpeed: 0.8, particleDensity: 0.56, fog: 0.72, drift: 0.6, distortion: 0.9, starDensity: 0.8 },
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

function buildIceFragments(count: number) {
  return Array.from({ length: count }, (_, index): IceFragmentState => {
    const radius = 2.25 + (index % 6) * 0.22 + pseudoRandom(index * 1.2) * 0.32;
    return {
      angle: (index / count) * Math.PI * 2,
      radius,
      baseRadius: radius,
      speed: 0.18 + (index % 5) * 0.05,
      height: (pseudoRandom(index * 2.3) - 0.5) * 1.1,
      size: 0.11 + pseudoRandom(index * 4.7) * 0.16,
      spin: pseudoRandom(index * 3.1) * 2,
      wobble: 0.4 + pseudoRandom(index * 1.7) * 0.6,
      seed: pseudoRandom(index * 6.1) * Math.PI * 2,
      pull: 0,
    };
  });
}

export function GlacierCore({ activeSection = 'home', isActive = true }: GlacierCoreProps) {
  const mood = getSectionMood(activeSection);
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const profileRef = useRef<THREE.Mesh>(null);
  const coreGlassRef = useRef<THREE.Mesh>(null);
  const coreAuraRef = useRef<THREE.Mesh>(null);
  const coreDistortRef = useRef<THREE.Mesh>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const ringPrimaryRef = useRef<THREE.Mesh>(null);
  const ringSecondaryRef = useRef<THREE.Mesh>(null);
  const shardRef = useRef<THREE.InstancedMesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const frostFieldRef = useRef<THREE.Points>(null);
  const hazeFieldRef = useRef<THREE.Points>(null);
  const sparklePrimaryRef = useRef<THREE.Points>(null);
  const sparkleSecondaryRef = useRef<THREE.Points>(null);
  const iceFragmentRef = useRef<THREE.InstancedMesh>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.SpotLight>(null);
  const blendRef = useRef(isActive ? 1 : 0);
  const targetPointer = useRef(new THREE.Vector2(0, 0));
  const smoothPointer = useRef(new THREE.Vector2(0, 0));
  const hoverStrength = useRef(0);
  const clickStrength = useRef(0);
  const pullStrength = useRef(0);
  const cursorBoost = useRef(0);
  const shockwaveStrength = useRef(0);
  const cameraKick = useRef(0);

  const profileTexture = useTexture(PROFILE_IMAGE_URL);

  const frostField = useMemo(() => buildField(120, 6.6, 4.8, 0.45), []);
  const hazeField = useMemo(() => buildField(72, 4.8, 3.8, 1.6), []);
  const iceFragments = useMemo(() => buildIceFragments(24), []);
  const iceTemp = useMemo(() => new THREE.Object3D(), []);
  const shardTemp = useMemo(() => new THREE.Object3D(), []);

  const shardSeeds = useMemo(() =>
    Array.from({ length: 14 }, (_, index) => ({
      radius: 1.45 + (index % 4) * 0.12,
      angle: (index / 14) * Math.PI * 2,
      height: Math.sin(index * 0.4) * 0.18,
      spin: 0.2 + (index % 3) * 0.08,
      seed: pseudoRandom(index * 2.4) * Math.PI * 2,
      size: 0.12 + pseudoRandom(index * 1.8) * 0.08,
    })),
  []);

  const triggerInteraction = () => {
    if (!isActive) return;
    clickStrength.current = 1;
    pullStrength.current = 1;
    shockwaveStrength.current = 1;
    cursorBoost.current = 1;
    cameraKick.current = 1;
    iceFragments.forEach((fragment) => {
      fragment.pull = 1;
    });
  };

  useEffect(() => {
    profileTexture.colorSpace = THREE.SRGBColorSpace;
    profileTexture.anisotropy = 8;
  }, [profileTexture]);

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
    const glowBoost = mood.glow * (1 + clickStrength.current * 0.9 + pointerStrength * 0.3);

    if (rootRef.current) {
      rootRef.current.visible = blend > 0.02;
      rootRef.current.scale.setScalar(0.9 + blend * 0.1);
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, smoothPointer.current.y * -0.18, 0.08);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, smoothPointer.current.x * 0.22 + elapsed * 0.08, 0.08);
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, smoothPointer.current.x * 0.12, 0.06);
      rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, smoothPointer.current.x * 0.35 * mood.drift, 0.06);
      rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, smoothPointer.current.y * 0.25 * mood.drift, 0.06);
      rootRef.current.position.z = THREE.MathUtils.lerp(rootRef.current.position.z, -0.12 + (1 - blend) * 0.6, 0.06);
    }

    if (coreRef.current) {
      const scale = 1 + clickStrength.current * 0.22 + shockwaveStrength.current * 0.1;
      coreRef.current.scale.setScalar(scale);
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, smoothPointer.current.y * -0.24, 0.08);
      coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, smoothPointer.current.x * 0.28 + elapsed * 0.1, 0.08);
    }

    if (profileRef.current) {
      const material = profileRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.4 + pointerStrength * 0.6 + clickStrength.current * 0.8;
      material.opacity = 0.97;
    }

    if (coreGlassRef.current) {
      const material = coreGlassRef.current.material as THREE.MeshPhysicalMaterial & { opacity?: number; distortion?: number };
      material.opacity = (0.78 + pointerStrength * 0.12 + clickStrength.current * 0.1) * blend;
      if (typeof material.distortion === 'number') {
        material.distortion = 0.55 + pointerStrength * 0.1 + clickStrength.current * 0.18;
      }
    }

    if (coreAuraRef.current) {
      coreAuraRef.current.rotation.y = elapsed * 0.2 + smoothPointer.current.x * 0.2;
      coreAuraRef.current.scale.setScalar(1.02 + pointerStrength * 0.12 + clickStrength.current * 0.2 + shockwaveStrength.current * 0.2);
      const material = coreAuraRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.35 + pointerStrength * 0.2 + clickStrength.current * 0.25) * blend;
      material.emissiveIntensity = 1.2 * glowBoost * blend;
    }

    if (coreDistortRef.current) {
      coreDistortRef.current.rotation.y = elapsed * 0.12 + smoothPointer.current.x * 0.32;
      const material = coreDistortRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.2 + glowBoost * 0.08) * blend;
    }

    if (coreGlowRef.current) {
      coreGlowRef.current.scale.setScalar(1.1 + clickStrength.current * 0.3 + pointerStrength * 0.2);
      const material = coreGlowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.25 + glowBoost * 0.1) * blend;
    }

    if (ringPrimaryRef.current) {
      ringPrimaryRef.current.rotation.x = smoothPointer.current.y * 0.3;
      ringPrimaryRef.current.rotation.y = elapsed * 0.25 * ringSpin + smoothPointer.current.x * 0.12;
      ringPrimaryRef.current.rotation.z = elapsed * 0.08;
      const material = ringPrimaryRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.86 + glowBoost * 0.08) * blend;
      material.emissiveIntensity = 2.1 * glowBoost * blend;
    }

    if (ringSecondaryRef.current) {
      ringSecondaryRef.current.rotation.x = smoothPointer.current.y * 0.24;
      ringSecondaryRef.current.rotation.y = -elapsed * 0.18 * ringSpin;
      const material = ringSecondaryRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = (0.5 + glowBoost * 0.06) * blend;
      material.emissiveIntensity = 1.4 * glowBoost * blend;
    }

    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(1.12 + shockwaveStrength.current * 1.6 + clickStrength.current * 0.6);
      pulseRef.current.rotation.z = elapsed * 0.2;
      const material = pulseRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.4 + shockwaveStrength.current * 0.6) * blend;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, (0.36 + energy * 0.22) * blend, 0.08);
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

    if (frostFieldRef.current) {
      frostFieldRef.current.rotation.y = elapsed * 0.02 + smoothPointer.current.x * 0.08;
      frostFieldRef.current.rotation.x = elapsed * 0.01 + smoothPointer.current.y * 0.04;
      const material = frostFieldRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.55 + mood.starDensity * 0.2) * blend;
    }

    if (hazeFieldRef.current) {
      hazeFieldRef.current.rotation.y = elapsed * 0.03 + smoothPointer.current.x * 0.1;
      hazeFieldRef.current.rotation.x = elapsed * 0.02 + smoothPointer.current.y * 0.06;
      const material = hazeFieldRef.current.material as THREE.PointsMaterial;
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

    if (iceFragmentRef.current) {
      const current = iceFragmentRef.current;
      iceFragments.forEach((fragment, index) => {
        fragment.pull = Math.max(fragment.pull, pullStrength.current * 0.9);
        fragment.pull = THREE.MathUtils.damp(fragment.pull, 0, 0.7, delta);

        const pullBoost = fragment.pull * (0.6 + fragment.size * 2);
        fragment.radius = THREE.MathUtils.lerp(fragment.radius, fragment.baseRadius, 0.02);
        fragment.radius = Math.max(0.55, fragment.radius - pullBoost * delta);
        fragment.angle += delta * fragment.speed * (1 + fragment.pull * 2.2 + clickStrength.current * 0.8);

        if (fragment.radius <= 0.58 && fragment.pull > 0.2) {
          fragment.radius = fragment.baseRadius * (0.9 + pseudoRandom(index * elapsed) * 0.3);
          fragment.pull = 0;
          shockwaveStrength.current = Math.max(shockwaveStrength.current, 0.8);
        }

        const wobble = Math.sin(elapsed * fragment.wobble + fragment.seed) * 0.12;
        const x = Math.cos(fragment.angle) * (fragment.radius + wobble);
        const z = Math.sin(fragment.angle) * (fragment.radius + wobble * 0.6);
        const y = fragment.height + Math.sin(elapsed * 0.6 + fragment.seed) * 0.1;

        iceTemp.position.set(x, y, z);
        iceTemp.rotation.set(elapsed * 0.4 + fragment.spin, elapsed * 0.6 + fragment.spin, elapsed * 0.3 + fragment.spin);
        iceTemp.scale.setScalar(fragment.size * (1 + fragment.pull * 0.4));
        iceTemp.updateMatrix();
        current.setMatrixAt(index, iceTemp.matrix);
      });
      current.instanceMatrix.needsUpdate = true;
    }

    if (shardRef.current) {
      const current = shardRef.current;
      shardSeeds.forEach((seed, index) => {
        const orbit = elapsed * (0.18 + seed.spin) * (1 + pointerStrength * 0.6 + clickStrength.current * 0.8 + shockwaveStrength.current * 0.4) * mood.ringSpeed;
        const radius = seed.radius + clickStrength.current * 0.18 + shockwaveStrength.current * 0.12;
        shardTemp.position.set(
          Math.cos(orbit + seed.angle) * radius,
          Math.sin(orbit * 1.1 + seed.angle) * (0.42 + seed.height * 0.3),
          Math.sin(orbit * 0.8 + seed.seed) * 0.55,
        );
        shardTemp.rotation.set(elapsed * 0.6 + seed.seed, elapsed * 0.8 + seed.seed, elapsed * 0.5 + seed.angle);
        shardTemp.scale.setScalar(seed.size * (0.9 + pointerStrength * 0.2 + clickStrength.current * 0.15));
        shardTemp.updateMatrix();
        current.setMatrixAt(index, shardTemp.matrix);
      });
      current.instanceMatrix.needsUpdate = true;
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
      <ambientLight ref={ambientRef} intensity={0.5} color="#dff7ff" />
      <pointLight ref={keyRef} position={[0, 0, 3.5]} intensity={1.6} color="#38bdf8" distance={12} decay={2} />
      <spotLight ref={rimRef} position={[2, 5, 6]} angle={0.35} penumbra={0.9} intensity={2.8} color="#a855f7" distance={18} decay={1.6} />

      <points ref={frostFieldRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[frostField, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#e0f2fe" transparent opacity={0.7} depthWrite={false} sizeAttenuation />
      </points>

      <points ref={hazeFieldRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hazeField, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} color="#7dd3fc" transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>

      <group ref={coreRef}>
        <mesh ref={coreAuraRef} scale={1.1}>
          <sphereGeometry args={[0.92, 64, 64]} />
          <MeshDistortMaterial
            color="#38bdf8"
            emissive="#22d3ee"
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.6}
            transparent
            opacity={0.38}
            distort={0.4}
            speed={2}
          />
        </mesh>

        <mesh ref={coreGlassRef} scale={1.02}>
          <sphereGeometry args={[0.84, 64, 64]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={1.4}
            roughness={0.05}
            chromaticAberration={0.08}
            anisotropy={0.55}
            distortion={0.55}
            distortionScale={1.15}
            temporalDistortion={0.25}
            clearcoat={1}
            clearcoatRoughness={0.06}
            ior={1.35}
            attenuationColor="#bdf3ff"
            attenuationDistance={1.8}
            samples={6}
            resolution={256}
            transparent
            opacity={0.82}
          />
        </mesh>

        <mesh ref={profileRef} position={[0, 0, -0.04]}>
          <circleGeometry args={[0.64, 64]} />
          <meshStandardMaterial
            map={profileTexture}
            transparent
            opacity={0.97}
            roughness={0.2}
            metalness={0.3}
            emissive="#7dd3fc"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={coreDistortRef} scale={0.98}>
          <sphereGeometry args={[0.78, 48, 48]} />
          <MeshDistortMaterial
            color="#93c5fd"
            transparent
            opacity={0.26}
            distort={0.45}
            speed={1.8}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>

        <mesh ref={coreGlowRef} scale={1.05}>
          <sphereGeometry args={[0.94, 32, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh
          onPointerMove={handlePointerMove}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
        >
          <sphereGeometry args={[1.05, 24, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <mesh ref={ringPrimaryRef} rotation={[Math.PI / 2.1, 0, 0]}>
        <torusGeometry args={[1.32, 0.08, 24, 220]} />
        <meshStandardMaterial color="#38bdf8" emissive="#a5f3fc" emissiveIntensity={2.2} roughness={0.1} metalness={0.9} transparent opacity={0.9} />
      </mesh>

      <mesh ref={ringSecondaryRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[1.52, 0.045, 16, 200]} />
        <meshStandardMaterial color="#a78bfa" emissive="#7dd3fc" emissiveIntensity={1.6} roughness={0.2} metalness={0.7} transparent opacity={0.55} />
      </mesh>

      <mesh ref={pulseRef} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[1.05, 1.32, 180]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <instancedMesh ref={shardRef} args={[undefined, undefined, shardSeeds.length]}>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.7} roughness={0.16} metalness={0.8} transparent opacity={0.78} />
      </instancedMesh>

      <instancedMesh ref={iceFragmentRef} args={[undefined, undefined, iceFragments.length]}>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#f0f9ff" emissive="#7dd3fc" emissiveIntensity={0.7} roughness={0.2} metalness={0.8} transparent opacity={0.85} />
      </instancedMesh>

      <Sparkles ref={sparklePrimaryRef} count={Math.round(30 + mood.particleDensity * 10)} speed={0.16 + mood.energy * 0.05} size={1.05 + mood.glow * 0.1} scale={[6, 6, 6]} color="#f8fbff" opacity={0.7} />
      <Sparkles ref={sparkleSecondaryRef} count={Math.round(14 + mood.particleDensity * 6)} speed={0.12 + mood.energy * 0.04} size={0.7} scale={[4.4, 4.4, 4.4]} color="#7dd3fc" opacity={0.5} />
      {isActive ? <Environment preset="dawn" /> : null}
    </group>
  );
}
