import React from 'react';
import { Sun, Wind, Info, ShieldCheck } from 'lucide-react';

/**
 * Deterministic hash function to ensure stable but diverse content.
 * Returns an index between 0 and 3.
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
    const vis = (weather.current.visibility / 1000).toFixed(1);
    const precip = weather.daily?.precipitation_probability_max?.[0] || 0;
    const uv = weather.daily?.uv_index_max?.[0] || 0;

    // Zone 1: Context Climatic / Intro
    const zone1Templates = [
        `${cityName} beneficiază de un climat specific regiunii ${region}, oferind condiții meteo variate pe parcursul anului. Monitorizăm constant acești parametri pentru a oferi precizie maximă.`,
        `Starea vremii în ${cityName} este monitorizată constant pentru a oferi cea mai bună prognoză locală actualizată în timp real, direct din surse satelitare profesionale.`,
        `Planifici o vizită în ${cityName}? Află cum evoluează temperaturile și ce influențe geografice dictează vremea azi în această zonă importantă din ${region}.`,
        `Sistemul nostru meteo pentru ${cityName} procesează date satelitare complexe pentru a-ți oferi acuratețe de grad profesional în fiecare oră a zilei.`
    ];

    // Zone 2: Activități și Condiții Curente
    const zone2Templates = [
        `Cu o temperatură de ${temp}°C, este un moment ${temp > 20 ? 'excelent' : 'oportun'} pentru activități în exterior în ${cityName}, conform datelor de ultimă oră.`,
        `Indicele de umiditate de ${humidity}% sugerează un confort termic ${humidity > 80 ? 'redus' : 'optim'} astăzi, influențând direct percepția temperaturii în ${cityName}.`,
        `Vântul suflă cu ${wind} km/h, fapt ce poate influența resimțirea temperaturii în ${cityName} pe parcursul zilei. Recomandăm consultarea detaliată a indicelui de vânt.`,
        `Resimțirea de ${feelsLike}°C este factorul decisiv pentru alegerea vestimentației potrivite în ${cityName} în aceste ore, indiferent de temperatura afișată pe termometre.`
    ];

    // Zone 3: Tendințe și Regionalitate
    const zone3Templates = [
        `Prognoza pe 7 zile în ${cityName} indică o tendință de stabilizare meteo, specifică acestui interval din an în regiunea ${region}.`,
        `Analizând datele pe 14 zile, observăm că regiunea ${region} se află sub influența unor curenți de aer care pot schimba rapid tabloul meteo în ${cityName}.`,
        `Istoricul meteo pentru ${cityName} ne ajută să anticipăm variațiile sezoniere cu o precizie ridicată, oferindu-ți un avantaj în planificarea activităților.`,
        `Urmărim presiunea atmosferică și radiațiile UV (index actual: ${uv}) pentru a completa tabloul meteo în ${cityName} și a asigura siguranța utilizatorilor noștri.`
    ];

    // Zone 4: Planificare și Siguranță
    const zone4Templates = [
        `Recomandăm verificarea constantă a indicelui de precipitații (${precip}%) înainte de deplasări lungi sau evenimente organizate în aer liber în localitatea ${cityName}.`,
        `Vizibilitatea de ${vis} km asigură condiții de trafic ${parseFloat(vis) > 5 ? 'bune' : 'ce necesită atenție sporită'} în zona ${cityName} și pe drumurile adiacente.`,
        `Fantezia meteo se transformă în certitudine cu ajutorul modelelor matematice aplicate pentru ${cityName}, eliminând presupunerile din planurile tale.`,
        `Protecția solară este recomandată atunci când indicele UV (${uv}) depășește pragul de siguranță în ${cityName}, protejându-ți sănătatea pe parcursul expunerii.`
    ];

    const idx1 = getDeterministicIndex(cityName, day, 1);
    const idx2 = getDeterministicIndex(cityName, day, 2);
    const idx3 = getDeterministicIndex(cityName, day, 3);
    const idx4 = getDeterministicIndex(cityName, day, 4);

    return (
        <div className="mt-16 bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed font-sans">
            <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Vremea in {cityName} - Ghid si Info Meteo {currentYear}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-sm md:text-base">
                        <strong>Vremea în {cityName}</strong>: {zone1Templates[idx1]}
                    </p>
                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <Sun className="h-5 w-5 text-orange-500 shrink-0 mt-1" />
                        <p className="text-sm">
                            {zone2Templates[idx2]}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm md:text-base">
                        {zone3Templates[idx3]}
                    </p>
                    <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                        <p className="text-sm italic">
                            {zone4Templates[idx4]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
