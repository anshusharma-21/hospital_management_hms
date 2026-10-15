/**
 * Frontend Clinical Safety & Physiological Range Utilities
 */

export const PHYSIOLOGICAL_BOUNDS = {
  bloodPressureSystolic: { min: 50, max: 260, label: 'Systolic BP', unit: 'mmHg' },
  bloodPressureDiastolic: { min: 30, max: 160, label: 'Diastolic BP', unit: 'mmHg' },
  pulse: { min: 30, max: 250, label: 'Pulse Rate', unit: 'bpm' },
  temperature: { min: 85, max: 112, label: 'Temperature', unit: '°F' },
  spo2: { min: 50, max: 100, label: 'SpO2 Oxygen', unit: '%' },
  respiratoryRate: { min: 4, max: 80, label: 'Respiratory Rate', unit: 'breaths/min' },
  bloodSugarRandom: { min: 20, max: 1000, label: 'Random Blood Sugar', unit: 'mg/dL' },
  bloodSugarFasting: { min: 20, max: 1000, label: 'Fasting Blood Sugar', unit: 'mg/dL' },
  painScore: { min: 0, max: 10, label: 'Pain Score', unit: 'scale' }
};

export const DRUG_FAMILIES = {
  penicillin: [
    'penicillin',
    'amoxicillin',
    'ampicillin',
    'augmentin',
    'amoxicillin-clavulanate',
    'piperacillin',
    'oxacillin',
    'cloxacillin',
    'nafcillin',
    'ampicillin-sulbactam',
    'piperacillin-tazobactam',
    'zosyn',
    'moxatag',
    'amoxil'
  ],
  cephalosporin: [
    'cephalosporin',
    'cefazolin',
    'ceftriaxone',
    'cefuroxime',
    'cephalexin',
    'cefixime',
    'cefepime',
    'cefotaxime',
    'keflex',
    'rocephin'
  ],
  sulfa: [
    'sulfa',
    'sulfonamide',
    'sulfamethoxazole',
    'trimethoprim-sulfamethoxazole',
    'bactrim',
    'septra',
    'sulfadiazine',
    'sulfasalazine'
  ],
  nsaid: [
    'nsaid',
    'aspirin',
    'ibuprofen',
    'naproxen',
    'diclofenac',
    'ketorolac',
    'indomethacin',
    'meloxicam',
    'celecoxib',
    'motrin',
    'advil',
    'aleve',
    'toradol',
    'voveran'
  ],
  fluoroquinolone: [
    'fluoroquinolone',
    'ciprofloxacin',
    'levofloxacin',
    'moxifloxacin',
    'norfloxacin',
    'ofloxacin',
    'cipro',
    'levaquin'
  ],
  macrolide: [
    'macrolide',
    'azithromycin',
    'erythromycin',
    'clarithromycin',
    'zithromax',
    'biaxin'
  ]
};

function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isDrugAllergyConflict(medicineName, allergenName) {
  const normMed = normalizeName(medicineName);
  const normAllergen = normalizeName(allergenName);

  if (!normMed || !normAllergen) return false;

  if (normMed.includes(normAllergen) || normAllergen.includes(normMed)) {
    return true;
  }

  for (const [familyKey, members] of Object.entries(DRUG_FAMILIES)) {
    const allergenMatches =
      normAllergen.includes(familyKey) ||
      members.some((m) => normalizeName(m) === normAllergen || normAllergen.includes(normalizeName(m)));

    if (allergenMatches) {
      const medMatches =
        normMed.includes(familyKey) ||
        members.some((m) => normalizeName(m) === normMed || normMed.includes(normalizeName(m)));

      if (medMatches) return true;
    }
  }

  return false;
}

export function checkMedicationAllergies(medications, patientAllergies) {
  const conflicts = [];
  if (!Array.isArray(medications) || !Array.isArray(patientAllergies)) {
    return conflicts;
  }

  for (const med of medications) {
    const medName = med?.medicineName || '';
    if (!medName) continue;

    for (const allergy of patientAllergies) {
      const allergen = typeof allergy === 'string' ? allergy : allergy?.allergen;
      const severity = typeof allergy === 'object' ? allergy?.severity || 'High' : 'High';
      if (!allergen) continue;

      if (isDrugAllergyConflict(medName, allergen)) {
        conflicts.push({
          medicineName: medName,
          allergen,
          severity,
          reason: `Documented cross-reactivity between ${medName} and patient's ${allergen} allergy`
        });
      }
    }
  }

  return conflicts;
}

export function validateVitalsFrontend(vitals) {
  const errors = [];
  for (const [key, range] of Object.entries(PHYSIOLOGICAL_BOUNDS)) {
    const val = vitals[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push(`${range.label} must be a number`);
      } else if (num < range.min || num > range.max) {
        errors.push(`${range.label} must be between ${range.min} and ${range.max} ${range.unit}`);
      }
    }
  }

  if (
    vitals.bloodPressureSystolic &&
    vitals.bloodPressureDiastolic &&
    Number(vitals.bloodPressureSystolic) <= Number(vitals.bloodPressureDiastolic)
  ) {
    errors.push('Systolic BP must be higher than Diastolic BP');
  }

  return errors;
}

export function calculatePrescriptionQuantity(dosageStr, frequencyStr, durationStr) {
  const doseMatch = String(dosageStr || '').match(/(\d+(\.\d+)?)/);
  const unitsPerDose = doseMatch ? parseFloat(doseMatch[1]) : 1;

  let timesPerDay = 1;
  const freq = String(frequencyStr || '').toLowerCase();
  if (freq.includes('bd') || freq.includes('twice')) {
    timesPerDay = 2;
  } else if (freq.includes('tds') || freq.includes('thrice') || freq.includes('three')) {
    timesPerDay = 3;
  } else if (freq.includes('qid') || freq.includes('four')) {
    timesPerDay = 4;
  } else if (freq.includes('od') || freq.includes('once') || freq.includes('hs') || freq.includes('bedtime')) {
    timesPerDay = 1;
  } else if (freq.includes('sos') || freq.includes('as needed')) {
    timesPerDay = 1;
  }

  const durStr = String(durationStr || '').toLowerCase();
  let days = 5;
  const daysMatch = durStr.match(/(\d+)\s*(day|d)/);
  const weeksMatch = durStr.match(/(\d+)\s*(week|wk)/);
  const monthsMatch = durStr.match(/(\d+)\s*(month|mo)/);
  const justNumMatch = durStr.match(/^(\d+)$/);

  if (daysMatch) {
    days = parseInt(daysMatch[1], 10);
  } else if (weeksMatch) {
    days = parseInt(weeksMatch[1], 10) * 7;
  } else if (monthsMatch) {
    days = parseInt(monthsMatch[1], 10) * 30;
  } else if (justNumMatch) {
    days = parseInt(justNumMatch[1], 10);
  }

  return Math.max(1, Math.round(unitsPerDose * timesPerDay * days));
}

