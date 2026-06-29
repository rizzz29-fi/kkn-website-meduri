import { useEffect, useMemo, useState } from "react";

type Props = {
  length?: number; // total days of KKN
};

export default function ActivityCalendar({ length = 30 }: Props) {
  const storageKey = "kkn_start_date";
  const defaultStart = "2026-07-21"; // provided KKN dates
  const [startDateStr, setStartDateStr] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey) ?? defaultStart;
    } catch {
      return defaultStart;
    }
  });

  const [startDateInput, setStartDateInput] = useState<string>(
    startDateStr ?? defaultStart,
  );

  useEffect(() => {
    setStartDateInput(startDateStr ?? "");
  }, [startDateStr]);

  const startDate = useMemo(() => {
    if (!startDateStr) return null;
    const d = new Date(startDateStr);
    // normalize to midnight
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }, [startDateStr]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dayIndex = useMemo(() => {
    if (!startDate) return null;
    const diff = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff >= 0 && diff < length ? diff + 1 : null;
  }, [startDate, today, length]);

  const days = useMemo(() => {
    const arr = [] as { day: number; date: Date }[];
    for (let i = 0; i < length; i++) {
      const d = startDate
        ? new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        : new Date();
      arr.push({ day: i + 1, date: d });
    }
    return arr;
  }, [startDate, length]);

  const endDate = useMemo(() => {
    if (!startDate) return null;
    return new Date(startDate.getTime() + (length - 1) * 24 * 60 * 60 * 1000);
  }, [startDate, length]);

  const saveStart = () => {
    try {
      if (startDateInput) {
        localStorage.setItem(storageKey, startDateInput);
        setStartDateStr(startDateInput);
      } else {
        localStorage.removeItem(storageKey);
        setStartDateStr(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearStart = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch { }
    setStartDateInput("");
    setStartDateStr(null);
  };

  // render only July and August 2026
  const months = [
    { year: 2026, month: 6 }, // July (0-based)
    { year: 2026, month: 7 }, // August
  ];

  const buildMonthGrid = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  return (
    <div className="mb-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Kalender KKN
          </h3>
          <p className="text-sm text-muted-foreground">
            Menampilkan Juli & Agustus 2026. Rentang KKN disorot, dan hari ini
            ditandai.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            aria-label="Tanggal mulai KKN"
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-200 bg-white text-sm"
          />
          <button
            onClick={saveStart}
            className="px-3 py-2 rounded-md bg-kkn-accent-1 text-kkn-bg-primary text-sm font-semibold"
          >
            Simpan
          </button>
          <button
            onClick={clearStart}
            className="px-3 py-2 rounded-md border border-slate-200 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-slate-700">
        {startDate ? (
          <>
            <div>
              Mulai: <strong>{startDate.toLocaleDateString()}</strong>
            </div>
            {endDate && (
              <div>
                Berakhir: <strong>{endDate.toLocaleDateString()}</strong>
              </div>
            )}
            {dayIndex ? (
              <div>
                Hari saat ini: <strong>Hari ke-{dayIndex}</strong>
              </div>
            ) : (
              <div className="text-slate-500">(di luar rentang KKN)</div>
            )}
          </>
        ) : (
          <div className="text-slate-500">Tanggal mulai belum diatur.</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {months.map(({ year, month }) => {
          const weeks = buildMonthGrid(year, month);
          const monthName = new Date(year, month, 1).toLocaleString(undefined, {
            month: "long",
          });
          return (
            <div
              key={`${year}-${month}`}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-slate-800">
                  {monthName} {year}
                </div>
                <div className="h-1 w-20 bg-kkn-accent-1 rounded-full" />
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="font-medium">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weeks.map((week, wi) => (
                  <div key={wi} className="contents">
                    {week.map((date, di) => {
                      if (!date) return <div key={di} className="p-2"></div>;
                      const dd = new Date(date);
                      dd.setHours(0, 0, 0, 0);
                      const inKKN =
                        startDate &&
                        endDate &&
                        dd.getTime() >= startDate.getTime() &&
                        dd.getTime() <= endDate.getTime();
                      const isToday = dd.getTime() === today.getTime();
                      return (
                        <div
                          key={di}
                          className={`p-2 rounded-md text-sm border ${inKKN ? "bg-kkn-bg-dark text-kkn-text-light border-kkn-bg-dark" : "bg-white text-slate-800 border-slate-100"} ${isToday ? "ring-2 ring-kkn-accent-1" : ""}`}
                        >
                          <div className="font-medium">{dd.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-4 bg-kkn-bg-dark rounded-sm border" />{" "}
          <span>KKN (21 Jul — 21 Aug)</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border rounded-sm" />{" "}
          <span>Tanggal lain</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-4 bg-kkn-accent-1 rounded-sm" />{" "}
          <span>Hari ini</span>
        </div>
      </div>
    </div>
  );
}
