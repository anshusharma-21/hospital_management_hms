const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const notificationService = require('../services/notification/NotificationService');

router.use(protect);
router.use(enforceTenant);

// @desc    Dispatch notification using provider-neutral service
// @route   POST /api/v1/notifications/send
// @access  Private
router.post('/send', async (req, res, next) => {
  try {
    const { eventName, channel, recipient, data, metadata } = req.body;

    const result = await notificationService.sendNotification({
      tenantId: req.tenantId,
      eventName,
      channel,
      recipient,
      data,
      metadata
    });

    res.status(200).json({
      success: true,
      message: `${result.channel} notification sent successfully`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Send direct SMS
// @route   POST /api/v1/notifications/sms
// @access  Private
router.post('/sms', async (req, res, next) => {
  try {
    const { to, message, data, metadata } = req.body;
    const result = await notificationService.sendSMS({
      tenantId: req.tenantId,
      to,
      message,
      data,
      metadata
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// @desc    Send direct WhatsApp
// @route   POST /api/v1/notifications/whatsapp
// @access  Private
router.post('/whatsapp', async (req, res, next) => {
  try {
    const { to, message, data, metadata } = req.body;
    const result = await notificationService.sendWhatsApp({
      tenantId: req.tenantId,
      to,
      message,
      data,
      metadata
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// @desc    Send direct Email
// @route   POST /api/v1/notifications/email
// @access  Private
router.post('/email', async (req, res, next) => {
  try {
    const { to, subject, html, text, data, metadata } = req.body;
    const result = await notificationService.sendEmail({
      tenantId: req.tenantId,
      to,
      subject,
      html,
      text,
      data,
      metadata
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
