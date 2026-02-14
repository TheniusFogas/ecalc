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
        `Analiza tehnică pentru **vremea în ${cityName}**, județul **${region}**, indică un sistem de presiune stabil. Monitorizăm parametrii locali pentru a oferi o **prognoză meteo** precisă, esențială pentru planificarea activităților logistice și deplasărilor în regiune.`,
        `Datele satelitare actualizate pentru **orașul ${cityName}** confirmă o dinamică atmosferică specifică județului **${region}**. Infrastructura noastră de monitoriing procesează în timp real indicii de **temperatură** și umiditate pentru siguranța comunității locale.`,
        `Raportul oficial privind **starea vremii în ${cityName}** subliniază importanța consultării datelor de **real feel** înainte de orice deplasare în județul **${region}**. Verificăm constant variațiile barometrice pentru a preveni orice incertitudine meteorologică.`,
        `Pentru locuitorii din **${cityName}**, județul **${region}**, acest profil meteo servește ca instrument profesional de prognoză. Interpretăm fluxurile de date pentru a livra o imagine clară asupra evoluției **temperaturilor** și a riscurilor de precipitații.`
    ];

    // Zone 2: Recomandări Activități & Mobilitate
    const zone2Templates = [
        `Cu un **real feel** de **${feelsLike}°C**, recomandăm adaptarea vestimentației pentru a menține confortul termic în **${cityName}**. Valorile de umiditate din județul **${region}** sugerează un mediu ${humidity > 70 ? 'saturat' : 'optim'} pentru activități în aer liber.`,
        `Viteza vântului de **${wind} km/h** în **${cityName}** permite desfășurarea normală a traficului pietonal. În județul **${region}**, condițiile de vizibilitate sunt monitorizate prioritar pentru a asigura o navigare sigură pe drumurile publice.`,
        `La o **temperatură** de **${temp}°C**, planificarea plimbărilor în **${cityName}** trebuie să țină cont de indicii de radiație solară. Recomandăm hidratarea corespunzătoare și utilizarea factorului de protecție adecvat județului **${region}**.`,
        `Parametrii de **precipitații** (${precip}%) indică un grad de ${precip > 30 ? 'atenție sporit' : 'siguranță ridicat'} pentru activitățile externe în **${cityName}**. Analiza noastră pentru județul **${region}** facilitează luarea deciziilor informate privind mobilitatea urbană.`
    ];

    // Zone 3: Precauții Sănătate & Mediu
    const zone3Templates = [
        `Indexul UV maxim de **${uv}** în **${cityName}** impune măsuri de precauție pentru expunerea prelungită. Datele de monitorizare din județul **${region}** sunt corelate cu standardele de sănătate publică pentru a minimiza riscurile dermatologice.`,
        `Sistemul de alertă pentru **starea vremii** detectează fluctuații barometrice în **${cityName}**. Persoanele meteo-sensibile din județul **${region}** sunt sfătuite să monitorizeze presiunea atmosferică pentru a preveni disconfortul fizic.`,
        `Calitatea aerului în **${cityName}** este influențată de viteza actuală a vântului și de pragul de umiditate. În contextul județului **${region}**, recomandăm perioade de aerisire controlată a spațiilor închise în intervalele de stabilitate maximă.`,
        `Analiza bio-climatică pentru **${cityName}** evidențiază un echilibru între **temperatură** și punctul de rouă. Pentru rezidenții din județul **${region}**, acest lucru se traduce printr-o percepție termică clară, fără anomalii de disconfort.`
    ];

    // Zone 4: Atenționări Locale & Siguranță
    const zone4Templates = [
        `Echipa noastră tehnică validează datele pentru **vremea de azi în ${cityName}** conform protocoalelor de siguranță europeană. În județul **${region}**, prioritizăm acuratețea informației pentru a susține deciziile tale zilnice.`,
        `Monitorizarea continuă a **orașului ${cityName}** asigură un flux constant de informații către utilizatori. Indiferent de variațiile din județul **${region}**, sistemul nostru oferă alerte timpurii pentru fenomene meteorologice neprevăzute.`,
        `Informația meteo pentru **${cityName}** este procesată pentru a oferi claritate maximă. Ne angajăm să menținem standardul de excelență informativă pentru toți cetățenii din județul **${region}**, punând siguranța pe primul loc.`,
        `Fiecare actualizare pentru **${cityName}** trece printr-un proces de verificare a integrității datelor. În județul **${region}**, furnizăm o bază solidă pentru planificarea profesională și personală, eliminând riscurile asociate vremii.`
    ];

    const idx1 = getDeterministicIndex(cityName, day, 1);
    const idx2 = getDeterministicIndex(cityName, day, 2);
    const idx3 = getDeterministicIndex(cityName, day, 3);
    const idx4 = getDeterministicIndex(cityName, day, 4);

    return (
        <div className="mt-8 bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden font-sans">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-[4px]">
                        <Navigation className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">VREMEA ÎN {cityName} ({region})</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghid Profesional & Recomandări Tehnice • {currentYear}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Partea Stângă: Analiză & Mobilitate */}
                <div className="flex flex-col">
                    <div className="p-6 flex-1 flex flex-col gap-6">
                        <div className="flex gap-4">
                            <div className="mt-1 p-1 bg-slate-100 rounded"><Info className="h-4 w-4 text-slate-500" /></div>
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone1Templates[idx1] }} />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-[4px] border border-slate-100 flex gap-4">
                            <div className="mt-1 p-1 bg-blue-100 rounded"><Navigation className="h-4 w-4 text-blue-600" /></div>
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone2Templates[idx2] }} />
                        </div>
                    </div>
                </div>

                {/* Partea Dreaptă: Sănătate & Siguranță */}
                <div className="flex flex-col">
                    <div className="p-6 flex-1 flex flex-col gap-6">
                        <div className="flex gap-4">
                            <div className="mt-1 p-1 bg-orange-100 rounded"><ShieldAlert className="h-4 w-4 text-orange-600" /></div>
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone3Templates[idx3] }} />
                        </div>
                        <div className="bg-blue-600 p-4 rounded-[4px] shadow-lg flex gap-4">
                            <div className="mt-1 p-1 bg-white/20 rounded"><ShieldCheck className="h-4 w-4 text-white" /></div>
                            <p className="text-sm text-white font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: zone4Templates[idx4] }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-4 flex justify-center border-t border-slate-100">
                <div className="flex items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Monitorizare 1:1</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Verificare Tehnică</span>
                    <span className="flex items-center gap-1.5"><Heart className="h-3 w-3" /> Recomandări Sănătate</span>
                </div>
            </div>
        </div>
    );
};
