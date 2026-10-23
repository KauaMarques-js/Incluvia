'use client';

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import type { ApiResponse } from '@/lib/api-client';

interface ResourceState<T> {
  data: T | null;
  pagination: ApiResponse<T>['pagination'];
  error: Error | null;
  loading: boolean;
  /** Recarrega os dados; `silent` mantém o conteúdo atual na tela (usado em polling). */
  reload: (options?: { silent?: boolean }) => Promise<void>;
}

/**
 * Carrega um recurso da API com estados de carregamento, erro e recarga (§6.5).
 * Respostas antigas são descartadas para evitar condições de corrida entre filtros.
 */
export function useResource<T>(load: () => Promise<ApiResponse<T>>, deps: DependencyList): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [pagination, setPagination] = useState<ApiResponse<T>['pagination']>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  const requestId = useRef(0);
  loadRef.current = load;

  const reload = useCallback(async ({ silent = false } = {}) => {
    const current = ++requestId.current;
    if (!silent) setLoading(true);
    try {
      const res = await loadRef.current();
      if (current !== requestId.current) return;
      setData(res.data);
      setPagination(res.pagination);
      setError(null);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(err instanceof Error ? err : new Error('Falha ao carregar dados.'));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, pagination, error, loading, reload };
}

/** Atrasa a propagação de um valor (ex.: busca digitada) para evitar uma requisição por tecla. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
