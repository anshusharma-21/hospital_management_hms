const Patient = require('../../models/Patient');
const User = require('../../models/User');
const Medicine = require('../../models/Medicine');
const Bed = require('../../models/Bed');
const AuditLog = require('../../models/AuditLog');

class BulkImportService {
  /**
   * Preview and validate bulk import rows prior to committing to the database
   */
  async previewImport({ tenantId, branchId, category, rows = [] }) {
    if (!tenantId) {
      throw new Error('[BulkImportService] tenantId is required for tenant isolation.');
    }
    if (!category) {
      throw new Error('[BulkImportService] category is required (patients, medicines, beds, staff, doctors).');
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        duplicateRows: []
      };
    }

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];

    // Pre-fetch existing identifiers in tenant to detect duplicates accurately
    let existingIdentifiers = new Set();
    if (category === 'patients') {
      const existing = await Patient.find({ tenant: tenantId }).select('phone uhid').lean();
      existing.forEach(p => {
        if (p.phone) existingIdentifiers.add(p.phone);
        if (p.uhid) existingIdentifiers.add(p.uhid);
      });
    } else if (category === 'medicines') {
      const existing = await Medicine.find({ tenant: tenantId }).select('name').lean();
      existing.forEach(m => {
        if (m.name) existingIdentifiers.add(m.name.toLowerCase().trim());
      });
    } else if (category === 'beds') {
      const existing = await Bed.find({ tenant: tenantId }).select('bedNumber').lean();
      existing.forEach(b => {
        if (b.bedNumber) existingIdentifiers.add(b.bedNumber.toUpperCase().trim());
      });
    } else if (category === 'staff' || category === 'doctors') {
      const existing = await User.find({ tenant: tenantId }).select('email').lean();
      existing.forEach(u => {
        if (u.email) existingIdentifiers.add(u.email.toLowerCase().trim());
      });
    }

    const seenInBatch = new Set();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const errors = [];

      switch (category) {
        case 'patients': {
          if (!row.firstName || !row.firstName.trim()) errors.push('firstName is required');
          if (!row.phone || !String(row.phone).trim()) errors.push('phone is required');
          const phone = String(row.phone || '').trim();

          if (existingIdentifiers.has(phone) || seenInBatch.has(phone)) {
            duplicateRows.push({
              rowNumber: rowNum,
              rowData: row,
              matchedOn: `Phone '${phone}' already registered in tenant`
            });
            return;
          }
          seenInBatch.add(phone);
          break;
        }

        case 'medicines': {
          if (!row.name || !row.name.trim()) errors.push('name is required');
          if (row.mrp === undefined || isNaN(Number(row.mrp))) errors.push('valid mrp is required');
          const normName = (row.name || '').toLowerCase().trim();

          if (existingIdentifiers.has(normName) || seenInBatch.has(normName)) {
            duplicateRows.push({
              rowNumber: rowNum,
              rowData: row,
              matchedOn: `Medicine '${row.name}' already exists in inventory`
            });
            return;
          }
          seenInBatch.add(normName);
          break;
        }

        case 'beds': {
          if (!row.bedNumber || !row.bedNumber.trim()) errors.push('bedNumber is required');
          if (!row.ward || !row.ward.trim()) errors.push('ward name is required');
          const normBed = (row.bedNumber || '').toUpperCase().trim();

          if (existingIdentifiers.has(normBed) || seenInBatch.has(normBed)) {
            duplicateRows.push({
              rowNumber: rowNum,
              rowData: row,
              matchedOn: `Bed Number '${row.bedNumber}' already exists`
            });
            return;
          }
          seenInBatch.add(normBed);
          break;
        }

        case 'staff':
        case 'doctors': {
          if (!row.name || !row.name.trim()) errors.push('name is required');
          if (!row.email || !row.email.trim()) errors.push('email is required');
          const normEmail = (row.email || '').toLowerCase().trim();

          if (existingIdentifiers.has(normEmail) || seenInBatch.has(normEmail)) {
            duplicateRows.push({
              rowNumber: rowNum,
              rowData: row,
              matchedOn: `Email '${row.email}' already registered`
            });
            return;
          }
          seenInBatch.add(normEmail);
          break;
        }

        default:
          errors.push(`Unsupported import category: ${category}`);
      }

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber: rowNum,
          rowData: row,
          errors
        });
      } else {
        validRows.push({
          rowNumber: rowNum,
          rowData: row
        });
      }
    });

    return {
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicateRows
    };
  }

  /**
   * Commit validated import rows into MongoDB with tenant isolation and audit logging
   */
  async commitImport({ tenantId, branchId, category, validRows = [], importedBy }) {
    if (!tenantId) {
      throw new Error('[BulkImportService] tenantId is required for tenant isolation.');
    }
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return { success: true, count: 0, inserted: [] };
    }

    const insertedRecords = [];

    try {
      if (category === 'patients') {
        const docs = validRows.map((r, i) => {
          const item = r.rowData || r;
          const uhidNumber = Date.now() + i;
          return {
            tenant: tenantId,
            primaryBranch: branchId || undefined,
            uhid: item.uhid || `HV-IMP-${uhidNumber}`,
            firstName: item.firstName,
            lastName: item.lastName || '',
            phone: String(item.phone),
            gender: item.gender || 'Other',
            age: Number(item.age) || 30,
            bloodGroup: item.bloodGroup || 'Unknown'
          };
        });
        const created = await Patient.insertMany(docs, { ordered: true });
        insertedRecords.push(...created);
      } else if (category === 'medicines') {
        const docs = validRows.map(r => {
          const item = r.rowData || r;
          return {
            tenant: tenantId,
            branch: branchId || undefined,
            name: item.name,
            genericName: item.genericName || item.name,
            dosageForm: item.dosageForm || 'Tablet',
            mrp: Number(item.mrp) || 0,
            costPrice: Number(item.costPrice) || 0,
            stockQuantity: Number(item.stockQuantity) || 100,
            reorderLevel: Number(item.reorderLevel) || 20
          };
        });
        const created = await Medicine.insertMany(docs, { ordered: true });
        insertedRecords.push(...created);
      } else if (category === 'beds') {
        const docs = validRows.map(r => {
          const item = r.rowData || r;
          return {
            tenant: tenantId,
            branch: branchId || undefined,
            bedNumber: item.bedNumber,
            ward: item.ward,
            roomType: item.roomType || 'General Ward',
            dailyRate: Number(item.dailyRate) || 1000,
            status: 'Available'
          };
        });
        const created = await Bed.insertMany(docs, { ordered: true });
        insertedRecords.push(...created);
      } else {
        throw new Error(`[BulkImportService] Category '${category}' commit handler not implemented.`);
      }

      // Record Audit Trail
      await AuditLog.create({
        tenant: tenantId,
        user: importedBy?._id || undefined,
        action: 'Bulk Data Import',
        module: 'Settings & Config',
        entityType: category.toUpperCase(),
        entityId: insertedRecords[0]?._id ? insertedRecords[0]._id.toString() : 'BATCH',
        details: `Successfully committed bulk import of ${insertedRecords.length} records for category '${category}'`,
        timestamp: new Date()
      });

      return {
        success: true,
        count: insertedRecords.length,
        inserted: insertedRecords
      };
    } catch (err) {
      // Compensating cleanup if batch insert partially succeeded
      if (insertedRecords.length > 0) {
        const insertedIds = insertedRecords.map(rec => rec._id);
        if (category === 'patients') await Patient.deleteMany({ _id: { $in: insertedIds } });
        if (category === 'medicines') await Medicine.deleteMany({ _id: { $in: insertedIds } });
        if (category === 'beds') await Bed.deleteMany({ _id: { $in: insertedIds } });
      }
      throw new Error(`[BulkImportService] Commit failed: ${err.message}`);
    }
  }
}

module.exports = new BulkImportService();
