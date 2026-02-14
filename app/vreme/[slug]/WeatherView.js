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
        {/* Left: Main Card - Now containing 12 indices */}
        <div className={`lg:col-span-7 rounded-[6px] p-6 text-white relative overflow-hidden shadow-lg md3-card-gradient flex flex-col justify-between min-h-[450px] ${isHot ? 'from-orange-600 via-red-600 to-orange-700' :
          isCold ? 'from-slate-800 via-blue-950 to-slate-900' :
            'from-blue-700 via-indigo-700 to-blue-800'
          }`}>

          {/* Subtle Background Icon - Requirement 1 */}
          <div className="absolute top-4 right-4 opacity-10 pointer-events-none animate-float-slow" aria-hidden="true">
            {getWeatherIcon(weather.current.weather_code, currentTemp < 10 && Math.abs(currentTemp) > 20)}
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black mb-0.5 tracking-tight uppercase drop-shadow-md">{weather.cityName}</h1>
                <p className="text-blue-100/90 font-bold text-[10px] uppercase tracking-widest drop-shadow-sm">
                  {weather.region} • {currentYear}
                </p>
              </div>
              <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-[4px] border border-white/10">
                <span className="text-[10px] font-black tracking-tighter uppercase whitespace-nowrap">Status: ACTIV</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 my-4">
              <div className="flex items-end gap-2 shrink-0">
                <span className="text-9xl font-black tracking-tighter tabular-nums leading-none drop-shadow-xl">{currentTemp}°</span>
                <div className="mb-6">
                  <p className="text-base font-black opacity-100 drop-shadow-md">Simțit: {Math.round(weather.current.apparent_temperature)}°</p>
                  <div className="flex items-center gap-1 text-xs font-black text-blue-200 drop-shadow-sm">
                    <Thermometer className="h-3.5 w-3.5" />
                    <span>Min: {Math.round(weather.daily.temperature_2m_min[0])}° / Max: {Math.round(weather.daily.temperature_2m_max[0])}°</span>
                  </div>
                </div>
              </div>

              {/* Requirement 1: 12 Indicators in the Left Box */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-grow bg-black/10 p-4 rounded-[6px] backdrop-blur-sm border border-white/5">
                {[
                  { l: 'Vânt', v: `${weather.current.wind_speed_10m} km/h`, i: Wind },
                  { l: 'Umiditate', v: `${weather.current.relative_humidity_2m}%`, i: Droplets },
                  { l: 'UV Max', v: weather.daily.uv_index_max[0], i: Sun },
                  { l: 'Aer (AQI)', v: weather.hourly.pm10[0] > 50 ? 'Moderat' : 'Excelent', i: Gauge },
                  { l: 'Presiune', v: `${Math.round(weather.current.surface_pressure)}hPa`, i: Gauge },
                  { l: 'Planer', v: `${weather.daily.precipitation_probability_max[0]}%`, i: Umbrella },
                  { l: 'Vizibilitate', v: `${weather.current.visibility / 1000}km`, i: Eye },
                  { l: 'Punct Rouă', v: `${Math.round(weather.current.dew_point_2m)}°`, i: Droplets },
                  { l: 'Noros', v: `${weather.current.cloud_cover}%`, i: Cloud },
                  { l: 'Precipitații', v: `${weather.daily.precipitation_sum[0]}mm`, i: CloudRain },
                  { l: 'Meteo Max', v: `${Math.round(weather.daily.temperature_2m_max[0])}°`, i: ThermometerSun },
                  { l: 'Valuri', v: '0.4m', i: Waves },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center text-center p-1 rounded hover:bg-white/5 transition-colors">
                    <item.i className="h-3.5 w-3.5 text-blue-200 mb-0.5" />
                    <span className="text-[7px] font-black text-white/60 uppercase tracking-tighter leading-none">{item.l}</span>
                    <span className="text-[10px] font-black text-white leading-none mt-0.5">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                < Sunrise className="h-5 w-5 text-orange-300" />
                <div className="leading-none">
                  <p className="text-[9px] font-black uppercase text-white/60">Răsărit</p>
                  <p className="text-sm font-black text-white">{formatTime(weather.daily.sunrise?.[0])}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sunset className="h-5 w-5 text-orange-200" />
                <div className="leading-none">
                  <p className="text-[9px] font-black uppercase text-white/60">Apus</p>
                  <p className="text-sm font-black text-white">{formatTime(weather.daily.sunset?.[0])}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Hourly Forecast (Requirement 2) */}
        <div className="lg:col-span-5 flex flex-col">
          <section className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm h-full flex flex-col" aria-labelledby="hourly-forecast">
            <h2 id="hourly-forecast" className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Gauge className="h-3 w-3" /> Evoluție Orară (Următoarele 24h)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 flex-grow content-start">
              {weather.hourly.time.slice(0, 24).map((time, index) => {
                const hour = new Date(time).getHours();
                const temp = Math.round(weather.hourly.temperature_2m[index]);
                const isNight = hour < 6 || hour > 20;
                const isCurrentHour = index === 0;

                return (
                  <div key={time} className={`flex flex-col items-center p-2 rounded-[4px] border ${isNight ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100'} hover:border-blue-200 transition-all duration-200 group`}>
                    <span className={`text-[9px] font-black ${isNight ? 'text-slate-600' : 'text-slate-500'} mb-1`}>{hour}:00</span>
                    <div className={`mb-1 transform scale-[0.85] ${isCurrentHour ? 'animate-pulse' : ''}`}>
                      {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                    </div>
                    <span className={`text-xs font-black ${isNight ? 'text-slate-900' : 'text-slate-800'} leading-none`}>{temp}°</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {generateSEOStory(weather.cityName, weather, currentYear)}

      {/* Footer Design Fixes - Requirement 4-7 */}
      <footer className="mt-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top 3 boxes with same height (flex approach) */}
          <div className="bg-white p-4 rounded-[6px] border border-slate-200 flex flex-col min-h-[280px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">METEO Reședințe de Județ</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 overflow-visible">
              {ORASE_PRINCIPALE.map(oras => (
                <a key={oras} href={`/vreme/${oras.toLowerCase().replace(/\s+/g, '-')}`} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 truncate bg-slate-50 px-2 py-1 rounded-[2px] border border-transparent hover:border-blue-100 transition-all">
                  {oras}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-[6px] border border-slate-200 flex flex-col min-h-[280px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Stațiuni Montane (Regiuni)</h3>
            <div className="space-y-4 overflow-visible">
              {MOUNTAIN_RESORTS_ZONES.map((zone, zIdx) => (
                <div key={zIdx} className="space-y-1.5">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{zone.zone}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.items.map(item => (
                      <a key={item.slug} href={`/vreme/${item.slug}`} className="text-[10px] font-bold text-slate-600 hover:text-white hover:bg-blue-500 bg-slate-50 px-2 py-1 rounded-[2px] transition-colors border border-slate-100 shadow-sm">
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 min-h-[280px]">
            <div className="bg-white p-4 rounded-[6px] border border-slate-200 flex-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Umbrella className="h-3 w-3" /> Litoral Românesc
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COASTAL_RESORTS.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-[2px] border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-[6px] border border-slate-200 flex-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Triangle className="h-3 w-3" /> Vârfuri +2500m
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {VARFURI_MUNTE.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-[2px] border border-slate-100 hover:border-blue-400 transition-all shadow-sm">
                    {s.name} <span className="text-[8px] opacity-70">({s.alt}m)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Localitati pe judete - Requirement 6: Full Width */}
        <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Index Complet: Localități pe Județe (13.000+)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-x-4 gap-y-2">
            {ROMANIA_COUNTIES.map(judet => (
              <a key={judet.slug} href={`/vreme/judet/${judet.slug}`} className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 opacity-50" /> Județul {judet.name}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Requirement 1: Background Icon Animation */}
      <style jsx global>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
