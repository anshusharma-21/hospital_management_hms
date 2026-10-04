const AIProviderAdapter = require('./AIProviderAdapter');

class MockAIAdapter extends AIProviderAdapter {
  constructor() {
    super('mock');
  }

  async summarizeClinicalNotes({ notes = '', history = [] }) {
    return {
      success: true,
      provider: 'mock',
      isDraft: true,
      requiresClinicianReview: true,
      disclaimer: 'AI-generated clinical draft. Attending clinician must review and sign prior to committing to legal medical record.',
      summary: notes.length > 0 
        ? `Patient presented with: ${notes.slice(0, 80)}... Longitudinal history shows ${history.length} past encounters.`
        : 'Longitudinal profile stable. No acute active alerts flagged in recent records.',
      keyFindings: [
        'Vital signs reviewed',
        'Longitudinal drug allergies verified',
        'Follow-up interval suggested: 7-14 days'
      ]
    };
  }

  async suggestDifferential({ symptoms = [], vitals = {} }) {
    return {
      success: true,
      provider: 'mock',
      isDraft: true,
      requiresClinicianReview: true,
      disclaimer: 'Clinical decision support draft only. Does not constitute an authorized medical diagnosis.',
      differentials: [
        { condition: 'Upper Respiratory Tract Infection (URTI)', probability: 'High (0.82)', icd10Hint: 'J06.9' },
        { condition: 'Viral Pharyngitis', probability: 'Moderate (0.55)', icd10Hint: 'J02.9' },
        { condition: 'Seasonal Allergic Rhinitis', probability: 'Low (0.28)', icd10Hint: 'J30.9' }
      ]
    };
  }

  async voiceToSOAPDraft({ audioTranscript = '' }) {
    return {
      success: true,
      provider: 'mock',
      isDraft: true,
      requiresClinicianReview: true,
      disclaimer: 'Voice-to-note draft. Clinician verification and signature required.',
      soap: {
        subjective: audioTranscript || 'Patient reports mild fever and dry cough for 3 days.',
        objective: 'Vitals stable. Chest clear on auscultation.',
        assessment: 'Suspected viral upper respiratory syndrome.',
        plan: 'Hydration, rest, paracetamol 500mg SOS. Review if fever persists > 48h.'
      }
    };
  }

  async generateRevenueInsights({ collections = 0, occupancyRate = 0 }) {
    return {
      success: true,
      provider: 'mock',
      insights: [
        `Current daily cash flow is ₹${collections.toLocaleString('en-IN')}.`,
        `Inpatient bed occupancy is at ${occupancyRate}%. Wards have optimal capacity.`
      ],
      recommendations: [
        'Ensure pharmacy dispensing queues are reconciled before end-of-shift.',
        'Review pending TPA pre-authorization clearances to accelerate discharge billing.'
      ]
    };
  }
}

module.exports = MockAIAdapter;
