const Tenant = require('../../models/Tenant');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const Encounter = require('../../models/Encounter');
const Invoice = require('../../models/Invoice');
const AuditLog = require('../../models/AuditLog');
const crypto = require('crypto');

class TenantLifecycleService {
  /**
   * Transition tenant into offboarding lifecycle with configurable grace and retention periods
   */
  async initiateOffboarding({ tenantId, initiatedBy, reason, gracePeriodDays = 3, retentionMonths = 12 }) {
    if (!tenantId) {
      throw new Error('[TenantLifecycleService] tenantId is required.');
    }
    if (!initiatedBy || !['super_admin', 'saas_admin'].includes(initiatedBy.role)) {
      throw new Error('[TenantLifecycleService] Offboarding can only be initiated by SaaS Super Admin.');
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`[TenantLifecycleService] Tenant with ID '${tenantId}' not found.`);
    }

    const now = new Date();
    const graceEndsAt = new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
    const retentionEndsAt = new Date(now.getTime() + retentionMonths * 30 * 24 * 60 * 60 * 1000);

    tenant.status = 'grace_period';
    tenant.subscription = tenant.subscription || {};
    tenant.subscription.status = 'grace_period';
    tenant.offboardingMetadata = {
      initiatedAt: now,
      gracePeriodEndsAt: graceEndsAt,
      retentionEndsAt: retentionEndsAt,
      deletionEligibleAt: retentionEndsAt,
      reason: reason || 'Contract expiration or voluntary offboarding',
      initiatedBy: initiatedBy._id
    };

    await tenant.save();

    await AuditLog.create({
      tenant: tenantId,
      user: initiatedBy._id,
      action: 'Tenant Offboarding Initiated',
      module: 'SaaS Platform',
      entityType: 'Tenant',
      entityId: tenantId.toString(),
      details: `Initiated offboarding for tenant '${tenant.name}': Grace ends ${graceEndsAt.toISOString()}, Retention ends ${retentionEndsAt.toISOString()}`,
      timestamp: now
    });

    return {
      success: true,
      status: tenant.status,
      offboardingMetadata: tenant.offboardingMetadata
    };
  }

  /**
   * Set tenant to read-only status after grace period expires
   */
  async setReadOnly({ tenantId, authorizedBy }) {
    if (!tenantId) throw new Error('[TenantLifecycleService] tenantId is required.');
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error(`[TenantLifecycleService] Tenant '${tenantId}' not found.`);

    tenant.status = 'read_only';
    tenant.subscription.status = 'read_only';
    await tenant.save();

    await AuditLog.create({
      tenant: tenantId,
      user: authorizedBy?._id || undefined,
      action: 'Tenant Status Changed: Read-Only',
      module: 'SaaS Platform',
      entityType: 'Tenant',
      entityId: tenantId.toString(),
      details: `Tenant '${tenant.name}' placed into read-only operational state.`,
      timestamp: new Date()
    });

    return { success: true, status: 'read_only' };
  }

  /**
   * Export all tenant data prior to archival or purge
   */
  async exportTenantData({ tenantId, requestedBy }) {
    if (!tenantId) throw new Error('[TenantLifecycleService] tenantId is required.');
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) throw new Error(`[TenantLifecycleService] Tenant '${tenantId}' not found.`);

    const [patients, appointments, encounters, invoices] = await Promise.all([
      Patient.find({ tenant: tenantId }).select('-__v').lean(),
      Appointment.find({ tenant: tenantId }).select('-__v').lean(),
      Encounter.find({ tenant: tenantId }).select('-__v').lean(),
      Invoice.find({ tenant: tenantId }).select('-__v').lean()
    ]);

    const exportBundle = {
      tenantMetadata: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        exportedAt: new Date().toISOString()
      },
      counts: {
        patients: patients.length,
        appointments: appointments.length,
        encounters: encounters.length,
        invoices: invoices.length
      },
      records: {
        patients,
        appointments,
        encounters,
        invoices
      }
    };

    const payloadString = JSON.stringify(exportBundle);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

    await AuditLog.create({
      tenant: tenantId,
      user: requestedBy?._id || undefined,
      action: 'Tenant Full Data Export',
      module: 'SaaS Platform',
      entityType: 'Tenant',
      entityId: tenantId.toString(),
      details: `Exported comprehensive data bundle for tenant '${tenant.name}' (SHA256: ${checksum})`,
      timestamp: new Date()
    });

    return {
      success: true,
      checksum,
      bundle: exportBundle
    };
  }

  /**
   * Irreversible tenant purge: strictly tenant-isolated and only after eligibility verification
   */
  async purgeTenantData({ tenantId, authorizedBy, confirmationToken }) {
    if (!tenantId) throw new Error('[TenantLifecycleService] tenantId is required.');
    if (!authorizedBy || authorizedBy.role !== 'super_admin') {
      throw new Error('[TenantLifecycleService] Unauthorized: Only SaaS Super Admin can execute tenant purge.');
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error(`[TenantLifecycleService] Tenant '${tenantId}' not found.`);

    // Token must match slug or explicit 'CONFIRM_PURGE_<slug>'
    const expectedToken = `CONFIRM_PURGE_${tenant.slug.toUpperCase()}`;
    if (confirmationToken !== expectedToken) {
      throw new Error(`[TenantLifecycleService] Invalid confirmation token. Expected: '${expectedToken}'`);
    }

    // Verify deletion eligibility or explicit super_admin override
    const isEligible = tenant.status === 'deletion_eligible' || tenant.status === 'read_only' || tenant.status === 'grace_period';
    if (!isEligible) {
      throw new Error(`[TenantLifecycleService] Tenant is currently in '${tenant.status}' state and is not eligible for deletion.`);
    }

    // Execute strictly tenant-isolated delete operations
    const [deletedPatients, deletedAppts, deletedEncounters, deletedInvoices] = await Promise.all([
      Patient.deleteMany({ tenant: tenantId }),
      Appointment.deleteMany({ tenant: tenantId }),
      Encounter.deleteMany({ tenant: tenantId }),
      Invoice.deleteMany({ tenant: tenantId })
    ]);

    tenant.status = 'offboarded';
    await tenant.save();

    await AuditLog.create({
      tenant: tenantId,
      user: authorizedBy._id,
      action: 'Tenant Data Purged (Irreversible)',
      module: 'SaaS Platform',
      entityType: 'Tenant',
      entityId: tenantId.toString(),
      details: `Purged tenant records: ${deletedPatients.deletedCount} patients, ${deletedAppts.deletedCount} appts, ${deletedEncounters.deletedCount} encounters, ${deletedInvoices.deletedCount} invoices`,
      timestamp: new Date()
    });

    return {
      success: true,
      tenantId,
      purged: {
        patients: deletedPatients.deletedCount,
        appointments: deletedAppts.deletedCount,
        encounters: deletedEncounters.deletedCount,
        invoices: deletedInvoices.deletedCount
      }
    };
  }
}

module.exports = new TenantLifecycleService();
