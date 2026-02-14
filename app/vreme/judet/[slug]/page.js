import Link from 'next/link';
import { CITIES_ROMANIA } from '@/lib/cities-data';
import { ROMANIA_COUNTIES } from '@/lib/counties-data';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { MapPin, ChevronRight, Search, CloudSun } from 'lucide-react';

export default async function CountyPage({ params }) {
    const { slug } = params;
    const countyInfo = ROMANIA_COUNTIES.find(c => c.slug === slug);

    if (!countyInfo) return <div>Judetul nu a fost gasit.</div>;

    // Filtram orasele principale din acest judet
    const citiesInCounty = CITIES_ROMANIA.filter(c =>
        c.county.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') === slug ||
        c.county === countyInfo.name
    ).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
            <NavigationHeader />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
                <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
                    <Link href="/" className="hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/vreme" className="hover:text-blue-600">Vremea</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">Județul {countyInfo.name}</span>
                </nav>

                <header className="bg-white p-8 rounded-[6px] border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <CloudSun className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Vremea in județul {countyInfo.name}</h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Prognoza meteo detaliată și starea vremii pentru toate localitățile din județul {countyInfo.name}.
                            Alege orașul sau comuna dorită pentru a vedea evoluția temperaturilor, precipitațiile și indicii bioclimatici.
                        </p>
                    </div>
                </header>

                <section className="bg-white p-6 rounded-[6px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Localități în {countyInfo.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {citiesInCounty.map(city => {
                            const citySlug = city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                            return (
                                <Link
                                    key={city.name}
                                    href={`/vreme/${citySlug}`}
                                    className="group p-3 bg-slate-50 border border-slate-100 rounded-[4px] hover:bg-white hover:border-blue-400 hover:shadow-md transition-all"
                                >
                                    <p className="text-sm font-black text-slate-800 group-hover:text-blue-700">{city.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vezi prognoza meteo</p>
                                </Link>
                            );
                        })}
                    </div>

                    {citiesInCounty.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold">Folosiți căutarea pentru a găsi localitatea dorită.</p>
                        </div>
                    )}
                </section>

                <div className="mt-8 bg-blue-600 p-8 rounded-[6px] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black uppercase mb-1">Nu găsești localitatea?</h3>
                            <p className="text-blue-100 text-sm font-medium">Acoperim peste 13.000 de localități din România cu date în timp real.</p>
                        </div>
                        <Link href="/vreme" className="bg-white text-blue-700 px-8 py-3 rounded-[4px] font-black uppercase text-sm hover:bg-blue-50 transition-colors shadow-lg">
                            Înapoi la Căutare
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
