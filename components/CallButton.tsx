interface CallButtonProps {
  phoneNumber: string;
  label?: string;
  className?: string;
}

export default function CallButton({
  phoneNumber,
  label = "📞 Telepon",
  className = "",
}: CallButtonProps) {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className={`flex-1 bg-[#E63946] text-white py-2.5 rounded-xl text-sm font-semibold text-center active:scale-95 transition-transform ${className}`}
    >
      {label}
    </a>
  );
}