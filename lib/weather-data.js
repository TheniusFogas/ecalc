// Open-Meteo API integration pentru date meteo istorice România
// API gratuit, fără API key necesar

/**
 * Extrage date meteo istorice pentru o dată specifică din România
 * Folosește Open-Meteo Historical Weather API
 * @param {string} date - Data în format YYYY-MM-DD
 * @returns {Promise<{temp: string, condition: string, icon: string}>}
 */
/**
 * Extrage date meteo istorice pentru o dată specifică din România
 * Folosește Open-Meteo Historical Weather API
 * @param {string} date - Data în format YYYY-MM-DD
 * @returns {Promise<{temp: string, condition: string, icon: string}>}
 */
export async function getHistoricalWeather(date) {
    const targetDate = new Date(date);
    const targetYear = targetDate.getFullYear();

    // Pentru 2026, folosim datele hardcodate direct (cerință utilizator: fără apeluri de nebun)
    if (targetYear === 2026) {
        return getHardcodedWeather(targetDate.getMonth());
    }

    try {
        // Coordonate București, România (centru țară)
        const lat = 44.4268;
        const lon = 26.1025;

        // Extragem anul din dată
        const targetDate = new Date(date);
        const currentYear = new Date().getFullYear();

        // Calculăm media ultimilor 5 ani (sau până în 2015)
        const startYear = Math.max(2015, currentYear - 5);
        const endYear = currentYear - 1; // Nu includem anul curent

        // Construim datele pentru fiecare an
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');

        let totalTemp = 0;
        let totalPrecip = 0;
        let count = 0;

        // Fetch date pentru fiecare an
        for (let year = startYear; year <= endYear; year++) {
            const historicalDate = `${year}-${month}-${day}`;

            try {
                const response = await fetch(
                    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${historicalDate}&end_date=${historicalDate}&daily=temperature_2m_mean,precipitation_sum&timezone=Europe/Bucharest`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.daily && data.daily.temperature_2m_mean && data.daily.temperature_2m_mean[0] !== null) {
                        totalTemp += data.daily.temperature_2m_mean[0];
                        totalPrecip += data.daily.precipitation_sum[0] || 0;
                        count++;
                    }
                }
            } catch (error) {
                console.error(`Error fetching weather for ${historicalDate}:`, error);
            }
        }

        if (count === 0) {
            // Fallback la date aproximative dacă API-ul eșuează
            return getFallbackWeather(targetDate.getMonth());
        }

        const avgTemp = Math.round(totalTemp / count);
        const avgPrecip = totalPrecip / count;

        // Determinăm condiția meteo
        let condition = 'Senin';
        let icon = 'Sun';

        if (avgTemp < 0) {
            condition = 'Îngheț';
            icon = 'Snowflake';
        } else if (avgTemp < 5 && avgPrecip > 5) {
            condition = 'Ninsoare';
            icon = 'CloudSnow';
        } else if (avgPrecip > 10) {
            condition = 'Ploaie';
            icon = 'CloudRain';
        } else if (avgTemp > 30) {
            condition = 'Caniculă';
            icon = 'Sun';
        } else if (avgPrecip > 2) {
            condition = 'Nor';
            icon = 'Cloud';
        }

        return {
            temp: `${avgTemp}°C`,
            condition,
            icon
        };
    } catch (error) {
        console.error('Error fetching historical weather:', error);
        return getFallbackWeather(new Date(date).getMonth());
    }
}

/**
 * Date meteo bazate pe statistici climatice România (Media multianuală)
 * Folosit pentru 2026 (hardcoded) și ca fallback
 */
export function getHardcodedWeather(month) {
    const data = {
        0: { temp: '2°C', condition: 'Îngheț', icon: 'Snowflake' },
        1: { temp: '5°C', condition: 'Ninsoare', icon: 'CloudSnow' },
        2: { temp: '10°C', condition: 'Primăvară', icon: 'Flower2' },
        3: { temp: '16°C', condition: 'Ploaie', icon: 'CloudRain' },
        4: { temp: '20°C', condition: 'Senin', icon: 'Sun' },
        5: { temp: '24°C', condition: 'Cald', icon: 'Sun' },
        6: { temp: '27°C', condition: 'Caniculă', icon: 'Sun' },
        7: { temp: '27°C', condition: 'Caniculă', icon: 'Sun' },
        8: { temp: '20°C', condition: 'Toamnă', icon: 'Leaf' },
        9: { temp: '14°C', condition: 'Ploaie', icon: 'CloudRain' },
        10: { temp: '7°C', condition: 'Ceață', icon: 'Cloud' },
        11: { temp: '1°C', condition: 'Îngheț', icon: 'Snowflake' }
    };

    return data[month];
}

/**
 * Păstrat pentru compatibilitate inversă
 * @deprecated Use getHardcodedWeather instead
 */
function getFallbackWeather(month) {
    return getHardcodedWeather(month);
}
