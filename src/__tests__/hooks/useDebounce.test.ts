import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update the value before the delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    );
    rerender({ value: 'world' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('hello');
  });

  it('updates the value after the delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    );
    rerender({ value: 'world' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('world');
  });

  it('resets the timer on rapid updates, only emitting the last value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 'd' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('d');
  });

  it('works with number type', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 1 } }
    );
    rerender({ value: 42 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(42);
  });
});
