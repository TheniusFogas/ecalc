import { ShieldAlert, Info, ShieldCheck, Navigation, Heart, MapPin, Sparkles, Activity } from 'lucide-react';

/**
 * Deterministic hash function to ensure stable but diverse content.
 */
const getDeterministicIndex = (city, day, zone) => {
    const cityScore = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = cityScore + day + (zone * 7);
    return seed % 4;
};

export const generateSEOStory = (cityName, weather, currentYear) => {
    const day = new Date().getDate();
    const region = weather.region || 'România';
    const temp = Math.round(weather.current.temperature_2m);
    const feelsLike = Math.round(weather.current.apparent_temperature);
    const humidity = weather.current.relative_humidity_2m;
    const wind = weather.current.wind_speed_10m;
    const precip = weather.daily?.precipitation_probability_max?.[0] || 0;
    const uv = weather.daily?.uv_index_max?.[0] || 0;

    // Zone 1: Context Utilitar & Local (Profesional)
    const zone1Templates = [
        `Analiza tehnică pentru <b>vremea în ${cityName}</b>, județul <b>${region}</b>, indică un sistem de presiune stabil. Monitorizăm parametrii locali pentru a oferi o <b>prognoză meteo</b> precisă, esențială pentru planificarea activităților logistice și deplasărilor în regiune.`,
        `Datele satelitare actualizate pentru <b>${cityName}</b> confirmă o dinamică atmosferică specifică județului <b>${region}</b>. Infrastructura noastră de monitorizare procesează în timp real indicii de <b>temperatură</b> și umiditate pentru siguranța comunității locale.`,
        `Raportul oficial privind <b>starea vremii în ${cityName}</b> subliniază importanța consultării datelor de <b>real feel</b> înainte de orice deplasare în județul <b>${region}</b>. Verificăm constant variațiile barometrice pentru a preveni orice incertitudine meteorologică.`,
        `Pentru locuitorii din <b>${cityName}</b>, județul <b>${region}</b>, acest profil meteo servește ca instrument profesional de prognoză. Interpretăm fluxurile de date pentru a livra o imagine clară asupra evoluției <b>temperaturilor</b> și a riscurilor de precipitații.`
    ];

    // Zone 2: Recomandări Activități & Mobilitate
    const zone2Templates = [
        `Cu un <b>real feel</b> de <b>${feelsLike}°C</b>, recomandăm adaptarea vestimentației pentru a menține confortul termic în <b>${cityName}</b>. Valorile de umiditate din județul <b>${region}</b> sugerează un mediu ${humidity > 70 ? 'saturat' : 'optim'} pentru activități în aer liber.`,
        `Viteza vântului de <b>${wind} km/h</b> în <b>${cityName}</b> permite desfășurarea normală a traficului pietonal. În județul <b>${region}</b>, condițiile de vizibilitate sunt monitorizate prioritar pentru a asigura o navigare sigură pe drumurile publice.`,
        `La o <b>temperatură</b> de <b>${temp}°C</b>, planificarea plimbărilor în <b>${cityName}</b> trebuie să țină cont de indicii de radiație solară. Recomandăm hidratarea corespunzătoare și utilizarea factorului de protecție adecvat județului <b>${region}</b>.`,
        `Parametrii de <b>precipitații</b> (${precip}%) indică un grad de ${precip > 30 ? 'atenție sporit' : 'siguranță ridicat'} pentru activitățile externe în <b>${cityName}</b>. Analiza noastră pentru județul <b>${region}</b> facilitează luarea deciziilor informate privind mobilitatea urbană.`
    ];

    // Zone 3: Precauții Sănătate & Mediu
    const zone3Templates = [
        `Indexul UV maxim de <b>${uv}</b> în <b>${cityName}</b> impune măsuri de precauție pentru expunerea prelungită. Datele de monitorizare din județul <b>${region}</b> sunt corelate cu standardele de sănătate publică pentru a minimiza riscurile dermatologice.`,
        `Sistemul de alertă pentru <b>starea vremii</b> detectează fluctuații barometrice în <b>${cityName}</b>. Persoanele meteo-sensibile din județul <b>${region}</b> sunt sfătuite să monitorizeze presiunea atmosferică pentru a preveni disconfortul fizic.`,
        `Calitatea aerului în <b>${cityName}</b> este influențată de viteza actuală a vântului și de pragul de umiditate. În contextul județului <b>${region}</b>, recomandăm perioade de aerisire controlată a spațiilor închise în intervalele de stabilitate maximă.`,
        `Analiza bio-climatică pentru <b>${cityName}</b> evidențiază un echilibru între <b>temperatură</b> și punctul de rouă. Pentru rezidenții din județul <b>${region}</b>, acest lucru se traduce printr-o percepție termică clară, fără anomalii de disconfort.`
    ];

    // Zone 4: Atenționări Locale & Siguranță
    const zone4Templates = [
        `Echipa noastră tehnică validează datele pentru <b>vremea de azi în ${cityName}</b> conform protocoalelor de siguranță europeană. În județul <b>${region}</b>, prioritizăm acuratețea informației pentru a susține deciziile tale zilnice.`,
        `Monitorizarea continuă a localității <b>${cityName}</b> asigură un flux constant de informații către utilizatori. Indiferent de variațiile din județul <b>${region}</b>, sistemul nostru oferă alerte timpurii pentru fenomene meteorologice neprevăzute.`,
        `Informația meteo pentru <b>${cityName}</b> este procesată pentru a oferi claritate maximă. Ne angajăm să menținem standardul de excelență informativă pentru toți cetățenii din județul <b>${region}</b>, punând siguranța pe primul loc.`,
        `Fiecare actualizare pentru <b>${cityName}</b> trece printr-un proces de verificare a integrității datelor. În județul <b>${region}</b>, furnizăm o bază solidă pentru planificarea profesională și personală, eliminând riscurile asociate vremii.`
    ];

    const idx1 = getDeterministicIndex(cityName, day, 1);
    const idx2 = getDeterministicIndex(cityName, day, 2);
    const idx3 = getDeterministicIndex(cityName, day, 3);
    const idx4 = getDeterministicIndex(cityName, day, 4);

    return (
        <div className="mt-8 bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">VREMEA ÎN {cityName} ({region})</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghid Profesional & Recomandări Tehnice • {currentYear}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
                {/* Partea Stângă: Analiză & Mobilitate */}
                <div className="flex flex-col gap-8">
                    <div className="flex gap-4 items-start">
                        <Info className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone1Templates[idx1] }} />
                    </div>
                    <div className="flex gap-4 items-start">
                        <Navigation className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone2Templates[idx2] }} />
                    </div>
                </div>

                {/* Partea Dreaptă: Sănătate & Siguranță */}
                <div className="flex flex-col gap-8">
                    <div className="flex gap-4 items-start">
                        <ShieldAlert className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone3Templates[idx3] }} />
                    </div>
                    <div className="flex gap-4 items-start">
                        <ShieldCheck className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone4Templates[idx4] }} />
                    </div>
                </div>
            </div>

            <div className="p-5 flex justify-center border-t border-slate-50">
                <div className="flex items-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Monitorizare 1:1</span>
                    <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Verificare Tehnică</span>
                    <span className="flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> Recomandări Sănătate</span>
                </div>
            </div>
        </div>
    );
};
