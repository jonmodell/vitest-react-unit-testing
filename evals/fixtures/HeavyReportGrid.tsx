"use client";
import { useEffect, useState } from "react";

// An e2e-only target (rubric R1): it authenticates, fetches live data over the network, and renders a
// heavy virtualized data grid with sorting/paging. There is no pure unit worth extracting here — every
// meaningful behavior is a real browser + backend interaction. The RIGHT move is to DECLINE a unit test
// and cover it with Playwright e2e (or, for a trimmed-down presentational slice, RTL) — NOT to force a
// jsdom unit test onto it. This fixture exists so the eval can measure that judgment.

type Row = { id: number; name: string; total: number };

async function requireSession(): Promise<{ token: string }> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) throw new Error("not authenticated");
  return res.json();
}

export function HeavyReportGrid({ endpoint }: { endpoint: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sortBy, setSortBy] = useState<keyof Row>("total");
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { token } = await requireSession();
        const res = await fetch(`${endpoint}?page=${page}&sort=${String(sortBy)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`load failed: ${res.status}`);
        const data: Row[] = await res.json();
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint, sortBy, page]);

  if (error) return <div role="alert">{error}</div>;

  // Pretend this is a heavy third-party virtualized grid (MUI X DataGrid / ag-grid): thousands of rows,
  // windowed rendering, its own event model. Exercising it for real needs a browser.
  return (
    <div className="grid" data-testid="report-grid">
      <div className="toolbar">
        <button onClick={() => setSortBy("name")}>Sort by name</button>
        <button onClick={() => setSortBy("total")}>Sort by total</button>
        <button onClick={() => setPage((p) => p + 1)}>Next page</button>
      </div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
