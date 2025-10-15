import React, { useLayoutEffect, useRef } from 'react';

type AnimatedHeightProps = {
  children: React.ReactNode;
  duration?: number; // ms
  easing?: string; // CSS timing function
  className?: string;
};

/**
 * Smoothly animates height changes of its children using a simple FLIP-style approach.
 * This reduces layout jumps when list size changes (e.g., after filtering).
 */
export default function AnimatedHeight({
  children,
  duration = 280,
  easing = 'cubic-bezier(.2,.9,.25,1)',
  className,
}: AnimatedHeightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = el.offsetHeight; // current rendered height
    // Temporarily set height to 'auto' to read target height of new content
    const prevHeight = el.style.height;
    el.style.height = 'auto';
    const target = el.scrollHeight; // desired height
    el.style.height = prevHeight || `${start}px`;

    if (start === target) {
      // No change, ensure clean state
      el.style.height = 'auto';
      el.style.transition = '';
      el.style.overflow = '';
      return;
    }

    // Prepare for transition
    el.style.overflow = 'hidden';
    // Force reflow to apply the starting height
    void el.offsetHeight;
    el.style.transition = `height ${duration}ms ${easing}`;
    el.style.height = `${target}px`;

    const handleEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== 'height') return;
      el.style.transition = '';
      el.style.height = 'auto';
      el.style.overflow = '';
    };
    el.addEventListener('transitionend', handleEnd, { once: true });
    return () => {
      el.removeEventListener('transitionend', handleEnd);
    };
  });

  return (
    <div ref={ref} className={className} style={{ height: 'auto', willChange: 'height' }}>
      {children}
    </div>
  );
}
