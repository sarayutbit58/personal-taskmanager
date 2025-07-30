
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const serializedState = JSON.stringify(storedValue);
        // Avoid writing to localStorage if the value is the default initial value,
        // and the key is not present. This prevents stringifying large empty initial states.
        if(window.localStorage.getItem(key) === null && serializedState === JSON.stringify(initialValue)) {
          return;
        }
        window.localStorage.setItem(key, serializedState);
      }
    } catch (error)
      {
      console.error(error);
    }
  }, [key, storedValue, initialValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;

interface UndoableState<T> {
    state: T;
    setState: (newState: T | ((prevState: T) => T)) => void;
    resetState: (newState: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const useUndoableState = <T,>(initialState: T): UndoableState<T> => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    const resolvedState = typeof newState === 'function' 
      ? (newState as (prevState: T) => T)(state) 
      : newState;
    
    // Simple deep-ish comparison to avoid re-saving identical state
    if (JSON.stringify(resolvedState) === JSON.stringify(state)) {
      return;
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(resolvedState);
    
    // Limit history size to prevent memory issues
    if (newHistory.length > 50) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
    } else {
        setCurrentIndex(newHistory.length - 1);
    }
    setHistory(newHistory);


  }, [currentIndex, history, state]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);
  
  const resetState = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo, resetState };
};
