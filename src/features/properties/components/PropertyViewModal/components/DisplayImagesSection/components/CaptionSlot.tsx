const CaptionSlot = ({ text }: { text?: string }) => {
  const t = (text || "").trim();
  return (
    <div className="mt-2 h-5 flex items-center justify-center">
      <p
        className={`text-xs text-gray-600 text-center whitespace-pre-wrap break-words font-semibold ${
          t ? "" : "invisible"
        }`}
        title={t}
      >
        {t || "placeholder"}
      </p>
    </div>
  );
};

export default CaptionSlot;
