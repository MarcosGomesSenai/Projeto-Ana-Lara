const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Especialidade = sequelize.define('Especialidade', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'especialidades',
  timestamps: true,
  underscored: true,
  paranoid: true
});

module.exports = Especialidade;
