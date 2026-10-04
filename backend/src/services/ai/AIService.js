const FeatureFlag = require('../../models/FeatureFlag');
const AuditLog = require('../../models/AuditLog');
const MockAIAdapter = require('./MockAIAdapter');

class AIService {
  constructor() {
    this.adapters = new Map();
    this.registerAdapter('mock', new MockAIAdapter());
  }

  registerAdapter(name, adapter) {
    this.adapters.set(name.toLowerCase(), adapter);
  }

  resolveAdapter() {
    const providerKey = process.env.AI_PROVIDER || 'mock';
    const adapter = this.adapters.get(providerKey.toLowerCase());
    if (!adapter) {
      throw new Error(`[AIService] No registered AI adapter for provider '${providerKey}'`);
    }
    return adapter;
  }

  async isEnabledForTenant(tenantId) {
    if (!tenantId) return false;
    const flag = await FeatureFlag.findOne({
      tenant: tenantId,
      moduleKey: { $in: ['module_ai_assistant', 'module_ai_copilot'] }
    });
    // Default to true if not explicitly disabled
    return flag ? flag.isEnabled : true;
  }

  async summarizeNotes({ tenantId, notes, history = [], requestedBy }) {
    if (!tenantId) throw new Error('[AIService] tenantId is required.');
    const enabled = await this.isEnabledForTenant(tenantId);
    if (!enabled) {
      return {
        success: false,
        disabled: true,
        message: 'AI Assistant module is not enabled for this hospital tenant.'
      };
    }

    const adapter = this.resolveAdapter();
    const result = await adapter.summarizeClinicalNotes({ notes, history });

    AuditLog.create({
      tenant: tenantId,
      user: requestedBy?._id || undefined,
      action: 'AI Clinical Note Summary Draft Generated',
      module: 'Clinical / EMR',
      details: 'Generated draft clinical summary (clinician review required)',
      timestamp: new Date()
    }).catch(err => console.warn('[AIService AuditLog Warning]:', err.message));

    return result;
  }

  async suggestDifferential({ tenantId, symptoms, vitals, requestedBy }) {
    if (!tenantId) throw new Error('[AIService] tenantId is required.');
    const enabled = await this.isEnabledForTenant(tenantId);
    if (!enabled) {
      return {
        success: false,
        disabled: true,
        message: 'AI Assistant module is not enabled for this hospital tenant.'
      };
    }

    const adapter = this.resolveAdapter();
    return adapter.suggestDifferential({ symptoms, vitals });
  }

  async voiceToSOAP({ tenantId, audioTranscript, requestedBy }) {
    if (!tenantId) throw new Error('[AIService] tenantId is required.');
    const enabled = await this.isEnabledForTenant(tenantId);
    if (!enabled) {
      return {
        success: false,
        disabled: true,
        message: 'AI Assistant module is not enabled for this hospital tenant.'
      };
    }

    const adapter = this.resolveAdapter();
    return adapter.voiceToSOAPDraft({ audioTranscript });
  }

  async getRevenueInsights({ tenantId, collections, occupancyRate, requestedBy }) {
    if (!tenantId) throw new Error('[AIService] tenantId is required.');
    const adapter = this.resolveAdapter();
    return adapter.generateRevenueInsights({ collections, occupancyRate });
  }
}

module.exports = new AIService();
