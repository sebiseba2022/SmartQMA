interface TraceabilityGraphicProps {
  className?: string;
  size?: number | string;
}

export function TraceabilityGraphic({ className = '', size = 320 }: TraceabilityGraphicProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Gradients bordeaux bogat */}
        <linearGradient id="qmaRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1535" />
          <stop offset="50%" stopColor="#7A0C22" />
          <stop offset="100%" stopColor="#54091A" />
        </linearGradient>

        <linearGradient id="qmaSoftBlob" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FDF2F4" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F8E5E9" stopOpacity="0.5" />
        </linearGradient>

        <linearGradient id="qmaOrbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B0F24" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#1E3A8A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#6B0F24" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Formă organică de fundal fluidă și aerisită */}
      <path
        d="M 120 70 C 220 30 330 90 350 190 C 370 290 280 360 180 350 C 80 340 40 250 60 160 C 75 95 90 80 120 70 Z"
        fill="url(#qmaSoftBlob)"
      />

      {/* Traiectorii fluide orbitale de trasabilitate */}
      <ellipse
        cx="200"
        cy="200"
        rx="150"
        ry="85"
        transform="rotate(-25 200 200)"
        stroke="url(#qmaOrbitGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.8"
      />
      <ellipse
        cx="200"
        cy="200"
        rx="135"
        ry="75"
        transform="rotate(35 200 200)"
        stroke="#6B0F24"
        strokeWidth="1.2"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M 60 210 Q 150 120 280 140 T 350 240"
        stroke="#1E3A8A"
        strokeWidth="1.2"
        fill="none"
        opacity="0.55"
      />

      {/* Formă centrală ribbon vișiniu (bordeaux) */}
      <path
        d="M 130 180 C 110 130 190 110 240 140 C 290 170 330 220 310 260 C 290 300 220 310 170 280 C 130 255 140 210 130 180 Z"
        fill="url(#qmaRibbonGrad)"
        opacity="0.95"
      />
      <path
        d="M 170 140 C 240 110 300 170 270 230 C 240 290 160 260 150 200 C 145 170 155 150 170 140 Z"
        fill="#8B1535"
        opacity="0.8"
      />

      {/* Centrul alb / spațiu aerisit cu simbolul Infinit SmartQMA */}
      <ellipse cx="200" cy="195" rx="58" ry="34" fill="#ffffff" />

      {/* Simbolul Infinit elegant SmartQMA */}
      <path
        d="M 180 195 C 168 185 155 185 150 195 C 145 205 158 208 170 200 L 230 190 C 242 182 255 185 250 195 C 245 205 232 205 220 195 L 180 195 Z"
        stroke="#7A0C22"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 235 200 C 242 208 248 210 252 205"
        stroke="#7A0C22"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Noduri mari bordeaux și accente discrete albastru cobalt */}
      {/* Noduri Bordeaux */}
      <circle cx="270" cy="120" r="14" fill="#54091A" />
      <circle cx="270" cy="120" r="16" stroke="#ffffff" strokeWidth="2.5" fill="none" />

      <circle cx="330" cy="225" r="18" fill="#6B0F24" />
      <circle cx="330" cy="225" r="21" stroke="#ffffff" strokeWidth="3" fill="none" />

      <circle cx="160" cy="290" r="16" fill="#7A0C22" />
      <circle cx="160" cy="290" r="19" stroke="#ffffff" strokeWidth="2.5" fill="none" />

      <circle cx="115" cy="170" r="10" fill="#8B1535" />

      {/* Noduri / Accente Albastru Cobalt (#1E3A8A / #1D4ED8) */}
      <circle cx="320" cy="140" r="6" fill="#1E3A8A" />
      <circle cx="320" cy="300" r="8" fill="#1E3A8A" />
      <circle cx="320" cy="300" r="10" stroke="#ffffff" strokeWidth="2" fill="none" />

      <circle cx="78" cy="240" r="7" fill="#1D4ED8" />
      <circle cx="78" cy="240" r="9" stroke="#ffffff" strokeWidth="1.5" fill="none" />

      <circle cx="135" cy="95" r="5" fill="#1E3A8A" />
      <circle cx="215" cy="335" r="5.5" fill="#1E3A8A" />
      <circle cx="365" cy="190" r="4.5" fill="#1E3A8A" />
      <circle cx="95" cy="130" r="4" fill="#1E3A8A" />

      {/* Linii fine de conexiune */}
      <line x1="270" y1="120" x2="320" y2="140" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <line x1="330" y1="225" x2="320" y2="300" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <line x1="160" y1="290" x2="215" y2="335" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <line x1="115" y1="170" x2="78" y2="240" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
    </svg>
  );
}

export default TraceabilityGraphic;
