'use client';

import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = 16; // ~60fps
    const totalSteps = Math.ceil(totalMiliseconds / incrementTime);
    const stepIncrement = (end - start) / totalSteps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const nextCount = Math.round(start + stepIncrement * step);
      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(nextCount);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}
