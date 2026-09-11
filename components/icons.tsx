import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function Trophy({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M8 3h8v5a4 4 0 0 1-8 0V3Z" />
      <path d="M8 5H5a2 2 0 0 0 0 4h1.2M16 5h3a2 2 0 0 1 0 4h-1.2" />
      <path d="M12 12v4M9 20h6M10 16h4l.5 4h-5l.5-4Z" />
    </svg>
  );
}

export function Football({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M4 20C3 13 10 3 20 4c1 10-6 17-16 16Z" />
      <path d="M9 15l6-6M10.5 11.5l2 2M12.5 9.5l2 2" />
    </svg>
  );
}

export function Lock({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="4.5" y="10.5" width="15" height="9" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export function Check({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function XMark({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ChevronLeft({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRight({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function Refresh({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
    </svg>
  );
}

export function User({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function Clock({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ListIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function Gear({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

/** Brand mark: a shield with a football, used in the header. */
export function Logo({ size = 32, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" {...p}>
      <path
        d="M20 3.5 33 8v10c0 8.5-5.6 15-13 18.5C12.6 33 7 26.5 7 18V8l13-4.5Z"
        fill="#16a34a"
        stroke="#4ade80"
        strokeWidth="1.5"
      />
      <path
        d="M13 22c-.6-6 4-11 12-10.5.6 6-4 11-12 10.5Z"
        fill="#052e13"
        stroke="#bbf7d0"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M16 19.5l4-4M17 18l1.5 1.5M19 16l1.5 1.5" stroke="#bbf7d0" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
