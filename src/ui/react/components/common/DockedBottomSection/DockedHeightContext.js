/**
 * DockedHeightContext
 *
 * Provides shared height state across multiple DockedBottomSection instances
 * that use the same sharedHeightKey. This allows multiple tabs to share
 * the same collapsed/expanded state and height.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const DockedHeightContext = createContext(null);

/**
 * Provider for shared docked section height state
 */
export function DockedHeightProvider({ children }) {
  // Store heights by key: { [sharedHeightKey]: { height, isCollapsed } }
  const [heightStates, setHeightStates] = useState({});

  const getHeightState = useCallback(
    (key, defaultHeight = 200) => {
      return heightStates[key] || { height: defaultHeight, isCollapsed: false };
    },
    [heightStates]
  );

  const setHeightState = useCallback((key, updates) => {
    setHeightStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates,
      },
    }));
  }, []);

  const setHeight = useCallback(
    (key, height) => {
      setHeightState(key, { height });
    },
    [setHeightState]
  );

  const setCollapsed = useCallback(
    (key, isCollapsed) => {
      setHeightState(key, { isCollapsed });
    },
    [setHeightState]
  );

  const toggleCollapsed = useCallback((key) => {
    setHeightStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isCollapsed: !prev[key]?.isCollapsed,
      },
    }));
  }, []);

  const value = useMemo(
    () => ({
      getHeightState,
      setHeight,
      setCollapsed,
      toggleCollapsed,
    }),
    [getHeightState, setHeight, setCollapsed, toggleCollapsed]
  );

  return (
    <DockedHeightContext.Provider value={value}>
      {children}
    </DockedHeightContext.Provider>
  );
}

/**
 * Hook to access shared docked height state
 */
export function useDockedHeight(sharedHeightKey, defaultHeight = 200) {
  const context = useContext(DockedHeightContext);

  // If no provider, use local state
  const [localState, setLocalState] = useState({
    height: defaultHeight,
    isCollapsed: false,
  });

  if (!context) {
    return {
      height: localState.height,
      isCollapsed: localState.isCollapsed,
      setHeight: (h) => setLocalState((prev) => ({ ...prev, height: h })),
      setCollapsed: (c) =>
        setLocalState((prev) => ({ ...prev, isCollapsed: c })),
      toggleCollapsed: () =>
        setLocalState((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed })),
    };
  }

  const state = context.getHeightState(sharedHeightKey, defaultHeight);

  return {
    height: state.height,
    isCollapsed: state.isCollapsed,
    setHeight: (h) => context.setHeight(sharedHeightKey, h),
    setCollapsed: (c) => context.setCollapsed(sharedHeightKey, c),
    toggleCollapsed: () => context.toggleCollapsed(sharedHeightKey),
  };
}

export default DockedHeightContext;
