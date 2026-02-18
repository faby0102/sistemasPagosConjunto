const express = require('express');
const { authMiddleware, roleAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const moment = require('moment');
const { Op, sequelize } = require('sequelize');

const router = express.Router();

// @route   GET api/dashboard/summary
// @desc    Get financial summary for dashboard
// @access  Private - Admin/Treasurer
router.get('/summary', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    // Calculate total collected this month
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
    
    const monthlyTotal = await Payment.sum('amount', {
      where: {
        paymentDate: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    // Count debtors (properties with missing payments for current month)
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    // Get all active properties
    const allProperties = await Property.findAll({
      where: { status: 'active' }
    });
    
    // Get properties that have made payments this month
    const paidProperties = await Payment.findAll({
      attributes: ['propertyId'],
      where: {
        referenceMonth: currentMonth,
        referenceYear: currentYear
      },
      group: ['propertyId']
    });
    
    const paidPropertyIds = paidProperties.map(p => p.propertyId);
    const debtorCount = allProperties.length - paidPropertyIds.length;
    
    // Calculate percentage of compliance
    const compliancePercentage = allProperties.length > 0 
      ? Math.round((paidPropertyIds.length / allProperties.length) * 100) 
      : 0;
    
    // Find properties with positive balance (overpayments/credits)
    // This is simplified - in a real system you'd track credits separately
    const creditProperties = 0; // Placeholder for future implementation
    
    res.json({
      totalCollectedThisMonth: monthlyTotal || 0,
      debtorCount,
      creditCount: creditProperties,
      compliancePercentage
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/dashboard/payment-trends
// @desc    Get payment trends for charts
// @access  Private - Admin/Treasurer
router.get('/payment-trends', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    // Get total collected per month for the last 12 months
    const twelveMonthsAgo = moment().subtract(12, 'months').startOf('month').format('YYYY-MM-DD');
    
    const monthlyTotals = await Payment.findAll({
      attributes: [
        'referenceMonth', 
        'referenceYear',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        [Op.and]: [
          { referenceYear: { [Op.gte]: moment(twelveMonthsAgo).year() } },
          {
            [Op.or]: [
              { referenceYear: { [Op.gt]: moment(twelveMonthsAgo).year() } },
              { 
                referenceYear: { [Op.eq]: moment(twelveMonthsAgo).year() },
                referenceMonth: { [Op.gte]: moment(twelveMonthsAgo).month() + 1 }
              }
            ]
          }
        ]
      },
      group: ['referenceMonth', 'referenceYear'],
      order: [['referenceYear', 'ASC'], ['referenceMonth', 'ASC']]
    });
    
    // Format the data for the chart
    const formattedMonthlyData = monthlyTotals.map(record => ({
      month: `${record.referenceYear}-${String(record.referenceMonth).padStart(2, '0')}`,
      total: parseFloat(record.dataValues.totalAmount)
    }));
    
    // Get distribution by concept
    const conceptDistribution = await Payment.findAll({
      attributes: [
        'concept',
        [sequelize.fn('COUNT', sequelize.col('concept')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['concept']
    });
    
    const formattedConceptData = conceptDistribution.map(record => ({
      concept: record.concept,
      count: parseInt(record.dataValues.count),
      total: parseFloat(record.dataValues.totalAmount)
    }));
    
    res.json({
      monthlyTrend: formattedMonthlyData,
      conceptDistribution: formattedConceptData
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/dashboard/debtors
// @desc    Get debtor information
// @access  Private - Admin/Treasurer
router.get('/debtors', authMiddleware, roleAuth('admin', 'treasurer'), async (req, res) => {
  try {
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    // Find properties that haven't made payments for the current month
    const allProperties = await Property.findAll({
      where: { status: 'active' }
    });
    
    const paidProperties = await Payment.findAll({
      attributes: ['propertyId'],
      where: {
        referenceMonth: currentMonth,
        referenceYear: currentYear
      },
      group: ['propertyId']
    });
    
    const paidPropertyIds = paidProperties.map(p => p.propertyId);
    const debtorPropertyIds = allProperties
      .filter(prop => !paidPropertyIds.includes(prop.id))
      .map(prop => prop.id);
    
    // Get debtor details
    const debtors = await Property.findAll({
      where: {
        id: {
          [Op.in]: debtorPropertyIds
        }
      }
    });
    
    // Enhance with debt information
    const enhancedDebtors = await Promise.all(debtors.map(async (debtor) => {
      // Find oldest unpaid month for this property
      // This is a simplified approach - in reality, you might track this differently
      let oldestUnpaid = null;
      for (let i = 0; i < 12; i++) {
        const checkMonth = moment().subtract(i, 'months');
        const month = checkMonth.month() + 1;
        const year = checkMonth.year();
        
        const paymentExists = await Payment.findOne({
          where: {
            propertyId: debtor.id,
            referenceMonth: month,
            referenceYear: year
          }
        });
        
        if (!paymentExists) {
          oldestUnpaid = { month, year };
        } else {
          break;
        }
      }
      
      return {
        ...debtor.toJSON(),
        oldestUnpaidMonth: oldestUnpaid ? `${oldestUnpaid.year}-${String(oldestUnpaid.month).padStart(2, '0')}` : null,
        monthsInArrears: oldestUnpaid ? moment().diff(moment(`${oldestUnpaid.year}-${String(oldestUnpaid.month).padStart(2, '0')}`, 'YYYY-MM'), 'months') + 1 : 0
      };
    }));
    
    res.json({ debtors: enhancedDebtors });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;