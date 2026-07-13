'use client';

import { useEffect, useState } from 'react';

/**
 * True below Tailwind's `sm` breakpoint. Popovers anchored to a trigger get
 * squeezed against the bottom of a phone screen (and fight the keyboard and the
 * bottom tab bar), so on mobile we render them as bottom sheets instead.
 */
export function useIsMobile(query = '(max-width: 639px)') {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
