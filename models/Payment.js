const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  concept: {
    type: DataTypes.ENUM('monthly_fee', 'water', 'communal_house', 'parking'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  referenceMonth: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  referenceYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'transfer', 'deposit'),
    allowNull: false
  },
  receiptPath: {
    type: DataTypes.STRING
  },
  observations: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;