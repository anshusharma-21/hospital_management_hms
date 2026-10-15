/**
 * Drug-Allergy Interaction & Cross-Reactivity Safety Engine
 * Validates prescribed drugs against documented patient allergies and drug classes.
 */

// Drug class associations and brand/generic family mappings
const DRUG_FAMILIES = {
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

/**
 * Normalizes text for allergen matching.
 */
function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Determines whether a medicine belongs to a given allergy class.
 */
function isDrugInAllergyFamily(medicineName, allergenName) {
  const normMed = normalizeName(medicineName);
  const normAllergen = normalizeName(allergenName);

  if (!normMed || !normAllergen) return false;

  // Exact or direct substring match
  if (normMed.includes(normAllergen) || normAllergen.includes(normMed)) {
    return true;
  }

  // Cross-reference mapped drug families
  for (const [familyKey, members] of Object.entries(DRUG_FAMILIES)) {
    const allergenMatchesFamily =
      normAllergen.includes(familyKey) ||
      members.some((m) => normalizeName(m) === normAllergen || normAllergen.includes(normalizeName(m)));

    if (allergenMatchesFamily) {
      const medMatchesFamily =
        normMed.includes(familyKey) ||
        members.some((m) => normalizeName(m) === normMed || normMed.includes(normalizeName(m)));

      if (medMatchesFamily) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Cross-checks prescribed medications against patient allergy records.
 * @param {Array} medications - Array of prescribed medicine objects { medicineName, dosage, ... }
 * @param {Array} allergies - Array of patient allergy objects { allergen, severity, ... } or strings
 * @returns {Object} { hasConflict: boolean, conflicts: Array }
 */
function checkDrugAllergyConflicts(medications, allergies) {
  const conflicts = [];

  if (!Array.isArray(medications) || !Array.isArray(allergies)) {
    return { hasConflict: false, conflicts: [] };
  }

  for (const med of medications) {
    const medName = med?.medicineName || (typeof med === 'string' ? med : '');
    if (!medName) continue;

    for (const allergy of allergies) {
      const allergenName = typeof allergy === 'string' ? allergy : allergy?.allergen;
      const severity = typeof allergy === 'object' ? allergy?.severity || 'High' : 'High';

      if (!allergenName) continue;

      if (isDrugInAllergyFamily(medName, allergenName)) {
        conflicts.push({
          medicineName: medName,
          allergen: allergenName,
          severity,
          reason: `Prescribed drug "${medName}" matches documented patient allergy "${allergenName}" or its drug class cross-reactivity. High risk of anaphylactic or adverse clinical reaction.`
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

module.exports = {
  DRUG_FAMILIES,
  isDrugInAllergyFamily,
  checkDrugAllergyConflicts
};
