import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SimMode, SimState, ReplayBundle } from './types';
import { createInitialState, setMode as applyMode, tick, DEMO_STEPS } from './engine';
import { DATASETS } from '@/data/datasets';

interface SimContextValue {
  state: SimState;
  setMode: (mode: SimMode) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  restartDemo: () => void;
  setDataset: (id: string | null) => void;
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
  const bundleRef = useRef<ReplayBundle | null>(null);

  // Main simulation tick — every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => tick(s, bundleRef.current));
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
        setState((s) => applyMode(s, next, bundleRef.current));
        advanceLifecycle(next);
      }, duration);
    }
  };

  const setMode = (mode: SimMode) => {
    clearLifecycle();
    setState((s) => applyMode(s, mode, bundleRef.current));
    // Start auto-progression for attack/spike scenarios
    if (mode === 'spike' || mode === 'httpflood' || mode === 'ddos') {
      advanceLifecycle(mode);
    }
  };

  const runDemoStep = (index: number) => {
    if (index >= DEMO_STEPS.length) {
      setDemoRunning(false);
      setDemoStepIndex(-1);
      setState((s) => applyMode(s, 'restored', bundleRef.current));
      setTimeout(() => setState((s) => applyMode(s, 'normal', bundleRef.current)), 2500);
      return;
    }
    if (demoPausedRef.current) return;
    const step = DEMO_STEPS[index];
    setDemoStepIndex(index);
    setState((s) => applyMode(s, step.mode, bundleRef.current));
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
    setState((s) => applyMode(s, 'normal', bundleRef.current));
    setTimeout(() => runDemoStep(0), 300);
  };

  const setDataset = (id: string | null) => {
    if (id === null) {
      bundleRef.current = null;
      setState((s) => ({ ...s, datasetId: null, datasetName: null, datasetStatus: 'synthetic' }));
      return;
    }

    const meta = DATASETS.find((d) => d.id === id);
    if (!meta?.replay.available || !meta.replay.bundlePath) return;

    fetch(meta.replay.bundlePath)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((bundle: ReplayBundle) => {
        if (!bundle?.benign?.length && !bundle?.attack?.length) throw new Error('empty bundle');
        bundleRef.current = bundle;
        setState((s) => ({ ...s, datasetId: id, datasetName: meta.name, datasetStatus: 'replay' }));
      })
      .catch((err) => {
        console.warn(`Dataset "${id}" could not be loaded, staying on built-in simulation:`, err);
        bundleRef.current = null;
        setState((s) => ({ ...s, datasetId: null, datasetName: null, datasetStatus: 'synthetic' }));
      });
  };

  const currentStep = demoStepIndex >= 0 ? DEMO_STEPS[demoStepIndex] : null;
  const demoStepsMeta = DEMO_STEPS.map((s) => ({ label: s.label, duration: s.duration }));

  const value: SimContextValue = {
    state,
    setMode,
    startDemo,
    pauseDemo,
    restartDemo,
    setDataset,
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
