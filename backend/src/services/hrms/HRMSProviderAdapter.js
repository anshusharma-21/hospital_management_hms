/**
 * Base abstract interface for external HRMS provider adapters
 */
class HRMSProviderAdapter {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  /**
   * Sync staff records from external HRMS
   * @param {Object} params - { tenantId, department, options }
   */
  async syncEmployees(params) {
    throw new Error(`[HRMSProviderAdapter] ${this.name} must implement syncEmployees()`);
  }

  /**
   * Fetch staff attendance / leave status from external HRMS
   * @param {Object} params - { tenantId, employeeId, date }
   */
  async getStaffAttendance(params) {
    throw new Error(`[HRMSProviderAdapter] ${this.name} must implement getStaffAttendance()`);
  }

  /**
   * Export approved hospital staff updates to external HRMS
   * @param {Object} params - { tenantId, staffData }
   */
  async exportStaff(params) {
    throw new Error(`[HRMSProviderAdapter] ${this.name} must implement exportStaff()`);
  }
}

module.exports = HRMSProviderAdapter;
