"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import { Html, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import type { CardTheme, PlayerProfile, UniformEra } from "@/lib/player-data"
import { BackFace, FrontFace } from "@/components/card-faces"

const CARD_W = 2.6
const CARD_H = 3.64
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

// Procedurally generate normal maps for fabric texture simulation
function createFabricNormalMap(fabricType: string) {
  if (typeof window === "undefined") return null
  
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  
  // Normal map neutral base: RGB (128, 128, 255)
  ctx.fillStyle = "#8080ff"
  ctx.fillRect(0, 0, size, size)
  
  const imgData = ctx.getImageData(0, 0, size, size)
  const data = imgData.data
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      
      let nx = 128
      let ny = 128
      let nz = 255
      
      if (fabricType === "wool") {
        // Coarse, fuzzy cross-hatch pattern
        const horiz = Math.sin(y * 1.2) * 20
        const vert = Math.sin(x * 1.2) * 20
        const noise = (Math.random() - 0.5) * 15
        nx += horiz + noise
        ny += vert + noise
      } else if (fabricType === "flannel") {
        // Slightly tighter flannel cross-hatch
        const horiz = Math.sin(y * 1.8) * 15
        const vert = Math.sin(x * 1.8) * 15
        const noise = (Math.random() - 0.5) * 10
        nx += horiz + noise
        ny += vert + noise
      } else if (fabricType === "double-knit") {
        // Diagonal ribbing representing high-sheen 70s polyester
        const rib = Math.sin((x + y) * 1.6) * 22
        const noise = (Math.random() - 0.5) * 6
        nx += rib + noise
        ny += rib + noise
      } else if (fabricType === "performance") {
        // Modern micro-mesh grid / breathing pores
        const dotX = Math.sin(x * 2.8) > 0.75 ? 18 : -18
        const dotY = Math.sin(y * 2.8) > 0.75 ? 18 : -18
        nx += dotX
        ny += dotY
      }
      
      data[idx] = Math.max(0, Math.min(255, nx))
      data[idx + 1] = Math.max(0, Math.min(255, ny))
      data[idx + 2] = Math.max(0, Math.min(255, nz))
    }
  }
  
  ctx.putImageData(imgData, 0, 0)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 5)
  return texture
}

