export default function IconApp({
  width = '14',
  className,
  style,
  color = '#fff',
  backgroundColor = '#2C2C2C',
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
      viewBox="0 0 681 681"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="app-icon-title">App Icon</title>
      <path
        d="M340.5 0C528.553 0 681 152.447 681 340.5C681 403.95 663.643 463.346 633.421 514.201L668.939 568.95C683.183 590.905 667.425 619.911 641.255 619.911H535.15C479.982 658.416 412.879 681 340.5 681C152.447 681 0 528.553 0 340.5C0 152.447 152.447 0 340.5 0ZM340.5 124C220.93 124 124 220.93 124 340.5C124 460.07 220.93 557 340.5 557C460.07 557 557 460.07 557 340.5C557 220.93 460.07 124 340.5 124Z"
        fill="white"
      />
      <path
        d="M471.479 269.48C495.608 271.917 505.403 305.433 486.469 320.774L431.269 363.988L404.86 390.321L526.717 464.695C553.693 480.606 543.791 524.245 513.653 522.27L264.885 492.758C240.705 491.172 227.541 460.614 241.661 440.759C242.449 439.652 243.405 438.675 244.411 437.762L291.541 394.99L340.182 350.848L340.266 350.898L358.809 334.117L224.947 278.935C224.022 278.554 223.11 278.113 222.279 277.558C201.777 263.873 210.65 229.487 234.875 231.934L471.479 269.48Z"
        fill="#FFA600"
      />
    </svg>
  )
}
