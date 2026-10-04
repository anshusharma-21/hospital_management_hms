const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'patient_portal_test_secret_2026_super_secure';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Encounter = require('../src/models/Encounter');
const Vital = require('../src/models/Vital');
const Prescription = require('../src/models/Prescription');
const LabOrder = require('../src/models/LabOrder');
const RadiologyOrder = require('../src/models/RadiologyOrder');
const Admission = require('../src/models/Admission');
const Bed = require('../src/models/Bed');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const DocumentRegistry = require('../src/models/DocumentRegistry');
const Feedback = require('../src/models/Feedback');

const patientController = require('../src/controllers/patientController');
const appointmentController = require('../src/controllers/appointmentController');
const clinicalController = require('../src/controllers/clinicalController');
const labController = require('../src/controllers/labController');
const billingController = require('../src/controllers/billingController');
const ipdController = require('../src/controllers/ipdController');
const documentController = require('../src/controllers/documentController');
const authController = require('../src/controllers/authController');

// Helper to mock express res object
const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.data = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (obj) {
    this.data = obj;
    return this;
  };
  return res;
};

describe('Hospital Vision Patient Portal — Security & API Contracts Test Suite', () => {
  let tenant1, tenant2;
  let branch1;
  let doctorUser;
  let patient1, patient2, patientOtherTenant;
  let patientUser1, patientUser2;

  before(async () => {
    await connectDB();

    // Create Tenants
    tenant1 = await Tenant.create({
      name: 'LifeLine General Hospital',
      slug: `lifeline-${Date.now()}`
    });

    tenant2 = await Tenant.create({
      name: 'Apex Health Systems',
      slug: `apex-${Date.now()}`
    });

    branch1 = await Branch.create({
      tenant: tenant1._id,
      name: 'Main Campus',
      code: `MC-${Date.now()}`
    });

    // Create Doctor User
    doctorUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Dr. Arun Sharma',
      email: `dr.arun_${Date.now()}@lifeline.com`,
      password: 'Password123!',
      role: 'doctor',
      doctorProfile: { specialization: 'General Medicine' }
    });

    // Create Patient 1 (in Tenant 1)
    patient1 = await Patient.create({
      tenant: tenant1._id,
      primaryBranch: branch1._id,
      uhid: `HV-TEST-0001-${Date.now()}`,
      firstName: 'Aarav',
      lastName: 'Mehta',
      fullName: 'Aarav Mehta',
      age: 32,
      gender: 'Male',
      bloodGroup: 'B+',
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      allergies: [
        { allergen: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' },
        { allergen: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Urticaria rash' }
      ],
      chronicConditions: ['Type 2 Diabetes', 'Hypertension']
    });

    // Create Patient 2 (in Tenant 1)
    patient2 = await Patient.create({
      tenant: tenant1._id,
      primaryBranch: branch1._id,
      uhid: `HV-TEST-0002-${Date.now()}`,
      firstName: 'Priya',
      lastName: 'Nair',
      fullName: 'Priya Nair',
      age: 28,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: `98764${Math.floor(10000 + Math.random() * 90000)}`,
      allergies: [{ allergen: 'Peanuts', severity: 'Mild', reaction: 'Itching' }],
      chronicConditions: ['Asthma']
    });

    // Create Patient in Tenant 2 (for cross-tenant boundary verification)
    patientOtherTenant = await Patient.create({
      tenant: tenant2._id,
      uhid: `HV-APEX-0001-${Date.now()}`,
      firstName: 'Vikram',
      lastName: 'Singhania',
      fullName: 'Vikram Singhania',
      age: 45,
      gender: 'Male',
      phone: `98763${Math.floor(10000 + Math.random() * 90000)}`
    });

    // Patient User Accounts
    patientUser1 = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: patient1.fullName,
      email: `${patient1.phone}@patient.hospitalvision.local`,
      phone: patient1.phone,
      password: 'PatientPortal2026!',
      role: 'patient',
      patient: patient1._id,
      status: 'active'
    });

    patientUser2 = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: patient2.fullName,
      email: `${patient2.phone}@patient.hospitalvision.local`,
      phone: patient2.phone,
      password: 'PatientPortal2026!',
      role: 'patient',
      patient: patient2._id,
      status: 'active'
    });
  });

  after(async () => {
    // Teardown
    await Patient.deleteMany({ _id: { $in: [patient1._id, patient2._id, patientOtherTenant._id] } });
    await User.deleteMany({ _id: { $in: [doctorUser._id, patientUser1._id, patientUser2._id] } });
    await Branch.deleteMany({ _id: branch1._id });
    await Tenant.deleteMany({ _id: { $in: [tenant1._id, tenant2._id] } });
  });

  describe('1. Patient Authentication & Dedicated Profile Scoping', () => {
    it('should authenticate patient via phone and OTP with signed JWT', async () => {
      const req = {
        body: { phone: patient1.phone, otp: '1234' }
      };
      const res = mockRes();
      await authController.patientLogin(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.token, 'Must return JWT token');
      assert.strictEqual(res.data.patient.fullName, 'Aarav Mehta');
      assert.strictEqual(res.data.patient.uhid, patient1.uhid);
      // Allergies must be an array of objects
      assert.ok(Array.isArray(res.data.patient.allergies));
      assert.strictEqual(res.data.patient.allergies[0].allergen, 'Penicillin');
    });

    it('GET /patients/me returns the authenticated patient profile without hardcoding', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id
      };
      const res = mockRes();
      await patientController.getPatientMe(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data.fullName, 'Aarav Mehta');
      assert.strictEqual(res.data.data.allergies[0].allergen, 'Penicillin');
      assert.strictEqual(res.data.data.allergies[0].severity, 'Severe');
    });

    it('SECURITY: Unlinked/invalid user account calling /patients/me returns 404 instead of fallback patient', async () => {
      const fakeUser = { _id: new mongoose.Types.ObjectId(), role: 'patient' };
      const req = {
        user: fakeUser,
        tenantId: tenant1._id
      };
      const res = mockRes();
      await patientController.getPatientMe(req, res, () => {});

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('not found'));
    });
  });

  describe('2. Anti-IDOR Security: Cross-Patient and Cross-Tenant Rejection', () => {
    it('SECURITY: Patient 1 requesting Patient 2 record by ID is strictly blocked with HTTP 403', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: patient2._id.toString() }
      };
      const res = mockRes();
      await patientController.getPatientById(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });

    it('SECURITY: Patient 1 requesting Patient 2 timeline is strictly blocked with HTTP 403', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: patient2._id.toString() }
      };
      const res = mockRes();
      await patientController.getPatientTimeline(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });

    it('SECURITY: Patient 1 querying /api/v1/patients receives ONLY their own record (count: 1)', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await patientController.getPatients(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data.length, 1);
      assert.strictEqual(res.data.data[0]._id.toString(), patient1._id.toString());
      assert.notStrictEqual(res.data.data[0]._id.toString(), patient2._id.toString());
    });

    it('SECURITY: Cross-tenant access to another tenant patient record returns 404/403', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant2._id, // Tenant 2 boundary
        params: { id: patientOtherTenant._id.toString() }
      };
      const res = mockRes();
      await patientController.getPatientById(req, res, () => {});

      assert.ok([403, 404].includes(res.statusCode));
      assert.strictEqual(res.data.success, false);
    });
  });

  describe('3. Appointments: Booking Ownership & Scoped Retrieval', () => {
    let appt1, appt2;

    before(async () => {
      // Seed an appointment for Patient 1
      appt1 = await Appointment.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '10:30 AM',
        tokenNumber: 1,
        status: 'Scheduled',
        bookedBy: doctorUser._id
      });

      // Seed an appointment for Patient 2
      appt2 = await Appointment.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '11:00 AM',
        tokenNumber: 2,
        status: 'Confirmed',
        bookedBy: doctorUser._id
      });
    });

    after(async () => {
      await Appointment.deleteMany({ _id: { $in: [appt1._id, appt2._id] } });
    });

    it('Patient 1 calling GET /appointments only receives their own appointment', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await appointmentController.getAppointments(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].tokenNumber, 1);
    });

    it('SECURITY: When patient books appointment, backend forces patient to authenticated patient identity', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        body: {
          patient: patient2._id, // Malicious attempt to book for Patient 2
          doctor: doctorUser._id,
          appointmentDate: new Date().toISOString(),
          slotTime: '02:00 PM',
          reasonForVisit: 'Chest pain review'
        }
      };
      const res = mockRes();
      await appointmentController.createAppointment(req, res, () => {});

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);
      // Stamped patient must be Patient 1, not Patient 2!
      assert.strictEqual(res.data.data.patient._id.toString(), patient1._id.toString());

      // Cleanup
      await Appointment.findByIdAndDelete(res.data.data._id);
    });
  });

  describe('4. Clinical Encounters, Vitals & Prescriptions Anti-IDOR', () => {
    let encounter1, encounter2, vitals1, vitals2, prescription1, prescription2;

    before(async () => {
      encounter1 = await Encounter.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        doctor: doctorUser._id,
        encounterNumber: `ENC-TEST-0001-${Date.now()}`,
        encounterType: 'OPD',
        chiefComplaint: 'Headache & Mild Fever',
        status: 'Completed'
      });

      encounter2 = await Encounter.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        doctor: doctorUser._id,
        encounterNumber: `ENC-TEST-0002-${Date.now()}`,
        encounterType: 'OPD',
        chiefComplaint: 'Routine Knee checkup',
        status: 'Completed'
      });

      vitals1 = await Vital.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        encounter: encounter1._id,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        pulse: 72,
        spo2: 98,
        temperature: 98.6
      });

      vitals2 = await Vital.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        encounter: encounter2._id,
        bloodPressureSystolic: 140,
        bloodPressureDiastolic: 90,
        pulse: 84,
        spo2: 97,
        temperature: 99.1
      });

      prescription1 = await Prescription.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        doctor: doctorUser._id,
        encounter: encounter1._id,
        prescriptionNumber: `RX-TEST-0001-${Date.now()}`,
        medications: [
          { medicineName: 'Paracetamol', dosage: '650mg', form: 'Tablet', frequency: 'Twice daily (BD)', duration: '3 days' }
        ],
        diagnosis: 'Viral pyrexia'
      });

      prescription2 = await Prescription.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        doctor: doctorUser._id,
        encounter: encounter2._id,
        prescriptionNumber: `RX-TEST-0002-${Date.now()}`,
        medications: [
          { medicineName: 'Cetirizine', dosage: '10mg', form: 'Tablet', frequency: 'Once daily (OD)', duration: '5 days' }
        ],
        diagnosis: 'Allergic Rhinitis'
      });
    });

    after(async () => {
      await Encounter.deleteMany({ _id: { $in: [encounter1._id, encounter2._id] } });
      await Vital.deleteMany({ _id: { $in: [vitals1._id, vitals2._id] } });
      await Prescription.deleteMany({ _id: { $in: [prescription1._id, prescription2._id] } });
    });

    it('SECURITY: Patient 1 requesting Patient 2 encounter by ID is blocked with HTTP 403', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: encounter2._id.toString() }
      };
      const res = mockRes();
      await clinicalController.getEncounterById(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });

    it('SECURITY: Patient 1 requesting Patient 2 vitals is blocked with HTTP 403', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { patientId: patient2._id.toString() }
      };
      const res = mockRes();
      await clinicalController.getPatientVitals(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });

    it('Patient 1 calling GET /clinical/prescriptions receives only Patient 1 prescriptions with medications array', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await clinicalController.getPrescriptions(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].medications[0].medicineName, 'Paracetamol');
    });
  });

  describe('5. Lab & Radiology Diagnostics Anti-IDOR', () => {
    let lab1, lab2, rad1, rad2;

    before(async () => {
      lab1 = await LabOrder.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        doctor: doctorUser._id,
        orderNumber: `LAB-TEST-0001-${Date.now()}`,
        sampleBarcode: 'BC-TEST-0001',
        tests: [{ testName: 'Complete Blood Count', resultValue: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0' }],
        overallStatus: 'Completed'
      });

      lab2 = await LabOrder.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        doctor: doctorUser._id,
        orderNumber: `LAB-TEST-0002-${Date.now()}`,
        sampleBarcode: 'BC-TEST-0002',
        tests: [{ testName: 'Lipid Profile', resultValue: '210', unit: 'mg/dL', referenceRange: '< 200' }],
        overallStatus: 'Completed'
      });

      rad1 = await RadiologyOrder.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        doctor: doctorUser._id,
        orderNumber: `RAD-TEST-0001-${Date.now()}`,
        modality: 'X-Ray',
        bodyPart: 'Chest PA',
        status: 'Finalized',
        impression: 'Normal lung fields'
      });

      rad2 = await RadiologyOrder.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        doctor: doctorUser._id,
        orderNumber: `RAD-TEST-0002-${Date.now()}`,
        modality: 'MRI',
        bodyPart: 'Brain',
        status: 'Finalized',
        impression: 'No acute intracranial pathology'
      });
    });

    after(async () => {
      await LabOrder.deleteMany({ _id: { $in: [lab1._id, lab2._id] } });
      await RadiologyOrder.deleteMany({ _id: { $in: [rad1._id, rad2._id] } });
    });

    it('Patient 1 calling GET /diagnostics/lab-orders only receives Patient 1 lab orders', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await labController.getLabOrders(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].sampleBarcode, 'BC-TEST-0001');
    });

    it('Patient 1 calling GET /diagnostics/radiology-orders only receives Patient 1 radiology orders', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await labController.getRadiologyOrders(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].bodyPart, 'Chest PA');
    });

    it('SECURITY: Patient 1 requesting Patient 2 radiology order by ID returns 403 Forbidden', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: rad2._id.toString() }
      };
      const res = mockRes();
      await labController.getRadiologyOrderById(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });
  });

  describe('6. Invoices & Payments Anti-IDOR & Enums', () => {
    let invoice1, invoice2, payment1;

    before(async () => {
      invoice1 = await Invoice.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        invoiceNumber: `INV-TEST-0001-${Date.now()}`,
        subtotal: 1500,
        grandTotal: 1500,
        paidAmount: 1500,
        balanceDue: 0,
        items: [{ description: 'OPD Consultation', unitPrice: 1500, totalAmount: 1500 }],
        status: 'Fully Paid'
      });

      invoice2 = await Invoice.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        invoiceNumber: `INV-TEST-0002-${Date.now()}`,
        subtotal: 3000,
        grandTotal: 3000,
        paidAmount: 1000,
        balanceDue: 2000,
        items: [{ description: 'Specialist Procedure', unitPrice: 3000, totalAmount: 3000 }],
        status: 'Partially Paid'
      });

      payment1 = await Payment.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        invoice: invoice1._id,
        receiptNumber: `REC-TEST-0001-${Date.now()}`,
        amountPaid: 1500,
        paymentMethod: 'UPI / QR Code',
        collectedBy: doctorUser._id,
        status: 'Completed'
      });
    });

    after(async () => {
      await Invoice.deleteMany({ _id: { $in: [invoice1._id, invoice2._id] } });
      await Payment.deleteMany({ _id: payment1._id });
    });

    it('Patient 1 calling GET /billing/invoices returns only Patient 1 invoices with Fully Paid status enum', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await billingController.getInvoices(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].status, 'Fully Paid');
      assert.strictEqual(res.data.data[0].balanceDue, 0);
    });

    it('Patient 1 calling GET /billing/payments returns only Patient 1 payment receipts', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await billingController.getPayments(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].amountPaid, 1500);
      assert.strictEqual(res.data.data[0].paymentMethod, 'UPI / QR Code');
    });
  });

  describe('7. Inpatient Admissions & Discharge Summaries Anti-IDOR', () => {
    let bed1;
    let adm1, adm2;

    before(async () => {
      bed1 = await Bed.create({
        tenant: tenant1._id,
        branch: branch1._id,
        floor: '2nd Floor',
        ward: 'Deluxe Suite',
        roomNumber: '201',
        bedNumber: `BED-TEST-${Date.now()}`,
        status: 'Available'
      });

      adm1 = await Admission.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        attendingDoctor: doctorUser._id,
        bed: bed1._id,
        admissionNumber: `ADM-TEST-0001-${Date.now()}`,
        status: 'Discharged',
        dischargeDate: new Date(),
        dischargeSummary: {
          finalDiagnosis: 'Dengue Fever with Thrombocytopenia',
          treatmentCourse: 'IV fluids, antipyretics, platelet monitoring',
          conditionAtDischarge: 'Stable / Recovered',
          followUpInstructions: 'Follow-up after 5 days with repeat platelet count'
        }
      });

      adm2 = await Admission.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        attendingDoctor: doctorUser._id,
        bed: bed1._id,
        admissionNumber: `ADM-TEST-0002-${Date.now()}`,
        status: 'Discharged',
        dischargeDate: new Date(),
        dischargeSummary: {
          finalDiagnosis: 'Acute Appendicitis Post-Appendectomy',
          conditionAtDischarge: 'Stable / Recovered'
        }
      });
    });

    after(async () => {
      await Admission.deleteMany({ _id: { $in: [adm1._id, adm2._id] } });
      await Bed.findByIdAndDelete(bed1._id);
    });

    it('Patient 1 calling GET /ipd/admissions returns only Patient 1 admissions and discharge summary', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: { status: 'all' }
      };
      const res = mockRes();
      await ipdController.getAdmissions(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].dischargeSummary.finalDiagnosis, 'Dengue Fever with Thrombocytopenia');
    });

    it('SECURITY: Patient 1 requesting Patient 2 admission by ID returns 403 Forbidden', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: adm2._id.toString() }
      };
      const res = mockRes();
      await ipdController.getAdmissionById(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.error.includes('Access denied'));
    });
  });

  describe('8. Document Vault & Ephemeral Access Tokens', () => {
    let doc1, doc2;

    before(async () => {
      doc1 = await DocumentRegistry.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        documentType: 'Discharge summary',
        documentNumber: `DOC-TEST-0001-${Date.now()}`,
        title: 'Official Discharge Summary Certificate',
        storageKey: `vault/p1/discharge-${Date.now()}.pdf`,
        uploadedBy: doctorUser._id
      });

      doc2 = await DocumentRegistry.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient2._id,
        documentType: 'Prescription',
        documentNumber: `DOC-TEST-0002-${Date.now()}`,
        title: 'Specialist Prescription PDF',
        storageKey: `vault/p2/rx-${Date.now()}.pdf`,
        uploadedBy: doctorUser._id
      });
    });

    after(async () => {
      await DocumentRegistry.deleteMany({ _id: { $in: [doc1._id, doc2._id] } });
    });

    it('Patient 1 calling GET /documents returns only Patient 1 documents', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const res = mockRes();
      await documentController.getDocuments(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.count, 1);
      assert.strictEqual(res.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(res.data.data[0].title, 'Official Discharge Summary Certificate');
    });

    it('Patient 1 requesting secure access generates 15-minute ephemeral token', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: doc1._id.toString() }
      };
      const res = mockRes();
      await documentController.getSecureDocumentAccess(req, res, () => {});

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.token, 'Must return signed token');
      assert.strictEqual(res.data.data.accessMode, 'EphemeralVaultStream');
    });

    it('SECURITY: Patient 1 requesting secure access for Patient 2 document returns 403 Forbidden', async () => {
      const req = {
        user: patientUser1,
        tenantId: tenant1._id,
        params: { id: doc2._id.toString() }
      };
      const res = mockRes();
      await documentController.getSecureDocumentAccess(req, res, () => {});

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.message.includes('Unauthorized'));
    });
  });

  describe('9. Patient Feedback & Support Submissions', () => {
    it('Patient 1 submits feedback successfully and retrieves only their own feedback history', async () => {
      const postReq = {
        user: patientUser1,
        tenantId: tenant1._id,
        body: {
          category: 'Doctor Consultation',
          rating: 5,
          feedbackText: 'Dr. Arun provided excellent diagnostic care and clear advice.'
        }
      };
      const postRes = mockRes();
      await patientController.submitFeedback(postReq, postRes, () => {});

      assert.strictEqual(postRes.statusCode, 201);
      assert.strictEqual(postRes.data.success, true);
      assert.strictEqual(postRes.data.data.rating, 5);

      // Now query feedbacks
      const getReq = {
        user: patientUser1,
        tenantId: tenant1._id,
        query: {}
      };
      const getRes = mockRes();
      await patientController.getPatientFeedback(getReq, getRes, () => {});

      assert.strictEqual(getRes.statusCode, 200);
      assert.strictEqual(getRes.data.count, 1);
      assert.strictEqual(getRes.data.data[0].patient._id.toString(), patient1._id.toString());
      assert.strictEqual(getRes.data.data[0].category, 'Doctor Consultation');

      // Cleanup
      await Feedback.findByIdAndDelete(postRes.data.data._id);
    });
  });
});
