import { MetadataRoute } from 'next'
import { CITIES_ROMANIA } from '../lib/cities-data'
import { MOUNTAIN_RESORTS_ZONES, ALL_COASTAL_RESORTS, ROMANIAN_MOUNTAIN_PEAKS } from '../lib/resorts-data'
import { ROMANIA_COUNTIES } from '../lib/counties-data'
import { POPULAR_SALARY_AMOUNTS } from '../lib/salary-seo-amounts'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ecalc.ro'
  const years = [2024, 2025, 2026]

  // Helper for consistent slug generation
  const normalizeSlug = (name: string) => name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // 1. Rutele de bază și Calculatoarele principale pentru toți anii
  const coreRoutes = years.flatMap(year => [
    `/calculator-salarii-pro/${year}`,
    `/calculator-pfa/${year}`,
    `/decision-maker/${year}`,
    `/calculator-concediu-medical/${year}`,
    `/calculator-impozit-auto/${year}`,
    `/calculator-imobiliare-pro/${year}`,
    `/calculator-efactura/${year}`,
    `/calculator-compensatii-zboruri/${year}`,
    `/zile-lucratoare/${year}`,
    `/zile-libere/${year}`
  ]).concat(['', '/vreme']).map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }))

  // 2. SALARII - Generare PROGRAMATICĂ a link-urilor (Masiv)
  // FIX (audit 2026-08-11): the old slugs were `salariu-brut-{val}-lei` — but parseSlug() in
  // [slug]/page.js requires the slug to START with digits to extract an amount. "salariu-..."
  // never matched, so all 90 of these URLs silently fell back to the SAME "salariu minim"
  // content and title, submitted to Google as 90 near-identical pages. New format
  // (`{val}-brut-lei` / `{val}-net-lei`) actually matches the parser, so each URL renders its
  // own amount, its own title, its own numbers.
  const allSalaryValues = POPULAR_SALARY_AMOUNTS

  const salaryPages = years.flatMap(year =>
    allSalaryValues.flatMap(val => [
      { url: `${baseUrl}/calculator-salarii-pro/${year}/${val}-brut-lei`, lastModified: new Date() },
      { url: `${baseUrl}/calculator-salarii-pro/${year}/${val}-net-lei`, lastModified: new Date() }
    ])
  )

  const specificSalarySEO = years.flatMap(year => [
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-pe-economie-${year}`, lastModified: new Date() },
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-constructii-${year}`, lastModified: new Date() },
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-agricultura-${year}`, lastModified: new Date() }
  ])

  // 3. METEO - Orașe (200+)
  const locations = CITIES_ROMANIA.map(city => ({
    url: `${baseUrl}/vreme/${normalizeSlug(city.name)}`,
    lastModified: new Date()
  }))

  // 4. LOCAȚII SPECIALE (Stațiuni, Litoral, Vârfuri)
  const mountainSlugs = MOUNTAIN_RESORTS_ZONES.flatMap(z => z.items.map(i => i.slug))
  const coastalSlugs = ALL_COASTAL_RESORTS.map(s => s.slug)
  const peakSlugs = ROMANIAN_MOUNTAIN_PEAKS.map(p => p.slug)
  const extraSlugs = ['transfagarasan', 'aeroport-otopeni', 'aeroport-cluj', 'aeroport-timisoara', 'delta-dunarii']

  const specialLocations = Array.from(new Set([...mountainSlugs, ...coastalSlugs, ...peakSlugs, ...extraSlugs])).map(slug => ({
    url: `${baseUrl}/vreme/${slug}`,
    lastModified: new Date()
  }))

  // 5. JUDETE - Indexare programatica pentru cele 42 de judete
  const countyPages = ROMANIA_COUNTIES.map(judet => ({
    url: `${baseUrl}/vreme/judet/${judet.slug}`,
    lastModified: new Date()
  }))

  // Combinăm tot (Total estimat: ~4000-5000 link-uri)
  return [
    ...coreRoutes,
    ...salaryPages,
    ...specificSalarySEO,
    ...locations,
    ...specialLocations,
    ...countyPages
  ]
}
