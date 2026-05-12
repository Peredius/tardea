type BrandLogoProps = {
  className?: string
  iconClassName?: string
  textClassName?: string
  showWordmark?: boolean
}

export function BrandLogo({
  className = '',
  iconClassName = '',
  textClassName = '',
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 96 96"
        aria-hidden="true"
        className={`h-10 w-10 shrink-0 -rotate-6 drop-shadow-[0_10px_24px_rgba(244,63,94,0.22)] ${iconClassName}`}
      >
        <path
          fill="#f43f5e"
          fillRule="evenodd"
          d="M22.1 9.4h51.6c5.9 0 10.3 5.3 9.2 11.1l-10.3 55A10.5 10.5 0 0 1 62.2 84H11.1C5.2 84 .8 78.7 1.9 72.9l3.4-17.8a10.6 10.6 0 0 0 0-20.2l3.4-17A13.7 13.7 0 0 1 22.1 9.4Z M1 38a10 10 0 1 1 0 20V38Z"
        />
        <path
          fill="white"
          d="M27.3 27.6h44.9l-2.9 15.1H54.5l-6.1 31.2H30.7l6.1-31.2H24.4l2.9-15.1Z"
        />
      </svg>

      {showWordmark && (
        <span
          className={`text-[1.55rem] font-black uppercase leading-none tracking-[0.18em] text-white ${textClassName}`}
        >
          TARDEA<span className="ml-1 text-brand-500">.</span>
        </span>
      )}
    </span>
  )
}
