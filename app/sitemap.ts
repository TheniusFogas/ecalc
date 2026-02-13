import { MetadataRoute } from 'next'
import { CITIES_ROMANIA } from '../lib/cities-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ecalc.ro'
  const years = [2024, 2025, 2026]

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
  // Generăm link-uri din 100 în 100 RON între 3700 și 20000
  const salarySteps = []
  for (let s = 3700; s <= 20000; s += 100) {
    salarySteps.push(s)
  }
  // Adăugăm sume fixe/rotunde importante
  const fixedSalaries = [1000, 4050, 4325, 4850, 5500, 10000, 15000, 20000]
  const allSalaryValues = Array.from(new Set([...salarySteps, ...fixedSalaries])).sort((a, b) => a - b)

  const salaryPages = years.flatMap(year =>
    allSalaryValues.flatMap(val => [
      { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-brut-${val}-lei`, lastModified: new Date() },
      { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-net-${val}-lei`, lastModified: new Date() }
    ])
  )

  // Rute specifice SEO Salariu Minim
  const specificSalarySEO = years.flatMap(year => [
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-pe-economie-${year}`, lastModified: new Date() },
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-constructii-${year}`, lastModified: new Date() },
    { url: `${baseUrl}/calculator-salarii-pro/${year}/salariu-minim-agricultura-${year}`, lastModified: new Date() }
  ])

  // 3. METEO - Toate cele 320 orașe din bază
  const locations = CITIES_ROMANIA.map(city => {
    // Normalizare slug: "Alba Iulia" -> "alba-iulia"
    const slug = city.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Scoate diacriticele
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return {
      url: `${baseUrl}/vreme/${slug}`,
      lastModified: new Date()
    }
  })

  // Adăugăm și locațiile speciale (stațiuni/aeroporturi) care s-ar putea să nu fie în CITIES_ROMANIA
  const specialLocations = [
    'mamaia', 'costinesti', 'vama-veche', 'neptun', 'olimp', 'jupiter', 'venus', 'saturn', 'eforie-nord', 'eforie-sud', '2-mai', 'corbu', 'tuzla',
    'sinaia', 'predeal', 'busteni', 'azuga', 'poiana-brasov', 'paltinis', 'straja', 'ranca', 'vatra-dornei', 'cavnic', 'balea-lac', 'voineasa', 'durau', 'arieseni', 'semenic', 'cota-2000-sinaia',
    'baile-felix', 'baile-herculane', 'sovata', 'covasna', 'calimanesti', 'caciulata', 'baile-olanesti', 'slanic-moldova', 'borsec', 'praid', 'baile-tusnad', 'ocna-sibiului',
    'aeroport-otopeni', 'aeroport-cluj', 'aeroport-timisoara', 'delta-dunarii', 'transfagarasan'
  ].map(slug => ({
    url: `${baseUrl}/vreme/${slug}`,
    lastModified: new Date()
  }))

  // Combinăm tot (Total estimat: ~4000-5000 link-uri)
  return [
    ...coreRoutes,
    ...salaryPages,
    ...specificSalarySEO,
    ...locations,
    ...specialLocations
  ]
}
