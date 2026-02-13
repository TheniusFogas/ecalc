import React from 'react';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import WeatherView from './WeatherView';

const ORASE_PRINCIPALE = ['Alba Iulia', 'Alexandria', 'Arad', 'Bacau', 'Baia Mare', 'Bistrita', 'Botosani', 'Braila', 'Brasov', 'Bucuresti', 'Buzau', 'Calarasi', 'Cluj-Napoca', 'Constanta', 'Craiova', 'Deva', 'Drobeta-Turnu Severin', 'Focsani', 'Galati', 'Giurgiu', 'Iasi', 'Miercurea Ciuc', 'Oradea', 'Piatra Neamt', 'Pitesti', 'Ploiesti', 'Ramnicu Valcea', 'Resita', 'Satu Mare', 'Sfantu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava', 'Targoviste', 'Targu Jiu', 'Targu Mures', 'Timisoara', 'Tulcea', 'Vaslui', 'Zalau'].sort();

const STATIUNI_SKI = [
  { name: 'Poiana Brasov', slug: 'poiana-brasov' },
  { name: 'Predeal', slug: 'predeal' },
  { name: 'Sinaia', slug: 'sinaia' },
  { name: 'Busteni', slug: 'busteni' },
  { name: 'Azuga', slug: 'azuga' },
  { name: 'Paltinis', slug: 'paltinis' },
  { name: 'Straja', slug: 'straja' },
  { name: 'Cavnic', slug: 'cavnic' }
];

const STATIUNI_MARE = [
  { name: 'Mamaia', slug: 'mamaia' },
  { name: 'Eforie Nord', slug: 'eforie-nord' },
  { name: 'Costinesti', slug: 'costinesti' },
  { name: 'Neptun', slug: 'neptun' },
  { name: 'Vama Veche', slug: 'vama-veche' },
  { name: 'Mangalia', slug: 'mangalia' },
  { name: 'Navodari', slug: 'navodari' }
];

const VARFURI_MUNTE = [
  { name: 'Varful Moldoveanu', slug: 'varful-moldoveanu' },
  { name: 'Varful Negoiu', slug: 'varful-negoiu' },
  { name: 'Varful Omu', slug: 'varful-omu' },
  { name: 'Varful Peleaga', slug: 'varful-peleaga' },
  { name: 'Varful Toaca', slug: 'varful-toaca' },
  { name: 'Sarmizegetusa', slug: 'sarmizegetusa' }
];

// SEO: Generam titlu si descriere unica pentru fiecare oras/sat
export async function generateMetadata({ params }) {
  const city = params.city.charAt(0).toUpperCase() + params.city.slice(1).replace(/-/g, ' ');
  return {
    title: `Vremea in ${city} - Prognoza Meteo Detaliata 2026`,
    description: `Afla starea vremii in ${city}. Temperatura reala, sanse de precipitatii si prognoza pe 14 zile. Date actualizate pentru ${city}.`,
    alternates: {
      canonical: `https://ecalc.ro/vreme/${params.city}`,
    },
  };
}

async function getWeatherData(cityName) {
  try {
    // Curatam numele orasului (eliminam cratimele pentru cautare)
    const searchName = cityName.replace(/-/g, ' ');
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=ro&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results) return null;
    const { latitude, longitude, name, admin1 } = geoData.results[0];

    const [weatherRes, nearbyRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility&hourly=temperature_2m,pm10,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=14`, { next: { revalidate: 3600 } }),
      // Cautam localitati in acelasi judet (admin1)
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(admin1 || name)}&count=40&language=ro&format=json`, { next: { revalidate: 86400 } })
    ]);

    const nearbyResults = await nearbyRes.json();
    // Filtram sa fie doar localitati din ROMANIA si din acelasi judet
    const countyPlaces = nearbyResults.results?.filter(p =>
      p.country_code === 'RO' &&
      p.admin1 === admin1 &&
      p.name !== name &&
      (p.feature_code === 'PPL' || p.feature_code === 'PPLA' || p.feature_code === 'PPLA2')
    ).slice(0, 20) || [];

    return {
      weather: { ...(await weatherRes.json()), cityName: name, region: admin1 },
      nearbyPlaces: countyPlaces
    };
  } catch (e) { return null; }
}

export default async function Page({ params }) {
  const data = await getWeatherData(params.city);

  if (!data) return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <NavigationHeader />
      <main className="flex-grow flex items-center justify-center">
        <h1 className="text-xl font-bold">Locatie negasita.</h1>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <NavigationHeader />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-6xl">
        <WeatherView
          weather={data.weather}
          nearbyPlaces={data.nearbyPlaces}
          ORASE_PRINCIPALE={ORASE_PRINCIPALE}
          STATIUNI_SKI={STATIUNI_SKI}
          STATIUNI_MARE={STATIUNI_MARE}
          VARFURI_MUNTE={VARFURI_MUNTE}
        />
      </main>
      <Footer />
    </div>
  );
}
