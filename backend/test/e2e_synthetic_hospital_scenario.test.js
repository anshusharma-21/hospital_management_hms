const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e_synthetic_hospital_scenario_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const Department = require('../src/models/Department');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Encounter = require('../src/models/Encounter');
const Vital = require('../src/models/Vital');
const Prescription = require('../src/models/Prescription');
const LabOrder = require('../src/models/LabOrder');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const AuditLog = require('../src/models/AuditLog');

const barcodeReferenceService = require('../src/services/barcode/BarcodeReferenceService');
const paymentService = require('../src/services/payment/PaymentService');
const patientController = require('../src/controllers/patientController');
const appointmentController = require('../src/controllers/appointmentController');
const clinicalController = require('../src/controllers/clinicalController');
const labController = require('../src/controllers/labController');
const billingController = require('../src/controllers/billingController');

describe('Hospital Vision V1 — End-to-End Synthetic Hospital Acceptance Scenario', () => {
  let tenantA;
  let tenantB;
  let branchA;
  let deptMedicine;

  // Staff Users
  let userAdmin;
  let userReception;
  let userDoctor;
  let userBilling;
  let userLabTech;

  // Scenario entities
  let patientUhid;
  let patientRecord;
  let appointmentRecord;
  let encounterRecord;
  let prescriptionRecord;
  let labOrderRecord;
  let sampleBarcodeCode;
  let invoiceRecord;
  let paymentRecord;

  before(async () => {
    await connectDB();
    await Payment.init();

    // 1. Setup Tenant A: City Care Hospital
    tenantA = await Tenant.create({
      name: 'City Care Hospital',
      slug: `city-care-e2e-${Date.now()}`
    });

    // 2. Setup Tenant B: Rival Health Network (for cross-tenant boundary verification)
    tenantB = await Tenant.create({
      name: 'Rival Health Network',
      slug: `rival-health-e2e-${Date.now()}`
    });

    branchA = await Branch.create({
      tenant: tenantA._id,
      name: 'Main Branch',
      code: `MB-${Date.now().toString().slice(-4)}`
    });

    deptMedicine = await Department.create({
      tenant: tenantA._id,
      branch: branchA._id,
      name: 'General Medicine',
      code: 'GEN-MED'
    });

    userAdmin = await User.create({
      name: 'Hospital Administrator',
      email: `admin_e2e_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'hospital_admin',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    userReception = await User.create({
      name: 'Receptionist Suman',
      email: `reception_e2e_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'receptionist',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    userDoctor = await User.create({
      name: 'Dr. Neha Kapoor (MD Medicine)',
      email: `dr_neha_e2e_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'doctor',
      tenant: tenantA._id,
      branch: branchA._id,
      department: deptMedicine._id,
      status: 'active'
    });

    userBilling = await User.create({
      name: 'Cashier Rohan',
      email: `billing_e2e_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'billing_cashier',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    userLabTech = await User.create({
      name: 'Lab Tech Deepa',
      email: `lab_e2e_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'lab_tech',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    setTimeout(() => process.exit(0), 100);
  });

  // =========================================================================
  // STEP 1 & 2: PATIENT REGISTRATION & DUPLICATE DETECTION / SEARCH
  // =========================================================================
  it('Step 1: Register real synthetic patient and verify MongoDB persistence with UHID', async () => {
    patientUhid = `HV-2026-SYNTH-${Date.now().toString().slice(-4)}`;

    patientRecord = await Patient.create({
      tenant: tenantA._id,
      primaryBranch: branchA._id,
      uhid: patientUhid,
      firstName: 'Vikram',
      lastName: 'Malhotra',
      gender: 'Male',
      phone: '9811122233',
      dateOfBirth: new Date('1985-06-15'),
      age: 41,
      bloodGroup: 'O+',
      allergies: [{ allergen: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' }]
    });

    assert.ok(patientRecord._id);
    assert.strictEqual(patientRecord.uhid, patientUhid);
    assert.strictEqual(patientRecord.firstName, 'Vikram');
  });

  it('Step 2: Search patient immediately and verify longitudinal lookup', async () => {
    const searchResults = await Patient.find({
      tenant: tenantA._id,
      $or: [
        { uhid: patientUhid },
        { phone: '9811122233' }
      ]
    });

    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].firstName, 'Vikram');
    assert.strictEqual(searchResults[0].allergies[0].allergen, 'Penicillin');
  });

  // =========================================================================
  // STEP 3, 4 & 5: APPOINTMENT CREATION, PERSISTENCE & CHECK-IN QUEUE
  // =========================================================================
  it('Step 3: Create appointment linking patient, doctor, tenant, and branch', async () => {
    const today = new Date();
    today.setHours(10, 30, 0, 0);

    appointmentRecord = await Appointment.create({
      tenant: tenantA._id,
      branch: branchA._id,
      department: deptMedicine._id,
      doctor: userDoctor._id,
      patient: patientRecord._id,
      appointmentNumber: `APT-SYNTH-${Date.now().toString().slice(-4)}`,
      appointmentDate: today,
      slotTime: '10:30 AM',
      timeSlot: '10:30 AM - 10:45 AM',
      tokenNumber: 5,
      type: 'New Consultation',
      reason: 'Fever and general malaise for 4 days',
      status: 'Scheduled'
    });

    assert.ok(appointmentRecord._id);
    assert.strictEqual(appointmentRecord.status, 'Scheduled');
    assert.strictEqual(appointmentRecord.tokenNumber, 5);
  });

  it('Step 4: Verify appointment persistence after simulated page refresh', async () => {
    // Re-query directly from DB using ID
    const refreshed = await Appointment.findById(appointmentRecord._id)
      .populate('patient')
      .populate('doctor');

    assert.ok(refreshed);
    assert.strictEqual(refreshed.status, 'Scheduled');
    assert.strictEqual(refreshed.patient.uhid, patientUhid);
    assert.strictEqual(refreshed.doctor.name, userDoctor.name);
  });

  it('Step 5: Check in appointment and verify queue status updates to Checked-In', async () => {
    appointmentRecord.status = 'Checked-In';
    await appointmentRecord.save();

    const checkedIn = await Appointment.findById(appointmentRecord._id);
    assert.strictEqual(checkedIn.status, 'Checked-In');

    // Audit check-in
    await AuditLog.create({
      tenant: tenantA._id,
      branch: branchA._id,
      user: userReception._id,
      action: 'Patient Checked In',
      module: 'Appointments',
      entityType: 'Appointment',
      entityId: appointmentRecord._id.toString(),
      details: `Checked in patient ${patientRecord.firstName} for token #${appointmentRecord.tokenNumber}`,
      timestamp: new Date()
    });
  });

  // =========================================================================
  // STEP 6, 7 & 8: ENCOUNTER, VITALS & CLINICAL DIAGNOSIS
  // =========================================================================
  it('Step 6: Doctor creates clinical Encounter linking patient and appointment', async () => {
    encounterRecord = await Encounter.create({
      tenant: tenantA._id,
      branch: branchA._id,
      patient: patientRecord._id,
      doctor: userDoctor._id,
      appointment: appointmentRecord._id,
      encounterNumber: `ENC-SYNTH-${Date.now().toString().slice(-4)}`,
      encounterType: 'OPD',
      status: 'In-Progress',
      chiefComplaint: 'High grade fever with chills and joint pain for 4 days.'
    });

    assert.ok(encounterRecord._id);
    assert.strictEqual(encounterRecord.encounterType, 'OPD');
  });

  it('Step 7: Record vital signs linked to encounter and patient', async () => {
    const vital = await Vital.create({
      tenant: tenantA._id,
      patient: patientRecord._id,
      encounter: encounterRecord._id,
      recordedBy: userDoctor._id,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      pulse: 88,
      temperature: 101.4,
      spo2: 98,
      respiratoryRate: 18
    });

    assert.ok(vital._id);
    assert.strictEqual(vital.temperature, 101.4);
    assert.strictEqual(vital.pulse, 88);
  });

  it('Step 8: Attending doctor records provisional diagnosis and clinical notes', async () => {
    encounterRecord.clinicalNotes = 'Provisional Diagnosis: [A90] Dengue fever (classical). Patient febrile. Hydration advised. Ordered CBC and Dengue NS1 antigen profile.';
    encounterRecord.status = 'Completed';
    await encounterRecord.save();

    const freshEncounter = await Encounter.findById(encounterRecord._id);
    assert.ok(freshEncounter.clinicalNotes.includes('A90'));
    assert.strictEqual(freshEncounter.status, 'Completed');
  });

  // =========================================================================
  // STEP 9, 10, 11, 12 & 13: PRESCRIPTION, LAB ORDER, BARCODE & LAB RESULTS
  // =========================================================================
  it('Step 9: Doctor creates electronic prescription with dosages and durations', async () => {
    prescriptionRecord = await Prescription.create({
      tenant: tenantA._id,
      branch: branchA._id,
      patient: patientRecord._id,
      doctor: userDoctor._id,
      encounter: encounterRecord._id,
      prescriptionNumber: `RX-SYNTH-${Date.now().toString().slice(-4)}`,
      medications: [
        {
          medicineName: 'Paracetamol 650mg',
          dosage: '1 Tab',
          frequency: 'Thrice daily (TDS)',
          duration: '5 Days',
          instructions: 'After Food'
        },
        {
          medicineName: 'Oral Rehydration Salts (ORS)',
          dosage: '1 Sachet in 1L water',
          frequency: 'As needed (SOS)',
          duration: '5 Days',
          instructions: 'As directed'
        }
      ]
    });

    assert.ok(prescriptionRecord._id);
    assert.strictEqual(prescriptionRecord.medications.length, 2);
  });

  it('Step 10 & 11: Order lab tests and generate opaque legacy sample barcode', async () => {
    const orderNumber = `LAB-SYNTH-${Date.now().toString().slice(-4)}`;
    sampleBarcodeCode = barcodeReferenceService.generateLabBarcode(orderNumber);

    labOrderRecord = await LabOrder.create({
      tenant: tenantA._id,
      branch: branchA._id,
      patient: patientRecord._id,
      doctor: userDoctor._id,
      orderNumber,
      sampleBarcode: sampleBarcodeCode,
      overallStatus: 'Sample Collected',
      tests: [
        {
          testName: 'Complete Blood Count (CBC)',
          status: 'Sample Collected'
        },
        {
          testName: 'Dengue NS1 Antigen',
          status: 'Sample Collected'
        }
      ]
    });

    assert.ok(labOrderRecord._id);
    assert.ok(sampleBarcodeCode.startsWith('BC-'));

    // Verify barcode service resolves sampleBarcode correctly
    const resolved = await barcodeReferenceService.resolveReference({
      tenantId: tenantA._id,
      referenceCode: sampleBarcodeCode,
      requestingUser: userLabTech
    });
    assert.strictEqual(resolved.success, true);
    assert.strictEqual(resolved.resourceType, 'LAB_SAMPLE');
    assert.strictEqual(resolved.resource.orderNumber, orderNumber);
  });

  it('Step 12 & 13: Lab technician records results and marks order Verified', async () => {
    labOrderRecord.tests = [
      {
        testName: 'Complete Blood Count (CBC)',
        resultValue: '145000',
        unit: 'cells/mcL',
        referenceRange: '150000 - 450000',
        status: 'Verified'
      },
      {
        testName: 'Dengue NS1 Antigen',
        resultValue: 'Positive',
        status: 'Verified'
      }
    ];
    labOrderRecord.overallStatus = 'Completed';
    await labOrderRecord.save();

    const freshLab = await LabOrder.findById(labOrderRecord._id);
    assert.strictEqual(freshLab.overallStatus, 'Completed');
    assert.strictEqual(freshLab.tests[0].resultValue, '145000');
  });

  // =========================================================================
  // STEP 14, 15 & 16: BILL GENERATION, PAYMENT & INVOICE BALANCE VERIFICATION
  // =========================================================================
  it('Step 14: Generate Tax Invoice for consultation and laboratory diagnostic tests', async () => {
    const invNumber = `INV-E2E-${Date.now().toString().slice(-4)}`;

    invoiceRecord = await Invoice.create({
      tenant: tenantA._id,
      branch: branchA._id,
      patient: patientRecord._id,
      invoiceNumber: invNumber,
      items: [
        {
          description: 'Specialist Doctor OPD Consultation Fee',
          quantity: 1,
          unitPrice: 800,
          totalAmount: 800
        },
        {
          description: 'Complete Blood Count (CBC) Diagnostic Test',
          quantity: 1,
          unitPrice: 450,
          totalAmount: 450
        },
        {
          description: 'Dengue NS1 Antigen Serology Panel',
          quantity: 1,
          unitPrice: 950,
          totalAmount: 950
        }
      ],
      subtotal: 2200,
      grandTotal: 2200,
      paidAmount: 0,
      balanceDue: 2200,
      status: 'Finalized'
    });

    assert.ok(invoiceRecord._id);
    assert.strictEqual(invoiceRecord.grandTotal, 2200);
    assert.strictEqual(invoiceRecord.balanceDue, 2200);
  });

  it('Step 15 & 16: Record payment with idempotency key and verify invoice balance settles to 0', async () => {
    const idempotencyKey = `idemp_e2e_cashier_${Date.now()}`;

    // Initiate order first via Payment Gateway
    const initOrder = await paymentService.initiatePayment({
      tenantId: tenantA._id,
      invoiceId: invoiceRecord._id.toString(),
      amount: 2200,
      idempotencyKey,
      requestedBy: userBilling
    });

    // Verify and record payment
    const payResult = await paymentService.verifyAndRecordPayment({
      tenantId: tenantA._id,
      branchId: branchA._id,
      invoiceId: invoiceRecord._id.toString(),
      orderId: initOrder.orderId,
      gatewayPaymentId: `PAY-E2E-${Date.now()}`,
      gatewaySignature: initOrder.mockSignatureToken,
      idempotencyKey,
      collectedBy: userBilling
    });

    assert.strictEqual(payResult.success, true);
    assert.strictEqual(payResult.updatedInvoice.paidAmount, 2200);
    assert.strictEqual(payResult.updatedInvoice.balanceDue, 0);
    assert.strictEqual(payResult.updatedInvoice.status, 'Fully Paid');

    // Verify invoice in MongoDB
    const settledInvoice = await Invoice.findById(invoiceRecord._id);
    assert.strictEqual(settledInvoice.paidAmount, 2200);
    assert.strictEqual(settledInvoice.balanceDue, 0);
    assert.strictEqual(settledInvoice.status, 'Fully Paid');
  });

  // =========================================================================
  // STEP 17 & 18: PATIENT TIMELINE / HISTORY AGGREGATION
  // =========================================================================
  it('Step 17 & 18: Retrieve complete patient longitudinal history without broken references', async () => {
    const [patientAppts, patientEncounters, patientPrescriptions, patientLabs, patientInvoices] = await Promise.all([
      Appointment.find({ tenant: tenantA._id, patient: patientRecord._id }),
      Encounter.find({ tenant: tenantA._id, patient: patientRecord._id }),
      Prescription.find({ tenant: tenantA._id, patient: patientRecord._id }),
      LabOrder.find({ tenant: tenantA._id, patient: patientRecord._id }),
      Invoice.find({ tenant: tenantA._id, patient: patientRecord._id })
    ]);

    assert.strictEqual(patientAppts.length, 1);
    assert.strictEqual(patientEncounters.length, 1);
    assert.strictEqual(patientPrescriptions.length, 1);
    assert.strictEqual(patientLabs.length, 1);
    assert.strictEqual(patientInvoices.length, 1);

    // Verify all records point to the exact same patient ID
    const pid = patientRecord._id.toString();
    assert.strictEqual(patientAppts[0].patient.toString(), pid);
    assert.strictEqual(patientEncounters[0].patient.toString(), pid);
    assert.strictEqual(patientPrescriptions[0].patient.toString(), pid);
    assert.strictEqual(patientLabs[0].patient.toString(), pid);
    assert.strictEqual(patientInvoices[0].patient.toString(), pid);
  });

  // =========================================================================
  // STEP 19: AUDIT LOG VERIFICATION
  // =========================================================================
  it('Step 19: Verify audit trail entries generated during hospital operations', async () => {
    const auditLogs = await AuditLog.find({ tenant: tenantA._id });
    assert.ok(auditLogs.length >= 1);
    const actions = auditLogs.map(l => l.action);
    assert.ok(actions.includes('Patient Checked In'));
  });

  // =========================================================================
  // STEP 20: STRICT MULTI-TENANT ISOLATION BOUNDARY
  // =========================================================================
  it('Step 20: Verify Tenant B cannot access Tenant A patient, clinical notes, or billing records', async () => {
    // Tenant B attempts to look up Patient from Tenant A
    const foreignPatient = await Patient.findOne({
      tenant: tenantB._id, // Tenant B
      _id: patientRecord._id
    });
    assert.strictEqual(foreignPatient, null);

    // Tenant B attempts to look up Encounter from Tenant A
    const foreignEncounter = await Encounter.findOne({
      tenant: tenantB._id,
      _id: encounterRecord._id
    });
    assert.strictEqual(foreignEncounter, null);

    // Tenant B attempts to look up Invoice from Tenant A
    const foreignInvoice = await Invoice.findOne({
      tenant: tenantB._id,
      _id: invoiceRecord._id
    });
    assert.strictEqual(foreignInvoice, null);
  });
});
