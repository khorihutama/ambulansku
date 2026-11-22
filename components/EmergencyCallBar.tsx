export default function EmergencyCallBar() {
  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[460px] -translate-x-1/2 border-t border-hairline bg-[#0d1b2a]/[0.97] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur-md">
      <a
        href="tel:119"
        className="mx-auto flex min-h-[56px] w-full items-center justify-center gap-3 rounded-[14px] border border-white/15 bg-danger px-4 text-white transition-colors hover:bg-danger-hover touch-manipulation"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[21px] w-[21px] shrink-0"
        >
          <path
            fill="currentColor"
            d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"
          />
        </svg>
        <span className="flex flex-col text-left leading-tight">
          <span className="text-base font-bold">Hubungi 119</span>
          <span className="text-xs font-medium text-white/85">
            SPGDT Nasional
          </span>
        </span>
      </a>
    </div>
  );
}