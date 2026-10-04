"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";

type StoreHistoryEntry = {
  key: string;
  previousUrl?: string;
};

type SavedScrollPosition = {
  x: number;
  y: number;
};

const historyEntryKey = "__storeNavigation";

function readEntry(): StoreHistoryEntry | undefined {
  const state: unknown = window.history.state;
  if (!state || typeof state !== "object") return undefined;

  const entry = (state as Record<string, unknown>)[historyEntryKey];
  if (!entry || typeof entry !== "object") return undefined;

  const { key, previousUrl } = entry as Record<string, unknown>;
  if (typeof key !== "string") return undefined;
  return {
    key,
    ...(typeof previousUrl === "string" ? { previousUrl } : {}),
  };
}

function writeEntry(entry: StoreHistoryEntry) {
  const state =
    window.history.state && typeof window.history.state === "object"
      ? (window.history.state as Record<string, unknown>)
      : {};
  window.history.replaceState({ ...state, [historyEntryKey]: entry }, "", window.location.href);
}

function currentUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function StoreNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const entryKey = useRef<string | undefined>(undefined);
  const lastUrl = useRef<string | undefined>(undefined);
  const pendingPop = useRef(false);
  const storageErrorLogged = useRef(false);
  const restoreFrame = useRef<number | undefined>(undefined);
  const scrollFrame = useRef<number | undefined>(undefined);

  const savePosition = useCallback((key: string) => {
    try {
      const position: SavedScrollPosition = { x: window.scrollX, y: window.scrollY };
      window.sessionStorage.setItem(`store-scroll:${key}`, JSON.stringify(position));
    } catch (error) {
      if (!storageErrorLogged.current) {
        console.error("Unable to save the store scroll position.", error);
        storageErrorLogged.current = true;
      }
    }
  }, []);

  const restorePosition = useCallback((key: string) => {
    if (restoreFrame.current !== undefined) cancelAnimationFrame(restoreFrame.current);
    let position: SavedScrollPosition | null = null;
    try {
      const saved = window.sessionStorage.getItem(`store-scroll:${key}`);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof (parsed as SavedScrollPosition).x === "number" &&
          typeof (parsed as SavedScrollPosition).y === "number"
        ) {
          position = parsed as SavedScrollPosition;
        }
      }
    } catch (error) {
      if (!storageErrorLogged.current) {
        console.error("Unable to restore the store scroll position.", error);
        storageErrorLogged.current = true;
      }
    }
    if (!position) return;

    let attempts = 0;
    const restore = () => {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxY >= position!.y || attempts >= 10) {
        const scrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        const maxX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
        window.scrollTo(Math.min(position!.x, maxX), Math.min(position!.y, maxY));
        document.documentElement.style.scrollBehavior = scrollBehavior;
        restoreFrame.current = undefined;
        return;
      }
      attempts += 1;
      restoreFrame.current = requestAnimationFrame(restore);
    };
    restoreFrame.current = requestAnimationFrame(() => {
      restoreFrame.current = requestAnimationFrame(restore);
    });
  }, []);

  const syncLocation = useCallback(() => {
    const url = currentUrl();
    if (lastUrl.current === url) return;

    const isPop = pendingPop.current;
    pendingPop.current = false;
    if (!isPop && entryKey.current) savePosition(entryKey.current);

    const existing = readEntry();
    const entry =
      isPop && existing
        ? existing
        : {
            key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            ...(lastUrl.current ? { previousUrl: lastUrl.current } : {}),
          };
    writeEntry(entry);
    entryKey.current = entry.key;
    lastUrl.current = url;

    if (isPop) restorePosition(entry.key);
  }, [restorePosition, savePosition]);

  useLayoutEffect(() => {
    const url = currentUrl();
    if (lastUrl.current === undefined) {
      const entry = readEntry() ?? { key: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
      writeEntry(entry);
      entryKey.current = entry.key;
      lastUrl.current = url;
      return;
    }

    if (lastUrl.current !== url) syncLocation();
  }, [routeKey, syncLocation]);

  useLayoutEffect(() => {
    const onPopState = () => {
      pendingPop.current = true;
    };
    const onScroll = () => {
      if (scrollFrame.current !== undefined) return;
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = undefined;
        if (entryKey.current !== undefined) savePosition(entryKey.current);
      });
    };
    const onPageHide = () => {
      if (entryKey.current !== undefined) savePosition(entryKey.current);
    };
    const onHashChange = () => syncLocation();

    window.addEventListener("popstate", onPopState);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("hashchange", onHashChange);
      if (restoreFrame.current !== undefined) cancelAnimationFrame(restoreFrame.current);
      if (scrollFrame.current !== undefined) cancelAnimationFrame(scrollFrame.current);
    };
  }, [savePosition, syncLocation]);

  return null;
}
