const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

// @desc    Get medicines catalog & inventory
// @route   GET /api/v1/pharmacy/medicines
// @access  Private
exports.getMedicines = async (req, res, next) => {
  try {
    const { search, category, lowStockOnly } = req.query;
    const query = { tenant: req.tenantId };

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { genericName: regex }];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (lowStockOnly === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
    }

    const medicines = await Medicine.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new medicine master
// @route   POST /api/v1/pharmacy/medicines
// @access  Private
exports.createMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      unitPrice,
      stockQuantity,
      reorderLevel,
      batches,
      taxPercent
    } = req.body;

    const medicine = await Medicine.create({
      tenant: req.tenantId,
      branch: req.user.branch,
      name,
      genericName,
      category,
      dosageForm,
      strength,
      manufacturer,
      unitPrice,
      stockQuantity: stockQuantity || 0,
      reorderLevel: reorderLevel || 50,
      batches: batches || [],
      taxPercent: taxPercent || 12
    });

    res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update stock / add batch
// @route   PUT /api/v1/pharmacy/medicines/:id/stock
// @access  Private
exports.updateMedicineStock = async (req, res, next) => {
  try {
    const { batchNumber, expiryDate, quantity, purchaseRate, mrp } = req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    const qty = Number(quantity);
    medicine.stockQuantity += qty;
    medicine.batches.push({
      batchNumber,
      expiryDate: new Date(expiryDate),
      quantity: qty,
      purchaseRate: Number(purchaseRate) || medicine.unitPrice * 0.7,
      mrp: Number(mrp) || medicine.unitPrice
    });

    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Stock and batch successfully added',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Dispense prescription at POS & generate invoice
// @route   POST /api/v1/pharmacy/dispense
// @access  Private
exports.dispensePrescription = async (req, res, next) => {
  try {
    const { prescriptionId, patientId, items, paymentMethod, paymentMode } = req.body;

    let targetPatientId = patientId;
    let targetBranchId = req.branchId || req.user.branch;
    let targetPrescription = null;

    if (prescriptionId) {
      targetPrescription = await Prescription.findOne({ _id: prescriptionId, tenant: req.tenantId });
      if (targetPrescription) {
        const { verifyBranchAccess } = require('../middleware/authMiddleware');
        if (!verifyBranchAccess(req, targetPrescription.branch)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You do not have authorization to dispense prescriptions for another branch.'
          });
        }
        if (!targetPatientId) targetPatientId = targetPrescription.patient;
        if (!targetBranchId && targetPrescription.branch) targetBranchId = targetPrescription.branch;
      }
    }

    if (!targetBranchId) {
      const Branch = require('../models/Branch');
      const fallbackBranch = await Branch.findOne({ tenant: req.tenantId });
      targetBranchId = fallbackBranch?._id;
    }

    const invoiceItems = [];
    let subtotal = 0;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        let medicine = null;
        if (item.medicineId) {
          medicine = await Medicine.findOne({
            _id: item.medicineId,
            tenant: req.tenantId
          });
        }
        if (!medicine && item.medicineName) {
          const regex = new RegExp(item.medicineName.trim(), 'i');
          medicine = await Medicine.findOne({
            tenant: req.tenantId,
            $or: [{ name: regex }, { genericName: regex }]
          });
        }

        const qtyToDispense = Number(item.quantity) || 1;
        const unitPrice = medicine?.unitPrice || Number(item.unitPrice) || 10;
        const taxPercent = medicine?.taxPercent || 12;

        if (medicine) {
          medicine.stockQuantity = Math.max(0, medicine.stockQuantity - qtyToDispense);

          // Deduct from earliest expiring batch
          if (medicine.batches && medicine.batches.length > 0) {
            medicine.batches[0].quantity = Math.max(0, medicine.batches[0].quantity - qtyToDispense);
          }
          await medicine.save();
        }

        const lineTotal = unitPrice * qtyToDispense;
        subtotal += lineTotal;

        invoiceItems.push({
          description: `${medicine?.name || item.medicineName || 'Medicine'} (${medicine?.strength || ''}) - Qty: ${qtyToDispense}`,
          department: 'Pharmacy',
          serviceCategory: 'Pharmacy / Drugs',
          quantity: qtyToDispense,
          unitPrice,
          taxPercent,
          taxAmount: (lineTotal * taxPercent) / 100,
          totalAmount: lineTotal + (lineTotal * taxPercent) / 100
        });
      }
    }

    const totalTax = invoiceItems.reduce((acc, curr) => acc + curr.taxAmount, 0);
    const grandTotal = Math.round(subtotal + totalTax);

    // Create Invoice
    const count = await Invoice.countDocuments({ tenant: req.tenantId });
    const invSeq = String(count + 1).padStart(4, '0');
    const invoiceNumber = `PHARM-INV-${new Date().getFullYear()}-${invSeq}`;

    const invoice = await Invoice.create({
      tenant: req.tenantId,
      branch: targetBranchId,
      patient: targetPatientId,
      invoiceNumber,
      billingType: 'Pharmacy POS',
      items: invoiceItems,
      subtotal,
      totalTax,
      grandTotal,
      paidAmount: grandTotal,
      balanceDue: 0,
      payerType: 'Self-Pay (Cash / UPI / Card)',
      status: 'Fully Paid',
      generatedBy: req.user._id
    });

    // Create Payment record
    const payCount = await Payment.countDocuments({ tenant: req.tenantId });
    const recSeq = String(payCount + 1).padStart(4, '0');
    const receiptNumber = `REC-PHARM-${new Date().getFullYear()}-${recSeq}`;

    const selectedPaymentMethod = paymentMethod || paymentMode || 'Cash';

    const payment = await Payment.create({
      tenant: req.tenantId,
      branch: targetBranchId,
      receiptNumber,
      invoice: invoice._id,
      patient: targetPatientId,
      amountPaid: grandTotal,
      paymentMethod: selectedPaymentMethod,
      paymentType: 'Pharmacy Instant',
      collectedBy: req.user._id,
      status: 'Completed'
    });

    // Update prescription if linked
    if (targetPrescription) {
      targetPrescription.medications.forEach(m => {
        m.dispensedStatus = 'Fully Dispensed';
      });
      await targetPrescription.save();
    }

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Dispense Pharmacy POS',
      module: 'Pharmacy',
      entityId: invoice._id.toString(),
      entityType: 'Invoice',
      details: `Dispensed ${invoiceItems.length} drugs. Total: ₹${grandTotal} (${selectedPaymentMethod})`
    });

    res.status(200).json({
      success: true,
      message: 'Prescription successfully dispensed and billed',
      invoice,
      payment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get prescriptions for pharmacy queue / POS
// @route   GET /api/v1/pharmacy/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res, next) => {
  try {
    const { status, patientId } = req.query;
    const query = { tenant: req.tenantId };

    if (req.branchId) {
      query.$or = [{ branch: req.branchId }, { branch: null }, { branch: { $exists: false } }];
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (patientId) {
      query.patient = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'fullName uhid phone gender age')
      .populate('doctor', 'name department')
      .populate('encounter')
      .sort({ createdAt: -1 });

    const formatted = prescriptions.map(rx => {
      const isAllDispensed = rx.medications && rx.medications.length > 0 && rx.medications.every(m => m.dispensedStatus === 'Fully Dispensed');
      const isPartiallyDispensed = rx.medications && rx.medications.some(m => m.dispensedStatus === 'Partially Dispensed' || m.dispensedStatus === 'Fully Dispensed');
      const pharmacyStatus = isAllDispensed ? 'dispensed' : isPartiallyDispensed ? 'partially_dispensed' : 'pending';
      const rxObj = rx.toObject();
      return {
        ...rxObj,
        medicines: rxObj.medications, // alias for frontend compatibility
        pharmacyStatus
      };
    });

    const filtered = status && status !== 'all'
      ? formatted.filter(p => p.pharmacyStatus === status)
      : formatted;

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    next(err);
  }
};
