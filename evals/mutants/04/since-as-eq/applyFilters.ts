// MUTANT: `since` is routed to eq() instead of the gte() range clause.
export interface Builder {
  eq(col: string, val: unknown): Builder;
  in(col: string, vals: unknown[]): Builder;
  gte(col: string, val: unknown): Builder;
}

export function applyFilters(q: Builder, filters: Record<string, unknown>): Builder {
  for (const [key, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === "") continue;
    if (Array.isArray(val)) {
      if (val.length) q.in(key, val);
      continue;
    }
    q.eq(key, val);
  }
  return q;
}
