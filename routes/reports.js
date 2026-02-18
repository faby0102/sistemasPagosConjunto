const express = require('express');
const { authMiddleware, roleAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const moment = require('moment');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// @route   GET api/reports/monthly
// @desc    Generate monthly report
// @access  Private - Admin/Treasurer
router.get('/monthly/:year/:month', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate inputs
    if (!year || !month || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    
    // Get all payments for the specified month/year
    const payments = await Payment.findAll({
      where: {
        referenceMonth: parseInt(month),
        referenceYear: parseInt(year)
      },
      include: [{
        model: Property,
        attributes: ['id', 'propertyNumber', 'ownerName']
      }],
      order: [['propertyId', 'ASC']]
    });
    
    // Group payments by concept for summary
    const conceptTotals = {};
    let totalCollected = 0;
    
    payments.forEach(payment => {
      if (!conceptTotals[payment.concept]) {
        conceptTotals[payment.concept] = {
          count: 0,
          total: 0
        };
      }
      
      conceptTotals[payment.concept].count++;
      conceptTotals[payment.concept].total += parseFloat(payment.amount);
      totalCollected += parseFloat(payment.amount);
    });
    
    const report = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalCollected,
      conceptBreakdown: conceptTotals,
      payments: payments.map(payment => ({
        id: payment.id,
        property: payment.Property.propertyNumber,
        owner: payment.Property.ownerName,
        concept: payment.concept,
        amount: parseFloat(payment.amount),
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        observations: payment.observations
      }))
    };
    
    res.json(report);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/history/:propertyId
// @desc    Get payment history for a property
// @access  Private - Admin/Treasurer/Owner
router.get('/history/:propertyId', authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // For owners, only allow access to their own property history
    if (req.user.role === 'owner') {
      // In a real implementation, we would check if the property belongs to the owner
    }
    
    const payments = await Payment.findAll({
      where: { propertyId: parseInt(propertyId) },
      include: [{
        model: Property,
        attributes: ['id', 'propertyNumber', 'ownerName']
      }],
      order: [['referenceYear', 'DESC'], ['referenceMonth', 'DESC']]
    });
    
    // Calculate property balance
    let totalPaid = 0;
    payments.forEach(payment => {
      totalPaid += parseFloat(payment.amount);
    });
    
    const property = await Property.findByPk(propertyId);
    
    res.json({
      property: property,
      payments,
      totalPaid
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/debtors
// @desc    Get debtors report
// @access  Private - Admin/Treasurer
router.get('/debtors', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    // Find all properties that have missed payments
    const allProperties = await Property.findAll({
      where: { status: 'active' }
    });
    
    // For each property, check if they have payments for the recent months
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    const debtors = [];
    
    for (const property of allProperties) {
      // Check if property has payment for current month
      let isCurrentMonthPaid = false;
      let oldestUnpaidMonth = null;
      
      // Look back up to 12 months to find unpaid periods
      for (let i = 0; i < 12; i++) {
        const checkMonth = moment().subtract(i, 'months');
        const month = checkMonth.month() + 1;
        const year = checkMonth.year();
        
        const paymentExists = await Payment.findOne({
          where: {
            propertyId: property.id,
            referenceMonth: month,
            referenceYear: year
          }
        });
        
        if (!paymentExists) {
          oldestUnpaidMonth = { month, year };
        } else {
          // If we found a payment, and we're checking the current month, mark as paid
          if (month === currentMonth && year === currentYear) {
            isCurrentMonthPaid = true;
          }
          break;
        }
      }
      
      if (!isCurrentMonthPaid && oldestUnpaidMonth) {
        const monthsInArrears = moment().diff(
          moment(`${oldestUnpaidMonth.year}-${String(oldestUnpaidMonth.month).padStart(2, '0')}`, 'YYYY-MM'), 
          'months'
        ) + 1;
        
        debtors.push({
          id: property.id,
          propertyNumber: property.propertyNumber,
          ownerName: property.ownerName,
          contactEmail: property.contactEmail,
          contactPhone: property.contactPhone,
          oldestUnpaidPeriod: `${oldestUnpaidMonth.year}-${String(oldestUnpaidMonth.month).padStart(2, '0')}`,
          monthsInArrears,
          estimatedDebt: (monthsInArrears * 50).toFixed(2) // Estimate based on average monthly fee
        });
      }
    }
    
    res.json({ debtors });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reports/export/csv
// @desc    Export payments data to CSV
// @access  Private - Admin/Treasurer
router.get('/export/csv', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.paymentDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const payments = await Payment.findAll({
      where: whereClause,
      include: [{
        model: Property,
        attributes: ['propertyNumber', 'ownerName']
      }],
      order: [['paymentDate', 'DESC']]
    });
    
    // Create CSV content
    let csvContent = 'ID,Property Number,Owner Name,Concept,Amount,Payment Date,Reference Month,Reference Year,Payment Method,Observations\n';
    
    payments.forEach(payment => {
      csvContent += `"${payment.id}","${payment.Property.propertyNumber}","${payment.Property.ownerName}","${payment.concept}",${payment.amount},"${payment.paymentDate}","${payment.referenceMonth}","${payment.referenceYear}","${payment.paymentMethod}","${payment.observations}"\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments_report.csv');
    
    res.send(csvContent);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;