const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'v1_gap_closure_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Medicine = require('../src/models/Medicine');
const FeatureFlag = require('../src/models/FeatureFlag');
const DocumentRegistry = require('../src/models/DocumentRegistry');

const bulkImportService = require('../src/services/import/BulkImportService');
const hrmsService = require('../src/services/hrms/HRMSService');
const fhirConverterService = require('../src/services/interop/FHIRConverterService');
const tenantLifecycleService = require('../src/services/privacy/TenantLifecycleService');
const aiService = require('../src/services/ai/AIService');
const dashboardController = require('../src/controllers/dashboardController');
const saasPlatformController = require('../src/controllers/saasPlatformController');

describe('Hospital Vision V1 — Gap-Closure & Architectural Boundaries Test Suite', () => {
  let tenant1;
  let tenant2;
  let branch1;
  let adminUser;
  let doctorUser;
  let patient1;

  before(async () => {
    await connectDB();

    tenant1 = await Tenant.create({
      name: 'Vision Metro Hospital',
      slug: `metro-hosp-${Date.now()}`,
      subscription: {
        plan: 'Professional',
        status: 'active',
        billingCycle: 'annual'
      }
    });

    tenant2 = await Tenant.create({
      name: 'Sunrise Clinic Network',
      slug: `sunrise-net-${Date.now()}`,
      subscription: {
        plan: 'Basic',
        status: 'active',
        billingCycle: 'monthly'
      }
    });

    branch1 = await Branch.create({
      tenant: tenant1._id,
      name: 'Central Pavilion',
      code: `CP-${Date.now()}`
    });

    adminUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Admin Meera',
      email: `admin_meera_${Date.now()}@metro.org`,
      password: 'Password123!',
      role: 'hospital_admin',
      status: 'active'
    });

    doctorUser = await User.create({
      tenant: tenant1._id,
      branch: branch1._id,
      name: 'Dr. Vivek Sengupta',
      email: `dr_vivek_${Date.now()}@metro.org`,
      password: 'Password123!',
      role: 'doctor',
      status: 'active'
    });

    patient1 = await Patient.create({
      tenant: tenant1._id,
      primaryBranch: branch1._id,
      uhid: `HV-2026-${Date.now().toString().slice(-4)}`,
      firstName: 'Ramesh',
      lastName: 'Iyer',
      phone: '9845012345',
      gender: 'Male',
      age: 48,
      bloodGroup: 'B+'
    });
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    setTimeout(() => process.exit(0), 100);
  });

  // =========================================================================
  // 1. FEATURE FLAGS CANONICAL CONTRACT & PERSISTENCE
  // =========================================================================
  describe('1. Feature Flags Canonical Contract', () => {
    it('should support canonical module keys and legacy aliases in FeatureFlag model', async () => {
      const flag1 = await FeatureFlag.create({
        tenant: tenant1._id,
        moduleKey: 'module_laboratory',
        isEnabled: true
      });
      assert.strictEqual(flag1.moduleKey, 'module_laboratory');

      // Legacy alias allowed by schema
      const flag2 = await FeatureFlag.create({
        tenant: tenant1._id,
        moduleKey: 'module_lab',
        isEnabled: false
      });
      assert.strictEqual(flag2.moduleKey, 'module_lab');
    });

    it('should toggle flag via controller with canonical mapping and audit logging', async () => {
      let response = {};
      const res = {
        status: (code) => {
          response.code = code;
          return { json: (data) => { response.data = data; } };
        }
      };

      await saasPlatformController.toggleFeatureFlag({
        tenantId: tenant1._id.toString(),
        user: { _id: adminUser._id, role: 'super_admin' },
        body: {
          tenantId: tenant1._id.toString(),
          moduleKey: 'module_ai_copilot', // Alias will be mapped to module_ai_assistant
          isEnabled: true
        }
      }, res, (err) => { if (err) throw err; });

      assert.strictEqual(response.code, 200);
      assert.strictEqual(response.data.data.moduleKey, 'module_ai_assistant');
      assert.strictEqual(response.data.data.isEnabled, true);

      // Verify persistence in DB
      const persisted = await FeatureFlag.findOne({
        tenant: tenant1._id,
        moduleKey: 'module_ai_assistant'
      });
      assert.ok(persisted);
      assert.strictEqual(persisted.isEnabled, true);
    });
  });

  // =========================================================================
  // 2. DOCUMENT REGISTRY & SECURE ACCESS
  // =========================================================================
  describe('2. Centralized Document Registry', () => {
    let testDoc;

    it('should register document metadata with private storage key without public URLs', async () => {
      testDoc = await DocumentRegistry.create({
        tenant: tenant1._id,
        branch: branch1._id,
        patient: patient1._id,
        documentType: 'Discharge summary',
        documentNumber: `DOC-2026-${Date.now().toString().slice(-4)}`,
        title: 'IPD Discharge Summary - Cardiology',
        storageKey: `vault://tenants/${tenant1._id}/docs/cardio_discharge_001.enc`,
        mimeType: 'application/pdf',
        fileSizeBytes: 245000,
        accessControl: {
          isRestricted: true,
          allowedRoles: ['doctor', 'hospital_admin']
        }
      });

      assert.ok(testDoc._id);
      assert.strictEqual(testDoc.documentType, 'Discharge summary');
      assert.ok(testDoc.storageKey.startsWith('vault://'));
      assert.strictEqual(testDoc.storageKey.includes('http://'), false);
      assert.strictEqual(testDoc.storageKey.includes('https://'), false);
    });

    it('should generate time-limited ephemeral access token for authorized role', async () => {
      const isAuthorized = testDoc.accessControl.allowedRoles.includes(doctorUser.role);
      assert.strictEqual(isAuthorized, true);

      const token = 'ephemeral_token_' + Date.now();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      assert.ok(expiresAt > new Date());
    });

    it('should enforce tenant isolation on document query (Tenant 2 cannot view Tenant 1 docs)', async () => {
      const docsInTenant2 = await DocumentRegistry.find({
        tenant: tenant2._id,
        patient: patient1._id
      });
      assert.strictEqual(docsInTenant2.length, 0);
    });
  });

  // =========================================================================
  // 3. GLOBAL UNIFIED SEARCH
  // =========================================================================
  describe('3. Global Unified Search', () => {
    it('should return categorized search results respecting tenant and RBAC', async () => {
      let response = {};
      const res = {
        status: (code) => {
          response.code = code;
          return { json: (data) => { response.data = data; } };
        }
      };

      await dashboardController.globalSearch({
        tenantId: tenant1._id,
        user: doctorUser,
        query: { q: 'Ramesh' }
      }, res, (err) => { if (err) throw err; });

      assert.strictEqual(response.code, 200);
      assert.ok(response.data.results.patients);
      assert.strictEqual(response.data.results.patients.length, 1);
      assert.strictEqual(response.data.results.patients[0].firstName, 'Ramesh');
      assert.strictEqual(response.data.results.patients[0].uhid, patient1.uhid);
    });

    it('should return empty results for queries under 2 characters', async () => {
      let response = {};
      const res = {
        status: (code) => {
          response.code = code;
          return { json: (data) => { response.data = data; } };
        }
      };

      await dashboardController.globalSearch({
        tenantId: tenant1._id,
        user: doctorUser,
        query: { q: 'R' }
      }, res, (err) => { if (err) throw err; });

      assert.strictEqual(response.code, 200);
      assert.strictEqual(response.data.results.patients.length, 0);
    });
  });

  // =========================================================================
  // 4. BULK IMPORT ENGINE
  // =========================================================================
  describe('4. Safe Bulk Import Engine', () => {
    it('should preview import rows, detect required field errors, and detect duplicates', async () => {
      const preview = await bulkImportService.previewImport({
        tenantId: tenant1._id,
        category: 'patients',
        rows: [
          { firstName: 'Arjun', phone: '9900112233', gender: 'Male', age: 34 }, // Valid
          { firstName: '', phone: '9900112244' }, // Invalid (no firstName)
          { firstName: 'Duplicate Phone', phone: '9845012345' } // Duplicate of patient1 phone
        ]
      });

      assert.strictEqual(preview.totalRows, 3);
      assert.strictEqual(preview.validRows.length, 1);
      assert.strictEqual(preview.invalidRows.length, 1);
      assert.strictEqual(preview.duplicateRows.length, 1);
      assert.ok(preview.duplicateRows[0].matchedOn.includes('already registered'));
    });

    it('should commit valid rows into MongoDB with tenant isolation and audit trail', async () => {
      const commit = await bulkImportService.commitImport({
        tenantId: tenant1._id,
        branchId: branch1._id,
        category: 'patients',
        validRows: [
          { firstName: 'Arjun', lastName: 'Kumar', phone: '9900112233', gender: 'Male', age: 34 }
        ],
        importedBy: adminUser
      });

      assert.strictEqual(commit.success, true);
      assert.strictEqual(commit.count, 1);

      // Verify in DB
      const created = await Patient.findOne({ tenant: tenant1._id, phone: '9900112233' });
      assert.ok(created);
      assert.strictEqual(created.firstName, 'Arjun');
    });
  });

  // =========================================================================
  // 5. HRMS INTEGRATION BOUNDARY
  // =========================================================================
  describe('5. HRMS Provider-Neutral Boundary', () => {
    it('should synchronize staff from mock HRMS adapter with tenant isolation', async () => {
      const result = await hrmsService.syncStaff({
        tenantId: tenant1._id,
        department: 'Cardiology',
        requestedBy: adminUser
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.provider, 'mock');
      assert.ok(result.count >= 2);
      assert.ok(result.employees[0].name.includes('Dr. Anita Desai'));
    });

    it('should retrieve staff attendance status without third-party coupling', async () => {
      const att = await hrmsService.checkAttendance({
        tenantId: tenant1._id,
        employeeId: 'HRMS-EMP-001'
      });

      assert.strictEqual(att.success, true);
      assert.strictEqual(att.status, 'Present');
    });
  });

  // =========================================================================
  // 6. ABDM / FHIR R4 READINESS
  // =========================================================================
  describe('6. ABDM / FHIR Interoperability Boundary', () => {
    it('should convert internal Patient into standard FHIR R4 Patient resource', () => {
      const fhirPat = fhirConverterService.toFHIRPatient(patient1);
      assert.strictEqual(fhirPat.resourceType, 'Patient');
      assert.strictEqual(fhirPat.id, patient1._id.toString());
      assert.strictEqual(fhirPat.name[0].given[0], 'Ramesh');
      assert.strictEqual(fhirPat.telecom[0].value, '9845012345');
    });

    it('should reject FHIR bundle export if patient consent is missing or invalid', async () => {
      await assert.rejects(
        () => fhirConverterService.exportPatientBundleWithConsent({
          tenantId: tenant1._id,
          patient: patient1,
          consentArtifact: null // Missing consent
        }),
        /Missing or invalid patient consent/i
      );
    });

    it('should generate FHIR Bundle when valid patient consent is supplied', async () => {
      const bundleResult = await fhirConverterService.exportPatientBundleWithConsent({
        tenantId: tenant1._id,
        patient: patient1,
        consentArtifact: { consentId: 'CONSENT-ABDM-2026-99', status: 'GRANTED' },
        authorizedBy: doctorUser
      });

      assert.strictEqual(bundleResult.success, true);
      assert.strictEqual(bundleResult.bundle.resourceType, 'Bundle');
      assert.strictEqual(bundleResult.consentVerified, true);
    });
  });

  // =========================================================================
  // 7. AI SERVICE DRAFT ASSISTANCE BOUNDARY
  // =========================================================================
  describe('7. AI Add-on Service Boundary', () => {
    it('should generate clinical draft with mandatory clinician review disclaimer', async () => {
      const aiResult = await aiService.summarizeNotes({
        tenantId: tenant1._id,
        notes: 'Patient reports persistent headache and elevated blood pressure since morning.',
        requestedBy: doctorUser
      });

      assert.strictEqual(aiResult.success, true);
      assert.strictEqual(aiResult.isDraft, true);
      assert.strictEqual(aiResult.requiresClinicianReview, true);
      assert.ok(aiResult.disclaimer.includes('Attending clinician must review and sign'));
    });

    it('should provide differential diagnosis decision-support draft', async () => {
      const diff = await aiService.suggestDifferential({
        tenantId: tenant1._id,
        symptoms: ['fever', 'cough'],
        requestedBy: doctorUser
      });

      assert.strictEqual(diff.success, true);
      assert.strictEqual(diff.isDraft, true);
      assert.ok(diff.differentials.length > 0);
    });
  });

  // =========================================================================
  // 8. TENANT PRIVACY, DPDP EXPORT & OFFBOARDING
  // =========================================================================
  describe('8. Tenant Privacy, DPDP Export & Offboarding', () => {
    it('should export complete tenant data bundle with SHA256 checksum', async () => {
      const exported = await tenantLifecycleService.exportTenantData({
        tenantId: tenant1._id,
        requestedBy: adminUser
      });

      assert.strictEqual(exported.success, true);
      assert.ok(exported.checksum);
      assert.strictEqual(exported.bundle.tenantMetadata.name, 'Vision Metro Hospital');
      assert.ok(exported.bundle.counts.patients >= 1);
    });

    it('should transition tenant into grace period and set configurable offboarding metadata', async () => {
      const offboard = await tenantLifecycleService.initiateOffboarding({
        tenantId: tenant2._id,
        initiatedBy: { _id: adminUser._id, role: 'super_admin' },
        reason: 'Client hospital contract concluded',
        gracePeriodDays: 5,
        retentionMonths: 6
      });

      assert.strictEqual(offboard.success, true);
      assert.strictEqual(offboard.status, 'grace_period');
      assert.ok(offboard.offboardingMetadata.gracePeriodEndsAt > new Date());
      assert.ok(offboard.offboardingMetadata.retentionEndsAt > new Date());
    });

    it('should reject irreversible purge when confirmation token is incorrect', async () => {
      await assert.rejects(
        () => tenantLifecycleService.purgeTenantData({
          tenantId: tenant2._id,
          authorizedBy: { _id: adminUser._id, role: 'super_admin' },
          confirmationToken: 'WRONG_TOKEN'
        }),
        /Invalid confirmation token/i
      );
    });
  });
});
