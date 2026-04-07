import { useEffect, useRef, useCallback, type RefCallback } from "react";

const SCROLL_THRESHOLD = 30;

/**
 * Auto-scrolls a scrollable element to the bottom when content changes,
 * unless the user has manually scrolled up.
 *
 * Returns a callback ref to attach to the scrollable element.
 */
export function useAutoScroll<T extends HTMLElement>(
  content: string | null | undefined
): RefCallback<T> {
  const elRef = useRef<T | null>(null);
  const userIsAtBottom = useRef(true);
  const listenerAttached = useRef(false);

  const handleScroll = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    userIsAtBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  // Callback ref: fires whenever the DOM element mounts or changes
  const callbackRef = useCallback(
    (node: T | null) => {
      // Clean up old listener
      if (elRef.current && listenerAttached.current) {
        elRef.current.removeEventListener("scroll", handleScroll);
        listenerAttached.current = false;
      }
      elRef.current = node;
      // Attach listener to new element
      if (node) {
        node.addEventListener("scroll", handleScroll, { passive: true });
        listenerAttached.current = true;
      }
    },
    [handleScroll]
  );

  // Scroll to bottom when content changes (if user is at bottom)
  useEffect(() => {
    const el = elRef.current;
    if (!el || !content) return;
    if (userIsAtBottom.current) {
      requestAnimationFrame(() => {
        if (elRef.current) {
          elRef.current.scrollTop = elRef.current.scrollHeight;
        }
      });
    }
  }, [content]);

  return callbackRef;
}
