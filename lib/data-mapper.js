export const mapDbToFiscalRules = (dbData) => {
    if (!dbData) {
        console.warn('DataMapper: Document lipsa. Se returneaza fallback standard.');
        return getFallbackRules();
    }

    // Extragem sectiunea salary sau un obiect gol
    const rawSalary = dbData.salary || {};

    // Mapare campuri Salarii (Normalizare intre DB si FISCAL_SCHEMA)
    const mappedSalary = {
        // Fundamentale & Rate Standard
        minimum_salary: Number(rawSalary.minimum_salary || 0),
        average_salary: Number(rawSalary.average_salary || 0),
        cas_rate: Number(rawSalary.cas_rate ?? 0),
        pilon2_rate: Number(rawSalary.pilon2_rate ?? 0),
        cass_rate: Number(rawSalary.cass_rate ?? 0),
        income_tax_rate: Number(rawSalary.income_tax_rate ?? 0),
        cam_rate: Number(rawSalary.cam_rate ?? 0),

        // Sume Netaxabile & Beneficii
        untaxed_amount_enabled: Boolean(rawSalary.untaxed_amount_enabled ?? false),
        untaxed_amount: Number(rawSalary.untaxed_amount ?? 0),
        meal_voucher_max: Number(rawSalary.meal_voucher_max ?? 0),
        gift_voucher_threshold: Number(rawSalary.gift_voucher_threshold ?? 0),
        meal_allowance_max: Number(rawSalary.meal_allowance_max ?? 0),

        // Deduceri Personale
        personal_deduction_percent: Number(rawSalary.personal_deduction_percent ?? 0),
        personal_deduction_base: Number(rawSalary.personal_deduction_base ?? 0),
        personal_deduction_range: Number(rawSalary.personal_deduction_range ?? 0),
        child_deduction: Number(rawSalary.child_deduction ?? 0),
        dependent_deduction: Number(rawSalary.dependent_deduction ?? 0),

        // Sectoare Speciale - Salarii Minime
        minimum_gross_construction: Number(rawSalary.minimum_gross_construction || 0),
        minimum_gross_agriculture: Number(rawSalary.minimum_gross_agriculture || 0),
        minimum_gross_it: Number(rawSalary.minimum_gross_it || 0),

        // Facilitati IT
        it_tax_exempt: Boolean(rawSalary.it_tax_exempt ?? false),
        it_threshold: Number(rawSalary.it_threshold ?? 0),
        it_pilon2_optional: Boolean(rawSalary.it_pilon2_optional ?? false),

        // Facilitati Constructii & Agricultura
        construction_cas_rate: Number(rawSalary.construction_cas_rate ?? 0),
        construction_tax_exempt: Boolean(rawSalary.construction_tax_exempt ?? false),
        construction_cass_exempt: Boolean(rawSalary.construction_cass_exempt ?? false),
        agriculture_cas_rate: Number(rawSalary.agriculture_cas_rate ?? 0),
        agriculture_tax_exempt: Boolean(rawSalary.agriculture_tax_exempt ?? false),

        // Scutiri & Praguri Generale
        tax_exemption_threshold: Number(rawSalary.tax_exemption_threshold ?? 0),
        youth_exemption_enabled: Boolean(rawSalary.youth_exemption_enabled ?? false),
        youth_exemption_threshold: Number(rawSalary.youth_exemption_threshold ?? 0),
        disability_tax_exempt: Boolean(rawSalary.disability_tax_exempt ?? false),

        // Overtaxing (Suprataxare)
        part_time_overtax_enabled: Boolean(rawSalary.part_time_overtax_enabled ?? false),
        part_time_minor_exempt: Boolean(rawSalary.part_time_minor_exempt ?? false),
        part_time_student_exempt: Boolean(rawSalary.part_time_student_exempt ?? false),
        part_time_pensioner_exempt: Boolean(rawSalary.part_time_pensioner_exempt ?? false),
        part_time_second_job_exempt: Boolean(rawSalary.part_time_second_job_exempt ?? false),

        // UI Control
        show_year_comparison: Boolean(rawSalary.show_year_comparison ?? true),
    };

    // Explicitly map exchange rate to ensure safety
    const exchangeRate = {
        eur: Number(dbData.exchange_rate?.eur || 0),
        auto_update: Boolean(dbData.exchange_rate?.auto_update ?? true)
    };

    // Returnam obiectul complet, pastrand intacte modulele pe care Engine-ul nu le atinge
    return {
        ...dbData, // PFA, car_tax, real_estate, etc. raman intacte
        year: Number(dbData.year || 0),
        effectiveDate: dbData.effectiveDate || '',
        salary: mappedSalary, // Doar sectiunea salary este normalizata
        exchange_rate: exchangeRate // Normalized exchange rate
    };
};

const getFallbackRules = () => ({
    year: 0,
    effectiveDate: '',
    salary: {
        minimum_salary: 0,
        cas_rate: 0,
        cass_rate: 0,
        income_tax_rate: 0,
        cam_rate: 0,
        untaxed_amount: 0,
        it_tax_exempt: false,
        it_threshold: 0,
        personal_deduction_percent: 0,
        personal_deduction_base: 0,
        personal_deduction_range: 0
    }
});
