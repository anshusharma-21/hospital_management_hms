const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'phase1_p0_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Bed = require('../src/models/Bed');
const Admission = require('../src/models/Admission');
const LabOrder = require('../src/models/LabOrder');
const Prescription = require('../src/models/Prescription');
const Medicine = require('../src/models/Medicine');
const Invoice = require('../src/models/Invoice');
const Appointment = require('../src/models/Appointment');

const ipdController = require('../src/controllers/ipdController');
const labController = require('../src/controllers/labController');
const pharmacyController = require('../src/controllers/pharmacyController');
const billingController = require('../src/controllers/billingController');
const patientController = require('../src/controllers/patientController');
const appointmentController = require('../src/controllers/appointmentController');
const clinicalController = require('../src/controllers/clinicalController');
const { authorize } = require('../src/middleware/authMiddleware');

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

describe('Hospital Vision Phase 1 — P0 Fixes & RBAC Reconciliation Test Suite', () => {
  let tenant1;
  let tenant2;
  let branch1;
  let otherBranch;
  let adminUser;
  let branchAdminUser;
  let doctorUser;
  let receptionistUser;
  let patientUser1;
  let patientUser2;
  let patientRecord1;
  let patientRecord2;
  let testBed;
  let testMedicine;

  before(async () => {
    try {
      await connectDB();

    // 1. Tenants
    tenant1 = await Tenant.create({
      name: 'St. Jude Apex Hospital',
      slug: `st-jude-apex-${Date.now()}`,
      subscription: { plan: 'Professional', status: 'active' }
    });

    tenant2 = await Tenant.create({
      name: 'Mercy Care Clinic',
      slug: `mercy-care-${Date.now()}`,
      subscription: { plan: 'Basic', status: 'active' }
    });

    // 2. Branches
    branch1 = await Branch.create({
      tenant: tenant1._id,
      name: 'Apex Main Wing',
      code: `AMW-${Date.now()}`
    });

    otherBranch = await Branch.create({
      tenant: tenant2._id,
      name: 'Mercy Branch 1',
      code: `MB1-${Date.now()}`
    });

    // 3. Staff Users
    adminUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Apex Hospital Admin',
      email: `admin.${Date.now()}@apex.org`,
      password: 'password123',
      role: 'hospital_admin'
    });

    branchAdminUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Branch Manager Apex',
      email: `branchadmin.${Date.now()}@apex.org`,
      password: 'password123',
      role: 'branch_admin'
    });

    doctorUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Dr. Sarah Mitchell',
      email: `dr.mitchell.${Date.now()}@apex.org`,
      password: 'password123',
      role: 'doctor'
    });

    receptionistUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Front Desk Leo',
      email: `leo.${Date.now()}@apex.org`,
      password: 'password123',
      role: 'receptionist'
    });

    // 4. Patients (with exact schema fields)
    patientRecord1 = await Patient.create({
      tenant: tenant1._id,
      primaryBranch: branch1._id,
      uhid: `HV-2026-P01-${Date.now()}`,
      firstName: 'Alice',
      lastName: 'Johnson',
      fullName: 'Alice Johnson',
      gender: 'Female',
      phone: `998877${Math.floor(1000 + Math.random() * 9000)}`
    });

    patientRecord2 = await Patient.create({
      tenant: tenant1._id,
      primaryBranch: branch1._id,
      uhid: `HV-2026-P02-${Date.now()}`,
      firstName: 'Bob',
      lastName: 'Williams',
      fullName: 'Bob Williams',
      gender: 'Male',
      phone: `998866${Math.floor(1000 + Math.random() * 9000)}`
    });

    // 5. Patient Users
    patientUser1 = await User.create({
      tenant: tenant1._id,
      name: 'Alice Johnson (User)',
      email: `alice.${Date.now()}@example.com`,
      password: 'password123',
      role: 'patient',
      patient: patientRecord1._id
    });

    patientUser2 = await User.create({
      tenant: tenant1._id,
      name: 'Bob Williams (User)',
      email: `bob.${Date.now()}@example.com`,
      password: 'password123',
      role: 'patient',
      patient: patientRecord2._id
    });

    // 6. Bed
    testBed = await Bed.create({
      tenant: tenant1._id,
      branch: branch1._id,
      floor: '2nd Floor',
      ward: 'Male Surgical Ward',
      roomNumber: '204',
      bedNumber: `BED-204A-${Date.now()}`,
      status: 'Occupied',
      currentPatient: patientRecord1._id
    });

    // 7. Medicine
    testMedicine = await Medicine.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'Antibiotics / Antiviral',
      dosageForm: 'Capsule',
      strength: '500mg',
      unitPrice: 15,
      stockQuantity: 50,
      batches: [
        {
          batchNumber: 'BATCH-AMX-01',
          expiryDate: new Date('2028-12-31'),
          quantity: 50,
          purchaseRate: 10,
          mrp: 15
        }
      ]
    });
    } catch (err) {
      console.error('=== TOP BEFORE ERROR ===', err);
      throw err;
    }
  });

  // =========================================================================
  // P0.1 DISCHARGE CLEARANCE
  // =========================================================================
  describe('P0.1 Discharge Clearance Contract & Bed Release', () => {
    let admission;

    before(async () => {
      admission = await Admission.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        admissionNumber: `ADM-${Date.now()}`,
        attendingDoctor: doctorUser._id,
        bed: testBed._id,
        status: 'Admitted',
        departmentClearances: {
          clinical: { cleared: true },
          nursing: { cleared: true },
          pharmacy: { cleared: true },
          billing: { cleared: true }
        }
      });
      testBed.currentAdmission = admission._id;
      await testBed.save();
    });

    it('should successfully finalize discharge via POST/PUT contract and transition bed to Cleaning', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        params: { id: admission._id.toString() },
        body: {
          dischargeType: 'Routine / Planned',
          dischargeSummary: {
            reasonForDischarge: 'Patient recovered steadily. Vitals normal.',
            medicationsOnDischarge: 'Amoxicillin 500mg TDS for 3 days'
          },
          conditionAtDischarge: 'Stable / Recovered'
        }
      };
      const { result, res, next } = makeMockRes();

      await ipdController.finalizeDischarge(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.admission.status, 'Discharged');
      assert.ok(result.data.admission.dischargeDate);

      // Verify bed release
      const updatedBed = await Bed.findById(testBed._id);
      assert.strictEqual(updatedBed.status, 'Cleaning');
      assert.strictEqual(updatedBed.currentPatient, null);
      assert.strictEqual(updatedBed.currentAdmission, null);
    });

    it('should reject discharge if admission has already been finalized/discharged (Idempotency)', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        params: { id: admission._id.toString() },
        body: { conditionAtDischarge: 'Stable' }
      };
      const { result, res, next } = makeMockRes();

      await ipdController.finalizeDischarge(req, res, next);

      assert.strictEqual(result.code, 400);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /already discharged/i);
    });

    it('should reject discharge across different tenant (Tenant Isolation)', async () => {
      const req = {
        tenantId: tenant2._id.toString(), // Wrong tenant
        branchId: otherBranch._id.toString(),
        user: adminUser,
        params: { id: admission._id.toString() },
        body: { conditionAtDischarge: 'Stable' }
      };
      const { result, res, next } = makeMockRes();

      await ipdController.finalizeDischarge(req, res, next);

      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.data.success, false);
    });
  });

  // =========================================================================
  // P0.2 LAB WORKBENCH RESULT SUBMISSION
  // =========================================================================
  describe('P0.2 Lab Workbench Result Submission Contract', () => {
    let labOrder;

    before(async () => {
      labOrder = await LabOrder.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        doctor: doctorUser._id,
        orderNumber: `LAB-ORD-${Date.now()}`,
        status: 'Ordered',
        tests: [
          {
            testCode: 'CBC-WBC',
            testName: 'Complete Blood Count (WBC)',
            category: 'Hematology',
            sampleType: 'Whole Blood EDTA'
          }
        ]
      });
    });

    it('should collect sample and update order status via sample collection flow', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: doctorUser,
        params: { id: labOrder._id.toString() },
        body: {
          sampleBarcode: `BAR-${Date.now()}`
        }
      };
      const { result, res, next } = makeMockRes();

      await labController.collectSample(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.data.overallStatus, 'Sample Collected');
    });

    it('should enter and verify results via PUT /results contract with pathologist remarks', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: doctorUser,
        params: { id: labOrder._id.toString() },
        body: {
          tests: [
            {
              testCode: 'CBC-WBC',
              testName: 'Complete Blood Count (WBC)',
              resultValue: '18500',
              referenceRange: '4,000 - 11,000 /mcL',
              unit: '/mcL',
              isAbnormal: true,
              isCritical: true
            }
          ],
          pathologistRemarks: 'Significant leukocytosis observed. Clinical correlation advised.',
          isVerified: true
        }
      };
      const { result, res, next } = makeMockRes();

      await labController.enterResults(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.data.overallStatus, 'Completed');
      assert.strictEqual(result.data.data.tests[0].resultValue, '18500');
      assert.strictEqual(result.data.data.tests[0].isCritical, true);
      assert.strictEqual(result.data.data.criticalAlert, true);
      assert.strictEqual(result.data.data.pathologistRemarks, 'Significant leukocytosis observed. Clinical correlation advised.');
    });

    it('should reject lab order result submission from another tenant', async () => {
      const req = {
        tenantId: tenant2._id.toString(), // Wrong tenant
        branchId: otherBranch._id.toString(),
        user: doctorUser,
        params: { id: labOrder._id.toString() },
        body: { tests: [] }
      };
      const { result, res, next } = makeMockRes();

      await labController.enterResults(req, res, next);

      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.data.success, false);
    });
  });

  // =========================================================================
  // P0.3 PHARMACY PRESCRIPTION QUEUE & DISPENSE
  // =========================================================================
  describe('P0.3 Pharmacy Prescription Queue & POS Integration', () => {
    let prescription;

    before(async () => {
      prescription = await Prescription.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        doctor: doctorUser._id,
        prescriptionNumber: `RX-PHARM-${Date.now()}`,
        medications: [
          {
            medicineName: 'Amoxicillin 500mg',
            dosage: '500mg',
            form: 'Capsule',
            frequency: 'Thrice daily (TDS)',
            duration: '5 Days',
            quantity: 15,
            dispensedStatus: 'Pending'
          }
        ]
      });
    });

    it('should return pending prescriptions via GET /pharmacy/prescriptions with branch scoping', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        query: {}
      };
      const { result, res, next } = makeMockRes();

      await pharmacyController.getPrescriptions(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.ok(Array.isArray(result.data.data));
      const found = result.data.data.find(p => p._id.toString() === prescription._id.toString());
      assert.ok(found);
      assert.strictEqual(found.pharmacyStatus, 'pending');
      assert.ok(Array.isArray(found.medicines));
    });

    it('should dispense prescription, decrement stock, and update prescription status', async () => {
      const initialStock = testMedicine.stockQuantity;
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        body: {
          prescriptionId: prescription._id.toString(),
          items: [
            {
              medicineId: testMedicine._id.toString(),
              quantity: 10,
              unitPrice: 15
            }
          ],
          paymentMethod: 'Cash'
        }
      };
      const { result, res, next } = makeMockRes();

      await pharmacyController.dispensePrescription(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.ok(result.data.invoice);

      // Verify stock was deducted
      const updatedMed = await Medicine.findById(testMedicine._id);
      assert.strictEqual(updatedMed.stockQuantity, initialStock - 10);

      // Verify prescription status updated
      const updatedRx = await Prescription.findById(prescription._id);
      assert.strictEqual(updatedRx.medications[0].dispensedStatus, 'Fully Dispensed');
    });
  });

  // =========================================================================
  // P0.4 PAYMENT COLLECTION BALANCE DUAL-CONTRACT & CALCULATIONS
  // =========================================================================
  describe('P0.4 Payment Collection Balance Contract & Calculations', () => {
    let invoice;

    before(async () => {
      invoice = await Invoice.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        invoiceNumber: `INV-${Date.now()}`,
        billingType: 'OPD Consultation',
        items: [
          {
            description: 'Specialist Consultation',
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000
          }
        ],
        subtotal: 1000,
        grandTotal: 1000,
        paidAmount: 0,
        balanceDue: 1000,
        status: 'Finalized'
      });
    });

    it('should expose both balanceDue and balanceAmount in getInvoices response', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        query: {}
      };
      const { result, res, next } = makeMockRes();

      await billingController.getInvoices(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      const target = result.data.data.find(inv => inv._id.toString() === invoice._id.toString());
      assert.ok(target);
      assert.strictEqual(target.balanceDue, 1000);
      assert.strictEqual(target.balanceAmount, 1000);
      assert.strictEqual(target.netAmount, 1000);
    });

    it('should record partial payment and accurately update balanceDue', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 400,
          paymentMethod: 'UPI / QR Code',
          transactionReference: `TXN-${Date.now()}`
        }
      };
      const { result, res, next } = makeMockRes();

      await billingController.collectPayment(req, res, next);

      assert.strictEqual(result.code, 201);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.updatedInvoice.paidAmount, 400);
      assert.strictEqual(result.data.updatedInvoice.balanceDue, 600);
      assert.strictEqual(result.data.updatedInvoice.status, 'Partially Paid');
    });

    it('should record full remaining payment and set balanceDue to 0', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 600,
          paymentMethod: 'Cash'
        }
      };
      const { result, res, next } = makeMockRes();

      await billingController.collectPayment(req, res, next);

      assert.strictEqual(result.code, 201);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.updatedInvoice.paidAmount, 1000);
      assert.strictEqual(result.data.updatedInvoice.balanceDue, 0);
      assert.strictEqual(result.data.updatedInvoice.status, 'Fully Paid');
    });

    it('should reject payment greater than balanceDue', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: adminUser,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 50,
          paymentMethod: 'Cash'
        }
      };
      const { result, res, next } = makeMockRes();

      await billingController.collectPayment(req, res, next);

      assert.strictEqual(result.code, 400);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /exceeds outstanding balance/i);
    });
  });

  // =========================================================================
  // P0.5 PATIENT PORTAL DATA ISOLATION (SECURITY)
  // =========================================================================
  describe('P0.5 Patient Portal Data Isolation & Anti-IDOR Security', () => {
    let patientAAppointment;
    let patientBAppointment;
    let patientAPrescription;
    let patientBPrescription;
    let patientAInvoice;
    let patientBInvoice;

    before(async () => {
      // Appointments
      patientAAppointment = await Appointment.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '10:00 AM',
        tokenNumber: 1,
        status: 'Confirmed'
      });

      patientBAppointment = await Appointment.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord2._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '11:00 AM',
        tokenNumber: 2,
        status: 'Confirmed'
      });

      // Prescriptions
      patientAPrescription = await Prescription.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        doctor: doctorUser._id,
        prescriptionNumber: `RX-A-${Date.now()}`,
        medications: [{ medicineName: 'Paracetamol', dosage: '650mg' }]
      });

      patientBPrescription = await Prescription.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord2._id,
        doctor: doctorUser._id,
        prescriptionNumber: `RX-B-${Date.now()}`,
        medications: [{ medicineName: 'Atorvastatin', dosage: '20mg' }]
      });

      // Invoices
      patientAInvoice = await Invoice.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord1._id,
        invoiceNumber: `INV-A-${Date.now()}`,
        items: [{ description: 'Test A', unitPrice: 500, totalAmount: 500 }],
        subtotal: 500,
        grandTotal: 500,
        balanceDue: 500
      });

      patientBInvoice = await Invoice.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patientRecord2._id,
        invoiceNumber: `INV-B-${Date.now()}`,
        items: [{ description: 'Test B', unitPrice: 750, totalAmount: 750 }],
        subtotal: 750,
        grandTotal: 750,
        balanceDue: 750
      });
    });

    it('Patient A calling /patients/me receives only their own patient record', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        user: patientUser1
      };
      const { result, res, next } = makeMockRes();

      await patientController.getPatientMe(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.strictEqual(result.data.data._id.toString(), patientRecord1._id.toString());
      assert.strictEqual(result.data.data.fullName, 'Alice Johnson');
    });

    it('SECURITY: Patient A requesting Patient B profile via ID returns 403 Forbidden', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        user: patientUser1,
        params: { id: patientRecord2._id.toString() } // Patient B ID
      };
      const { result, res, next } = makeMockRes();

      await patientController.getPatientById(req, res, next);

      assert.strictEqual(result.code, 403);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /access denied|forbidden/i);
    });

    it('SECURITY: Patient A requesting Patient B timeline via ID returns 403 Forbidden', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        user: patientUser1,
        params: { id: patientRecord2._id.toString() }
      };
      const { result, res, next } = makeMockRes();

      await patientController.getPatientTimeline(req, res, next);

      assert.strictEqual(result.code, 403);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /access denied|forbidden/i);
    });

    it('SECURITY: Patient A querying /appointments automatically receives only Patient A appointments', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: patientUser1,
        query: {} // No filter supplied
      };
      const { result, res, next } = makeMockRes();

      await appointmentController.getAppointments(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      assert.ok(result.data.data.length >= 1);
      for (const appt of result.data.data) {
        assert.strictEqual(appt.patient._id ? appt.patient._id.toString() : appt.patient.toString(), patientRecord1._id.toString());
      }
    });

    it('SECURITY: Patient A querying /clinical/prescriptions receives only their own prescriptions', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        branchId: branch1._id.toString(),
        user: patientUser1,
        query: {}
      };
      const { result, res, next } = makeMockRes();

      await clinicalController.getPrescriptions(req, res, next);

      assert.strictEqual(result.code, 200);
      assert.strictEqual(result.data.success, true);
      for (const rx of result.data.data) {
        assert.strictEqual(rx.patient._id ? rx.patient._id.toString() : rx.patient.toString(), patientRecord1._id.toString());
      }
    });

    it('SECURITY: Patient A requesting Patient B invoice directly returns 403 Forbidden', async () => {
      const req = {
        tenantId: tenant1._id.toString(),
        user: patientUser1,
        params: { id: patientBInvoice._id.toString() }
      };
      const { result, res, next } = makeMockRes();

      await billingController.getInvoiceById(req, res, next);

      assert.strictEqual(result.code, 403);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /forbidden|access denied/i);
    });

    it('SECURITY: Cross-tenant patient access is blocked with 404/403', async () => {
      const req = {
        tenantId: tenant2._id.toString(), // Tenant 2 context
        user: patientUser1, // Belongs to Tenant 1
        params: { id: patientRecord1._id.toString() }
      };
      const { result, res, next } = makeMockRes();

      await patientController.getPatientById(req, res, next);

      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.data.success, false);
    });
  });

  // =========================================================================
  // RBAC & BRANCH ADMIN AUTHORIZATION
  // =========================================================================
  describe('RBAC Authorization Middleware & branch_admin Support', () => {
    it('should permit hospital_admin and branch_admin for administrative operations', async () => {
      const middleware = authorize('hospital_admin', 'branch_admin');

      // Test hospital_admin
      let adminNext = false;
      const adminReq = { user: adminUser };
      const { res: adminRes, next: adminMockNext } = makeMockRes();
      middleware(adminReq, adminRes, () => { adminNext = true; });
      assert.strictEqual(adminNext, true);

      // Test branch_admin
      let branchAdminNext = false;
      const branchReq = { user: branchAdminUser };
      const { res: branchRes, next: branchMockNext } = makeMockRes();
      middleware(branchReq, branchRes, () => { branchAdminNext = true; });
      assert.strictEqual(branchAdminNext, true);
    });

    it('should block unauthorized roles (e.g. receptionist) from admin routes', async () => {
      const middleware = authorize('hospital_admin', 'branch_admin');
      let nextCalled = false;
      const req = { user: receptionistUser };
      const { result, res, next } = makeMockRes();

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(result.code, 403);
      assert.strictEqual(result.data.success, false);
      const err = result.data.error || result.data.message;
      assert.match(err, /not authorized|forbidden|access denied/i);
    });
  });

  after(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {}
    setTimeout(() => process.exit(0), 500);
  });
});
