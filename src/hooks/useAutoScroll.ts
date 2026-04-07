import { useEffect, useRef, useCallback, type RefObject } from "react";

const SCROLL_THRESHOLD = 30;

/**
 * Auto-scrolls a scrollable element to the bottom when content changes,
 * unless the user has manually scrolled up.
 *
 * Returns a ref to attach to the scrollable element.
 */
export function useAutoScroll<T extends HTMLElement>(
  content: string | null | undefined
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const userIsAtBottom = useRef(true);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    userIsAtBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to bottom when content changes (if user is at bottom)
  useEffect(() => {
    const el = ref.current;
    if (!el || !content) return;
    if (userIsAtBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [content]);

  return ref;
}
