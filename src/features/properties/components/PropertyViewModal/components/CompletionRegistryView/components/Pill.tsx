const Pill = ({ text }: { text?: string }) => {
  return (
    <span className="inline-flex h-8 items-center rounded-lg px-3 text-sm border bg-blue-50 text-blue-700">
      {text || "-"}
    </span>
  );
};

export default Pill;
