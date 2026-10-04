const crypto = require('crypto');
const BarcodeReference = require('../../models/BarcodeReference');
const Patient = require('../../models/Patient');
const LabOrder = require('../../models/LabOrder');
const Medicine = require('../../models/Medicine');
const Appointment = require('../../models/Appointment');
const Invoice = require('../../models/Invoice');
const AuditLog = require('../../models/AuditLog');

// Blacklist of forbidden PHI keys to strictly enforce zero PHI in reference payloads
const PHI_FORBIDDEN_KEYS = [
  'diagnosis',
  'diagnoses',
  'prescription',
  'prescriptions',
  'medicine',
  'labresult',
  'results',
  'finding',
  'findings',
  'notes',
  'clinicalnotes',
  'history',
  'medicalhistory',
  'phone',
  'phonenumber',
  'contactnumber',
  'address',
  'email',
  'amount',
  'balancedue',
  'grandtotal',
  'financial'
];

class BarcodeReferenceService {
  /**
   * Deep scan metadata object to ensure NO Protected Health Information (PHI) is present
   */
  assertZeroPHI(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') return;

    const checkObj = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
        if (PHI_FORBIDDEN_KEYS.some(forbidden => cleanKey.includes(forbidden))) {
          throw new Error(`[BarcodeReferenceService Security Exception] Forbidden PHI key '${key}' detected. Barcode/QR references must remain strictly opaque.`);
        }
        if (value && typeof value === 'object') {
          checkObj(value);
        }
      }
    };

    checkObj(metadata);
  }

  /**
   * Generate or retrieve an opaque barcode/QR reference
   */
  async generateReference({ tenantId, resourceType, resourceId, resourceModel, metadata = {}, createdBy, expiresAt }) {
    if (!tenantId) {
      throw new Error('[BarcodeReferenceService] tenantId is required for tenant isolation.');
    }
    if (!resourceType || !resourceId || !resourceModel) {
      throw new Error('[BarcodeReferenceService] resourceType, resourceId, and resourceModel are required.');
    }

    // Security assertion: strictly verify no PHI data
    this.assertZeroPHI(metadata);

    // Check if an active reference already exists for this resource in this tenant
    let existingRef = await BarcodeReference.findOne({
      tenant: tenantId,
      resourceType,
      resourceId
    });

    if (existingRef && (!existingRef.expiresAt || existingRef.expiresAt > new Date())) {
      return {
        referenceCode: existingRef.referenceCode,
        displayCode: existingRef.displayCode,
        resourceType: existingRef.resourceType,
        resourceId: existingRef.resourceId,
        barcodePayload: existingRef.referenceCode,
        qrPayload: existingRef.referenceCode,
        isExisting: true
      };
    }

    // Generate opaque 16-hex token (e.g., HVREF:PAT:a1b2c3d4e5f67890)
    const token = crypto.randomBytes(8).toString('hex').toUpperCase();
    const referenceCode = `HVREF:${resourceType.toUpperCase()}:${token}`;
    const displayCode = `HV-${resourceType.substring(0, 3).toUpperCase()}-${token.substring(0, 6)}`;

    const newRef = await BarcodeReference.create({
      tenant: tenantId,
      referenceCode,
      resourceType: resourceType.toUpperCase(),
      resourceId,
      resourceModel,
      displayCode,
      metadata,
      expiresAt: expiresAt || null,
      createdBy: createdBy?._id || createdBy
    });

    return {
      referenceCode: newRef.referenceCode,
      displayCode: newRef.displayCode,
      resourceType: newRef.resourceType,
      resourceId: newRef.resourceId,
      barcodePayload: newRef.referenceCode,
      qrPayload: newRef.referenceCode,
      isExisting: false
    };
  }

  /**
   * Helper: Generate Code128 barcode instruction
   */
  async generateBarcodeData({ tenantId, resourceType, resourceId, resourceModel, metadata, createdBy }) {
    const ref = await this.generateReference({
      tenantId,
      resourceType,
      resourceId,
      resourceModel,
      metadata,
      createdBy
    });

    return {
      referenceCode: ref.referenceCode,
      format: 'CODE128',
      displayCode: ref.displayCode,
      payload: ref.barcodePayload, // Opaque reference only, NO PHI
      printText: ref.displayCode
    };
  }

  /**
   * Helper: Generate QR Code instruction
   */
  async generateQRCodeData({ tenantId, resourceType, resourceId, resourceModel, metadata, createdBy }) {
    const ref = await this.generateReference({
      tenantId,
      resourceType,
      resourceId,
      resourceModel,
      metadata,
      createdBy
    });

    return {
      referenceCode: ref.referenceCode,
      format: 'QR_CODE',
      payload: ref.qrPayload // Opaque reference only, NO PHI
    };
  }

  /**
   * Preserves existing Lab Barcode format (BC-XXXX-XXX) while maintaining compatibility
   */
  generateLabBarcode(orderNumber) {
    const cleanNum = (orderNumber || '0000').toString().replace(/[^0-9]/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    return `BC-${cleanNum || '2026'}-${randSuffix}`;
  }

  /**
   * Resolve an opaque reference code or lab barcode back to authorized resource
   */
  async resolveReference({ tenantId, referenceCode, requestingUser }) {
    if (!tenantId) {
      throw new Error('[BarcodeReferenceService] tenantId is required.');
    }
    if (!referenceCode) {
      throw new Error('[BarcodeReferenceService] referenceCode is required.');
    }

    const cleanRef = referenceCode.trim();

    // 1. Support existing legacy lab barcode format (BC-...)
    if (cleanRef.startsWith('BC-')) {
      const labOrder = await LabOrder.findOne({
        tenant: tenantId,
        sampleBarcode: cleanRef
      }).populate('patient', 'uhid firstName lastName fullName gender age');

      if (!labOrder) {
        throw new Error('[BarcodeReferenceService] Lab specimen barcode not found or inaccessible in current tenant.');
      }

      // Check RBAC for lab specimen access
      const allowedRoles = ['lab_tech', 'lab_technician', 'lab', 'radiologist', 'doctor', 'nurse', 'hospital_admin', 'super_admin', 'saas_admin'];
      if (requestingUser?.role && !allowedRoles.includes(requestingUser.role)) {
        throw new Error(`[BarcodeReferenceService] Role '${requestingUser.role}' is not authorized to inspect lab specimen.`);
      }

      // Audit log
      AuditLog.create({
        tenant: tenantId,
        user: requestingUser?._id,
        userName: requestingUser?.name || 'Lab Scanner',
        userRole: requestingUser?.role || 'lab_tech',
        action: 'Scan / Resolve Barcode Reference',
        module: 'Diagnostics (Lab/Rad)',
        entityId: labOrder._id.toString(),
        entityType: 'LabOrder',
        details: `Resolved lab specimen barcode ${cleanRef} for order ${labOrder.orderNumber}`,
        timestamp: new Date()
      }).catch(auditErr => console.warn('[BarcodeReferenceService AuditLog Warning]:', auditErr.message));

      return {
        success: true,
        referenceCode: cleanRef,
        resourceType: 'LAB_SAMPLE',
        resourceModel: 'LabOrder',
        resource: {
          _id: labOrder._id,
          orderNumber: labOrder.orderNumber,
          sampleBarcode: labOrder.sampleBarcode,
          patient: labOrder.patient,
          overallStatus: labOrder.overallStatus,
          tests: labOrder.tests?.map(t => ({ testName: t.testName, status: t.status }))
        }
      };
    }

    // 2. Resolve opaque HVREF reference
    const refDoc = await BarcodeReference.findOne({
      tenant: tenantId,
      referenceCode: cleanRef
    });

    if (!refDoc) {
      throw new Error('[BarcodeReferenceService] Reference code not found or inaccessible in current tenant context.');
    }

    // Expiration check
    if (refDoc.expiresAt && refDoc.expiresAt < new Date()) {
      throw new Error('[BarcodeReferenceService] Reference code has expired.');
    }

    // RBAC validation by resource type
    const userRole = requestingUser?.role || 'receptionist';
    if (refDoc.resourceType === 'PATIENT' || refDoc.resourceType === 'WRISTBAND') {
      const allowed = ['receptionist', 'doctor', 'nurse', 'billing_cashier', 'hospital_admin', 'super_admin', 'saas_admin'];
      if (!allowed.includes(userRole)) {
        throw new Error(`[BarcodeReferenceService] Role '${userRole}' is not authorized to inspect patient references.`);
      }
    } else if (refDoc.resourceType === 'LAB_SAMPLE') {
      const allowed = ['lab_tech', 'lab_technician', 'lab', 'radiologist', 'doctor', 'nurse', 'hospital_admin', 'super_admin', 'saas_admin'];
      if (!allowed.includes(userRole)) {
        throw new Error(`[BarcodeReferenceService] Role '${userRole}' is not authorized to inspect lab references.`);
      }
    } else if (refDoc.resourceType === 'PHARMACY_ITEM') {
      const allowed = ['pharmacist', 'doctor', 'nurse', 'hospital_admin', 'super_admin', 'saas_admin'];
      if (!allowed.includes(userRole)) {
        throw new Error(`[BarcodeReferenceService] Role '${userRole}' is not authorized to inspect pharmacy references.`);
      }
    }

    // Fetch the underlying resource with strict tenant isolation
    let resourceData = null;
    switch (refDoc.resourceModel) {
      case 'Patient':
        resourceData = await Patient.findOne({ _id: refDoc.resourceId, tenant: tenantId })
          .select('uhid firstName lastName fullName gender age bloodGroup primaryBranch');
        break;
      case 'LabOrder':
        resourceData = await LabOrder.findOne({ _id: refDoc.resourceId, tenant: tenantId })
          .populate('patient', 'uhid firstName lastName fullName gender age');
        break;
      case 'Medicine':
        resourceData = await Medicine.findOne({ _id: refDoc.resourceId, tenant: tenantId })
          .select('name genericName strength unit category batchNumber stockQuantity');
        break;
      case 'Appointment':
        resourceData = await Appointment.findOne({ _id: refDoc.resourceId, tenant: tenantId })
          .populate('patient', 'uhid firstName lastName fullName')
          .populate('doctor', 'name');
        break;
      case 'Invoice':
        resourceData = await Invoice.findOne({ _id: refDoc.resourceId, tenant: tenantId })
          .select('invoiceNumber grandTotal paidAmount balanceDue status');
        break;
      default:
        resourceData = { _id: refDoc.resourceId, model: refDoc.resourceModel };
    }

    if (!resourceData) {
      throw new Error(`[BarcodeReferenceService] Linked ${refDoc.resourceModel} record not found in tenant.`);
    }

    // Audit log
    AuditLog.create({
      tenant: tenantId,
      user: requestingUser?._id,
      userName: requestingUser?.name || 'Scanner System',
      userRole: requestingUser?.role || 'staff',
      action: 'Scan / Resolve Barcode Reference',
      module: 'Auth / Security',
      entityId: refDoc.resourceId.toString(),
      entityType: refDoc.resourceModel,
      details: `Resolved ${refDoc.resourceType} reference '${cleanRef}' to ${refDoc.resourceModel} #${refDoc.resourceId}`,
      timestamp: new Date()
    }).catch(auditErr => console.warn('[BarcodeReferenceService AuditLog Warning]:', auditErr.message));

    return {
      success: true,
      referenceCode: refDoc.referenceCode,
      displayCode: refDoc.displayCode,
      resourceType: refDoc.resourceType,
      resourceModel: refDoc.resourceModel,
      metadata: refDoc.metadata,
      resource: resourceData
    };
  }
}

// Singleton instance
const barcodeReferenceService = new BarcodeReferenceService();

module.exports = barcodeReferenceService;
