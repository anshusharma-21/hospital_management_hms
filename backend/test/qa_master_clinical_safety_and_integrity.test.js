const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'qa_master_test_secret_2026';

const connectDB = require('../src/config/db');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Encounter = require('../src/models/Encounter');
const Vital = require('../src/models/Vital');
const Prescription = require('../src/models/Prescription');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const Medicine = require('../src/models/Medicine');
const PatientOTP = require('../src/models/PatientOTP');

const clinicalController = require('../src/controllers/clinicalController');
const patientController = require('../src/controllers/patientController');
const appointmentController = require('../src/controllers/appointmentController');
const dashboardController = require('../src/controllers/dashboardController');
const pharmacyController = require('../src/controllers/pharmacyController');
const authController = require('../src/controllers/authController');

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

describe('HOSPITAL VISION — QA MASTER CLINICAL SAFETY & INTEGRITY TEST SUITE', () => {
  let tenantId;
  let branchId;
  let doctorId;
  let patientAId;
  let patientBId;
  let doctorUser;
  let patientUserA;

  before(async () => {
    await connectDB();

    const timestamp = Date.now();
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({
        name: `QA Safety Tenant ${timestamp}`,
        slug: `qa-tenant-${timestamp}`
      });
    }
    tenantId = tenant._id;

    let branch = await Branch.findOne({ tenant: tenantId });
    if (!branch) {
      branch = await Branch.create({
        tenant: tenantId,
        name: 'QA Main Branch',
        code: 'QA-01',
        isMain: true,
        bedCapacity: 50
      });
    }
    branchId = branch._id;

    doctorUser = await User.findOne({ tenant: tenantId, role: 'doctor' });
    if (!doctorUser) {
      doctorUser = await User.create({
        name: 'Dr. Automated Safety QA',
        email: `dr.safety.${timestamp}@hospitalvision.com`,
        password: 'Password123!',
        role: 'doctor',
        tenant: tenantId,
        branch: branchId
      });
    }
    doctorId = doctorUser._id;

    // Create Synthetic Patient A with Penicillin allergy
    const patientA = await Patient.create({
      tenant: tenantId,
      primaryBranch: branchId,
      uhid: `QA-UHID-${timestamp.toString().slice(-6)}`,
      firstName: 'Anita',
      lastName: 'SafetyQA',
      fullName: 'Anita SafetyQA',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'Female',
      age: 32,
      dob: new Date('1994-06-15'),
      bloodGroup: 'B+',
      allergies: [{ allergen: 'Penicillin', severity: 'Severe' }]
    });
    patientAId = patientA._id;

    patientUserA = await User.create({
      name: patientA.fullName,
      email: `${patientA.phone}@patient.hospitalvision.local`,
      phone: patientA.phone,
      password: 'PatientPortal2026!',
      role: 'patient',
      patient: patientA._id,
      tenant: tenantId,
      status: 'active'
    });

    // Create Synthetic Patient B
    const patientB = await Patient.create({
      tenant: tenantId,
      primaryBranch: branchId,
      uhid: `QA-UHID-B-${timestamp.toString().slice(-6)}`,
      firstName: 'Rahul',
      lastName: 'SafetyQA',
      fullName: 'Rahul SafetyQA',
      phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'Male',
      age: 45,
      dob: new Date('1981-02-20'),
      bloodGroup: 'O+'
    });
    patientBId = patientB._id;
  });

  after(async () => {
    try {
      if (patientAId) await Patient.deleteMany({ _id: { $in: [patientAId, patientBId] } });
      if (patientUserA) await User.deleteMany({ _id: patientUserA._id });
      if (patientAId) await Vital.deleteMany({ patient: { $in: [patientAId, patientBId] } });
      if (patientAId) await Prescription.deleteMany({ patient: { $in: [patientAId, patientBId] } });
      if (patientAId) await Encounter.deleteMany({ patient: { $in: [patientAId, patientBId] } });
      if (patientAId) await Appointment.deleteMany({ patient: { $in: [patientAId, patientBId] } });
      if (patientUserA) await PatientOTP.deleteMany({ phone: patientUserA.phone });
      await mongoose.connection.close();
    } catch (_) {}
    setTimeout(() => process.exit(0), 500);
  });

  /* ─────────────────────────────────────────────────────────────
     1. CLINICAL SAFETY: VITALS PHYSIOLOGICAL BOUNDS
  ───────────────────────────────────────────────────────────── */
  describe('1. Clinical Safety — Vital Signs Physiological Limits', () => {
    it('CRITICAL: Rejects impossible high systolic BP (e.g. 400 mmHg) with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          bloodPressureSystolic: 400,
          bloodPressureDiastolic: 80,
          pulse: 72
        }
      };

      await clinicalController.recordVitals(req, res, next);
      assert.strictEqual(result.code, 400, 'Must return 400 Bad Request');
      assert(result.data.errors && result.data.errors.length > 0, 'Must return field-level errors');
    });

    it('CRITICAL: Rejects pulse rate of 5 bpm (incompatible with life) with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          pulse: 5
        }
      };

      await clinicalController.recordVitals(req, res, next);
      assert.strictEqual(result.code, 400, 'Pulse of 5 must be rejected');
    });

    it('CRITICAL: Rejects Systolic BP less than or equal to Diastolic BP (e.g. 80/120)', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          bloodPressureSystolic: 80,
          bloodPressureDiastolic: 120,
          pulse: 72
        }
      };

      await clinicalController.recordVitals(req, res, next);
      assert.strictEqual(result.code, 400, 'Systolic <= Diastolic must be rejected');
    });

    it('PASS: Accurately saves physiological valid vitals (BP 120/80, Pulse 72, SpO2 98%)', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          pulse: 72,
          spo2: 98,
          temperature: 98.6
        }
      };

      await clinicalController.recordVitals(req, res, next);
      assert.strictEqual(result.code, 201, 'Valid vitals must be saved with 201');
      assert.strictEqual(result.data.data.bloodPressureSystolic, 120);
    });
  });

  /* ─────────────────────────────────────────────────────────────
     2. CLINICAL SAFETY: DRUG ALLERGY CHECKING & OVERRIDE
  ───────────────────────────────────────────────────────────── */
  describe('2. Clinical Safety — Drug-Allergy Safety & Audited Override', () => {
    it('CRITICAL: Blocks Amoxicillin prescription for Penicillin-allergic patient with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          diagnosis: 'Acute bacterial pharyngitis',
          medications: [
            {
              medicineName: 'Amoxicillin 500mg',
              dosage: '1 Cap',
              frequency: 'Thrice daily (TDS)',
              duration: '5 Days'
            }
          ]
        }
      };

      await clinicalController.createPrescription(req, res, next);
      assert.strictEqual(result.code, 400, 'Conflicting drug must be blocked');
      assert.strictEqual(result.data.allergyConflict, true, 'Flag allergyConflict must be true');
      assert(result.data.conflicts.length > 0, 'Must identify Penicillin cross-reactivity');
    });

    it('PASS: Permits prescription when clinician provides explicit audited override', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          diagnosis: 'Acute bacterial pharyngitis',
          medications: [
            {
              medicineName: 'Amoxicillin 500mg',
              dosage: '1 Cap',
              frequency: 'Thrice daily (TDS)',
              duration: '5 Days'
            }
          ],
          allergyOverrideAcknowledged: true,
          allergyOverrideReason: 'Severe sepsis indication; desensitization protocol active under clinical observation'
        }
      };

      await clinicalController.createPrescription(req, res, next);
      assert.strictEqual(result.code, 201, 'Prescription with documented override must succeed');
      assert.strictEqual(result.data.success, true);
    });
  });

  /* ─────────────────────────────────────────────────────────────
     3. PATIENT DEMOGRAPHICS & DOB INTEGRITY
  ───────────────────────────────────────────────────────────── */
  describe('3. Input Validation — Patient Date of Birth & Age Integrity', () => {
    it('CRITICAL: Rejects future date of birth with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const req = {
        tenantId,
        user: doctorUser,
        body: {
          firstName: 'Future',
          lastName: 'Patient',
          fullName: 'Future Patient',
          phone: '9812345678',
          gender: 'Female',
          dob: futureDate.toISOString().split('T')[0]
        }
      };

      await patientController.createPatient(req, res, next);
      assert.strictEqual(result.code, 400, 'Future DOB must return 400');
    });

    it('CRITICAL: Rejects age greater than 125 with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          firstName: 'Ancient',
          lastName: 'Patient',
          fullName: 'Ancient Patient',
          phone: '9812345679',
          gender: 'Male',
          dob: '1850-01-01',
          age: 176
        }
      };

      await patientController.createPatient(req, res, next);
      assert.strictEqual(result.code, 400, 'Age > 125 must return 400');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     4. APPOINTMENT INTEGRITY & CONCURRENCY
  ───────────────────────────────────────────────────────────── */
  describe('4. Appointment Integrity — Past Dates, Fees & Double Booking', () => {
    it('CRITICAL: Rejects past date appointment booking with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          doctor: doctorId,
          branch: branchId,
          appointmentDate: pastDate.toISOString().split('T')[0],
          slotTime: '10:00 AM',
          consultationFee: 500
        }
      };

      await appointmentController.createAppointment(req, res, next);
      assert.strictEqual(result.code, 400, 'Past date booking must be rejected');
    });

    it('CRITICAL: Rejects negative consultation fee with HTTP 400', async () => {
      const { result, res, next } = makeMockRes();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          doctor: doctorId,
          branch: branchId,
          appointmentDate: tomorrow.toISOString().split('T')[0],
          slotTime: '10:30 AM',
          consultationFee: -250
        }
      };

      await appointmentController.createAppointment(req, res, next);
      assert.strictEqual(result.code, 400, 'Negative fee must be rejected');
    });

    it('CRITICAL: Prevents double-booking same doctor and slot time with HTTP 409 Conflict', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      const dateStr = targetDate.toISOString().split('T')[0];
      const slot = '11:15 AM';

      // 1. First booking succeeds
      const { result: res1, res: r1, next: n1 } = makeMockRes();
      const req1 = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientAId,
          doctor: doctorId,
          branch: branchId,
          appointmentDate: dateStr,
          slotTime: slot,
          consultationFee: 500
        }
      };
      await appointmentController.createAppointment(req1, r1, n1);
      assert.strictEqual(res1.code, 201, 'First booking should succeed');

      // 2. Second booking with same doctor and slot is rejected with 409
      const { result: res2, res: r2, next: n2 } = makeMockRes();
      const req2 = {
        tenantId,
        user: doctorUser,
        body: {
          patient: patientBId,
          doctor: doctorId,
          branch: branchId,
          appointmentDate: dateStr,
          slotTime: slot,
          consultationFee: 500
        }
      };
      await appointmentController.createAppointment(req2, r2, n2);
      assert.strictEqual(res2.code, 409, 'Double booking must return 409 Conflict');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     5. BILLING & ADMIN REVENUE RECONCILIATION
  ───────────────────────────────────────────────────────────── */
  describe('5. Financial Accuracy — Admin Revenue Reconciliation', () => {
    it('PASS: Admin dashboard calculates revenue from authoritative Payment collection', async () => {
      const invoice = await Invoice.create({
        tenant: tenantId,
        branch: branchId,
        patient: patientAId,
        invoiceNumber: `INV-REV-${Date.now().toString().slice(-6)}`,
        billingType: 'OPD Consultation',
        subtotal: 1000,
        grandTotal: 1000,
        paidAmount: 1000,
        balanceDue: 0,
        status: 'Fully Paid'
      });

      const payment = await Payment.create({
        tenant: tenantId,
        branch: branchId,
        patient: patientAId,
        invoice: invoice._id,
        receiptNumber: `REC-REV-${Date.now().toString().slice(-6)}`,
        amountPaid: 1000,
        paymentMethod: 'Cash',
        collectedBy: doctorUser._id,
        status: 'Completed'
      });

      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: { role: 'hospital_admin', _id: doctorUser._id }
      };

      await dashboardController.getDashboardStats(req, res, next);
      assert.strictEqual(result.code, 200);
      assert(result.data.stats.todayCollections >= 1000, 'Admin collections must reflect completed payments, not 0');

      // Cleanup
      await Payment.deleteOne({ _id: payment._id });
      await Invoice.deleteOne({ _id: invoice._id });
    });
  });


  /* ─────────────────────────────────────────────────────────────
     6. PHARMACY DISPENSING, TAXES & RECONCILIATION
  ───────────────────────────────────────────────────────────── */
  describe('6. Pharmacy Dispensing — 5% GST & Authoritative Total', () => {
    it('PASS: Calculates 5% GST and reconciles grandTotal with invoice and receipt', async () => {
      const medicine = await Medicine.create({
        tenant: tenantId,
        name: `Paracetamol QA ${Date.now()}`,
        genericName: 'Paracetamol',
        strength: '500mg',
        unitPrice: 100,
        stockQuantity: 50,
        taxPercent: 5
      });


      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: doctorUser,
        body: {
          patientId: patientAId,
          items: [
            {
              medicineId: medicine._id,
              quantity: 10,
              unitPrice: 100,
              taxPercent: 5
            }
          ],
          discount: 50,
          paymentMethod: 'Cash'
        }
      };

      await pharmacyController.dispensePrescription(req, res, next);
      assert.strictEqual(result.code, 200);

      const inv = result.data.invoice;
      assert.strictEqual(inv.subtotal, 1000);
      assert.strictEqual(inv.totalTax, 50);
      assert.strictEqual(inv.totalDiscount, 50);
      assert.strictEqual(inv.grandTotal, 1000);
      assert.strictEqual(result.data.payment.amountPaid, 1000);

      // Cleanup
      await Medicine.deleteOne({ _id: medicine._id });
      await Invoice.deleteOne({ _id: inv._id });
      await Payment.deleteOne({ _id: result.data.payment._id });
    });
  });

  /* ─────────────────────────────────────────────────────────────
     7. AUTHENTICATION & SECURITY: REAL OTP & NO ENUMERATION
  ───────────────────────────────────────────────────────────── */
  describe('7. Authentication Security — Real Cryptographic OTP & Account Enumeration Prevention', () => {
    it('SECURITY: Missing or wrong OTP is strictly rejected with 401', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        body: {
          phone: patientUserA.phone,
          otp: '999999' // arbitrary wrong OTP
        }
      };

      await authController.patientLogin(req, res, next);
      assert(result.code === 400 || result.code === 401, 'Arbitrary OTP must be blocked');
    });

    it('SECURITY: Send OTP generates cryptographic session and validates genuine OTP', async () => {
      // 1. Request OTP
      const { result: resSend, res: rSend, next: nSend } = makeMockRes();
      const reqSend = { body: { phone: patientUserA.phone } };
      await authController.sendPatientOTP(reqSend, rSend, nSend);
      assert.strictEqual(resSend.code, 200);
      assert(resSend.data.devCode, 'DevCode must be provided in test environment');

      // 2. Submit wrong OTP -> 401
      const { result: resWrong, res: rWrong, next: nWrong } = makeMockRes();
      const reqWrong = { body: { phone: patientUserA.phone, otp: '000000' } };
      await authController.patientLogin(reqWrong, rWrong, nWrong);
      assert.strictEqual(resWrong.code, 401, 'Wrong OTP must return 401 Unauthorized');

      // 3. Submit valid OTP -> 200 Success
      const { result: resValid, res: rValid, next: nValid } = makeMockRes();
      const reqValid = { body: { phone: patientUserA.phone, otp: resSend.data.devCode } };
      await authController.patientLogin(reqValid, rValid, nValid);
      assert.strictEqual(resValid.code, 200, 'Authentic OTP must successfully log in');
      assert(resValid.data.token, 'Must issue JWT token');

      // 4. Replay attack: Reusing same OTP must fail with 400
      const { result: resReplay, res: rReplay, next: nReplay } = makeMockRes();
      await authController.patientLogin(reqValid, rReplay, nReplay);
      assert.strictEqual(resReplay.code, 400, 'Replay of used OTP must be blocked with 400');
    });

    it('SECURITY: Staff login uses uniform error message to prevent account enumeration', async () => {
      // Nonexistent account
      const { result: res1, res: r1, next: n1 } = makeMockRes();
      await authController.login(
        { body: { email: 'nonexistent9999@randomhospital.com', password: 'Password123!' } },
        r1,
        n1
      );

      // Existing account, wrong password
      const { result: res2, res: r2, next: n2 } = makeMockRes();
      await authController.login(
        { body: { email: doctorUser.email, password: 'WrongPassword999!' } },
        r2,
        n2
      );

      assert.strictEqual(res1.code, 401);
      assert.strictEqual(res2.code, 401);
      assert.strictEqual(res1.data.error, res2.data.error, 'Error message must be identical for missing user vs wrong password');
      assert.strictEqual(res1.data.error, 'Invalid credentials. Please check your email and password.');
    });

    it('SECURITY: Super Admin Ajay demo account exists and verifies with demo credentials', async () => {
      const ajay = await User.findOne({ email: 'ajay@gmail.com' }).select('+password');
      assert(ajay, 'ajay@gmail.com must exist in database');
      const isMatch = await ajay.matchPassword('ajay321');
      assert.strictEqual(isMatch, true, 'ajay@gmail.com password must match ajay321');
      assert.strictEqual(ajay.role, 'super_admin');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     8. PATIENT PORTAL & CLINICAL ISOLATION
  ───────────────────────────────────────────────────────────── */
  describe('8. Patient Portal — Privacy, Isolation & Timeline Alignment', () => {
    it('PRIVACY: Patient A requesting Patient B vitals is strictly blocked with HTTP 403', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: patientUserA,
        params: { patientId: patientBId.toString() }
      };

      await clinicalController.getPatientVitals(req, res, next);
      assert.strictEqual(result.code, 403, 'Patient cannot access another patient vitals');
    });

    it('PASS: getPatientTimeline response provides both data and timeline keys for frontend contracts', async () => {
      const { result, res, next } = makeMockRes();
      const req = {
        tenantId,
        user: patientUserA,
        params: { id: 'me' }
      };

      await patientController.getPatientTimeline(req, res, next);
      assert.strictEqual(result.code, 200);
      assert(Array.isArray(result.data.data), 'result.data.data must be an array');
      assert(Array.isArray(result.data.timeline), 'result.data.timeline must be an array');
      assert.strictEqual(result.data.data.length, result.data.timeline.length);
    });
  });
});
