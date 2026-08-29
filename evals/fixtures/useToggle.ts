import { useCallback, useState } from "react";

// A small custom hook: boolean state with a toggle and an explicit setter. Pure logic + React state,
// so it's a unit target — tested with @testing-library/react's renderHook + act (no DOM assertions).
export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const set = useCallback((value: boolean) => setOn(value), []);
  return [on, toggle, set];
}
