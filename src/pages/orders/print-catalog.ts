import { useEffect, useState } from 'react';
import apiClient from '../../providers/rest-client';
import type { IPrintAddon, IPrintPaper } from './types';

export const usePrintCatalog = () => {
  const [papers, setPapers] = useState<IPrintPaper[]>([]);
  const [addons, setAddons] = useState<IPrintAddon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [papersRes, addonsRes] = await Promise.all([
          apiClient.get<{ papers: IPrintPaper[] }>('/printing/papers', {
            params: { limit: 100, active: true },
          }),
          apiClient.get<{ addons: IPrintAddon[] }>('/printing/addons', {
            params: { limit: 100, active: true },
          }),
        ]);
        if (cancelled) return;
        setPapers(papersRes.data?.papers || []);
        setAddons(addonsRes.data?.addons || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { papers, addons, loading };
};

export const computePrintUnitPrice = (
  paper: IPrintPaper | undefined,
  selectedAddons: IPrintAddon[]
): number => {
  if (!paper) return 0;
  let total = paper.price_per_sheet;
  let percentSum = 0;
  for (const addon of selectedAddons) {
    if (addon.price_type === 'fixed') {
      total += addon.price_value;
    } else {
      percentSum += addon.price_value;
    }
  }
  total += total * (percentSum / 100);
  return Math.round(total * 100) / 100;
};
