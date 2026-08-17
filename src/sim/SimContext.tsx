import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SimMode, SimState } from './types';
import { createInitialState, setMode as applyMode, tick, DEMO_STEPS } from './engine';

interface SimContextValue {
  state: SimState;
  setMode: (mode: SimMode) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  restartDemo: () => void;
  isDemoRunning: boolean;
  demoStepIndex: number;
  demoTotalSteps: number;
  demoStepLabel: string;
}

const SimContext = createContext<SimContextValue | null>(null);

// Auto-lifecycle timings (ms): how long each phase lasts before auto-advancing
const LIFECYCLE: { mode: SimMode; duration: number; next: SimMode }[] = [
  { mode: 'spike', duration: 5000, next: 'normal' },
  { mode: 'httpflood', duration: 5000, next: 'mitigating' },
  { mode: 'ddos', duration: 6000, next: 'mitigating' },
  { mode: 'mitigating', duration: 6000, next: 'recovering' },
  { mode: 'recovering', duration: 8000, next: 'restored' },
  { mode: 'restored', duration: 3000, next: 'normal' },
];

const lifecycleDurationFor = (mode: SimMode): number | null => {
  const entry = LIFECYCLE.find((l) => l.mode === mode);
  return entry ? entry.duration : null;
};
const lifecycleNextFor = (mode: SimMode): SimMode | null => {
  const entry = LIFECYCLE.find((l) => l.mode === mode);
  return entry ? entry.next : null;
};

export function SimProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimState>(() => createInitialState());
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(-1);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifecycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoPausedRef = useRef(false);

  // Main simulation tick — every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => tick(s));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearLifecycle = () => {
    if (lifecycleTimerRef.current) {
      clearTimeout(lifecycleTimerRef.current);
      lifecycleTimerRef.current = null;
    }
  };

  const advanceLifecycle = (mode: SimMode) => {
    clearLifecycle();
    const duration = lifecycleDurationFor(mode);
    const next = lifecycleNextFor(mode);
    if (duration !== null && next !== null) {
      lifecycleTimerRef.current = setTimeout(() => {
        setState((s) => applyMode(s, next));
        advanceLifecycle(next);
      }, duration);
    }
  };

  const setMode = (mode: SimMode) => {
    clearLifecycle();
    setState((s) => applyMode(s, mode));
    // Start auto-progression for attack/spike scenarios
    if (mode === 'spike' || mode === 'httpflood' || mode === 'ddos') {
      advanceLifecycle(mode);
    }
  };

  const runDemoStep = (index: number) => {
    if (index >= DEMO_STEPS.length) {
      setDemoRunning(false);
      setDemoStepIndex(-1);
      setState((s) => applyMode(s, 'restored'));
      setTimeout(() => setState((s) => applyMode(s, 'normal')), 2500);
      return;
    }
    if (demoPausedRef.current) return;
    const step = DEMO_STEPS[index];
    setDemoStepIndex(index);
    setState((s) => applyMode(s, step.mode));
    demoTimerRef.current = setTimeout(() => runDemoStep(index + 1), step.duration);
  };

  const startDemo = () => {
    clearLifecycle();
    setDemoRunning(true);
    demoPausedRef.current = false;
    runDemoStep(0);
  };

  const pauseDemo = () => {
    demoPausedRef.current = true;
    setDemoRunning(false);
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
  };

  const restartDemo = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    clearLifecycle();
    demoPausedRef.current = false;
    setDemoRunning(true);
    setState((s) => applyMode(s, 'normal'));
    setTimeout(() => runDemoStep(0), 300);
  };

  const currentStep = demoStepIndex >= 0 ? DEMO_STEPS[demoStepIndex] : null;
  const demoStepsMeta = DEMO_STEPS.map((s) => ({ label: s.label, duration: s.duration }));

  const value: SimContextValue = {
    state,
    setMode,
    startDemo,
    pauseDemo,
    restartDemo,
    isDemoRunning: demoRunning,
    demoStepIndex,
    demoTotalSteps: DEMO_STEPS.length,
    demoStepLabel: currentStep?.label ?? '',
  };

  return (
    <SimContext.Provider value={value}>
      <SimContextExtra.Provider value={{ demoSteps: demoStepsMeta }}>{children}</SimContextExtra.Provider>
    </SimContext.Provider>
  );
}

const SimContextExtra = createContext<{ demoSteps: { label: string; duration: number }[] }>({ demoSteps: [] });

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useSim must be used within SimProvider');
  return ctx;
}

export function useDemoSteps() {
  return useContext(SimContextExtra).demoSteps;
}
