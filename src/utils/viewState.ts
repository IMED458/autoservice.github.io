import { useState, Dispatch, SetStateAction } from 'react';

/**
 * In-memory view state that survives a component unmounting (e.g. opening an order
 * and pressing "back"). Cleared on logout via clearViewState().
 */
const store = new Map<string, unknown>();

export function useViewState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial));
  const set: Dispatch<SetStateAction<T>> = (v) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      store.set(key, next);
      return next;
    });
  };
  return [value, set];
}

export function clearViewState() {
  store.clear();
}
