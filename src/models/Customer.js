// models/Customer.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    segmento: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    qtd_clientes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    site: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  }, {
    tableName: 'customers',
    timestamps: true, // ✅ ATIVAR timestamps
    createdAt: 'created_at', // ✅ Mapear para created_at (como está na tabela)
    updatedAt: 'updated_at', // ✅ Mapear para updated_at (como está na tabela)
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['email'],
        unique: true,
      },
    ],
  });

  return Customer;
};