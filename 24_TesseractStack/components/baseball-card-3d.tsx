"use client"

import { useRef, useState } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import { Html, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import type { CardTheme, PlayerProfile, UniformEra } from "@/lib/player-data"
import { BackFace, FrontFace } from "@/components/card-faces"

const CARD_W = 2.6
const CARD_H = 3.64
const CARD_D = 0.08
// drei <Html transform> bakes in a 1/40 factor, so 260px * 0.4 * (1/40) = 2.6 units
const HTML_SCALE = 0.4
const TWO_PI = Math.PI * 2

type Props = {
  player: PlayerProfile
  theme: CardTheme
  era: UniformEra
  leverageActive: boolean
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function BaseballCard3D({ player, theme, era, leverageActive }: Props) {
  const group = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Mesh>(null)
  const [flipped, setFlipped] = useState(false)
  const [showBack, setShowBack] = useState(false)

  const retro = theme === "retro-16-bit"
  const premium = theme === "sim-premium"

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const { x: px, y: py } = state.pointer // normalized -1..1 over the canvas

    // Target rotation: flip on Y plus a subtle holographic tilt from the pointer.
    const baseY = flipped ? Math.PI : 0
    const targetY = baseY + px * 0.45
    const targetX = -py * 0.32

    g.rotation.y = lerp(g.rotation.y, targetY, 0.1)
    g.rotation.x = lerp(g.rotation.x, targetX, 0.1)
    g.rotation.z = lerp(g.rotation.z, px * 0.05, 0.1)

    // Gentle floating motion.
    g.position.y = Math.sin(t * 1.2) * 0.06

    // Swap visible face once we pass the 90-degree mark of the flip.
    const norm = ((g.rotation.y % TWO_PI) + TWO_PI) % TWO_PI
    const back = norm > Math.PI / 2 && norm < (3 * Math.PI) / 2
    if (back !== showBack) setShowBack(back)

    // Pulse the leverage glow.
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshBasicMaterial
      mat.opacity = leverageActive ? 0.35 + Math.sin(t * 6) * 0.2 : 0
      const s = 1 + (leverageActive ? Math.sin(t * 6) * 0.01 : 0)
      glow.current.scale.set(s, s, 1)
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setFlipped((f) => !f)
  }

  return (
    <group
      ref={group}
      onClick={handleClick}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* Neon leverage glow halo (behind + around the card) */}
      <mesh ref={glow} position={[0, 0, -CARD_D / 2 - 0.01]}>
        <planeGeometry args={[CARD_W + 0.22, CARD_H + 0.22]} />
        <meshBasicMaterial color={era.accent} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Card body — geometry + material morph by theme */}
      {retro ? (
        <mesh castShadow>
          <boxGeometry args={[CARD_W, CARD_H, CARD_D]} />
          <meshStandardMaterial color="#1a1c4b" roughness={1} metalness={0} flatShading />
        </mesh>
      ) : (
        <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={0.12} smoothness={6} castShadow>
          {premium ? (
            <meshPhysicalMaterial
              color="#eaf6ff"
              transmission={0.9}
              thickness={0.6}
              roughness={0.06}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.05}
              ior={1.4}
              transparent
              opacity={0.85}
            />
          ) : (
            <meshStandardMaterial color={era.cardBg} roughness={0.45} metalness={0.25} />
          )}
        </RoundedBox>
      )}

      {/* Edge accent when leverage is active */}
      {leverageActive && (
        <lineSegments position={[0, 0, CARD_D / 2 + 0.001]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(CARD_W, CARD_H)]} />
          <lineBasicMaterial color={era.accent} toneMapped={false} />
        </lineSegments>
      )}

      {/* Visible face (HTML projected onto the card surface) */}
      {!showBack ? (
        <Html
          transform
          scale={HTML_SCALE}
          position={[0, 0, CARD_D / 2 + 0.012]}
          pointerEvents="none"
          zIndexRange={[10, 0]}
        >
          <FrontFace player={player} theme={theme} era={era} />
        </Html>
      ) : (
        <Html
          transform
          scale={HTML_SCALE}
          position={[0, 0, -CARD_D / 2 - 0.012]}
          rotation={[0, Math.PI, 0]}
          pointerEvents="none"
          zIndexRange={[10, 0]}
        >
          <BackFace player={player} theme={theme} era={era} />
        </Html>
      )}
    </group>
  )
}
