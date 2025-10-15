export function withinLastHours(iso: string | undefined, hours: number): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return true;
  return Date.now() - t <= hours * 60 * 60 * 1000;
}

export function within72Hours(iso?: string): boolean {
  return withinLastHours(iso, 72);
}
