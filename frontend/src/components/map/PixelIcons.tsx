/**
 * Hand-drawn pixel-art SVG icons (16x16 grids, crispEdges) for map
 * buildings that the Minifantasy asset subset doesn't include.
 */

interface IconProps {
  size?: number
  className?: string
}

function Px({
  size = 56,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Small stone keep with a red flag — the start of the trail */
export function PixelCastle(props: IconProps) {
  return (
    <Px {...props}>
      <rect x="7" y="1" width="1" height="3" fill="#5a4632" />
      <rect x="8" y="1" width="3" height="2" fill="#d43d2a" />
      <rect x="2" y="4" width="2" height="2" fill="#9aa5b1" />
      <rect x="6" y="4" width="2" height="2" fill="#9aa5b1" />
      <rect x="12" y="4" width="2" height="2" fill="#9aa5b1" />
      <rect x="2" y="6" width="12" height="9" fill="#b8c2cc" />
      <rect x="2" y="6" width="12" height="1" fill="#dde4ea" />
      <rect x="2" y="14" width="12" height="1" fill="#7d8894" />
      <rect x="4" y="8" width="2" height="2" fill="#3d4852" />
      <rect x="10" y="8" width="2" height="2" fill="#3d4852" />
      <rect x="6" y="10" width="4" height="5" fill="#5a4632" />
      <rect x="6" y="10" width="4" height="1" fill="#7a6248" />
      <rect x="9" y="12" width="1" height="1" fill="#e7bc78" />
    </Px>
  )
}

/** Wooden cottage — a campus app level */
export function PixelHouse(props: IconProps) {
  return (
    <Px {...props}>
      <rect x="6" y="1" width="4" height="1" fill="#8a3324" />
      <rect x="4" y="2" width="8" height="1" fill="#a84a32" />
      <rect x="3" y="3" width="10" height="1" fill="#a84a32" />
      <rect x="2" y="4" width="12" height="1" fill="#c1502e" />
      <rect x="1" y="5" width="14" height="1" fill="#c1502e" />
      <rect x="3" y="6" width="10" height="9" fill="#e7bc78" />
      <rect x="3" y="6" width="10" height="1" fill="#f6e3bb" />
      <rect x="3" y="14" width="10" height="1" fill="#a8763e" />
      <rect x="5" y="8" width="2" height="2" fill="#4a90c2" />
      <rect x="9" y="8" width="2" height="2" fill="#4a90c2" />
      <rect x="6" y="11" width="4" height="4" fill="#5a4632" />
      <rect x="8" y="12" width="1" height="1" fill="#e7bc78" />
    </Px>
  )
}

/** Mushroom-topped lab with a glowing bulb — the Ideas Lab */
export function PixelLab(props: IconProps) {
  return (
    <Px {...props}>
      <rect x="4" y="1" width="8" height="1" fill="#d43d2a" />
      <rect x="2" y="2" width="12" height="2" fill="#e85a3a" />
      <rect x="1" y="4" width="14" height="1" fill="#d43d2a" />
      <rect x="4" y="2" width="2" height="2" fill="#f6e3bb" />
      <rect x="10" y="3" width="2" height="1" fill="#f6e3bb" />
      <rect x="3" y="5" width="10" height="10" fill="#f6e3bb" />
      <rect x="3" y="5" width="10" height="1" fill="#fffdf5" />
      <rect x="3" y="14" width="10" height="1" fill="#c9a86a" />
      <rect x="6" y="7" width="4" height="3" fill="#ffd94a" />
      <rect x="7" y="6" width="2" height="1" fill="#ffd94a" />
      <rect x="7" y="10" width="2" height="1" fill="#8a6f52" />
      <rect x="6" y="12" width="4" height="3" fill="#5a4632" />
    </Px>
  )
}

/** Striped construction sign — planned new-app idea */
export function PixelConstruction(props: IconProps) {
  return (
    <Px {...props}>
      <rect x="7" y="8" width="2" height="7" fill="#8a6f52" />
      <rect x="2" y="3" width="12" height="5" fill="#e7bc78" />
      <rect x="2" y="3" width="12" height="1" fill="#f6e3bb" />
      <rect x="3" y="4" width="2" height="3" fill="#2b2b2b" />
      <rect x="7" y="4" width="2" height="3" fill="#2b2b2b" />
      <rect x="11" y="4" width="2" height="3" fill="#2b2b2b" />
      <rect x="5" y="4" width="2" height="3" fill="#ffd94a" />
      <rect x="9" y="4" width="2" height="3" fill="#ffd94a" />
      <rect x="6" y="15" width="4" height="1" fill="#5a4632" />
    </Px>
  )
}

/** Little victory flag — cleared level */
export function PixelFlag({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      <rect x="1" y="0" width="1" height="8" fill="#5a4632" />
      <rect x="2" y="0" width="4" height="3" fill="#4caf50" />
      <rect x="2" y="0" width="4" height="1" fill="#6fd172" />
    </svg>
  )
}
