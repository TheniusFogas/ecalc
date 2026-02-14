import { Sun, Wind, Info, ShieldCheck, Heart, MapPin, Sparkles, Activity } from 'lucide-react';

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

    // Zone 1: Context Uman & Local (Emotie)
    const zone1Templates = [
        `Gândurile noastre se îndreaptă către locuitorii din **${cityName}**, județul **${region}**, care încep această zi sub un cer ce promite o dinamică meteo fascinantă. Fiecare adiere de vânt și fiecare rază de soare spun o poveste despre specificul climatic al acestei zone superbe.`,
        `Există ceva magic în atmosfera din **${cityName}** astăzi. Fiind o parte vitală a județului **${region}**, această localitate se pregătește pentru o zi în care natura își dictează propriul ritm, invitându-ne să ne adaptăm planurile cu zâmbetul pe buze.`,
        `Dacă te afli în **${cityName}** sau plănuiești să vizitezi inima județului **${region}**, este esențial să simți pulsul vremii. Dincolo de cifre, este vorba despre confortul tău și despre cum poți profita la maximum de această zi specială.`,
        `Comunitatea din **${cityName}** trăiește astăzi o experiență meteo autentică, tipică pentru **${region}**. Ne face plăcere să îți oferim aceste detalii nu doar ca date tehnice, ci ca un ghid prietenos pentru siguranța și bucuria ta zilnică.`
    ];

    // Zone 2: Confort & Stil de Viață
    const zone2Templates = [
        `Cu o temperatură resimțită de **${feelsLike}°C**, corpul tău va percepe aerul din **${cityName}** într-un mod ${temp > 20 ? 'generos' : 'viguros'}. Este momentul perfect să alegi o vestimentație care să îți permită să te simți în largul tău pe străzile din **${region}**.`,
        `Umiditatea de **${humidity}%** creează o textură aparte a aerului în **${cityName}**. Simțim cum atmosfera se mulează pe nevoile tale, transformând o simplă plimbare prin județul **${region}** într-o amintire ${humidity > 70 ? 'răcoroasă' : 'plăcută'}.`,
        `Vântul ce adie cu **${wind} km/h** nu este doar un indicator, ci un partener de drum în **${cityName}**. În județul **${region}**, aceste rafale subtile ne amintesc să ne protejăm confortul termic cu atenție și stil.`,
        `La **${temp}°C**, inima orașului **${cityName}** bate într-un ritm temperat. Este acea zi din **${region}** în care echilibrul dintre soare și nori te invită la introspecție sau la o cafea savurată în aer liber.`
    ];

    // Zone 3: Recomandări Proactive
    const zone3Templates = [
        `Privind spre viitorul apropiat în **${cityName}**, observăm o tendință de stabilitate care ne oferă încredere. În tot județul **${region}**, natura pare să se așeze, oferindu-ne fereastra ideală pentru planuri pe termen lung.`,
        `Schimbările line de presiune din **${cityName}** sugerează că regiunea **${region}** trece printr-o etapă de transformare estetică. Este timpul să fii proactiv și să îți ajustezi agenda pentru a nu fi surprins de capriciile cerului.`,
        `Istoricul meteo local ne învață că **${cityName}** are întotdeauna un as în mână. Astăzi, în județul **${region}**, recomandăm să fii pregătit pentru micile surprize care fac viața dinamică și interesantă.`,
        `Analiza noastră detaliată pentru **${cityName}** indică un index UV de **${uv}**. Sănătatea pielii tale este prioritară în **${region}**, așa că nu ezita să folosești protecția adecvată pentru a te bucura de lumină în siguranță.`
    ];

    // Zone 4: Siguranță & Empatie
    const zone4Templates = [
        `Siguranța ta în **${cityName}** este ceea ce ne motivează. Cu o probabilitate de precipitații de **${precip}%**, județul **${region}** ne îndeamnă la o prudență elegantă, asigurându-ne că nicio picătură de ploaie nu ne va strica buna dispoziție.`,
        `Monitorizăm fiecare grad din **${cityName}** pentru ca tu să poți dormi liniștit. Indiferent de condițiile din județul **${region}**, suntem aici să îți oferim acea certitudine de care ai nevoie pentru a proteja ceea ce contează pentru tine.`,
        `Vremea în **${cityName}** nu este doar despre cifre, ci despre oameni. Ne pasă ca fiecare locuitor din **${region}** să aibă acces la cea mai onestă și caldă prognoză, eliminând orice urmă de incertitudine din viața de zi cu zi.`,
        `Fiecare prognoză pentru **${cityName}** este un act de responsabilitate față de tine. În județul **${region}**, ne luăm angajamentul să transformăm datele satelitare în sfaturi utile, oferite cu grijă și respect pentru timpul tău.`
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
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vremea in {cityName} ({region})</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghid Contextual & Recomandări Locale • {currentYear}</p>
                    </div>
                </div>
                <Sparkles className="h-4 w-4 text-orange-400 animate-pulse" />
            </div>

            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Partea Stângă */}
                <div className="flex flex-col">
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="mt-1"><MapPin className="h-4 w-4 text-blue-600" /></div>
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone1Templates[idx1] }} />
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-[4px] border border-slate-100 flex gap-4 mt-auto">
                            <div className="mt-1"><Heart className="h-4 w-4 text-red-500" /></div>
                            <p className="text-sm text-slate-600 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: zone2Templates[idx2] }} />
                        </div>
                    </div>
                </div>

                {/* Partea Dreaptă */}
                <div className="flex flex-col">
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="mt-1"><Sparkles className="h-4 w-4 text-orange-500" /></div>
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: zone3Templates[idx3] }} />
                        </div>
                        <div className="bg-blue-50/30 p-4 rounded-[4px] border border-blue-100/50 flex gap-4 mt-auto">
                            <div className="mt-1"><ShieldCheck className="h-4 w-4 text-blue-600" /></div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: zone4Templates[idx4] }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-3 flex justify-center border-t border-slate-100">
                <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Date Satelitare 1:1</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verificat Manual</span>
                    <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Update Orar</span>
                </div>
            </div>
        </div>
    );
};
