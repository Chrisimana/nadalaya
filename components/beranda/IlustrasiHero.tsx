/**
 * Ilustrasi dekoratif untuk beranda: paranada dengan not dan garis kontur
 * nyanyian yang mengikuti acuan. Bukan data sungguhan.
 */
export function IlustrasiHero() {
  const garis = [40, 58, 76, 94, 112];
  const not = [
    { x: 70, y: 112 },
    { x: 130, y: 103 },
    { x: 190, y: 94 },
    { x: 250, y: 85 },
    { x: 310, y: 76 },
    { x: 370, y: 67 },
  ];

  return (
    <div
      aria-hidden="true"
      className="relative rounded-3xl border border-garis bg-white p-5 shadow-[0_24px_60px_-24px_rgb(46_42_107/0.35)] sm:p-7"
    >
      <div className="mb-4 flex items-center justify-between text-xs font-semibold tracking-wide text-redup uppercase">
        <span>Acuan vs nyanyian</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-nada-700" /> Acuan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-kuningan-400" /> Anda
          </span>
        </span>
      </div>

      <svg viewBox="0 0 420 150" className="w-full">
        {garis.map((y) => (
          <line
            key={y}
            x1="0"
            x2="420"
            y1={y}
            y2={y}
            className="stroke-nada-200"
            strokeWidth="1.2"
          />
        ))}
        <line
          x1="1"
          x2="1"
          y1="40"
          y2="112"
          className="stroke-nada-300"
          strokeWidth="2"
        />
        <line
          x1="419"
          x2="419"
          y1="40"
          y2="112"
          className="stroke-nada-300"
          strokeWidth="2"
        />
        {not.map((n) => (
          <g key={n.x}>
            <ellipse
              cx={n.x}
              cy={n.y}
              rx="9"
              ry="6.5"
              transform={`rotate(-20 ${n.x} ${n.y})`}
              className="fill-nada-700"
            />
            <line
              x1={n.x + 8}
              x2={n.x + 8}
              y1={n.y}
              y2={n.y - 46}
              className="stroke-nada-700"
              strokeWidth="2"
            />
          </g>
        ))}
        <path
          d="M52 116 C 80 114, 100 108, 122 104 S 168 96, 190 95 S 230 88, 252 84 S 290 79, 312 77 S 350 70, 380 66"
          fill="none"
          className="stroke-kuningan-400"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-5 flex items-end justify-between border-t border-garis pt-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-redup uppercase">
            Skor akurasi
          </p>
          <p className="font-serif text-4xl font-semibold text-nada-800">
            0–100
          </p>
        </div>
        <p className="max-w-[12rem] text-right text-sm text-redup">
          Nada yang meleset lebih dari 50 cent ditandai otomatis.
        </p>
      </div>
    </div>
  );
}
