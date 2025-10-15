export function buildWhatsAppHref(baseUrl: string | undefined, message: string): string {
  if (!baseUrl) return '#';
  try {
    const url = new URL(baseUrl);
    const hasText = url.searchParams.has('text');
    if (!hasText) url.searchParams.set('text', message);
    return url.toString();
  } catch {
    // If it's not a full URL, return as-is
    return baseUrl;
  }
}
