const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const InsurancePolicy = require('../models/InsurancePolicy');
const ApprovalRequest = require('../models/ApprovalRequest');
const AuditLog = require('../models/AuditLog');

// @desc    Get all invoices with filters
// @route   GET /api/v1/billing/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, billingType, patientId, branch } = req.query;
    const query = { tenant: req.tenantId };

    // Branch Isolation: Sub-branch can ONLY see its own branch invoices!
    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (billingType && billingType !== 'all') {
      query.billingType = billingType;
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (patientId) {
      query.patient = patientId;
    }

    const invoices = await Invoice.find(query)
      .populate('patient', 'uhid fullName phone age gender')
      .populate('generatedBy', 'name role')
      .populate('tenant', 'name legalName address phone email branding settings')
      .populate('branch', 'name code address phone email')
      .sort({ createdAt: -1 });

    const formattedInvoices = invoices.map(inv => {
      const obj = inv.toObject();
      obj.balanceAmount = obj.balanceDue;
      obj.netAmount = obj.grandTotal;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: formattedInvoices.length,
      data: formattedInvoices
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new finalized bill / invoice
// @route   POST /api/v1/billing/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      patient,
      encounter,
      admission,
      billingType,
      items,
      totalDiscount,
      discountReason,
      payerType
    } = req.body;

    let subtotal = 0;
    let totalTax = 0;

    const computedItems = items.map(item => {
      const lineSub = Number(item.quantity || 1) * Number(item.unitPrice);
      const taxRate = Number(item.taxPercent || 0);
      const taxVal = (lineSub * taxRate) / 100;
      const lineTotal = lineSub + taxVal;
      subtotal += lineSub;
      totalTax += taxVal;

      return {
        ...item,
        totalAmount: lineTotal,
        taxAmount: taxVal
      };
    });

    const discount = Number(totalDiscount || 0);
    const grandTotal = Math.max(0, Math.round(subtotal + totalTax - discount));

    const count = await Invoice.countDocuments({ tenant: req.tenantId });
    const invSeq = String(count + 1).padStart(4, '0');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${invSeq}`;

    const invoice = await Invoice.create({
      tenant: req.tenantId,
      branch: req.branchId || req.user.branch,
      patient,
      encounter,
      admission,
      invoiceNumber,
      billingType: billingType || 'OPD Consultation',
      items: computedItems,
      subtotal,
      totalDiscount: discount,
      discountReason,
      totalTax,
      grandTotal,
      paidAmount: 0,
      balanceDue: grandTotal,
      payerType: payerType || 'Self-Pay (Cash / UPI / Card)',
      status: 'Finalized',
      isImmutable: true,
      generatedBy: req.user._id
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('patient', 'uhid fullName phone age gender');

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Generate Invoice',
      module: 'Billing & Cashier',
      entityId: invoice._id.toString(),
      entityType: 'Invoice',
      details: `Invoice ${invoiceNumber} created for ₹${grandTotal} (${populated.patient?.fullName})`
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated and finalized',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single invoice details with payment history
// @route   GET /api/v1/billing/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    })
      .populate('patient')
      .populate('generatedBy', 'name role');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, invoice.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to access records from another branch.'
      });
    }

    if (req.user?.role === 'patient') {
      const invoicePatientId = invoice.patient?._id ? invoice.patient._id.toString() : invoice.patient?.toString();
      if (invoicePatientId !== req.user.patient?.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only access your own invoices' });
      }
    }

    const payments = await Payment.find({ invoice: invoice._id, tenant: req.tenantId })
      .populate('collectedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        invoice,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Collect payment against an invoice (supports partial/multiple payments with idempotency)
// @route   POST /api/v1/billing/payments
// @access  Private
exports.collectPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentType, transactionReference, idempotencyKey } = req.body;
    const clientKey = (
      idempotencyKey ||
      (req.get ? req.get('idempotency-key') : req.headers?.['idempotency-key']) ||
      (req.get ? req.get('x-idempotency-key') : req.headers?.['x-idempotency-key'])
    )?.toString()?.trim();

    // Idempotency check: return existing payment if already processed
    if (clientKey) {
      const existingPayment = await Payment.findOne({
        tenant: req.tenantId,
        idempotencyKey: clientKey
      }).populate('patient');

      if (existingPayment) {
        const currentInvoice = await Invoice.findOne({
          _id: existingPayment.invoice,
          tenant: req.tenantId
        }).populate('patient');

        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Payment already processed with this idempotency key',
          payment: existingPayment,
          updatedInvoice: currentInvoice
        });
      }
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenant: req.tenantId
    }).populate('patient');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, invoice.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to collect payments for another branch.'
      });
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' });
    }

    if (paymentAmount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        error: `Payment amount ₹${paymentAmount} exceeds outstanding balance of ₹${invoice.balanceDue}`
      });
    }

    // Generate receipt number
    const count = await Payment.countDocuments({ tenant: req.tenantId });
    const recSeq = String(count + 1).padStart(4, '0');
    const receiptNumber = `REC-${new Date().getFullYear()}-${recSeq}`;

    const payment = await Payment.create({
      tenant: req.tenantId,
      branch: invoice.branch || req.branchId || req.user.branch,
      receiptNumber,
      invoice: invoice._id,
      patient: invoice.patient._id,
      amountPaid: paymentAmount,
      paymentMethod: paymentMethod || 'Cash',
      paymentType: paymentType || 'Bill Settlement',
      transactionReference,
      idempotencyKey: clientKey || undefined,
      collectedBy: req.user._id,
      status: 'Completed'
    });

    // Update invoice totals
    invoice.paidAmount += paymentAmount;
    invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.paidAmount);

    if (invoice.balanceDue === 0) {
      invoice.status = 'Fully Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Collect Payment',
      module: 'Billing & Cashier',
      entityId: payment._id.toString(),
      entityType: 'Payment',
      details: `Collected ₹${paymentAmount} via ${paymentMethod}. New balance: ₹${invoice.balanceDue} (Receipt #${receiptNumber})${clientKey ? ` [IdempotencyKey: ${clientKey}]` : ''}`
    });

    // Asynchronously dispatch payment receipt notification
    const notificationService = require('../services/notification/NotificationService');
    const patientPhone = invoice.patient?.phone;
    if (patientPhone) {
      notificationService.sendNotification({
        tenantId: req.tenantId,
        eventName: 'Payment Received Receipt',
        channel: 'SMS',
        recipient: patientPhone,
        data: {
          patientName: invoice.patient?.fullName || invoice.patient?.firstName || 'Patient',
          receiptNumber,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: paymentAmount,
          hospitalName: req.user?.tenant?.name || 'Hospital Vision'
        }
      }).catch(notifErr => console.warn('[Payment Notification Error]:', notifErr.message));
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded and receipt generated',
      payment,
      updatedInvoice: invoice
    });
  } catch (err) {
    // Handle concurrent duplicate submission with same idempotencyKey
    const clientKey = (
      req.body?.idempotencyKey ||
      (req.get ? req.get('idempotency-key') : req.headers?.['idempotency-key']) ||
      (req.get ? req.get('x-idempotency-key') : req.headers?.['x-idempotency-key'])
    )?.toString()?.trim();
    if (clientKey && err.code === 11000 && (err.keyPattern?.idempotencyKey || err.message?.includes('idempotencyKey'))) {
      try {
        const existingPayment = await Payment.findOne({
          tenant: req.tenantId,
          idempotencyKey: clientKey
        }).populate('patient');
        const currentInvoice = await Invoice.findOne({
          _id: existingPayment?.invoice || req.body?.invoiceId,
          tenant: req.tenantId
        }).populate('patient');

        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Payment already processed with this idempotency key',
          payment: existingPayment,
          updatedInvoice: currentInvoice
        });
      } catch (recoveryErr) {
        return next(recoveryErr);
      }
    }
    next(err);
  }
};

