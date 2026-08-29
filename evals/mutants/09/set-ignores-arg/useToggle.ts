import { useCallback, useState } from "react";

// MUTANT: set() ignores its argument — the explicit setter is a no-op.
export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const set = useCallback((_value: boolean) => {}, []);
  return [on, toggle, set];
}
