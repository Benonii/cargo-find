import { useEffect, useState } from 'react';

const showForMs = 3600;
const leaveForMs = 320;

export const useSuggestionCycle = (count: number, paused: boolean) => {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (paused) {
      setLeaving(false);
      return;
    }
    const leaveTimer = window.setTimeout(() => setLeaving(true), showForMs);
    const nextTimer = window.setTimeout(() => {
      setLeaving(false);
      setIndex((current) => (current + 1) % count);
    }, showForMs + leaveForMs);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(nextTimer);
    };
  }, [index, paused, count]);

  return { index, leaving };
};
