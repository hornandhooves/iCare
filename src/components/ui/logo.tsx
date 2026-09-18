export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid flex-none place-items-center rounded-[28%] bg-primary"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </div>
  );
}
