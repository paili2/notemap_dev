export const ActionBtn = ({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">
        {icon}
      </span>
      <span
        className={
          danger ? "font-semibold text-red-600" : "font-medium text-zinc-900"
        }
      >
        {label}
      </span>
    </button>
  );
};
