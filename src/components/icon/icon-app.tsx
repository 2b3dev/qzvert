export default function IconApp({
  width = '14',
  className,
  style,
  color = '#fff',
  logoUrl,
}: {
  width?: string
  className?: string
  style?: React.CSSProperties
  color?: string
  backgroundColor?: string
  logoUrl?: string
}) {
  // If logoUrl is provided, show image instead of SVG
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="App Logo"
        width={width}
        height={width}
        className={className}
        style={{ objectFit: 'contain', ...style }}
      />
    )
  }

  return (
    <svg
      role="img"
      aria-labelledby="img"
      width={width}
      className={className}
      style={style}
      viewBox="0 0 541 533"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="app-icon-title">App Icon</title>
      <path
        d="M539.127 472.407C539.871 474.19 540.509 476.034 540.731 477.953C542.971 497.25 523.88 512.816 505.035 505.818L395.304 465.07L471.538 407.924L494.5 365.5L539.127 472.407Z"
        fill={color}
      />
      <circle cx="266.5" cy="266.5" r="236.5" stroke={color} strokeWidth="60" />
      <path
        d="M200.493 180.324C206.164 163.612 231.531 162.143 239.316 178.076L244.169 188.445L268.329 232.55L284.537 262.13L286.692 265.566L356.809 173.225C372.5 156.696 392.972 170.675 386.647 191.724L325.068 363.312C320.046 380.023 296.67 384.45 284.774 371.696C283.847 370.703 283.115 369.546 282.451 368.36L260.094 328.434L227.918 270.785L167.149 356.36C166.57 357.175 165.944 357.966 165.202 358.636C152.1 370.483 129.554 358.625 135.204 341.972L200.493 180.324Z"
        fill="#FFA600"
      />
    </svg>
  )
}
