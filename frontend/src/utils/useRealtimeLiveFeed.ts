import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRealtimeLiveFeedOptions<T> {
  fetchFn: () => Promise<T[] | undefined>;
  intervalMs?: number;
  enabled?: boolean;
}

export function useRealtimeLiveFeed<T extends { id?: number | string }>({
  fetchFn,
  intervalMs = 2500,
  enabled = true,
}: UseRealtimeLiveFeedOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [pendingNewCount, setPendingNewCount] = useState<number>(0);
  const [isFrozenOnScroll, setIsFrozenOnScroll] = useState<boolean>(false);
  const [recentNewIds, setRecentNewIds] = useState<Set<number | string>>(new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<T[]>([]);
  itemsRef.current = items;

  const pendingItemsRef = useRef<T[]>([]);
  const isFetchingRef = useRef<boolean>(false);
  const isFrozenRef = useRef<boolean>(false);
  isFrozenRef.current = isFrozenOnScroll;

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Actualizare inițială sau forțată manual (încarcă ultimele 50)
  const refreshNow = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const incoming = await fetchFnRef.current();
      if (incoming && Array.isArray(incoming)) {
        // La pornire afișăm ultimele 50 de elemente
        const initialFifty = incoming.slice(0, 50);
        setItems(initialFifty);
        pendingItemsRef.current = [];
        setPendingNewCount(0);
      }
    } catch {
      // Ignorăm erorile pasagere de rețea
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Handler de scroll pe containerul tabelului
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const top = containerRef.current.scrollTop;
    const scrolled = top > 25;

    if (scrolled !== isFrozenRef.current) {
      setIsFrozenOnScroll(scrolled);
      // Dacă a revenit sus (top <= 25) și avem date noi în așteptare, le aplicăm instant în top
      if (!scrolled && pendingItemsRef.current.length > 0) {
        const toPrepend = [...pendingItemsRef.current];
        pendingItemsRef.current = [];
        setPendingNewCount(0);
        setItems((prev) => [...toPrepend, ...prev]);
        setRecentNewIds((prev) => new Set([...prev, ...toPrepend.map((it) => it.id!)]));
      }
    }
  }, []);

  // Revenire manuală la ultimele rezultate (deblocare flux live)
  const resumeLiveStream = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsFrozenOnScroll(false);
    if (pendingItemsRef.current.length > 0) {
      const toPrepend = [...pendingItemsRef.current];
      pendingItemsRef.current = [];
      setPendingNewCount(0);
      setItems((prev) => [...toPrepend, ...prev]);
      setRecentNewIds((prev) => new Set([...prev, ...toPrepend.map((it) => it.id!)]));
    }
  }, []);

  // Curățare automată a highlight-ului după 2.5s
  useEffect(() => {
    if (recentNewIds.size === 0) return;
    const timer = setTimeout(() => {
      setRecentNewIds(new Set());
    }, 2500);
    return () => clearTimeout(timer);
  }, [recentNewIds]);

  // Polling în fundal non-blocant la fiecare interval
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: any = null;
    let isCancelled = false;

    // Încărcare inițială o singură dată la montare/activare
    refreshNow();

    const scheduleNext = () => {
      if (!isCancelled && enabled) {
        timeoutId = setTimeout(poll, intervalMs);
      }
    };

    const poll = async () => {
      if (isCancelled || !enabled) return;
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        try {
          const incoming = await fetchFnRef.current();
          if (!isCancelled && incoming && Array.isArray(incoming)) {
            // Dacă lista curentă este goală, încărcăm primele 50
            if (itemsRef.current.length === 0) {
              setItems(incoming.slice(0, 50));
              setPendingNewCount(0);
            } else {
              // Identificăm elementele nou create care nu se află încă în lista curentă
              const currentIds = new Set(itemsRef.current.map((it) => it.id));
              const pendingIds = new Set(pendingItemsRef.current.map((it) => it.id));
              const genuinelyNew = incoming.filter(
                (it) => it.id !== undefined && !currentIds.has(it.id) && !pendingIds.has(it.id)
              );

              if (genuinelyNew.length > 0) {
                // Dacă utilizatorul este sus la capul tabelului: CASCADĂ DIRECTĂ ÎN TOP!
                // Rândurile existente coboară cu o poziție, iar cel nou apare pe prima poziție
                if (!isFrozenRef.current) {
                  setItems((prev) => [...genuinelyNew, ...prev]);
                  setRecentNewIds((prev) => new Set([...prev, ...genuinelyNew.map((it) => it.id!)]));
                  setPendingNewCount(0);
                } else {
                  // Utilizatorul inspectează o linie derulată: acumulăm fără a sări rândurile
                  pendingItemsRef.current = [...genuinelyNew, ...pendingItemsRef.current];
                  setPendingNewCount(pendingItemsRef.current.length);
                }
              }
            }
          }
        } catch {
          // Ignorăm erorile pasagere de rețea în fundal
        } finally {
          isFetchingRef.current = false;
        }
      }

      scheduleNext();
    };

    scheduleNext();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs, refreshNow]);

  return {
    items,
    setItems,
    pendingNewCount,
    isFrozenOnScroll,
    recentNewIds,
    containerRef,
    handleScroll,
    resumeLiveStream,
    refreshNow,
  };
}

