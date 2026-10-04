const AuditLog = require('../../models/AuditLog');
const MockHRMSAdapter = require('./MockHRMSAdapter');

class HRMSService {
  constructor() {
    this.adapters = new Map();
    this.registerAdapter('mock', new MockHRMSAdapter());
  }

  registerAdapter(name, adapter) {
    this.adapters.set(name.toLowerCase(), adapter);
  }

  resolveAdapter() {
    const providerKey = process.env.HRMS_PROVIDER || 'mock';
    const adapter = this.adapters.get(providerKey.toLowerCase());
    if (!adapter) {
      throw new Error(`[HRMSService] No registered HRMS adapter for provider '${providerKey}'`);
    }
    return adapter;
  }

  async syncStaff({ tenantId, department, requestedBy }) {
    if (!tenantId) {
      throw new Error('[HRMSService] tenantId is required for tenant isolation.');
    }
    const adapter = this.resolveAdapter();
    const result = await adapter.syncEmployees({ tenantId, department });

    // Asynchronously log audit trail
    AuditLog.create({
      tenant: tenantId,
      user: requestedBy?._id || undefined,
      action: 'HRMS Staff Sync',
      module: 'Settings & Config',
      entityType: 'Staff',
      details: `Synchronized ${result.count} staff records from ${result.provider} HRMS adapter`,
      timestamp: new Date()
    }).catch(err => console.warn('[HRMSService AuditLog Warning]:', err.message));

    return result;
  }

  async checkAttendance({ tenantId, employeeId, date }) {
    if (!tenantId) {
      throw new Error('[HRMSService] tenantId is required for tenant isolation.');
    }
    const adapter = this.resolveAdapter();
    return adapter.getStaffAttendance({ tenantId, employeeId, date });
  }

  async exportStaffUpdate({ tenantId, staffData, requestedBy }) {
    if (!tenantId) {
      throw new Error('[HRMSService] tenantId is required.');
    }
    const adapter = this.resolveAdapter();
    const result = await adapter.exportStaff({ tenantId, staffData });

    AuditLog.create({
      tenant: tenantId,
      user: requestedBy?._id || undefined,
      action: 'HRMS Staff Export',
      module: 'Settings & Config',
      entityType: 'Staff',
      details: `Exported staff update to ${result.provider} HRMS: status ${result.status}`,
      timestamp: new Date()
    }).catch(err => console.warn('[HRMSService AuditLog Warning]:', err.message));

    return result;
  }
}

module.exports = new HRMSService();
