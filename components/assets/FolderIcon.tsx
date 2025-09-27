export default function FolderIcon({
  filled,
  ...rest
}: { filled: boolean } & React.SVGAttributes<SVGElement>) {
  return filled ? (
    <svg
      {...rest}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 261 195"
    >
      <g filter="url(#a)">
        <path
          fill="url(#b)"
          d="M246.193 25.957v128.171a7.34 7.34 0 0 1-7.34 7.34H22.339a7.34 7.34 0 0 1-7.339-7.34V7.339A7.34 7.34 0 0 1 22.34 0h70.346a18.35 18.35 0 0 1 11.847 4.337l14.837 12.545a7.34 7.34 0 0 0 4.739 1.735h114.744a7.34 7.34 0 0 1 7.34 7.34"
        ></path>
      </g>
      <g filter="url(#c)">
        <path
          fill="#DDDCE2"
          d="M233.862 22.018a4.99 4.99 0 0 1 4.991 4.991v12.037a4.99 4.99 0 0 1-4.991 4.99H27.33a4.99 4.99 0 0 1-4.99-4.99V27.009a4.99 4.99 0 0 1 4.99-4.99z"
        ></path>
      </g>
      <g filter="url(#d)">
        <path
          fill="url(#e)"
          d="M15 44.305v128.172a7.34 7.34 0 0 0 7.34 7.34h216.513a7.34 7.34 0 0 0 7.34-7.34V33.027a7.34 7.34 0 0 0-7.34-7.339h-110.35a29.35 29.35 0 0 0-13.383 3.228l-9.414 4.822a29.36 29.36 0 0 1-13.383 3.228H22.339A7.34 7.34 0 0 0 15 44.306Z"
        ></path>
      </g>
      <defs>
        <filter
          id="a"
          width="231.193"
          height="166.972"
          x="15"
          y="-3.67"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.835"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.941176 0 0 0 0 0.839216 0 0 0 0 0.301961 0 0 0 1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect1_innerShadow_301_203"></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="-3.67"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.811765 0 0 0 0 0.521569 0 0 0 0 0.2 0 0 0 1 0"></feColorMatrix>
          <feBlend
            in2="effect1_innerShadow_301_203"
            result="effect2_innerShadow_301_203"
          ></feBlend>
        </filter>
        <filter
          id="c"
          width="227.098"
          height="32.603"
          x="18.37"
          y="19.372"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dx="1.323" dy="2.646"></feOffset>
          <feGaussianBlur stdDeviation="2.646"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_301_203"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_301_203"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dx="1.323" dy="1.323"></feOffset>
          <feGaussianBlur stdDeviation="1.323"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect2_innerShadow_301_203"></feBlend>
        </filter>
        <filter
          id="d"
          width="260.55"
          height="183.486"
          x="0.321"
          y="11.009"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset></feOffset>
          <feGaussianBlur stdDeviation="7.339"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_301_203"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_301_203"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.835"></feOffset>
          <feGaussianBlur stdDeviation="3.67"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 0.974775 0 0 0 0 0.733333 0 0 0 1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect2_innerShadow_301_203"></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="-3.67"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.811765 0 0 0 0 0.521569 0 0 0 0 0.2 0 0 0 1 0"></feColorMatrix>
          <feBlend
            in2="effect2_innerShadow_301_203"
            result="effect3_innerShadow_301_203"
          ></feBlend>
        </filter>
        <linearGradient
          id="b"
          x1="90.229"
          x2="92.064"
          y1="7.339"
          y2="40.367"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.042" stopColor="#E1AE40"></stop>
          <stop offset="1" stopColor="#ECAB3F"></stop>
        </linearGradient>
        <linearGradient
          id="e"
          x1="130.596"
          x2="130.596"
          y1="25.688"
          y2="179.817"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8D555"></stop>
          <stop offset="1" stopColor="#E0A53F"></stop>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg
      {...rest}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 261 195"
    >
      <g filter="url(#a)">
        <path
          fill="url(#b)"
          d="M246.193 25.957v128.171a7.34 7.34 0 0 1-7.34 7.34H22.339a7.34 7.34 0 0 1-7.339-7.34V7.339A7.34 7.34 0 0 1 22.34 0h70.346a18.35 18.35 0 0 1 11.847 4.337l14.837 12.545a7.34 7.34 0 0 0 4.739 1.735h114.744a7.34 7.34 0 0 1 7.34 7.34"
        ></path>
      </g>
      <g filter="url(#c)">
        <path
          fill="url(#d)"
          d="M15 44.305v128.172a7.34 7.34 0 0 0 7.34 7.34h216.513a7.34 7.34 0 0 0 7.34-7.34V33.027a7.34 7.34 0 0 0-7.34-7.339h-110.35a29.35 29.35 0 0 0-13.383 3.228l-9.414 4.822a29.36 29.36 0 0 1-13.383 3.228H22.339A7.34 7.34 0 0 0 15 44.306Z"
        ></path>
      </g>
      <defs>
        <linearGradient
          id="b"
          x1="90.229"
          x2="92.064"
          y1="7.339"
          y2="40.367"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.042" stopColor="#E1AE40"></stop>
          <stop offset="1" stopColor="#ECAB3F"></stop>
        </linearGradient>
        <linearGradient
          id="d"
          x1="130.596"
          x2="130.596"
          y1="25.688"
          y2="179.817"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8D555"></stop>
          <stop offset="1" stopColor="#E0A53F"></stop>
        </linearGradient>
        <filter
          id="a"
          width="231.193"
          height="166.972"
          x="15"
          y="-3.67"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.835"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.941176 0 0 0 0 0.839216 0 0 0 0 0.301961 0 0 0 1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect1_innerShadow_301_203"></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="-3.67"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.811765 0 0 0 0 0.521569 0 0 0 0 0.2 0 0 0 1 0"></feColorMatrix>
          <feBlend
            in2="effect1_innerShadow_301_203"
            result="effect2_innerShadow_301_203"
          ></feBlend>
        </filter>
        <filter
          id="c"
          width="260.55"
          height="183.486"
          x="0.321"
          y="11.009"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset></feOffset>
          <feGaussianBlur stdDeviation="7.339"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_301_203"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_301_203"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.835"></feOffset>
          <feGaussianBlur stdDeviation="3.67"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 0.974775 0 0 0 0 0.733333 0 0 0 1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect2_innerShadow_301_203"></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="-3.67"></feOffset>
          <feGaussianBlur stdDeviation="1.835"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0.811765 0 0 0 0 0.521569 0 0 0 0 0.2 0 0 0 1 0"></feColorMatrix>
          <feBlend
            in2="effect2_innerShadow_301_203"
            result="effect3_innerShadow_301_203"
          ></feBlend>
        </filter>
      </defs>
    </svg>
  );
}
