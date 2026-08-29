// MUTANT: the empty/null/undefined skip is gone — empty values now emit eq() clauses.
export interface Builder {
  eq(col: string, val: unknown): Builder;
  in(col: string, vals: unknown[]): Builder;
  gte(col: string, val: unknown): Builder;
}

export function applyFilters(q: Builder, filters: Record<string, unknown>): Builder {
  for (const [key, val] of Object.entries(filters)) {
    if (Array.isArray(val)) {
      if (val.length) q.in(key, val);
      continue;
    }
    if (key === "since") {
      q.gte(key, val);
      continue;
    }
    q.eq(key, val);
  }
  return q;
}
