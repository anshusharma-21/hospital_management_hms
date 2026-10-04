const HRMSProviderAdapter = require('./HRMSProviderAdapter');

class MockHRMSAdapter extends HRMSProviderAdapter {
  constructor() {
    super('mock');
    this.syncedLogs = [];
  }

  async syncEmployees({ tenantId, department }) {
    const timestamp = new Date();
    const mockStaff = [
      {
        externalEmployeeId: 'HRMS-EMP-001',
        name: 'Dr. Anita Desai',
        email: 'anita.desai@citycare.mock',
        role: 'doctor',
        department: department || 'Cardiology',
        employmentStatus: 'Active',
        joinedDate: '2024-01-15'
      },
      {
        externalEmployeeId: 'HRMS-EMP-002',
        name: 'Nurse Priya Sharma',
        email: 'priya.sharma@citycare.mock',
        role: 'nurse',
        department: department || 'General Medicine',
        employmentStatus: 'Active',
        joinedDate: '2024-03-01'
      }
    ];

    this.syncedLogs.push({ tenantId, count: mockStaff.length, timestamp });

    return {
      success: true,
      provider: 'mock',
      count: mockStaff.length,
      employees: mockStaff,
      syncedAt: timestamp
    };
  }

  async getStaffAttendance({ tenantId, employeeId, date }) {
    return {
      success: true,
      provider: 'mock',
      employeeId,
      date: date || new Date().toISOString().split('T')[0],
      status: 'Present',
      shift: 'Day Shift (08:00 - 16:00)',
      checkInTime: '07:54 AM'
    };
  }

  async exportStaff({ tenantId, staffData }) {
    return {
      success: true,
      provider: 'mock',
      externalSyncId: `HRMS-SYNC-${Date.now()}`,
      exportedAt: new Date(),
      status: 'SYNCHRONIZED'
    };
  }
}

module.exports = MockHRMSAdapter;
