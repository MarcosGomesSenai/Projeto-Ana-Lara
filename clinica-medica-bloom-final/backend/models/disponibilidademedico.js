const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DisponibilidadeMedico = sequelize.define('DisponibilidadeMedico', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  medico_id: { type: DataTypes.INTEGER, allowNull: false },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horario: { type: DataTypes.TIME, allowNull: false },
  disponivel: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'disponibilidade_medicos',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['medico_id', 'data', 'horario'] }]
});

module.exports = DisponibilidadeMedico;
