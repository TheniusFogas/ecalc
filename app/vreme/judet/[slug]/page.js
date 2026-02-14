import Link from 'next/link';
import { CITIES_ROMANIA } from '@/lib/cities-data';
import { ROMANIA_COUNTIES } from '@/lib/counties-data';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { MapPin, ChevronRight, Search, CloudSun, Thermometer, Wind, Droplets } from 'lucide-react';

async function getCountyWeather(cityName) {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName + ', Romania')}&count=1&language=ro&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results) return null;

        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`, { next: { revalidate: 3600 } });
        return await weatherRes.json();
    } catch (e) { return null; }
}

const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '🌤️';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    return '⛅';
};

export default async function CountyPage({ params }) {
    const { slug } = params;
    const countyInfo = ROMANIA_COUNTIES.find(c => c.slug === slug);

    if (!countyInfo) return <div>Judetul nu a fost gasit.</div>;

    // Fetch weather for the county seat (capital)
    const countyWeather = await getCountyWeather(countyInfo.capital);

    // Filter cities with a more robust check (normalized county name)
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const slugCounty = normalize(countyInfo.name);

    const citiesInCounty = CITIES_ROMANIA.filter(c => {
        const normalizedItemCounty = normalize(c.county);
        return normalizedItemCounty === slugCounty || normalizedItemCounty.includes(slugCounty) || c.county === countyInfo.name;
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Categorize
    const urbanCenters = citiesInCounty.filter(c => c.population > 8000 || c.name.toLowerCase().includes("oras") || c.name.toLowerCase().includes("municipiul"));
    const ruralLocalities = citiesInCounty.filter(c => !urbanCenters.includes(c));

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
            <NavigationHeader />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
                <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">
                    <Link href="/" className="hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/vreme" className="hover:text-blue-600">Vremea</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">Județul {countyInfo.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    <header className="lg:col-span-8 bg-white p-8 rounded-[6px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Vremea in județul {countyInfo.name}</h1>
                            <p className="text-slate-500 font-medium max-w-2xl text-sm italic leading-relaxed">
                                Prognoza meteo detaliată și starea vremii pentru toate localitățile din județul {countyInfo.name}.
                                Monitorizăm datele actualizate pentru {citiesInCounty.length} localități.
                            </p>
                        </div>
                    </header>

                    {/* County Capital Weather Widget */}
                    {countyWeather && (
                        <div className="lg:col-span-4 bg-blue-600 rounded-[6px] p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Reședință Județ</p>
                                        <h3 className="text-xl font-black uppercase tracking-tighter">{countyInfo.capital}</h3>
                                    </div>
                                    <span className="text-4xl">{getWeatherIcon(countyWeather.current.weather_code)}</span>
                                </div>
                                <div className="flex items-end gap-2 mb-4">
                                    <span className="text-5xl font-black leading-none">{Math.round(countyWeather.current.temperature_2m)}°</span>
                                    <span className="text-blue-200 font-bold mb-1">Celsius</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Wind className="h-3.5 w-3.5 text-blue-300" />
                                        <span className="text-xs font-bold text-blue-100">{countyWeather.current.wind_speed_10m} km/h</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-3.5 w-3.5 text-blue-300" />
                                        <span className="text-xs font-bold text-blue-100">{countyWeather.current.relative_humidity_2m}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {/* Urban Centers */}
                    {urbanCenters.length > 0 && (
                        <section className="bg-white p-6 rounded-[6px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-blue-600 rounded-[4px]">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Orașe & Municipii ({urbanCenters.length})</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {urbanCenters.map(city => {
                                    const citySlug = normalize(city.name);
                                    return (
                                        <Link key={city.name} href={`/vreme/${citySlug}`} className="group p-4 bg-slate-50 border border-slate-100 rounded-[4px] hover:bg-white hover:border-blue-400 hover:shadow-md transition-all">
                                            <p className="text-sm font-black text-slate-800 group-hover:text-blue-700 truncate">{city.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Prognoză Meteo</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* All Other Localities */}
                    {ruralLocalities.length > 0 && (
                        <section className="bg-white p-6 rounded-[6px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-slate-800 rounded-[4px]">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Comune & Sate ({ruralLocalities.length})</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
                                {ruralLocalities.map(city => {
                                    const citySlug = normalize(city.name);
                                    return (
                                        <Link key={city.name} href={`/vreme/${citySlug}`} className="group p-1 hover:bg-slate-50 rounded transition-colors">
                                            <p className="text-[13px] font-bold text-slate-600 group-hover:text-blue-600 truncate">{city.name}</p>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Prognoză</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                {citiesInCounty.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-[6px] border border-slate-200">
                        <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nu am găsit localități pentru acest județ.</p>
                        <p className="text-slate-400 text-xs mt-2">Folosiți căutarea globală pentru rezultate precise.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
