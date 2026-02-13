"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudSun, Wind, Droplets, Sun, Eye, Gauge, Umbrella, Thermometer, Search, Info, Snowflake, Triangle } from 'lucide-react';

const getWeatherIcon = (code, isNight = false) => {
  if (isNight) return <span className="text-2xl" role="img" aria-label="Noapte">🌙</span>;
  if (code === 0) return <Sun className="h-6 w-6 text-yellow-500" />;
  if (code <= 3) return <CloudSun className="h-6 w-6 text-blue-400" />;
  if (code <= 67) return <Umbrella className="h-6 w-6 text-blue-500" />;
  if (code <= 99) return <span className="text-2xl" role="img" aria-label="Furtuna">⚡</span>;
  return <CloudSun className="h-6 w-6 text-slate-400" />;
};

const generateSEOStory = (cityName, weather, currentYear) => {
  const temp = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(weather.current.apparent_temperature);
  const condition = weather.current.weather_code === 0 ? 'senin' : 'variabil';

  return (
    <div className="mt-16 bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed">
      <div className="flex items-center gap-3 mb-4">
        <Info className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Vremea in {cityName} - Ghid si Info Meteo {currentYear}</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p>
            Daca te intrebi cum este <strong>vremea in {cityName}</strong> astazi, datele noastre indica o temperatura de <strong>{temp}°C</strong>, resimtita ca fiind <strong>{feelsLike}°C</strong>.
            Sistemul de monitorizare <strong>meteo {cityName}</strong> actualizeaza in timp real parametrii critici precum umiditatea de {weather.current.relative_humidity_2m}% si viteza vantului de {weather.current.wind_speed_10m} km/h.
          </p>
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-md">
            <Sun className="h-5 w-5 text-orange-500 shrink-0 mt-1" />
            <p className="text-sm">
              Pentru cei care planifica activitati in aer liber, <strong>prognoza meteo in {cityName} pe 7 zile</strong> este esentiala.
              Fie ca vorbim de temperaturile maxime sau de sansele de precipitatii, o verificare rapida te poate salva de surprize neplacute.
              Informatiile noastre sunt colectate via satelit si prelucrate pentru a oferi cea mai buna acuratete locala.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p>
            Analizand rubrica <strong>meteo 7 zile {cityName} si tara</strong>, observam tendinte de stabilizare a vremii.
            In {cityName}, clima este influentata direct de regiunea {weather.region}, fapt ce asigura un microclimat specific.
            Urmarim constant indicele UV si presiunea atmosferica pentru a oferi un tablou complet.
          </p>
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-md">
            <Wind className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
            <p className="text-sm">
              Nu uita: <strong>vremea in {cityName}</strong> se poate schimba rapid.
              Datele noastre despre <strong>vremea pe 14 zile in {cityName}</strong> includ si probabilitatea maxima de precipitatii zilnice,
              ajutand la planificarea calatoriilor sau a proiectelor de constructie care depind de conditiile atmosferice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WeatherView({ weather, nearbyPlaces, ORASE_PRINCIPALE, STATIUNI_SKI, STATIUNI_MARE, VARFURI_MUNTE }) {
  const router = useRouter();
  const [cityInput, setCityInput] = useState('');
  const currentYear = new Date().getFullYear();

  const handleSearch = () => {
    if (cityInput) router.push(`/vreme/${cityInput.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar - Optimizat pentru Accesibilitate */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 mb-6">
        <label htmlFor="city-search" className="sr-only">Cauta localitate</label>
        <input
          id="city-search"
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cauta alt oras..."
          className="flex-1 px-4 outline-none font-medium text-slate-700 placeholder-slate-500"
        />
        <button
          onClick={handleSearch}
          aria-label="Executa cautarea"
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Cauta</span>
        </button>
      </div>

      {/* Dashboard Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-5 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl group transition-all duration-700 bg-gradient-to-br ${weather.current.temperature_2m > 30 ? 'from-orange-500 to-red-600' :
          weather.current.temperature_2m < 5 ? 'from-slate-700 to-slate-900' :
            'from-blue-600 to-indigo-700'
          }`}>
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-1 leading-tight">{weather.cityName}</h1>
            <p className="text-blue-50 font-bold text-sm uppercase tracking-widest mb-8 opacity-90">
              {weather.region} {currentYear}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-8xl font-black tracking-tighter tabular-nums">{Math.round(weather.current.temperature_2m)}°</span>
              <div>
                <p className="text-xl font-bold opacity-100 text-white">
                  Simtit: {Math.round(weather.current.apparent_temperature)}°
                </p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-30 group-hover:opacity-50 transition-all duration-500 transform group-hover:rotate-12" aria-hidden="true">
            {getWeatherIcon(weather.current.weather_code, weather.current.temperature_2m)}
          </div>
        </div>

        {/* Widget-uri detaliate - Corectie contrast text */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { l: 'Vânt', v: `${weather.current.wind_speed_10m} km/h`, i: Wind, c: 'text-blue-600' },
            { l: 'Umiditate', v: `${weather.current.relative_humidity_2m}%`, i: Droplets, c: 'text-cyan-600' },
            { l: 'UV Max', v: weather.daily.uv_index_max[0], i: Sun, c: 'text-orange-600' },
            { l: 'Aer (AQI)', v: weather.hourly.pm10[0] > 50 ? 'Moderat' : 'Excelent', i: Gauge, c: 'text-emerald-600' },
            { l: 'Presiune', v: `${Math.round(weather.current.surface_pressure)} hPa`, i: Gauge, c: 'text-slate-600' },
            { l: 'Vizibilitate', v: `${weather.current.visibility / 1000} km`, i: Eye, c: 'text-blue-500' },
            { l: 'Șanse Ploaie', v: `${weather.daily.precipitation_probability_max[0]}%`, i: Umbrella, c: 'text-indigo-600' },
            { l: 'Temp. Min', v: `${Math.round(weather.daily.temperature_2m_min[0])}°`, i: Thermometer, c: 'text-rose-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <item.i className={`h-7 w-7 ${item.c} mb-1`} aria-hidden="true" />
              <span className="text-[10px] font-black text-slate-600 uppercase leading-tight">{item.l}</span>
              <span className="text-base font-black text-slate-900 leading-tight">{item.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evolutie pe Ore - Redesign MD3 Compact fara Scroll */}
      <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm" aria-labelledby="hourly-forecast">
        <h2 id="hourly-forecast" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Gauge className="h-3 w-3" />
          Următoarele 24 de ore (Detalii Orale)
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1">
          {weather.hourly.time.slice(0, 24).map((time, index) => {
            const hour = new Date(time).getHours();
            const temp = Math.round(weather.hourly.temperature_2m[index]);
            const isNight = hour < 6 || hour > 20;
            const precProb = weather.hourly.precipitation_probability ? weather.hourly.precipitation_probability[index] : 0;

            return (
              <div key={time} className="flex flex-col items-center p-2 bg-slate-50 border border-slate-100 hover:bg-blue-600 group transition-all duration-200">
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-100 mb-1">{hour}:00</span>
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                </div>
                <span className="text-sm font-black text-slate-900 group-hover:text-white leading-none">
                  {temp}°
                </span>
                <span className="text-[8px] font-medium text-blue-500 group-hover:text-blue-200 mt-1">
                  {precProb}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEO Story Section */}
      {generateSEOStory(weather.cityName, weather, currentYear)}

      {/* Orase Principale */}
      <nav className="mt-12" aria-label="Localitati principale">
        <p className="text-center text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest">Localități Principale</p>
        <div className="flex flex-wrap justify-center gap-2">
          {ORASE_PRINCIPALE.map(oras => (
            <a key={oras} href={`/vreme/${oras.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors">
              {oras}
            </a>
          ))}
        </div>
      </nav>

      {nearbyPlaces.length > 0 && (
        <section className="mt-12 p-6 bg-blue-50/30 rounded-lg border border-blue-100 shadow-sm" aria-labelledby="nearby-title">
          <h2 id="nearby-title" className="text-[10px] font-black text-blue-600 uppercase mb-6 tracking-widest text-center">Localități în Județul {weather.region}</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {nearbyPlaces.map((place) => (
              <a key={place.id} href={`/vreme/${place.name.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-white border border-blue-100 rounded-md text-[11px] font-bold text-slate-600 hover:text-blue-700 hover:border-blue-400 shadow-sm transition-all">
                Vremea in {place.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* NEW: Ski/Sea/Mountain Sections for SEO Authority */}
      <div className="grid md:grid-cols-3 gap-6 mt-12 bg-white p-6 rounded-lg border border-slate-200">
        <section aria-labelledby="ski-title">
          <h3 id="ski-title" className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Snowflake className="h-3 w-3" /> Vremea la Ski
          </h3>
          <div className="flex flex-wrap gap-1">
            {STATIUNI_SKI.map(s => (
              <a key={s.slug} href={`/vreme/${s.slug}`} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                {s.name}
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="sea-title">
          <h3 id="sea-title" className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Umbrella className="h-3 w-3" /> Vremea la Mare
          </h3>
          <div className="flex flex-wrap gap-1">
            {STATIUNI_MARE.map(s => (
              <a key={s.slug} href={`/vreme/${s.slug}`} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                {s.name}
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="mt-title">
          <h3 id="mt-title" className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Triangle className="h-3 w-3" /> Vârfuri Munte
          </h3>
          <div className="flex flex-wrap gap-1">
            {VARFURI_MUNTE.map(s => (
              <a key={s.slug} href={`/vreme/${s.slug}`} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                {s.name}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
