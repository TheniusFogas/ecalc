"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudSun, Wind, Droplets, Sun, Eye, Gauge, Umbrella, Thermometer, Search, Info, Snowflake, Triangle, Sunrise, Sunset, Cloud, CloudRain, CloudLightning, ThermometerSun, Waves, Cloudy, MapPin, Activity } from 'lucide-react';
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        .weather-module {
          font-family: 'Outfit', sans-serif !important;
        }
        @keyframes subtle-drift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .md3-card-light {
          background: #ffffff;
          border: 1px solid #f1f5f9;
        }
        .text-md3-navy {
          color: #1e293b;
        }
        .temp-display {
          font-weight: 300;
          letter-spacing: -0.05em;
        }
      `}</style>

      <div className="weather-module space-y-4">
        {/* Search Bar - MD3 Compact */}
        <div className="bg-white p-1 rounded-[6px] shadow-sm border border-slate-100 flex gap-1 mb-4">
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
          {/* Main Card - Split Layout */}
          <div className="lg:col-span-8 rounded-[6px] p-8 md3-card-light shadow-sm relative overflow-hidden flex flex-col min-h-[440px]">
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-5xl font-extrabold mb-1 tracking-tight uppercase text-slate-900">{weather.cityName}</h1>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-blue-600 rounded-full"></div>
                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em]">
                      JUDETUL {weather.region} • {currentYear}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-blue-700">SISTEM ACTIV</span>
                </div>
              </div>

              {/* Split Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center flex-grow">
                {/* Left: Temp & Basic Info */}
                <div className="md:col-span-5 flex flex-col justify-center border-r border-slate-50 pr-8">
                  <div className="relative mb-6">
                    <span className="text-[140px] leading-none temp-display text-slate-900 block translate-x-[-10px]">
                      {currentTemp}°
                    </span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
                      PROGNOZĂ: {Math.round(weather.current.apparent_temperature)}°C REALFEEL
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                      <span className="opacity-40">MIN: {Math.round(weather.daily.temperature_2m_min[0])}°</span>
                      <span className="opacity-40">MAX: {Math.round(weather.daily.temperature_2m_max[0])}°</span>
                    </div>
                    {/* Sunrise/Sunset at bottom of left column */}
                    <div className="flex gap-8 pt-4">
                      <div className="flex items-center gap-3">
                        <Sunrise className="h-4 w-4 text-orange-400" />
                        <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">RĂSĂRIT</p>
                          <p className="text-xs font-black text-slate-800">{formatTime(weather.daily.sunrise?.[0])}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sunset className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">APUS</p>
                          <p className="text-xs font-black text-slate-800">{formatTime(weather.daily.sunset?.[0])}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: 12 Indicators */}
                <div className="md:col-span-7 grid grid-cols-3 gap-x-6 gap-y-10">
                  {[
                    { l: 'Vânt', v: `${weather.current.wind_speed_10m} km/h`, i: Wind },
                    { l: 'Umiditate', v: `${weather.current.relative_humidity_2m}%`, i: Droplets },
                    { l: 'UV Max', v: weather.daily.uv_index_max[0], i: Sun },
                    { l: 'Aer (AQI)', v: weather.hourly.pm10[0] > 50 ? 'Moderat' : 'Excelent', i: Gauge },
                    { l: 'Presiune', v: `${Math.round(weather.current.surface_pressure)}hPa`, i: Activity },
                    { l: 'Sanse Pl.', v: `${weather.daily.precipitation_probability_max[0]}%`, i: Umbrella },
                    { l: 'Vizibilitate', v: `${weather.current.visibility / 1000}km`, i: Eye },
                    { l: 'Punct Rouă', v: `${Math.round(weather.current.dew_point_2m)}°`, i: Droplets },
                    { l: 'Noros', v: `${weather.current.cloud_cover}%`, i: Cloudy },
                    { l: 'Precipitații', v: `${weather.daily.precipitation_sum[0]}mm`, i: CloudRain },
                    { l: 'Meteo Max', v: `${Math.round(weather.daily.temperature_2m_max[0])}°`, i: ThermometerSun },
                    { l: 'Valuri', v: '0.4m', i: Waves },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <item.i className="h-4 w-4 text-blue-600 opacity-80" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{item.l}</span>
                      </div>
                      <p className="text-[17px] font-black text-slate-800 tracking-tight leading-none">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hourly Forecast */}
          <div className="lg:col-span-4">
            <section className="bg-white p-6 rounded-[6px] border border-slate-100 shadow-sm h-full flex flex-col">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] mb-10 flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-full"><Activity className="h-4 w-4 text-blue-600" /></div>
                EVOLUȚIE ORARĂ (URMĂTOARELE 24H)
              </h2>
              <div className="grid grid-cols-4 gap-x-2 gap-y-6 flex-grow content-start">
                {weather.hourly.time.slice(0, 24).map((time, index) => {
                  const hour = new Date(time).getHours();
                  const tempValue = Math.round(weather.hourly.temperature_2m[index]);
                  const isNight = hour < 6 || hour > 20;
                  const isCurrentHour = index === 0;

                  return (
                    <div key={time} className={`flex flex-col items-center py-4 rounded-[4px] border ${isCurrentHour ? 'border-blue-200 bg-blue-50/30' : 'border-transparent hover:bg-slate-50'}`}>
                      <span className="text-[8px] font-black text-slate-400 uppercase mb-3">{hour}:00</span>
                      <div className="mb-3 transform scale-110">
                        {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                      </div>
                      <span className="text-[16px] font-extrabold text-slate-900">{tempValue}°</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
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
