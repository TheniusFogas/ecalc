"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CloudSun, Wind, Droplets, Sun, Eye, Gauge, Umbrella, Thermometer, Search, Info, Snowflake, Triangle, Sunrise, Sunset, Cloud, CloudRain, CloudLightning, ThermometerSun, Waves, Cloudy, MapPin, Activity, Moon } from 'lucide-react';
import { generateSEOStory } from '@/lib/seo-story-engine';
import { ROMANIA_COUNTIES } from '@/lib/counties-data';

const getWeatherIcon = (code, isNight = false) => {
  const iconClass = "h-6 w-6 transition-all duration-300";
  if (isNight) return <Moon className={`${iconClass} text-slate-400 animate-pulse`} />;
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
  const [theme, setTheme] = useState('white');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const savedTheme = document.cookie.split('; ').find(row => row.startsWith('weather-theme='))?.split('=')[1];
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    document.cookie = `weather-theme=${newTheme}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

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
        .weather-module {
          font-family: 'Inter', sans-serif !important;
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
          font-weight: 200;
          letter-spacing: -0.05em;
        }
      `}</style>

      <div className="weather-module space-y-4">
        {/* Search Bar - MD3 Compact */}
        <div className={`p-1 rounded-[6px] shadow-sm border flex gap-1 mb-4 ${theme === 'blue' ? 'bg-[#242b3a] border-[#374151]' : 'bg-white border-slate-100'}`}>
          <label htmlFor="city-search" className="sr-only">Cauta localitate</label>
          <input
            id="city-search"
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cauta alt oras..."
            className={`flex-1 px-4 outline-none font-medium text-sm rounded ${theme === 'blue' ? 'bg-[#1a1d2d] text-white placeholder-slate-500' : 'bg-transparent text-slate-700 placeholder-slate-400'}`}
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

        {theme === 'blue' ? (
          /* METEOBLUE DARK THEME 1:1 REPLICATION */
          <div className="bg-[#171b28] text-white p-6 rounded-[4px] shadow-2xl overflow-x-hidden font-sans border border-slate-800">
            {/* Legend / Tooltip info at top */}
            <div className="flex bg-[#242b3a]/50 p-3 rounded mb-6 text-[10px] text-slate-400 gap-6 items-center border border-slate-800/50">
              <div className="flex items-center gap-2"><Triangle className="h-2.5 w-2.5 rotate-180 fill-current" /> Direcția și viteza vântului</div>
              <div className="flex items-center gap-2"><Droplets className="h-2.5 w-2.5 text-blue-400" /> Cantitate de precipitații</div>
              <div className="flex items-center gap-2"><Sun className="h-2.5 w-2.5 text-yellow-500" /> Ore de soare</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map(n => <div key={n} className="w-2 h-2 rounded-full border border-slate-500"></div>)}
                </div>
                Predictibilitate
              </div>
            </div>

            {/* Header: Title & Current compact */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-6xl font-medium tracking-tight">Vremea</h1>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-bold opacity-70">Județul {weather.region}, România, 44.318°N 23.8°E</p>
                <div className="flex gap-2 mt-6">
                  {['white', 'blue', 'grey'].map((t) => (
                    <button
                      key={t}
                      onClick={() => changeTheme(t)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${theme === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-[#242b3a] border-slate-700 text-slate-500 hover:text-white'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-8 bg-[#242b3a]/30 p-4 rounded-xl border border-slate-800/30">
                <Sun className="h-16 w-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" />
                <div className="text-right">
                  <p className="text-7xl font-bold tracking-tighter">{currentTemp}°C</p>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{weather.current.wind_speed_10m} km/h | {new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast Grid */}
            <div className="grid grid-cols-7 gap-1 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 mb-8 p-1">
              {weather.daily.time.slice(0, 7).map((time, i) => {
                const date = new Date(time);
                const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase();
                const dayDate = date.getDate() + '/' + (date.getMonth() + 1);

                return (
                  <div key={time} className="bg-[#1a1d2d] flex flex-col items-center py-5 px-2 hover:bg-[#242b3a] transition-all group cursor-pointer border border-transparent hover:border-blue-500/30 rounded-md">
                    <div className="text-center mb-6">
                      <p className="text-[12px] font-black text-slate-200">{dayName}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">{i === 0 ? 'Astăzi' : i === 1 ? 'Mâine' : dayDate}</p>
                    </div>

                    <div className="h-16 w-16 flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform">
                      {getWeatherIcon(weather.daily.weather_code[i])}
                    </div>

                    <div className="space-y-1.5 mb-8 w-full px-1">
                      <div className="bg-[#4caf50] text-[#171b28] text-center rounded-[4px] py-1.5 text-[14px] font-black shadow-lg">{Math.round(weather.daily.temperature_2m_max[i])}°C</div>
                      <div className="bg-[#2e7d32] text-white text-center rounded-[4px] py-1.5 text-[14px] font-black shadow-md">{Math.round(weather.daily.temperature_2m_min[i])}°C</div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-3 mt-auto w-full px-2">
                      <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                        <Triangle className="h-3 w-3 rotate-180 fill-current opacity-40" />
                        <span className="font-bold">⬅ {weather.daily.wind_speed_10m_max[i]} km/h</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span className="font-bold">{weather.daily.precipitation_probability_max[i] || '-'} mm</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-yellow-500 transition-colors">
                        <Sun className="h-3 w-3 text-yellow-500" />
                        <span className="font-bold">☀ {Math.round(weather.daily.sunshine_duration[i] / 3600)} h</span>
                      </div>
                    </div>

                    {/* Predictability circles - custom bullseye style */}
                    <div className="flex justify-center gap-1 mt-6">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className={`w-3 h-3 rounded-full border-2 border-slate-700 relative`}>
                          <div className="absolute inset-[2px] rounded-full bg-slate-700/50"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hourly Detail Section - with blue bars */}
            <div className="bg-[#1a1d2d] rounded-lg p-8 border border-slate-800 shadow-inner">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-md font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                  <Activity className="h-4 w-4" /> Evoluție orară: marți - 3h
                </h3>
                <div className="flex items-center bg-[#242b3a] p-1 rounded-full border border-slate-700">
                  <button className="px-4 py-1 text-[10px] font-black uppercase rounded-full bg-blue-600 text-white transition-all">3h</button>
                  <button className="px-4 py-1 text-[10px] font-black uppercase rounded-full text-slate-400 hover:text-white transition-all">1h</button>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-4 items-end">
                {weather.hourly.time.slice(0, 8).map((time, i) => {
                  const h = new Date(time).getHours();
                  const cloudCover = weather.hourly.cloud_cover?.[i] || 20;
                  return (
                    <div key={i} className="flex flex-col items-center gap-4 w-full group">
                      <span className="text-[11px] text-slate-500 font-black">{h === 0 ? '24' : h < 10 ? '0' + h : h}⁰⁰</span>
                      <div className="h-12 w-12 flex items-center justify-center transform group-hover:scale-125 transition-transform">
                        {getWeatherIcon(weather.hourly.weather_code[i])}
                      </div>
                      <div className="w-full bg-[#4caf50] text-[#171b28] text-center rounded-[3px] py-1 text-[12px] font-black">{Math.round(weather.hourly.temperature_2m[i])}°</div>
                      <span className="text-[10px] text-slate-500 font-bold mb-2">{Math.round(weather.hourly.apparent_temperature[i])}°</span>

                      {/* Blue visualization bars for clouds/precip */}
                      <div className="w-full space-y-1 mt-2">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600/50 rounded-full" style={{ width: `${cloudCover}%` }}></div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${weather.hourly.precipitation_probability?.[i] || 0}%` }}></div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-3 h-3 bg-blue-500/20 rounded-full border border-blue-500/50"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Info Bar - Extended Metadata */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1d2d] p-4 rounded-lg border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Sunrise className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Răsărit / Apus</p>
                  <p className="text-sm font-black">{formatTime(weather.daily.sunrise[0])} / {formatTime(weather.daily.sunset[0])}</p>
                </div>
              </div>
              <div className="bg-[#1a1d2d] p-4 rounded-lg border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Sun className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Index UV</p>
                  <p className="text-sm font-black">UV {weather.daily.uv_index_max[0]} (Moderat)</p>
                </div>
              </div>
              <div className="bg-[#1a1d2d] p-4 rounded-lg border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Moon className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faza Lunii</p>
                  <p className="text-sm font-black">Lună Nouă</p>
                </div>
              </div>
              <div className="bg-[#1a1d2d] p-4 rounded-lg border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-slate-500/10 rounded-xl">
                  <Activity className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presiune Bar.</p>
                  <p className="text-sm font-black">{Math.round(weather.current.surface_pressure)} hPa</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ORIGINAL MD3 THEME */
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
                  <div className="flex gap-2">
                    {[
                      { id: 'white', label: 'Alb' },
                      { id: 'blue', label: 'Blue' },
                      { id: 'grey', label: 'Grey' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => changeTheme(t.id)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${theme === t.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
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
              <section className="bg-white p-3 rounded-[6px] border border-slate-100 shadow-sm h-full flex flex-col">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] mb-2 flex items-center gap-3">
                  <div className="p-1 px-2 bg-blue-50 rounded-full"><Activity className="h-3 w-3 text-blue-600" /></div>
                  EVOLUȚIE ORARĂ
                </h2>
                <div className="grid grid-cols-6 gap-x-1 gap-y-1 flex-grow content-start">
                  {weather.hourly.time.slice(0, 24).map((time, index) => {
                    const hour = new Date(time).getHours();
                    const tempValue = Math.round(weather.hourly.temperature_2m[index]);
                    const isNight = hour < 6 || hour > 20;
                    const isCurrentHour = index === 0;

                    return (
                      <div key={time} className={`flex flex-col items-center py-1 rounded-[4px] border ${isCurrentHour ? 'border-blue-200 bg-blue-50/30' : 'border-transparent hover:bg-slate-50'}`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{hour}:00</span>
                        <div className="mb-0.5 transform scale-[0.75]">
                          {getWeatherIcon(weather.hourly.weather_code[index], isNight)}
                        </div>
                        <span className="text-[12px] font-extrabold text-slate-900">{tempValue}°</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {generateSEOStory(weather.cityName, weather, currentYear)}

      {/* Footer Design Fixes - Balanced & Full Width */}
      <footer className="mt-6 space-y-2">
        <div className="flex flex-col lg:flex-row gap-2 items-stretch">
          {/* Top 3 boxes with forced stretch */}
          <div className="bg-white p-4 rounded-[6px] border border-slate-100 flex-1 flex flex-col shadow-sm">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1 flex items-center gap-2">
              <div className="h-3 w-1 bg-blue-600 rounded-full"></div>
              REȘEDINȚE DE JUDEȚ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 grid-flow-row">
              {ORASE_PRINCIPALE.map(oras => (
                <a key={oras} href={`/vreme/${oras.toLowerCase().replace(/\s+/g, '-')}`} className="text-[9px] font-bold text-slate-500 hover:text-blue-600 truncate bg-slate-50 hover:bg-white px-2 py-1.5 rounded-[2px] border border-transparent hover:border-blue-100 transition-all">
                  {oras}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-[6px] border border-slate-100 flex-1 flex flex-col shadow-sm">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1 flex items-center gap-2">
              <div className="h-3 w-1 bg-blue-600 rounded-full"></div>
              STAȚIUNI MONTANE
            </h3>
            <div className="flex flex-col gap-1">
              {MOUNTAIN_RESORTS_ZONES.map((zone, zIdx) => (
                <div key={zIdx} className="space-y-0.5">
                  <p className="text-[8px] font-black text-blue-700 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded inline-block">{zone.zone}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {zone.items.map(item => (
                      <a key={item.slug} href={`/vreme/${item.slug}`} className="text-[9px] font-extrabold text-slate-600 hover:text-white hover:bg-blue-600 bg-white px-1.5 py-0.5 rounded-[2px] transition-all border border-slate-100 shadow-sm">
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-white p-4 rounded-[6px] border border-slate-100 flex-1 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1 flex items-center gap-2">
                <div className="h-3 w-1 bg-blue-600 rounded-full"></div>
                LITORAL ROMÂNESC
              </h3>
              <div className="flex flex-wrap gap-1">
                {ALL_COASTAL_RESORTS.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[9px] font-bold text-blue-700 bg-blue-50/50 px-2 py-1 rounded-[2px] border border-blue-50 hover:bg-blue-600 hover:text-white transition-all">
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-[6px] border border-slate-100 flex-1 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1 flex items-center gap-2">
                <div className="h-3 w-1 bg-blue-600 rounded-full"></div>
                VÂRFURI +2500M
              </h3>
              <div className="flex flex-wrap gap-1">
                {VARFURI_MUNTE.map(s => (
                  <a key={s.slug} href={`/vreme/${s.slug}`} className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-[2px] border border-slate-100 hover:border-blue-500 hover:bg-white transition-all">
                    {s.name} <span className="text-[8px] opacity-70 ml-1">({s.alt}m)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Localitati pe judete - Requirement 6: Full Width */}
        <div className="bg-white p-3 rounded-[6px] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Index Complet: Localități pe Județe</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-x-2 gap-y-1">
            {ROMANIA_COUNTIES.map(judet => (
              <a key={judet.slug} href={`/vreme/judet/${judet.slug}`} className="text-[9px] font-black text-blue-600 hover:underline flex items-center gap-1">
                <MapPin className="h-2 w-2 opacity-50" /> {judet.name}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
