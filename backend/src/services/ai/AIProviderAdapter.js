/**
 * Provider-neutral interface for AI Assistants
 */
class AIProviderAdapter {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  /**
   * Summarize longitudinal clinical note into concise bullet points
   */
  async summarizeClinicalNotes(params) {
    throw new Error(`[AIProviderAdapter] ${this.name} must implement summarizeClinicalNotes()`);
  }

  /**
   * Suggest differential diagnosis draft based on presenting vitals and complaints
   */
  async suggestDifferential(params) {
    throw new Error(`[AIProviderAdapter] ${this.name} must implement suggestDifferential()`);
  }

  /**
   * Convert clinical voice dictation transcript into structured SOAP draft
   */
  async voiceToSOAPDraft(params) {
    throw new Error(`[AIProviderAdapter] ${this.name} must implement voiceToSOAPDraft()`);
  }

  /**
   * Generate revenue and census insights for hospital leadership
   */
  async generateRevenueInsights(params) {
    throw new Error(`[AIProviderAdapter] ${this.name} must implement generateRevenueInsights()`);
  }
}

module.exports = AIProviderAdapter;
