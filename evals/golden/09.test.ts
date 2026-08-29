// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToggle } from "./useToggle";

describe("useToggle", () => {
  it("defaults to false and flips on toggle", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it("honors the initial value", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it("set() forces a specific value", () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);
    act(() => result.current[2](false));
    expect(result.current[0]).toBe(false);
  });
});
