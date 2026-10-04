const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'gap_closure_master_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Encounter = require('../src/models/Encounter');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const InsurancePolicy = require('../src/models/InsurancePolicy');
const RadiologyOrder = require('../src/models/RadiologyOrder');
const AuditLog = require('../src/models/AuditLog');
const OTRecord = require('../src/models/OTRecord');

const billingController = require('../src/controllers/billingController');
const labController = require('../src/controllers/labController');
const dashboardController = require('../src/controllers/dashboardController');
const tenantController = require('../src/controllers/tenantController');
const ipdController = require('../src/controllers/ipdController');
const clinicalController = require('../src/controllers/clinicalController');
const patientController = require('../src/controllers/patientController');

const makeMockRes = () => {
  const result = { code: 200, data: null };
  const res = {
    status: (code) => {
      result.code = code;
      return res;
    },
    json: (payload) => {
      result.data = payload;
      return res;
    }
  };
  const next = (err) => {
    if (err) {
      result.code = result.code && result.code !== 200 ? result.code : 500;
      result.data = { success: false, error: err.message, message: err.message };
    }
  };
  return { result, res, next };
};

describe('Hospital Vision Final Gap-Closure Master Test Suite (Phases 3, 4, 5)', () => {
  let primaryTenant;
  let secondaryTenant;
  let primaryBranch;
  let adminUser;
  let doctorUser;
  let cashierUser;
  let testPatient;
  let testPolicy;
  let refundInvoice;
  let refundPayment;
  let radOrder;
  let encounterToComplete;
  let aptToComplete;
  let sourcePatient;
  let targetPatient;
  let sourceApt;
  let sourceEncounter;
  let sourceInvoice;

  before(async () => {
    try {
      await connectDB();

    const timestamp = Date.now();

    primaryTenant = await Tenant.create({
      name: `Prime Healthcare ${timestamp}`,
      slug: `prime-health-${timestamp}`,
      subscription: { plan: 'Professional (Up to 100 Beds)', status: 'active', maxBeds: 100 }
    });

    secondaryTenant = await Tenant.create({
      name: `Apex Care ${timestamp}`,
      slug: `apex-care-${timestamp}`,
      subscription: { plan: 'Enterprise (500+ Beds)', status: 'active', maxBeds: 500 }
    });

    primaryBranch = await Branch.create({
      tenant: primaryTenant._id,
      name: 'Main Campus',
      code: `MC-${timestamp}`
    });

    adminUser = await User.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      name: 'Admin Test',
      email: `admin_${timestamp}@primehealth.com`,
      password: 'Password123!',
      role: 'hospital_admin'
    });

    doctorUser = await User.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      name: 'Dr. Vikram Shah',
      email: `doctor_${timestamp}@primehealth.com`,
      password: 'Password123!',
      role: 'doctor'
    });

    cashierUser = await User.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      name: 'Cashier Test',
      email: `cashier_${timestamp}@primehealth.com`,
      password: 'Password123!',
      role: 'billing_cashier'
    });

    testPatient = await Patient.create({
      tenant: primaryTenant._id,
      primaryBranch: primaryBranch._id,
      uhid: `HV-TEST-${timestamp.toString().slice(-4)}`,
      firstName: 'Sunil',
      lastName: 'Kumar',
      fullName: 'Sunil Kumar',
      gender: 'Male',
      age: 42,
      phone: '9876541111'
    });

    testPolicy = await InsurancePolicy.create({
      tenant: primaryTenant._id,
      patient: testPatient._id,
      insuranceProvider: 'Star Health Allied Insurance',
      tpaName: 'MediAssist TPA',
      policyNumber: `POL-${timestamp}`,
      policyHolderName: testPatient.fullName,
      sumInsuredLimit: 500000
    });

    refundInvoice = await Invoice.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: testPatient._id,
      invoiceNumber: `INV-REF-${timestamp}`,
      billingType: 'OPD Consultation',
      items: [{
        description: 'Consultation Fee',
        quantity: 1,
        unitPrice: 1000,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 1000
      }],
      subtotal: 1000,
      totalTax: 0,
      grandTotal: 1000,
      paidAmount: 1000,
      balanceDue: 0,
      status: 'Fully Paid'
    });

    refundPayment = await Payment.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      invoice: refundInvoice._id,
      patient: testPatient._id,
      receiptNumber: `REC-REF-${timestamp}`,
      amountPaid: 1000,
      paymentMethod: 'Cash',
      paymentType: 'Bill Settlement',
      collectedBy: cashierUser._id,
      status: 'Completed'
    });

    radOrder = await RadiologyOrder.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: testPatient._id,
      doctor: doctorUser._id,
      orderNumber: `RAD-${timestamp}`,
      modality: 'CT Scan',
      bodyPart: 'Chest',
      clinicalIndication: 'Productive cough, rule out consolidation',
      priority: 'Urgent',
      status: 'Ordered'
    });

    aptToComplete = await Appointment.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: testPatient._id,
      doctor: doctorUser._id,
      appointmentDate: new Date(),
      slotTime: '11:00 AM',
      tokenNumber: 101,
      type: 'New Consultation',
      status: 'In-Consultation',
      consultationFee: 800
    });

    encounterToComplete = await Encounter.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: testPatient._id,
      doctor: doctorUser._id,
      appointment: aptToComplete._id,
      encounterNumber: `ENC-${timestamp}-1`,
      encounterType: 'OPD',
      status: 'In-Progress',
      chiefComplaint: 'Acute pharyngitis and fever'
    });

    sourcePatient = await Patient.create({
      tenant: primaryTenant._id,
      primaryBranch: primaryBranch._id,
      uhid: `HV-DUP-${timestamp.toString().slice(-4)}`,
      firstName: 'Sunil',
      lastName: 'K Kumar',
      fullName: 'Sunil K Kumar',
      gender: 'Male',
      dateOfBirth: new Date('1984-06-12'),
      phone: '9876542222',
      allergies: [{ allergen: 'Sulfa Drugs', severity: 'Moderate' }]
    });

    targetPatient = await Patient.create({
      tenant: primaryTenant._id,
      primaryBranch: primaryBranch._id,
      uhid: `HV-MAST-${timestamp.toString().slice(-4)}`,
      firstName: 'Sunil',
      lastName: 'Kumar',
      fullName: 'Sunil Kumar',
      gender: 'Male',
      dateOfBirth: new Date('1984-06-12'),
      phone: '9876541111',
      allergies: [{ allergen: 'Penicillin', severity: 'Severe' }]
    });

    sourceApt = await Appointment.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: sourcePatient._id,
      doctor: doctorUser._id,
      appointmentDate: new Date(),
      slotTime: '09:00 AM',
      tokenNumber: 102,
      type: 'New Consultation',
      status: 'Completed',
      consultationFee: 500
    });

    sourceEncounter = await Encounter.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: sourcePatient._id,
      doctor: doctorUser._id,
      appointment: sourceApt._id,
      encounterNumber: `ENC-${timestamp}-2`,
      encounterType: 'OPD',
      status: 'Completed'
    });

    sourceInvoice = await Invoice.create({
      tenant: primaryTenant._id,
      branch: primaryBranch._id,
      patient: sourcePatient._id,
      invoiceNumber: `INV-MERGE-${timestamp}`,
      billingType: 'OPD Consultation',
      subtotal: 500,
      totalTax: 0,
      grandTotal: 500,
      paidAmount: 500,
      balanceDue: 0,
      status: 'Fully Paid'
    });
    } catch (err) {
      console.error('*** ERROR IN BEFORE HOOK ***:', err);
      throw err;
    }
  });

  // ==========================================
  // PHASE 3.1: INSURANCE WORKBENCH & PRE-AUTH
  // ==========================================
  describe('Phase 3.1: Insurance Workbench & Pre-Authorization', () => {
    it('should fetch insurance policies via getInsuranceWorkbench', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser
      };

      await billingController.getInsuranceWorkbench(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.ok(Array.isArray(result.data?.data));
      assert.ok(result.data?.data.length > 0);
    });

    it('should process insurance pre-authorization request via submitPreAuth', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser,
        body: {
          policyId: testPolicy._id,
          requestedAmount: 75000,
          tpaRemarks: 'Emergency Laparotomy pre-authorization request'
        }
      };

      await billingController.submitPreAuth(req, res, next);
      assert.strictEqual(result.code, 201);
      assert.strictEqual(result.data?.success, true);
      assert.ok(result.data?.data.preAuthRequests.length > 0);
      assert.strictEqual(result.data?.data.preAuthRequests[0].requestedAmount, 75000);
      assert.strictEqual(result.data?.data.preAuthRequests[0].status, 'Approved in Full');
    });
  });

  // ==========================================
  // PHASE 3.2: REFUNDS & FINANCIAL ADJUSTMENTS
  // ==========================================
  describe('Phase 3.2: Refunds & Financial Adjustments', () => {
    it('should process partial refund and update invoice balance and payment status', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser,
        body: {
          invoiceNumber: refundInvoice.invoiceNumber,
          refundAmount: 400,
          reason: 'Authorized cancellation of elective diagnostic charge'
        }
      };

      await billingController.processRefund(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.payment.status, 'Refunded');
      assert.strictEqual(result.data?.invoice.paidAmount, 600);
      assert.strictEqual(result.data?.invoice.balanceDue, 400);
      assert.strictEqual(result.data?.invoice.status, 'Partially Paid');
    });

    it('should retrieve refund audit history via getRefunds', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser
      };

      await billingController.getRefunds(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.ok(Array.isArray(result.data?.data));
      assert.ok(result.data?.data.length > 0);
      const found = result.data?.data.find(r => r.invoiceNumber === refundInvoice.invoiceNumber);
      assert.ok(found);
      assert.strictEqual(found.amount, 400);
    });
  });

  // ==========================================
  // PHASE 3.3: RADIOLOGY REPORTING WORKFLOW
  // ==========================================
  describe('Phase 3.3: Radiology Reporting Console & Finalization', () => {
    it('should fetch single radiology order by ID via getRadiologyOrderById', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: doctorUser,
        params: { id: radOrder._id.toString() }
      };

      await labController.getRadiologyOrderById(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.data._id.toString(), radOrder._id.toString());
      assert.strictEqual(result.data?.data.modality, 'CT Scan');
    });

    it('should digitally finalize radiology report with findings and critical alerts', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: doctorUser,
        params: { id: radOrder._id.toString() },
        body: {
          findings: 'Right middle and lower lobe ground glass opacities consistent with bronchopneumonia.',
          impression: 'Infective bronchopneumonia. Clinical correlation advised.',
          criticalFinding: true,
          criticalAlertRemarks: 'Immediate notification dispatched to attending physician.'
        }
      };

      await labController.finalizeRadiologyReport(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.data.status, 'Finalized');
      assert.strictEqual(result.data?.data.criticalFinding, true);
      assert.ok(result.data?.data.reportedAt);
    });
  });

  // ==========================================
  // PHASE 3.4: HOSPITAL MANAGEMENT REPORTS
  // ==========================================
  describe('Phase 3.4: Live Aggregated Hospital Reports', () => {
    it('should return OPD census and visits report with columns and rows', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: adminUser,
        query: { category: 'opd' }
      };

      await dashboardController.getHospitalReports(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.category, 'opd');
      assert.ok(Array.isArray(result.data?.data.columns));
      assert.ok(Array.isArray(result.data?.data.rows));
    });

    it('should return IPD Bed Occupancy report with columns and rows', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: adminUser,
        query: { category: 'ipd' }
      };

      await dashboardController.getHospitalReports(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.category, 'ipd');
      assert.ok(Array.isArray(result.data?.data.columns));
    });

    it('should return Departmental Revenue report', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: adminUser,
        query: { category: 'revenue' }
      };

      await dashboardController.getHospitalReports(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.category, 'revenue');
    });
  });

  // ==========================================
  // PHASE 3.5: SUBSCRIPTION CONTRACT MANAGEMENT
  // ==========================================
  describe('Phase 3.5: SaaS Subscription Contract Management', () => {
    it('should list all tenants with license counts via getTenants', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        user: { role: 'super_admin' }
      };

      await tenantController.getTenants(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.ok(Array.isArray(result.data?.data));
      assert.ok(result.data?.data.length >= 2);
    });

    it('should update tenant subscription plan and bed quota via updateTenant', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        user: { role: 'super_admin' },
        params: { id: primaryTenant._id.toString() },
        body: {
          subscription: {
            plan: 'Enterprise (500+ Beds)',
            status: 'active',
            maxBeds: 250,
            maxBranches: 5,
            maxUsers: 100,
            billingCycle: 'annual'
          }
        }
      };

      await tenantController.updateTenant(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.data.subscription.plan, 'Enterprise (500+ Beds)');
      assert.strictEqual(result.data?.data.subscription.maxBeds, 250);
    });
  });

  // ==========================================
  // PHASE 3.6: OPERATION THEATRE (OT) SCHEDULE
  // ==========================================
  describe('Phase 3.6: Operation Theatre Scheduling & Safety Checklists', () => {
    let createdBooking;

    it('should schedule an OT surgical case via createOTRecord', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: doctorUser,
        body: {
          patient: testPatient._id,
          theatreRoom: 'OT-1',
          procedureName: 'Laparoscopic Cholecystectomy',
          leadSurgeon: doctorUser._id,
          scheduledStartTime: new Date(Date.now() + 24 * 3600 * 1000),
          durationMinutes: 90,
          anaesthesiaType: 'General Anaesthesia (GA)',
          preOpChecklist: {
            consentSigned: true,
            fastingVerified: true,
            surgicalSiteMarked: true
          }
        }
      };

      await ipdController.createOTRecord(req, res, next);
      assert.strictEqual(result.code, 201);
      assert.strictEqual(result.data?.success, true);
      assert.ok(result.data?.data.otBookingNumber);
      assert.strictEqual(result.data?.data.status, 'Scheduled');
      createdBooking = result.data?.data;
    });

    it('should query OT schedule via getOTSchedule', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: doctorUser,
        query: {}
      };

      await ipdController.getOTSchedule(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.ok(Array.isArray(result.data?.data));
      const found = result.data?.data.find(b => b.otBookingNumber === createdBooking.otBookingNumber);
      assert.ok(found);
    });
  });

  // ==========================================
  // PHASE 4: CLINICAL -> FINANCIAL CONTINUITY
  // ==========================================
  describe('Phase 4: Consultation to Billing Continuity & Idempotency', () => {
    it('should automatically generate consultation invoice when encounter is completed', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: doctorUser,
        params: { id: encounterToComplete._id.toString() },
        body: {
          status: 'Completed',
          chiefComplaint: 'Acute pharyngitis - resolved with oral antibiotics',
          diagnosis: [{ condition: 'Acute viral pharyngitis', isPrimary: true }]
        }
      };

      await clinicalController.updateEncounter(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);
      assert.strictEqual(result.data?.data.status, 'Completed');
      assert.ok(result.data?.invoice);
      assert.strictEqual(result.data?.invoice.grandTotal, 800);
      assert.strictEqual(result.data?.invoice.billingType, 'OPD Consultation');
      assert.strictEqual(result.data?.invoice.items[0].serviceCategory, 'Consultation');

      // Verify linked appointment is also marked Completed
      const updatedApt = await Appointment.findById(aptToComplete._id);
      assert.strictEqual(updatedApt.status, 'Completed');
    });

    it('should be idempotent and not create duplicate invoices on retry', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        branchId: primaryBranch._id,
        user: doctorUser,
        params: { id: encounterToComplete._id.toString() },
        body: {
          status: 'Completed',
          chiefComplaint: 'Acute pharyngitis - retry save'
        }
      };

      await clinicalController.updateEncounter(req, res, next);
      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data?.success, true);

      // Verify only 1 invoice exists for this encounter
      const invoices = await Invoice.find({
        tenant: primaryTenant._id,
        encounter: encounterToComplete._id
      });
      assert.strictEqual(invoices.length, 1);
    });
  });

  // ==========================================
  // PHASE 5: PATIENT MASTER COMPLETION (MERGE)
  // ==========================================
  describe('Phase 5: Patient Master Merging & Audit History Retention', () => {
    it('should reject cross-tenant patient merge', async () => {
      const crossTenantPatient = await Patient.create({
        tenant: secondaryTenant._id,
        uhid: `HV-CROSS-${Date.now().toString().slice(-4)}`,
        firstName: 'Cross',
        lastName: 'Patient',
        fullName: 'Cross Tenant Patient',
        gender: 'Female',
        phone: '9876500000'
      });

      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser,
        body: {
          sourcePatientId: crossTenantPatient._id,
          targetPatientId: targetPatient._id,
          reason: 'Attempted cross-tenant merge'
        }
      };

      await patientController.mergePatients(req, res, next);
      assert.strictEqual(result.code, 400);
      assert.strictEqual(result.data?.success, false);
      assert.ok(result.data?.error.includes('Both patient records must belong to the same hospital organization'));
    });

    it('should reject self-merge (source === target)', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser,
        body: {
          sourcePatientId: targetPatient._id,
          targetPatientId: targetPatient._id,
          reason: 'Attempted self merge'
        }
      };

      await patientController.mergePatients(req, res, next);
      assert.strictEqual(result.code, 400);
      assert.strictEqual(result.data?.success, false);
      assert.ok(result.data?.error.includes('Source and target patient cannot be the exact same record'));
    });

    it('should safely merge source patient into target patient re-linking all historical records', async () => {
      let mockRes;
      try {
        mockRes = makeMockRes();
        const req = {
          tenantId: primaryTenant._id,
          user: adminUser,
          body: {
            sourcePatientId: sourcePatient._id,
            targetPatientId: targetPatient._id,
            reason: 'Duplicate patient profile registered under different phone numbers'
          }
        };

        await patientController.mergePatients(req, mockRes.res, mockRes.next);
        assert.strictEqual(mockRes.result.code, 200);
        assert.strictEqual(mockRes.result.data?.success, true);
        assert.ok(mockRes.result.data?.relocationCounts);
        assert.strictEqual(mockRes.result.data?.relocationCounts.appointments, 1);
        assert.strictEqual(mockRes.result.data?.relocationCounts.encounters, 1);
        assert.strictEqual(mockRes.result.data?.relocationCounts.invoices, 1);

        // Verify source patient is marked inactive and merged
        const updatedSource = await Patient.findById(sourcePatient._id);
        assert.strictEqual(updatedSource.isMerged, true);
        assert.strictEqual(updatedSource.status, 'inactive');
        assert.strictEqual(updatedSource.mergedInto.toString(), targetPatient._id.toString());

        // Verify target patient has both Penicillin and Sulfa Drugs allergies
        const updatedTarget = await Patient.findById(targetPatient._id);
        assert.strictEqual(updatedTarget.allergies.length, 2);
        assert.ok(updatedTarget.allergies.some(a => a.allergen === 'Penicillin'));
        assert.ok(updatedTarget.allergies.some(a => a.allergen === 'Sulfa Drugs'));

        // Verify source appointment and invoice now point to target patient
        const remappedApt = await Appointment.findById(sourceApt._id);
        assert.strictEqual(remappedApt.patient.toString(), targetPatient._id.toString());

        const remappedInv = await Invoice.findById(sourceInvoice._id);
        assert.strictEqual(remappedInv.patient.toString(), targetPatient._id.toString());

        // Verify AuditLog was generated
        const audit = await AuditLog.findOne({
          tenant: primaryTenant._id,
          action: 'Patient Record Merge',
          entityId: targetPatient._id.toString()
        });
        assert.ok(audit);
        assert.strictEqual(audit.module, 'Patients');
      } catch (err) {
        console.error('*** MERGE TEST FAILED HERE ***:', err?.message, 'STATUS:', mockRes?.result?.code, 'DATA:', JSON.stringify(mockRes?.result?.data));
        throw err;
      }
    });

    it('should prevent re-merging an already merged patient', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId: primaryTenant._id,
        user: adminUser,
        body: {
          sourcePatientId: sourcePatient._id,
          targetPatientId: targetPatient._id,
          reason: 'Retry merge'
        }
      };

      await patientController.mergePatients(req, res, next);
      assert.strictEqual(result.code, 400);
      assert.strictEqual(result.data?.success, false);
      assert.ok(result.data?.error.includes('Source patient is already merged'));
    });
  });

  after(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {}
    setTimeout(() => process.exit(0), 500);
  });
});
