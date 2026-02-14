"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudSun, Wind, Droplets, Sun, Eye, Gauge, Umbrella, Thermometer, Search, Info, Snowflake, Triangle, Sunrise, Sunset, Cloud, CloudRain, CloudLightning, ThermometerSun, Waves, Cloudy, MapPin } from 'lucide-react';
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
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.1; }
          50% { transform: translateY(-20px) rotate(8deg) scale(1.1); opacity: 0.2; }
          100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.1; }
        }
        .md3-card-gradient {
          background-size: 200% 200%;
          animation: subtle-drift 15s ease infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .font-condensed-tall {
           transform: scaleY(1.3) translateY(-5%);
           display: inline-block;
           font-weight: 100;
           letter-spacing: -0.08em;
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
        {/* Left: Main Card - Deep Contrast & Zero Waste */}
        <div className={`lg:col-span-7 rounded-[6px] p-8 text-white relative overflow-hidden shadow-2xl md3-card-gradient flex flex-col min-h-[460px] border border-white/5 ${isHot ? 'from-orange-950 via-red-900 to-black' :
          isCold ? 'from-black via-slate-950 to-blue-950' :
            'from-blue-950 via-indigo-950 to-black'
          }`}>

          {/* Background Floating Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none animate-float-slow" aria-hidden="true">
            <div className="scale-[5]">
              {getWeatherIcon(weather.current.weather_code)}
            </div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Top Row: Location & Status */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-5xl font-black mb-1 tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{weather.cityName}</h1>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-blue-500 rounded-full"></div>
                  <p className="text-blue-200 font-bold text-xs uppercase tracking-[0.2em] drop-shadow-sm">
                    JUDETUL {weather.region} • {currentYear}
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
                <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  SISTEM ACTIV
                </span>
              </div>
            </div>

            {/* Middle Row: Temp & 12 Indicators (Split Column) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-8 flex-grow items-center">
              {/* Left Column: Big Degrees */}
              <div className="md:col-span-5 flex flex-col items-center md:items-start">
                <div className="relative mb-4">
                  <span className="text-[13rem] leading-none font-condensed-tall drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    {currentTemp}°
                  </span>
                </div>
                <div className="space-y-1 bg-black/30 backdrop-blur-md p-4 rounded-[4px] border border-white/10 w-full md:w-auto">
                  <p className="text-sm font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
                    <Triangle className="h-3 w-3 text-blue-400 opacity-50" />
                    PROGNOZĂ: {Math.round(weather.current.apparent_temperature)}°C RealFeel
                  </p>
                  <div className="flex items-center gap-4 text-xs font-black text-blue-200 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Triangle className="h-2.5 w-2.5 rotate-180" /> MIN: {Math.round(weather.daily.temperature_2m_min[0])}°</span>
                    <span className="flex items-center gap-1"><Triangle className="h-2.5 w-2.5" /> MAX: {Math.round(weather.daily.temperature_2m_max[0])}°</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 12 Indicators - Full Height & Unboxed */}
              <div className="md:col-span-7 w-full h-full flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                  {[
                    { l: 'Vânt', v: `${weather.current.wind_speed_10m} km/h`, i: Wind },
                    { l: 'Umiditate', v: `${weather.current.relative_humidity_2m}%`, i: Droplets },
                    { l: 'UV Max', v: weather.daily.uv_index_max[0], i: Sun },
                    { l: 'Aer (AQI)', v: weather.hourly.pm10[0] > 50 ? 'Moderat' : 'Excelent', i: Gauge },
                    { l: 'Presiune', v: `${Math.round(weather.current.surface_pressure)}hPa`, i: Gauge },
                    { l: 'Sanse Pl.', v: `${weather.daily.precipitation_probability_max[0]}%`, i: Umbrella },
                    { l: 'Vizibilitate', v: `${weather.current.visibility / 1000}km`, i: Eye },
                    { l: 'Punct Rouă', v: `${Math.round(weather.current.dew_point_2m)}°`, i: Droplets },
                    { l: 'Noros', v: `${weather.current.cloud_cover}%`, i: Cloud },
                    { l: 'Precipitații', v: `${weather.daily.precipitation_sum[0]}mm`, i: CloudRain },
                    { l: 'Meteo Max', v: `${Math.round(weather.daily.temperature_2m_max[0])}°`, i: ThermometerSun },
                    { l: 'Valuri', v: '0.4m', i: Waves },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-start justify-center p-1 group transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-white/5 rounded-[4px] border border-white/5 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all">
                          <item.i className="h-4 w-4 text-blue-300" />
                        </div>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.l}</span>
                      </div>
                      <span className="text-base font-black text-white tracking-tighter leading-none ml-8 italic">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Astronomie */}
            <div className="flex items-center gap-12 border-t border-white/10 pt-6 mt-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500/20 rounded-full border border-orange-500/30">
                  <Sunrise className="h-6 w-6 text-orange-400" />
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ora Răsărit</p>
                  <p className="text-xl font-black text-white">{formatTime(weather.daily.sunrise?.[0])}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                  <Sunset className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ora Apus</p>
                  <p className="text-xl font-black text-white">{formatTime(weather.daily.sunset?.[0])}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Hourly Forecast - Extremely Compact */}
        <div className="lg:col-span-5 flex flex-col">
          <section className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm h-full flex flex-col" aria-labelledby="hourly-forecast">
            <h2 id="hourly-forecast" className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="p-1.5 bg-blue-100 rounded-full"><Gauge className="h-3.5 w-3.5 text-blue-600" /></div>
              EVOLUȚIE ORARĂ (URMĂTOARELE 24H)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-1 gap-y-1.5 flex-grow content-start overflow-hidden">
              {weather.hourly.time.slice(0, 24).map((time, index) => {
                const hour = new Date(time).getHours();
                const temp = Math.round(weather.hourly.temperature_2m[index]);
                const isNight = hour < 6 || hour > 20;
                const isCurrentHour = index === 0;

                return (
                  <div key={time} className={`flex flex-col items-center py-2 rounded-[2px] transition-all duration-200 ${isCurrentHour ? 'bg-blue-600 text-white shadow-lg scale-105 z-10' : 'bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200'}`}>
                    <span className={`text-[8px] font-black uppercase tracking-tighter mb-1 ${isCurrentHour ? 'text-blue-100' : 'text-slate-400'}`}>{hour}:00</span>
                    <div className={`mb-1 transform scale-[0.7] ${isCurrentHour ? 'animate-pulse' : 'opacity-60 grayscale-[50%]'}`}>
                      {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                    </div>
                    <span className={`text-xs font-black leading-none ${isCurrentHour ? 'text-white' : 'text-slate-800'}`}>{temp}°</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              <span>Interval: 1 Oră</span>
              <span>Actualizat Acum</span>
            </div>
          </section>
        </div>
      </div>

      {generateSEOStory(weather.cityName, weather, currentYear)}

      {/* Footer Design Fixes - Balanced & Full Width */}
      <footer className="mt-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Top 3 boxes with forced stretch */}
          <div className="bg-white p-6 rounded-[6px] border border-slate-200 flex-1 flex flex-col shadow-sm">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
              <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
              REȘEDINȚE DE JUDEȚ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 grid-flow-row">
              {ORASE_PRINCIPALE.map(oras => (
                <a key={oras} href={`/vreme/${oras.toLowerCase().replace(/\s+/g, '-')}`} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 truncate bg-slate-50 hover:bg-white px-2 py-1.5 rounded-[2px] border border-transparent hover:border-blue-200 transition-all">
                  {oras}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[6px] border border-slate-200 flex-1 flex flex-col shadow-sm">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
              <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
              STAȚIUNI MONTANE
            </h3>
            <div className="flex flex-col gap-6">
              {MOUNTAIN_RESORTS_ZONES.map((zone, zIdx) => (
                <div key={zIdx} className="space-y-2">
                  <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded inline-block">{zone.zone}</p>
                  <div className="flex flex-wrap gap-1">
                    {zone.items.map(item => (
                      <a key={item.slug} href={`/vreme/${item.slug}`} className="text-[10px] font-extrabold text-slate-600 hover:text-white hover:bg-blue-600 bg-white px-2 py-1 rounded-[2px] transition-all border border-slate-200 shadow-sm">
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-[6px] border border-slate-200 flex-1 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                LITORAL ROMÂNESC
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COASTAL_RESORTS.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[10px] font-bold text-blue-700 bg-blue-50/50 px-2 py-1.5 rounded-[2px] border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-[6px] border border-slate-200 flex-1 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                VÂRFURI +2500M
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {VARFURI_MUNTE.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1.5 rounded-[2px] border border-slate-200 hover:border-blue-500 hover:bg-white transition-all">
                    {s.name} <span className="text-[9px] opacity-70 ml-1">({s.alt}m)</span>
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
    </div>
  );
}
