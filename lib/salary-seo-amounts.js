/**
 * Single source of truth for the curated set of salary amounts eCalc pre-renders SEO pages
 * for (/calculator-salarii-pro/{year}/{amount}-brut-lei etc).
 *
 * WHY THIS EXISTS (audit 2026-08-11, per explicit product direction): the old "vezi și
 * salariul de X" widget built links directly from whatever a visitor typed into the
 * calculator (`val + 100`, `val - 50`, ...) — an unbounded, uncontrolled set of pages,
 * literally one per possible user input. The fix isn't fewer pages — the competitor ranking
 * #1 does the same "many amount pages" strategy successfully — it's a BOUNDED, curated list
 * that both the sitemap AND the "related amounts" links draw from, so every linked/indexed
 * page is one we actually pre-render with real, distinct content (see [slug]/page.js).
 * Add more values here to grow coverage on purpose; nothing outside this list gets linked to.
 */
export const POPULAR_SALARY_AMOUNTS = [
  1000, 2000, 3000, 3700, 4000, 4050, 4325, 4500, 4850, 5000,
  5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000,
  11000, 12000, 13000, 15000, 18000, 20000, 25000, 30000,
];

// Returns the N amounts from the curated list closest to `value`, excluding `value` itself —
// used for the "vezi și salariul de..." related-links widget so it stays contextually
// relevant without ever generating a link to an amount that isn't actually pre-rendered.
export function nearestPopularAmounts(value, count = 4) {
  const target = Number(value);
  if (!Number.isFinite(target) || target <= 0) return [];
  return POPULAR_SALARY_AMOUNTS
    .filter((amount) => amount !== target)
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
    .slice(0, count)
    .sort((a, b) => a - b);
}