function createJerseyTexture(eraId: string, isBarf: boolean) {
  if (typeof window === "undefined") return null
  if (eraId !== "1979" || !isBarf) return null

  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  // Gold background
  ctx.fillStyle = "#ffb300"
  ctx.fillRect(0, 0, size, size)

  // Black stripes (horizontal)
  ctx.fillStyle = "#111111"
  const stripeHeight = size / 8
  for (let i = 1; i < 8; i += 2) {
    ctx.fillRect(0, i * stripeHeight, size, stripeHeight)
  }

  // Draw white borders/trim details on the stripes
  ctx.fillStyle = "#ffffff"
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(0, i * stripeHeight, size, 2)
  }

  // Add subtle fabric weave noise
  for (let y = 0; y < size; y += 2) {
    ctx.fillStyle = "rgba(0,0,0,0.06)"
    ctx.fillRect(0, y, size, 1)
  }
  for (let x = 0; x < size; x += 2) {
    ctx.fillStyle = "rgba(255,255,255,0.05)"
    ctx.fillRect(x, 0, 1, size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  return texture
}

export function TesseractCardCanvas({ player, theme, era, leverageActive }: Props) {
  const group = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Mesh>(null)
  const [flipped, setFlipped] = useState(false)
  const [showBack, setShowBack] = useState(false)

  const retro = theme === "retro-16-bit"
  const premium = theme === "sim-premium"

  // 1. Era-based Geometry Morphing
  const { depth, radius } = useMemo(() => {
    switch (era.fabric) {
      case "wool":
        return { depth: 0.12, radius: 0.06 } // Deadball thick card
      case "flannel":
        return { depth: 0.10, radius: 0.09 }
      case "double-knit":
        return { depth: 0.08, radius: 0.12 }
      case "performance":
      default:
        return { depth: 0.06, radius: 0.15 } // Modern ultra-thin, highly rounded
    }
  }, [era.fabric])

  // 2. Era-based Fabric Normal Map Texture
  const normalMap = useMemo(() => {
    return createFabricNormalMap(era.fabric)
  }, [era.fabric])

  const jerseyTexture = useMemo(() => {
    return createJerseyTexture(era.id, player.name.toLowerCase().includes("barf"))
  }, [era.id, player.name])

  // 3. Era-based Material Sheen / Roughness Morphing
  const materialProps = useMemo(() => {
    switch (era.fabric) {
      case "wool":
        return { roughness: 0.95, metalness: 0.02 }
      case "flannel":
        return { roughness: 0.85, metalness: 0.05 }
      case "double-knit":
        return { roughness: 0.40, metalness: 0.22 } // Higher sheen polyester
      case "performance":
      default:
        return { roughness: 0.65, metalness: 0.10 }
    }
  }, [era.fabric])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const { x: px, y: py } = state.pointer

    const baseY = flipped ? Math.PI : 0
    const targetY = baseY + px * 0.45
    const targetX = -py * 0.32

    g.rotation.y = lerp(g.rotation.y, targetY, 0.1)
    g.rotation.x = lerp(g.rotation.x, targetX, 0.1)
    g.rotation.z = lerp(g.rotation.z, px * 0.05, 0.1)

    g.position.y = Math.sin(t * 1.2) * 0.06

    const norm = ((g.rotation.y % TWO_PI) + TWO_PI) % TWO_PI
    const back = norm > Math.PI / 2 && norm < (3 * Math.PI) / 2
    if (back !== showBack) setShowBack(back)

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
      {/* Neon leverage glow halo */}
      <mesh ref={glow} position={[0, 0, -depth / 2 - 0.01]}>
        <planeGeometry args={[CARD_W + 0.22, CARD_H + 0.22]} />
        <meshBasicMaterial color={era.accent} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Card body — dynamic depth, rounded corners, normal map & sheen */}
      {retro ? (
        <mesh castShadow>
          <boxGeometry args={[CARD_W, CARD_H, depth]} />
          <meshStandardMaterial color="#1a1c4b" roughness={1} metalness={0} flatShading />
        </mesh>
      ) : (
        <RoundedBox args={[CARD_W, CARD_H, depth]} radius={radius} smoothness={6} castShadow>
          {premium ? (
            <meshPhysicalMaterial
              color={jerseyTexture ? "#ffffff" : "#eaf6ff"}
              transmission={jerseyTexture ? 0.15 : 0.9}
              thickness={0.6}
              roughness={0.06}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.05}
              ior={1.4}
              transparent
              opacity={0.85}
              normalMap={normalMap || undefined}
              map={jerseyTexture || undefined}
            />
          ) : (
            <meshStandardMaterial
              color={jerseyTexture ? "#ffffff" : era.cardBg}
              roughness={materialProps.roughness}
              metalness={materialProps.metalness}
              normalMap={normalMap || undefined}
              map={jerseyTexture || undefined}
            />
          )}
        </RoundedBox>
      )}

      {/* Edge accent when leverage is active */}
      {leverageActive && (
        <lineSegments position={[0, 0, depth / 2 + 0.001]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(CARD_W, CARD_H)]} />
          <lineBasicMaterial color={era.accent} toneMapped={false} />
        </lineSegments>
      )}

      {/* Front Face */}
      {!showBack ? (
        <Html
          transform
          scale={HTML_SCALE}
          position={[0, 0, depth / 2 + 0.012]}
          pointerEvents="none"
          zIndexRange={[10, 0]}
        >
          <FrontFace player={player} theme={theme} era={era} />
        </Html>
      ) : (
        <Html
          transform
          scale={HTML_SCALE}
          position={[0, 0, -depth / 2 - 0.012]}
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
