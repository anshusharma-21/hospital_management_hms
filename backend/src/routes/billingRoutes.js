const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  getInvoiceById,
  collectPayment,
  getPayments,
  processRefund,
  getRefunds,
  getInsuranceWorkbench,
  submitPreAuth
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const paymentService = require('../services/payment/PaymentService');

router.use(protect);
router.use(enforceTenant);

router.route('/invoices')
  .get(getInvoices)
  .post(createInvoice);

router.get('/invoices/:id', getInvoiceById);
router.route('/payments')
  .get(getPayments)
  .post(collectPayment);
router.route('/refunds')
  .get(getRefunds)
  .post(processRefund);

// Payment Gateway Adapter Endpoints
router.post('/gateway/initiate', async (req, res, next) => {
  try {
    const { invoiceId, amount, currency, patientId, customerDetails, callbackUrl, idempotencyKey } = req.body;
    const clientKey = (
      idempotencyKey ||
      (req.get ? req.get('idempotency-key') : req.headers?.['idempotency-key']) ||
      (req.get ? req.get('x-idempotency-key') : req.headers?.['x-idempotency-key'])
    )?.toString()?.trim();

    const result = await paymentService.initiatePayment({
      tenantId: req.tenantId,
      invoiceId,
      amount,
      currency,
      patientId,
      customerDetails,
      callbackUrl,
      idempotencyKey: clientKey,
      requestedBy: req.user
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/gateway/verify', async (req, res, next) => {
  try {
    const { invoiceId, orderId, gatewayPaymentId, gatewaySignature, idempotencyKey } = req.body;
    const clientKey = (
      idempotencyKey ||
      (req.get ? req.get('idempotency-key') : req.headers?.['idempotency-key']) ||
      (req.get ? req.get('x-idempotency-key') : req.headers?.['x-idempotency-key'])
    )?.toString()?.trim();

    const result = await paymentService.verifyAndRecordPayment({
      tenantId: req.tenantId,
      invoiceId,
      orderId,
      gatewayPaymentId,
      gatewaySignature,
      idempotencyKey: clientKey,
      collectedBy: req.user,
      branchId: req.user?.branch
    });

    res.status(result.isDuplicate ? 200 : 201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/gateway/webhook', async (req, res, next) => {
  try {
    const signature = req.get ? (req.get('x-signature') || req.get('x-mock-signature')) : req.headers?.['x-signature'];
    const result = await paymentService.handleWebhook({
      tenantId: req.tenantId,
      payload: req.body,
      headers: req.headers,
      signature
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/gateway/reconcile', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const result = await paymentService.reconcilePayment({
      tenantId: req.tenantId,
      orderId
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Insurance & TPA
router.get('/insurance', getInsuranceWorkbench);
router.post('/insurance/preauth', submitPreAuth);

module.exports = router;

