'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showSubbrand?: boolean;
  theme?: 'dark' | 'light';
}

const SIZE_MAP = {
  sm: { box: 'w-6 h-6', svg: 12, text: 'text-sm', sub: 'text-xs' },
  md: { box: 'w-8 h-8', svg: 16, text: 'text-base', sub: 'text-xs' },
  lg: { box: 'w-10 h-10', svg: 20, text: 'text-lg', sub: 'text-sm' },
};

export default function Logo({
  size = 'md',
  showWordmark = true,
  showSubbrand = false,
  theme = 'dark',
}: LogoProps) {
  const s = SIZE_MAP[size];
  const wordmarkColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subbrandColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      {/* Logo mark — black square with white lightning bolt */}
      <div className={`${s.box} bg-black rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"
            fill="white"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-semibold ${s.text} ${wordmarkColor}`}>
            Signal to Startup
          </span>
          {showSubbrand && (
            <span className={`${s.sub} ${subbrandColor} mt-0.5`}>
              by EntrepAIneur
            </span>
          )}
        </div>
      )}
    </div>
  );
}