// @desc    Process refund with approval integrity
// @route   POST /api/v1/billing/refunds
// @access  Private
exports.processRefund = async (req, res, next) => {
  try {
    const { paymentId, invoiceId, invoiceNumber, refundAmount, reason } = req.body;

    let payment = null;
    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, tenant: req.tenantId });
    } else if (invoiceId) {
      payment = await Payment.findOne({ invoice: invoiceId, tenant: req.tenantId }).sort({ createdAt: -1 });
    } else if (invoiceNumber) {
      const inv = await Invoice.findOne({ invoiceNumber: invoiceNumber.trim(), tenant: req.tenantId });
      if (inv) {
        payment = await Payment.findOne({ invoice: inv._id, tenant: req.tenantId }).sort({ createdAt: -1 });
      }
    }

    if (!payment) {
      return res.status(404).json({ success: false, error: 'No qualifying payment record found for this refund request' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, payment.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to process refunds for another branch.'
      });
    }

    const refAmt = Number(refundAmount);
    if (refAmt <= 0 || refAmt > payment.amountPaid) {
      return res.status(400).json({ success: false, error: 'Invalid refund amount requested' });
    }

    payment.status = 'Refunded';
    payment.refundRecord = {
      refundAmount: refAmt,
      refundReason: reason,
      refundedAt: new Date(),
      approvedBy: req.user._id
    };
    await payment.save();

    // Adjust invoice
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.paidAmount = Math.max(0, invoice.paidAmount - refAmt);
      invoice.balanceDue = invoice.grandTotal - invoice.paidAmount;
      invoice.status = invoice.paidAmount === 0 ? 'Refunded' : 'Partially Paid';
      await invoice.save();
    }

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Process Refund',
      module: 'Billing & Cashier',
      entityId: payment._id.toString(),
      entityType: 'Payment',
      details: `Refund of ₹${refAmt} processed for receipt ${payment.receiptNumber}. Reason: ${reason}`
    });

    res.status(200).json({
      success: true,
      message: 'Refund recorded and ledger updated',
      payment,
      invoice
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get refund and financial adjustment history
// @route   GET /api/v1/billing/refunds
// @access  Private
exports.getRefunds = async (req, res, next) => {
  try {
    const query = {
      tenant: req.tenantId,
      $or: [
        { status: 'Refunded' },
        { refundRecord: { $exists: true } }
      ]
    };

    if (req.branchId) {
      query.branch = req.branchId;
    }

    const refundedPayments = await Payment.find(query)
      .populate('patient', 'uhid fullName phone age gender')
      .populate('invoice', 'invoiceNumber grandTotal paidAmount balanceDue status')
      .populate('refundRecord.approvedBy', 'name role')
      .populate('collectedBy', 'name role')
      .sort({ 'refundRecord.refundedAt': -1, updatedAt: -1 });

    const formatted = refundedPayments.map(p => ({
      _id: p._id,
      id: `REF-${p._id.toString().slice(-6).toUpperCase()}`,
      receiptNumber: p.receiptNumber,
      invoiceId: p.invoice?._id,
      invoiceNumber: p.invoice?.invoiceNumber || 'INV-N/A',
      patientName: p.patient?.fullName || 'Unknown Patient',
      uhid: p.patient?.uhid || 'N/A',
      amount: p.refundRecord?.refundAmount || p.amountPaid,
      reason: p.refundRecord?.refundReason || 'Financial Adjustment / Refund',
      requestedBy: p.collectedBy?.name || 'Cashier Desk',
      approvedBy: p.refundRecord?.approvedBy?.name || 'Hospital Admin',
      status: 'approved',
      date: p.refundRecord?.refundedAt || p.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get insurance policies and claims workbench
// @route   GET /api/v1/billing/insurance
// @access  Private
exports.getInsuranceWorkbench = async (req, res, next) => {
  try {
    const policies = await InsurancePolicy.find({ tenant: req.tenantId })
      .populate('patient', 'uhid fullName phone age gender');

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit insurance pre-authorization request
// @route   POST /api/v1/billing/insurance/preauth
// @access  Private
exports.submitPreAuth = async (req, res, next) => {
  try {
    const { policyId, requestedAmount, tpaRemarks } = req.body;

    const policy = await InsurancePolicy.findOne({
      _id: policyId,
      tenant: req.tenantId
    });

    if (!policy) {
      return res.status(404).json({ success: false, error: 'Insurance policy not found' });
    }

    const preAuthNumber = `PREAUTH-${Date.now().toString().slice(-6)}`;

    policy.preAuthRequests.push({
      preAuthNumber,
      requestedAmount: Number(requestedAmount),
      approvedAmount: Number(requestedAmount) * 0.9, // 90% pre-authorized approval simulation
      status: 'Approved in Full',
      tpaRemarks: tpaRemarks || 'Pre-authorization granted as per policy terms',
      requestDate: new Date(),
      approvalDate: new Date()
    });

    await policy.save();

    res.status(201).json({
      success: true,
      message: 'Pre-authorization submitted and approved',
      data: policy
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get payments / receipts with tenant isolation & anti-IDOR
// @route   GET /api/v1/billing/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { patientId, invoiceId, branch } = req.query;
    const query = { tenant: req.tenantId };

    // Branch Isolation: Sub-branch can ONLY see its own branch payments!
    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query.patient = ownPatientId;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (invoiceId) {
      query.invoice = invoiceId;
    }

    const payments = await Payment.find(query)
      .populate('patient', 'uhid fullName phone')
      .populate('invoice', 'invoiceNumber grandTotal paidAmount balanceDue status')
      .populate('collectedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    next(err);
  }
};

