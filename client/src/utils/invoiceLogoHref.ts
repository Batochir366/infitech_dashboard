/**
 * Absolute URL to `public/logo_black.png` (respects Vite `import.meta.env.BASE_URL`).
 * Use for HTML `<img src>` and for `fetch` before embedding in PDF.
 */
export function invoiceLogoHref(): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin).href;
  return new URL("logo_black.png", base).href;
}
