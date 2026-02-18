const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, roleAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const multer = require('multer');
const path = require('path');
const moment = require('moment');

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// @route   GET api/payments
// @desc    Get all payments
// @access  Private - Admin/Treasurer
router.get('/', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [{
        model: Property,
        attributes: ['id', 'propertyNumber', 'ownerName']
      }],
      order: [['paymentDate', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/payments/property/:propertyId
// @desc    Get payments for a specific property
// @access  Private - Admin/Treasurer/Owner
router.get('/property/:propertyId', authMiddleware, async (req, res) => {
  try {
    // For owners, only allow access to their own property payments
    if (req.user.role === 'owner') {
      // In a real implementation, we would check if the property belongs to the owner
    }
    
    const payments = await Payment.findAll({
      where: { propertyId: req.params.propertyId },
      include: [{
        model: Property,
        attributes: ['id', 'propertyNumber', 'ownerName']
      }],
      order: [['paymentDate', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/payments/:id
// @desc    Get a payment by ID
// @access  Private - Admin/Treasurer/Owner
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{
        model: Property,
        attributes: ['id', 'propertyNumber', 'ownerName']
      }]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // For owners, only allow access to their own property payments
    if (req.user.role === 'owner') {
      // In a real implementation, we would check if the property belongs to the owner
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/payments
// @desc    Create a new payment
// @access  Private - Admin/Treasurer
router.post('/', 
  authMiddleware, 
  roleAuth('admin', 'treasurer'),
  upload.single('receipt'),
  [
    body('propertyId').not().isEmpty().withMessage('Property ID is required'),
    body('concept').not().isEmpty().withMessage('Concept is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
    body('referenceMonth').isInt({ min: 1, max: 12 }).withMessage('Reference month must be between 1 and 12'),
    body('referenceYear').isInt({ min: 1900, max: 2100 }).withMessage('Reference year must be a valid year'),
    body('paymentMethod').not().isEmpty().withMessage('Payment method is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, concept, amount, paymentDate, referenceMonth, referenceYear, paymentMethod, observations } = req.body;

    try {
      // Verify property exists
      const property = await Property.findByPk(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const newPayment = new Payment({
        propertyId: parseInt(propertyId),
        concept,
        amount: parseFloat(amount),
        paymentDate,
        referenceMonth: parseInt(referenceMonth),
        referenceYear: parseInt(referenceYear),
        paymentMethod,
        observations,
        receiptPath: req.file ? req.file.path : null
      });

      const payment = await newPayment.save();
      
      // Populate the property data for response
      await payment.reload({
        include: [{
          model: Property,
          attributes: ['id', 'propertyNumber', 'ownerName']
        }]
      });
      
      res.json(payment);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/payments/:id
// @desc    Update a payment
// @access  Private - Admin/Treasurer
router.put('/:id', 
  authMiddleware, 
  roleAuth('admin', 'treasurer'),
  upload.single('receipt'),
  [
    body('propertyId').not().isEmpty().withMessage('Property ID is required'),
    body('concept').not().isEmpty().withMessage('Concept is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
    body('referenceMonth').isInt({ min: 1, max: 12 }).withMessage('Reference month must be between 1 and 12'),
    body('referenceYear').isInt({ min: 1900, max: 2100 }).withMessage('Reference year must be a valid year'),
    body('paymentMethod').not().isEmpty().withMessage('Payment method is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, concept, amount, paymentDate, referenceMonth, referenceYear, paymentMethod, observations } = req.body;

    try {
      const payment = await Payment.findByPk(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Verify property exists
      const property = await Property.findByPk(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      await payment.update({
        propertyId: parseInt(propertyId),
        concept,
        amount: parseFloat(amount),
        paymentDate,
        referenceMonth: parseInt(referenceMonth),
        referenceYear: parseInt(referenceYear),
        paymentMethod,
        observations,
        receiptPath: req.file ? req.file.path : payment.receiptPath
      });

      // Populate the property data for response
      await payment.reload({
        include: [{
          model: Property,
          attributes: ['id', 'propertyNumber', 'ownerName']
        }]
      });
      
      res.json(payment);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private - Admin/Treasurer
router.delete('/:id', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    await payment.destroy();
    
    res.json({ message: 'Payment removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;