const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propertyNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  contactPhone: {
    type: DataTypes.STRING
  },
  parkingSpaces: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'properties',
  timestamps: true
});

module.exports = Property;