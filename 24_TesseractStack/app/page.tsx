import { CardScene } from "@/components/card-scene"

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#06121d]">
      {/* Subtle field-light vignette behind the transparent canvas */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(43,245,255,0.10), transparent 70%), radial-gradient(80% 60% at 50% 100%, rgba(11,27,43,0.9), #06121d 80%)",
        }}
        aria-hidden="true"
      />
      <CardScene />
    </main>
  )
}
