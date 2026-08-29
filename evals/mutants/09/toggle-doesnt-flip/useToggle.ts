import { useCallback, useState } from "react";

// MUTANT: toggle no longer flips — it always sets `true`.
export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(true), []);
  const set = useCallback((value: boolean) => setOn(value), []);
  return [on, toggle, set];
}
