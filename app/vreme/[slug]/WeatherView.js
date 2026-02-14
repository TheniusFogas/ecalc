"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudSun, Wind, Droplets, Sun, Eye, Gauge, Umbrella, Thermometer, Search, Info, Snowflake, Triangle, Sunrise, Sunset, Cloud, CloudRain, CloudLightning, ThermometerSun, Waves, Cloudy } from 'lucide-react';
import { generateSEOStory } from '@/lib/seo-story-engine';
import { ROMANIA_COUNTIES } from '@/lib/counties-data';

const getWeatherIcon = (code, isNight = false) => {
  const iconClass = "h-6 w-6 transition-all duration-300";
  if (isNight) return <span className="text-2xl animate-pulse" role="img" aria-label="Noapte">🌙</span>;
  if (code === 0) return <Sun className={`${iconClass} text-yellow-500 hover:rotate-90`} />;
  if (code <= 3) return <CloudSun className={`${iconClass} text-blue-400`} />;
  if (code <= 48) return <Cloudy className={`${iconClass} text-slate-400`} />;
  if (code <= 67) return <CloudRain className={`${iconClass} text-blue-500`} />;
  if (code <= 99) return <CloudLightning className={`${iconClass} text-indigo-600`} />;
  return <CloudSun className={`${iconClass} text-slate-400`} />;
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

export default function WeatherView({ weather, nearbyPlaces, ORASE_PRINCIPALE, MOUNTAIN_RESORTS_ZONES, ALL_COASTAL_RESORTS, VARFURI_MUNTE }) {
  const router = useRouter();
  const [cityInput, setCityInput] = useState('');
  const currentYear = new Date().getFullYear();

  const handleSearch = () => {
    if (cityInput) router.push(`/vreme/${cityInput.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const currentTemp = Math.round(weather.current.temperature_2m);
  const isHot = currentTemp > 30;
  const isCold = currentTemp < 5;

  return (
    <div className="space-y-4">
      {/* Animated Background Definition */}
      <style jsx global>{`
        @keyframes subtle-drift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .md3-card-gradient {
          background-size: 200% 200%;
          animation: subtle-drift 15s ease infinite;
        }
      `}</style>

      {/* Search Bar - MD3 Compact */}
      <div className="bg-white p-1 rounded-[6px] shadow-sm border border-slate-200 flex gap-1 mb-4">
        <label htmlFor="city-search" className="sr-only">Cauta localitate</label>
        <input
          id="city-search"
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cauta alt oras..."
          className="flex-1 px-4 outline-none font-medium text-slate-700 placeholder-slate-400 text-sm"
        />
        <button
          onClick={handleSearch}
          aria-label="Cauta"
          className="bg-blue-600 text-white px-4 py-1.5 rounded-[4px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 text-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Cauta</span>
        </button>
      </div>

      {/* Main Dashboard Overhaul */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Main Card */}
        <div className={`lg:col-span-5 rounded-[6px] p-6 text-white relative overflow-hidden shadow-lg md3-card-gradient flex flex-col justify-between min-h-[320px] ${isHot ? 'from-orange-500 via-red-500 to-orange-600' :
          isCold ? 'from-slate-700 via-blue-900 to-slate-800' :
            'from-blue-600 via-indigo-600 to-blue-700'
          }`}>
          {/* Subtle Animated Blur Overlays */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black mb-0.5 tracking-tight uppercase">{weather.cityName}</h1>
                <p className="text-blue-50/80 font-bold text-[10px] uppercase tracking-widest">
                  {weather.region} • {currentYear}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-[4px] border border-white/20">
                <span className="text-[10px] font-black tracking-tighter uppercase whitespace-nowrap">Status: ACTIV</span>
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-8xl font-black tracking-tighter tabular-nums leading-none">{currentTemp}°</span>
              <div className="mb-4">
                <p className="text-sm font-bold opacity-90">Simțit: {Math.round(weather.current.apparent_temperature)}°</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-100">
                  <Thermometer className="h-3 w-3" />
                  <span>Min: {Math.round(weather.daily.temperature_2m_min[0])}° / Max: {Math.round(weather.daily.temperature_2m_max[0])}°</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6 border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-orange-300" />
              <div className="leading-none">
                <p className="text-[8px] font-black uppercase text-white/60">Răsărit</p>
                <p className="text-xs font-bold">{formatTime(weather.daily.sunrise?.[0])}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-orange-200" />
              <div className="leading-none">
                <p className="text-[8px] font-black uppercase text-white/60">Apus</p>
                <p className="text-xs font-bold">{formatTime(weather.daily.sunset?.[0])}</p>
              </div>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 scale-[4] pointer-events-none" aria-hidden="true">
            {getWeatherIcon(weather.current.weather_code, currentTemp < 10 && Math.abs(currentTemp) > 20)}
          </div>
        </div>

        {/* Right: Hourly & Detailed Indices (Compact) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Detailed 12 Indices Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { l: 'Vânt', v: `${weather.current.wind_speed_10m} km/h`, i: Wind, c: 'text-blue-600' },
              { l: 'Umiditate', v: `${weather.current.relative_humidity_2m}%`, i: Droplets, c: 'text-cyan-600' },
              { l: 'UV Max', v: weather.daily.uv_index_max[0], i: Sun, c: 'text-orange-600' },
              { l: 'Aer (AQI)', v: weather.hourly.pm10[0] > 50 ? 'Moderat' : 'Excelent', i: Gauge, c: 'text-emerald-600' },
              { l: 'Presiune', v: `${Math.round(weather.current.surface_pressure)}hPa`, i: Gauge, c: 'text-slate-600' },
              { l: 'Planer', v: `${weather.daily.precipitation_probability_max[0]}%`, i: Umbrella, c: 'text-indigo-600' },
              { l: 'Vizibilitate', v: `${weather.current.visibility / 1000}km`, i: Eye, c: 'text-blue-500' },
              { l: 'Punct Rouă', v: `${Math.round(weather.current.dew_point_2m)}°`, i: Droplets, c: 'text-teal-600' },
              { l: 'Noros', v: `${weather.current.cloud_cover}%`, i: Cloud, c: 'text-slate-500' },
              { l: 'Precipitații', v: `${weather.daily.precipitation_sum[0]}mm`, i: CloudRain, c: 'text-blue-700' },
              { l: 'Index Max', v: `${Math.round(weather.daily.temperature_2m_max[0])}°`, i: ThermometerSun, c: 'text-red-500' },
              { l: 'Valuri', v: '0.4m', i: Waves, c: 'text-cyan-700' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-2.5 rounded-[6px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors group">
                <item.i className={`h-4 w-4 ${item.c} mb-1 group-hover:scale-110 transition-transform`} aria-hidden="true" />
                <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">{item.l}</span>
                <span className="text-xs font-black text-slate-900 leading-none">{item.v}</span>
              </div>
            ))}
          </div>

          {/* Hourly Forecast MD3 Compact Card */}
          <section className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm flex-1" aria-labelledby="hourly-forecast">
            <h2 id="hourly-forecast" className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Gauge className="h-3 w-3" /> Evoluție Orară (Următoarele 24h)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
              {weather.hourly.time.slice(0, 24).map((time, index) => {
                const hour = new Date(time).getHours();
                const temp = Math.round(weather.hourly.temperature_2m[index]);
                const isNight = hour < 6 || hour > 20;

                return (
                  <div key={time} className={`flex flex-col items-center p-1.5 rounded-[4px] border ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'} hover:border-blue-300 transition-all duration-200`}>
                    <span className={`text-[8px] font-bold ${isNight ? 'text-slate-500' : 'text-slate-400'} mb-1`}>{hour}:00</span>
                    <div className="mb-0.5 transform scale-75">
                      {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                    </div>
                    <span className={`text-xs font-black ${isNight ? 'text-white' : 'text-slate-900'} leading-none`}>{temp}°</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {generateSEOStory(weather.cityName, weather, currentYear)}

      {/* METEO Reședințe de Județ - Compact Redesign */}
      <footer className="mt-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Resedinte de Judet (Compact) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white p-3 rounded-[6px] border border-slate-200">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">METEO Reședințe de Județ</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                {ORASE_PRINCIPALE.map(oras => (
                  <a key={oras} href={`/vreme/${oras.toLowerCase().replace(/\s+/g, '-')}`} className="text-[9px] font-bold text-slate-500 hover:text-blue-600 truncate bg-slate-50 px-1 py-0.5 rounded-[2px] border border-transparent hover:border-blue-100">
                    {oras}
                  </a>
                ))}
              </div>
            </div>

            {/* NEW: 13k Index entry point - Browse by County */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Localități pe Județe (13.000+)</h3>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                {ROMANIA_COUNTIES.map(judet => (
                  <a key={judet.slug} href={`/vreme/judet/${judet.slug}`} className="text-[9px] font-black text-blue-600 hover:underline">
                    Județul {judet.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Resorts & Peaks (Split) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-[6px] border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stațiuni Montane (Regiuni)</h3>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {MOUNTAIN_RESORTS_ZONES.map((zone, zIdx) => (
                    <div key={zIdx} className="space-y-1">
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">{zone.zone}</p>
                      <div className="flex flex-wrap gap-1">
                        {zone.items.map(item => (
                          <a key={item.slug} href={`/vreme/${item.slug}`} className="text-[9px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 px-1 py-0.5 rounded-[2px]">
                            {item.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="bg-white p-3 rounded-[6px] border border-slate-200 flex-1">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Umbrella className="h-2.5 w-2.5" /> Litoral Românesc
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {ALL_COASTAL_RESORTS.map(s => (
                      <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-[2px] border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-[6px] border border-slate-200 flex-1">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Triangle className="h-2.5 w-2.5" /> Vârfuri +2500m
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {VARFURI_MUNTE.map(s => (
                      <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[9px] font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-[2px] border border-slate-100 hover:border-blue-400">
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
