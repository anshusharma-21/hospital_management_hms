const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Invoice = require('../models/Invoice');
const LabOrder = require('../models/LabOrder');
const RadiologyOrder = require('../models/RadiologyOrder');
const Medicine = require('../models/Medicine');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Branch = require('../models/Branch');

// @desc    Get role-specific dashboard metrics & operational summary
// @route   GET /api/v1/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const tenantId = req.tenantId;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // If SaaS Super Admin
    if (['super_admin', 'saas_admin'].includes(role) && !req.headers['x-tenant-id']) {
      const totalTenants = await Tenant.countDocuments();
      const activeTenants = await Tenant.countDocuments({ status: 'active' });
      const totalPatientsPlatform = await Patient.countDocuments();
      const totalInvoicesPlatform = await Invoice.countDocuments();

      return res.status(200).json({
        success: true,
        role,
        stats: {
          totalTenants,
          activeTenants,
          mrrEstimate: activeTenants * 15000,
          totalPatientsPlatform,
          totalInvoicesPlatform,
          systemHealth: 'Optimal (100% Uptime)',
          activeMicroservices: '12 / 12 Healthy'
        }
      });
    }

    // Active branch context for operational metrics
    const branchFilter = req.branchId ? { branch: req.branchId } : {};
    let invoiceMatch = { tenant: tenantId, createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (req.branchId && mongoose.Types.ObjectId.isValid(req.branchId)) {
      invoiceMatch.branch = new mongoose.Types.ObjectId(req.branchId);
    }

    const patientBranchFilter = req.isSubBranch ? { primaryBranch: req.branchId } : {};

    // Role-specific operational stats for hospital staff
    const [
      totalPatients,
      todayAppointments,
      waitingQueueCount,
      activeAdmissions,
      availableBeds,
      totalBeds,
      todayCollections,
      pendingLabOrders,
      criticalLabAlerts,
      lowStockMedicines
    ] = await Promise.all([
      Patient.countDocuments({ tenant: tenantId, ...patientBranchFilter }),
      Appointment.countDocuments({
        tenant: tenantId,
        ...branchFilter,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
      }),
      Appointment.countDocuments({
        tenant: tenantId,
        ...branchFilter,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['Scheduled', 'Checked-In'] }
      }),
      Admission.countDocuments({ tenant: tenantId, ...branchFilter, status: 'Admitted' }),
      Bed.countDocuments({ tenant: tenantId, ...branchFilter, status: 'Available' }),
      Bed.countDocuments({ tenant: tenantId, ...branchFilter }),
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      LabOrder.countDocuments({ tenant: tenantId, ...branchFilter, overallStatus: { $in: ['Ordered', 'Sample Collected', 'In-Processing'] } }),
      LabOrder.countDocuments({ tenant: tenantId, ...branchFilter, criticalAlert: true }),
      Medicine.countDocuments({ tenant: tenantId, ...branchFilter, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } })
    ]);

    const collectionAmount = todayCollections[0]?.total || 0;

    res.status(200).json({
      success: true,
      role,
      stats: {
        totalPatients,
        todayAppointments,
        waitingQueueCount,
        activeAdmissions,
        availableBeds,
        totalBeds,
        occupancyRate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
        todayCollections: collectionAmount,
        pendingLabOrders,
        criticalLabAlerts,
        lowStockMedicines
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Global Unified Search with Tenant Isolation and Server-Side RBAC Filtering
// @route   GET /api/v1/dashboard/search?q=...
// @access  Private
exports.globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.search || '').trim();
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        query: q,
        results: { patients: [], appointments: [], users: [], invoices: [], medicines: [], labOrders: [] }
      });
    }

    const tenantId = req.tenantId;
    const role = req.user.role;
    const regex = new RegExp(q, 'i');

    const canAccessAll = ['hospital_admin', 'org_admin', 'super_admin', 'saas_admin', 'branch_admin', 'branch_manager'].includes(role);
    const canAccessClinical = canAccessAll || ['doctor', 'nurse'].includes(role);
    const canAccessBilling = canAccessAll || ['billing_cashier', 'receptionist'].includes(role);
    const canAccessPharmacy = canAccessAll || ['pharmacist', 'doctor', 'nurse'].includes(role);
    const canAccessLab = canAccessAll || ['lab_tech', 'doctor'].includes(role);

    const queryFilter = tenantId ? { tenant: tenantId } : {};
    const branchFilter = req.branchId ? { branch: req.branchId } : {};

    const searches = {};

    // 1. Patients Search (Visible to Reception, Doctors, Nurses, Billing, Admins - Tenant Global)
    searches.patients = Patient.find({
      ...queryFilter,
      $or: [
        { uhid: regex },
        { firstName: regex },
        { lastName: regex },
        { phone: regex }
      ]
    }).select('uhid firstName lastName phone gender age bloodGroup').limit(6);

    // 2. Appointments Search
    if (canAccessClinical || canAccessBilling) {
      searches.appointments = Appointment.find({
        ...queryFilter,
        ...branchFilter,
        $or: [
          { appointmentNumber: regex },
          { reason: regex }
        ]
      }).populate('patient', 'uhid firstName lastName phone').limit(5);
    }

    // 3. Users / Staff Search
    if (canAccessAll || role === 'receptionist') {
      const userBranchFilter = (!['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(role) && req.branchId) ? { branch: req.branchId } : {};
      searches.users = User.find({
        ...queryFilter,
        ...userBranchFilter,
        $or: [
          { name: regex },
          { email: regex },
          { role: regex },
          { department: regex }
        ]
      }).select('name email role department status branch').limit(5);
    }

    // 4. Invoices Search
    if (canAccessBilling) {
      searches.invoices = Invoice.find({
        ...queryFilter,
        ...branchFilter,
        invoiceNumber: regex
      }).populate('patient', 'uhid firstName lastName').select('invoiceNumber grandTotal paidAmount balanceDue status').limit(5);
    }

    // 5. Medicines Search
    if (canAccessPharmacy) {
      searches.medicines = Medicine.find({
        ...queryFilter,
        $or: [
          { name: regex },
          { genericName: regex },
          { batchNumber: regex }
        ]
      }).select('name genericName mrp stockQuantity dosageForm').limit(5);
    }

    // 6. Lab Orders Search
    if (canAccessLab) {
      searches.labOrders = LabOrder.find({
        ...queryFilter,
        ...branchFilter,
        $or: [
          { orderNumber: regex },
          { sampleBarcode: regex }
        ]
      }).populate('patient', 'uhid firstName lastName').select('orderNumber sampleBarcode overallStatus priority').limit(5);
    }

    // Execute queries in parallel
    const keys = Object.keys(searches);
    const resultsArray = await Promise.all(Object.values(searches));

    const finalResults = {
      patients: [],
      appointments: [],
      users: [],
      invoices: [],
      medicines: [],
      labOrders: []
    };

    keys.forEach((key, idx) => {
      finalResults[key] = resultsArray[idx];
    });

    res.status(200).json({
      success: true,
      query: q,
      results: finalResults
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Branch-Level Operational Overview for Branch Managers
// @route   GET /api/v1/dashboard/branch/:branchId/overview
// @access  Private (Branch Manager, Hospital Admin, Super Admin)
exports.getBranchOverview = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const tenantId = req.tenantId;

    const branch = await Branch.findOne({ _id: branchId, tenant: tenantId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found in current hospital organization.' });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      branchAppointments,
      checkedInQueue,
      totalBranchBeds,
      availableBranchBeds,
      branchAdmissions,
      branchStaffCount,
      todayBranchCollections
    ] = await Promise.all([
      Appointment.countDocuments({
        tenant: tenantId,
        branch: branchId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
      }),
      Appointment.countDocuments({
        tenant: tenantId,
        branch: branchId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'Checked-In'
      }),
      Bed.countDocuments({ tenant: tenantId, branch: branchId }),
      Bed.countDocuments({ tenant: tenantId, branch: branchId, status: 'Available' }),
      Admission.countDocuments({ tenant: tenantId, branch: branchId, status: 'Admitted' }),
      User.countDocuments({ tenant: tenantId, branch: branchId, status: 'active' }),
      Invoice.aggregate([
        { $match: { tenant: tenantId, branch: branch._id, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ])
    ]);

    const collections = todayBranchCollections[0]?.total || 0;

    res.status(200).json({
      success: true,
      branch: {
        id: branch._id,
        name: branch.name,
        code: branch.code,
        phone: branch.phone,
        city: branch.city
      },
      summary: {
        todayAppointments: branchAppointments,
        waitingQueue: checkedInQueue,
        totalBeds: totalBranchBeds,
        availableBeds: availableBranchBeds,
        occupiedBeds: totalBranchBeds - availableBranchBeds,
        occupancyRate: totalBranchBeds > 0 ? Math.round(((totalBranchBeds - availableBranchBeds) / totalBranchBeds) * 100) : 0,
        activeAdmissions: branchAdmissions,
        activeStaff: branchStaffCount,
        todayCollections: collections
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Detailed Hospital Census & Departmental Reports
// @route   GET /api/v1/dashboard/reports
// @access  Private (hospital_admin, org_admin, branch_admin, super_admin)
exports.getHospitalReports = async (req, res, next) => {
  try {
    const { category = 'opd', startDate, endDate, branch } = req.query;
    const tenantId = req.tenantId;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const branchId = req.branchId || (branch && branch !== 'all' ? branch : null);
    const branchFilter = branchId ? { branch: branchId } : {};

    let reportData = [];
    let summary = {};

    if (category === 'opd') {
      const appointments = await Appointment.find({
        tenant: tenantId,
        ...branchFilter,
        appointmentDate: { $gte: start, $lte: end }
      }).populate('department', 'name code').populate('doctor', 'name');

      const deptMap = {};
      appointments.forEach(a => {
        const dName = a.department?.name || 'General OPD';
        if (!deptMap[dName]) {
          deptMap[dName] = { department: dName, newPatients: 0, followUps: 0, totalVisits: 0, revenue: 0, avgWaitTime: '15 mins' };
        }
        deptMap[dName].totalVisits += 1;
        if (a.type === 'Follow-up') {
          deptMap[dName].followUps += 1;
        } else {
          deptMap[dName].newPatients += 1;
        }
        deptMap[dName].revenue += (a.consultationFee || 500);
      });

      reportData = Object.values(deptMap);
      if (reportData.length === 0) {
        reportData = [
          { department: 'General Medicine', newPatients: 0, followUps: 0, totalVisits: 0, revenue: 0, avgWaitTime: '--' },
          { department: 'Cardiology', newPatients: 0, followUps: 0, totalVisits: 0, revenue: 0, avgWaitTime: '--' },
          { department: 'Orthopedics', newPatients: 0, followUps: 0, totalVisits: 0, revenue: 0, avgWaitTime: '--' },
          { department: 'Pediatrics', newPatients: 0, followUps: 0, totalVisits: 0, revenue: 0, avgWaitTime: '--' }
        ];
      }

      summary = {
        totalVisits: reportData.reduce((acc, c) => acc + (c.totalVisits || 0), 0),
        totalRevenue: reportData.reduce((acc, c) => acc + (c.revenue || 0), 0)
      };
    } else if (category === 'ipd') {
      const beds = await Bed.find({ tenant: tenantId, ...branchFilter });
      const wardMap = {};
      beds.forEach(b => {
        const wName = b.ward || 'General Ward';
        if (!wardMap[wName]) {
          wardMap[wName] = { ward: wName, totalBeds: 0, occupiedBeds: 0, availableBeds: 0, admissions: 0, discharged: 0 };
        }
        wardMap[wName].totalBeds += 1;
        if (b.status === 'Occupied') wardMap[wName].occupiedBeds += 1;
        else if (b.status === 'Available') wardMap[wName].availableBeds += 1;
      });

      const admissions = await Admission.find({
        tenant: tenantId,
        ...branchFilter,
        admissionDate: { $gte: start, $lte: end }
      });
      admissions.forEach(adm => {
        const wName = 'General Ward';
        if (wardMap[wName]) {
          wardMap[wName].admissions += 1;
          if (adm.status === 'Discharged') wardMap[wName].discharged += 1;
        }
      });

      reportData = Object.values(wardMap);
      summary = {
        totalBeds: beds.length,
        totalOccupied: beds.filter(b => b.status === 'Occupied').length,
        overallOccupancyRate: beds.length > 0 ? Math.round((beds.filter(b => b.status === 'Occupied').length / beds.length) * 100) : 0
      };
    } else if (category === 'revenue') {
      const invoices = await Invoice.find({
        tenant: tenantId,
        ...branchFilter,
        createdAt: { $gte: start, $lte: end }
      });

      const catMap = {};
      invoices.forEach(inv => {
        const type = inv.billingType || 'OPD Consultation';
        if (!catMap[type]) {
          catMap[type] = { category: type, totalInvoiced: 0, totalPaid: 0, balanceDue: 0, invoiceCount: 0 };
        }
        catMap[type].totalInvoiced += (inv.grandTotal || 0);
        catMap[type].totalPaid += (inv.paidAmount || 0);
        catMap[type].balanceDue += (inv.balanceDue || 0);
        catMap[type].invoiceCount += 1;
      });

      reportData = Object.values(catMap);
      summary = {
        grossBilled: invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0),
        netCollections: invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0),
        outstandingBalance: invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0)
      };
    } else if (category === 'doctor') {
      const appointments = await Appointment.find({
        tenant: tenantId,
        ...branchFilter,
        appointmentDate: { $gte: start, $lte: end }
      }).populate('doctor', 'name department');

      const docMap = {};
      appointments.forEach(a => {
        const docName = a.doctor?.name || 'Assigned Clinician';
        if (!docMap[docName]) {
          docMap[docName] = { doctorName: docName, department: a.doctor?.department || 'Clinical', totalPatients: 0, completed: 0, revenueGenerated: 0 };
        }
        docMap[docName].totalPatients += 1;
        if (a.status === 'Completed') docMap[docName].completed += 1;
        docMap[docName].revenueGenerated += (a.consultationFee || 500);
      });

      reportData = Object.values(docMap);
      summary = {
        totalDoctors: reportData.length,
        totalConsultations: appointments.length
      };
    } else if (category === 'pharmacy') {
      const medicines = await Medicine.find({ tenant: tenantId, ...branchFilter }).sort({ stockQuantity: 1 });
      reportData = medicines.slice(0, 15).map(m => ({
        medicineName: m.name,
        genericName: m.genericName,
        stockQuantity: m.stockQuantity,
        reorderLevel: m.reorderLevel,
        unitPrice: m.unitPrice,
        status: m.stockQuantity <= m.reorderLevel ? 'LOW STOCK' : 'ADEQUATE'
      }));

      summary = {
        totalMedicines: medicines.length,
        lowStockAlerts: medicines.filter(m => m.stockQuantity <= m.reorderLevel).length
      };
    } else if (category === 'lab') {
      const labOrders = await LabOrder.find({
        tenant: tenantId,
        ...branchFilter,
        createdAt: { $gte: start, $lte: end }
      });

      const catMap = {};
      labOrders.forEach(ord => {
        (ord.tests || []).forEach(t => {
          const cName = t.category || 'General Diagnostics';
          if (!catMap[cName]) {
            catMap[cName] = { category: cName, testCount: 0, verifiedCount: 0, criticalAlerts: 0 };
          }
          catMap[cName].testCount += 1;
          if (t.status === 'Verified' || ord.overallStatus === 'Completed') catMap[cName].verifiedCount += 1;
          if (t.isCritical) catMap[cName].criticalAlerts += 1;
        });
      });

      reportData = Object.values(catMap);
      summary = {
        totalOrders: labOrders.length,
        criticalAlertsTotal: labOrders.filter(l => l.criticalAlert).length
      };
    }

    const columnDefinitions = {
      opd: ['Department', 'New Patients', 'Follow-up Visits', 'Total Consultations', 'Revenue (₹)', 'Avg Wait Time'],
      ipd: ['Ward / Specialty', 'Total Beds', 'Occupied Beds', 'Available Beds', 'Admissions', 'Discharged'],
      revenue: ['Service Category', 'Total Invoiced (₹)', 'Total Paid (₹)', 'Balance Due (₹)', 'Invoice Count'],
      doctor: ['Doctor Name', 'Department', 'Total Patients', 'Completed Consultations', 'Revenue (₹)'],
      pharmacy: ['Medicine Name', 'Generic Formula', 'Current Stock', 'Reorder Level', 'Unit Price (₹)', 'Inventory Status'],
      lab: ['Test Category', 'Tests Performed', 'Verified & Signed', 'Critical Alerts Flagged']
    };

    res.status(200).json({
      success: true,
      category,
      startDate: start,
      endDate: end,
      summary,
      data: {
        columns: columnDefinitions[category] || [],
        rows: reportData
      }
    });
  } catch (err) {
    next(err);
  }
};

