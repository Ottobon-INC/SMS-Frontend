import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)) {
  // Get from session storage then
  // parse stored json or return initialValue
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }

    // if initialValue is a function, evaluate it
    if (initialValue instanceof Function) {
      return initialValue();
    }
    return initialValue;
  });

  // Update session storage whenever the value changes
  useEffect(() => {
    try {
      if (value === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
