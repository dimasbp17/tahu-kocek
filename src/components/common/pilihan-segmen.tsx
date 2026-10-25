// Pilihan bergaya segmen, sama dengan filter periode di Ringkasan & Laporan
export default function PilihanSegmen<T extends string>({
  pilihan,
  nilai,
  onPilih,
}: {
  pilihan: { id: T; label: string }[];
  nilai: T;
  onPilih: (id: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr rounded-lg bg-zinc-200/60 p-1">
      {pilihan.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPilih(p.id)}
          aria-pressed={nilai === p.id}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            nilai === p.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
