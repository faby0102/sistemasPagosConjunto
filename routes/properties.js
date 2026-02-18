const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, roleAuth } = require('../middleware/auth');
const Property = require('../models/Property');

const router = express.Router();

// @route   GET api/properties
// @desc    Get all properties
// @access  Private - Admin/Treasurer
router.get('/', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const properties = await Property.findAll({
      order: [['propertyNumber', 'ASC']]
    });
    res.json(properties);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/properties/:id
// @desc    Get a property by ID
// @access  Private - Admin/Treasurer/Owner
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // For owners, only return their own property
    if (req.user.role === 'owner') {
      // In a real implementation, we would link properties to owners
      // For now, we'll just return the property
    }
    
    res.json(property);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/properties
// @desc    Create a new property
// @access  Private - Admin/Treasurer
router.post('/', 
  authMiddleware, 
  roleAuth('admin', 'treasurer'),
  [
    body('propertyNumber').not().isEmpty().withMessage('Property number is required'),
    body('ownerName').not().isEmpty().withMessage('Owner name is required'),
    body('contactEmail').optional().isEmail().withMessage('Please include a valid email')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyNumber, ownerName, contactEmail, contactPhone, parkingSpaces, status } = req.body;

    try {
      const newProperty = new Property({
        propertyNumber,
        ownerName,
        contactEmail,
        contactPhone,
        parkingSpaces: parkingSpaces || 0,
        status: status || 'active'
      });

      const property = await newProperty.save();
      res.json(property);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/properties/:id
// @desc    Update a property
// @access  Private - Admin/Treasurer
router.put('/:id', 
  authMiddleware, 
  roleAuth('admin', 'treasurer'),
  [
    body('propertyNumber').not().isEmpty().withMessage('Property number is required'),
    body('ownerName').not().isEmpty().withMessage('Owner name is required'),
    body('contactEmail').optional().isEmail().withMessage('Please include a valid email')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyNumber, ownerName, contactEmail, contactPhone, parkingSpaces, status } = req.body;

    try {
      const property = await Property.findByPk(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      await property.update({
        propertyNumber,
        ownerName,
        contactEmail,
        contactPhone,
        parkingSpaces,
        status
      });

      res.json(property);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/properties/:id
// @desc    Delete a property
// @access  Private - Admin/Treasurer
router.delete('/:id', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    await property.destroy();
    
    res.json({ message: 'Property removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;