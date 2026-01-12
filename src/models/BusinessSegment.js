// models/BusinessSegment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BusinessSegment = sequelize.define('BusinessSegment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    segment: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'business_segments',
    timestamps: false, // ✅ Sem timestamps para esta tabela
  });

  return BusinessSegment;
};