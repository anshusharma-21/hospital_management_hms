/**
 * Clinical Range & Physiological Bound Validators
 * Enforces physiological limits for patient vital signs on server and client.
 */

const PHYSIOLOGICAL_RANGES = {
  bloodPressureSystolic: {
    min: 50,
    max: 260,
    unit: 'mmHg',
    label: 'Systolic Blood Pressure',
    unusualLow: 80,
    unusualHigh: 180
  },
  bloodPressureDiastolic: {
    min: 30,
    max: 160,
    unit: 'mmHg',
    label: 'Diastolic Blood Pressure',
    unusualLow: 50,
    unusualHigh: 110
  },
  pulse: {
    min: 30,
    max: 250,
    unit: 'bpm',
    label: 'Heart Rate / Pulse',
    unusualLow: 50,
    unusualHigh: 120
  },
  temperature: {
    min: 85,
    max: 112,
    unit: '°F',
    label: 'Body Temperature',
    unusualLow: 96,
    unusualHigh: 103
  },
  spo2: {
    min: 50,
    max: 100,
    unit: '%',
    label: 'Oxygen Saturation (SpO2)',
    unusualLow: 90,
    unusualHigh: 100
  },
  respiratoryRate: {
    min: 4,
    max: 80,
    unit: 'breaths/min',
    label: 'Respiratory Rate',
    unusualLow: 10,
    unusualHigh: 30
  },
  bloodSugarRandom: {
    min: 20,
    max: 1000,
    unit: 'mg/dL',
    label: 'Random Blood Sugar',
    unusualLow: 60,
    unusualHigh: 250
  },
  bloodSugarFasting: {
    min: 20,
    max: 1000,
    unit: 'mg/dL',
    label: 'Fasting Blood Sugar',
    unusualLow: 60,
    unusualHigh: 200
  },
  height: {
    min: 30,
    max: 280,
    unit: 'cm',
    label: 'Height',
    unusualLow: 50,
    unusualHigh: 220
  },
  weight: {
    min: 0.5,
    max: 400,
    unit: 'kg',
    label: 'Weight',
    unusualLow: 2,
    unusualHigh: 200
  },
  painScore: {
    min: 0,
    max: 10,
    unit: 'scale (0-10)',
    label: 'Pain Score',
    unusualLow: 0,
    unusualHigh: 10
  }
};

/**
 * Validates a set of vital sign measurements.
 * @param {Object} vitals - Object containing vital fields
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
function validateVitalSigns(vitals) {
  const errors = [];
  const warnings = [];

  if (!vitals || typeof vitals !== 'object') {
    return { isValid: false, errors: ['Vitals payload must be an object'], warnings: [] };
  }

  // Check each field against physiological ranges
  for (const [key, range] of Object.entries(PHYSIOLOGICAL_RANGES)) {
    const value = vitals[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const num = Number(value);
    if (isNaN(num)) {
      errors.push(`${range.label} must be a valid number`);
      continue;
    }

    // Physiological impossible bounds check
    if (num < range.min || num > range.max) {
      errors.push(
        `${range.label} (${num} ${range.unit}) is outside physiological limits (${range.min} - ${range.max} ${range.unit})`
      );
    } else if (range.unusualLow !== undefined && (num < range.unusualLow || num > range.unusualHigh)) {
      warnings.push(
        `${range.label} (${num} ${range.unit}) is clinically unusual (Normal range: ${range.unusualLow} - ${range.unusualHigh} ${range.unit})`
      );
    }
  }

  // Cross-field BP check: Systolic must be greater than Diastolic
  if (
    vitals.bloodPressureSystolic !== undefined &&
    vitals.bloodPressureDiastolic !== undefined &&
    vitals.bloodPressureSystolic !== '' &&
    vitals.bloodPressureDiastolic !== ''
  ) {
    const sys = Number(vitals.bloodPressureSystolic);
    const dia = Number(vitals.bloodPressureDiastolic);
    if (!isNaN(sys) && !isNaN(dia) && sys <= dia) {
      errors.push(`Systolic BP (${sys} mmHg) must be greater than Diastolic BP (${dia} mmHg)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  PHYSIOLOGICAL_RANGES,
  validateVitalSigns
};
