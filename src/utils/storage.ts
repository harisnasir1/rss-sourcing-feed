export type ItemUI = {
  favorite?: boolean;
  contacted?: boolean;
  archived?: boolean;
  note?: string;
};

export type ItemUIMap = Record<string, ItemUI>;

const K_UI = 'feed_ui_map';

const safeParse = <T,>(k: string, d: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : d;
  } catch {
    return d;
  }
};

const safeSet = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

export const loadItemUIMap = (): ItemUIMap => safeParse<ItemUIMap>(K_UI, {});
export const saveItemUIMap = (m: ItemUIMap) => safeSet(K_UI, m);
