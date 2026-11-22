export default function EmergencyCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#2A3A4B] bg-[#0D1B2A]/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
      <a
        href="tel:119"
        className="mx-auto flex min-h-[56px] w-full max-w-xl touch-manipulation items-center justify-center gap-3 rounded-xl bg-[#E63946] px-4 text-white transition-transform active:scale-[0.98]"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          📞
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold">Hubungi 119</span>
          <span className="text-xs font-medium text-white/85">
            SPGDT Nasional
          </span>
        </span>
      </a>
    </div>
  );
}