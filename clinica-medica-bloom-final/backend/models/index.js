const { sequelize } = require('../config/database');
const Paciente = require('./paciente');
const Medico = require('./medico');
const Exame = require('./exame');
const Agendamento = require('./agendamento');
const Especialidade = require('./especialidade');
const DisponibilidadeMedico = require('./disponibilidademedico');

Medico.belongsTo(Especialidade, { foreignKey: 'especialidade_id', as: 'especialidade_info' });
Especialidade.hasMany(Medico, { foreignKey: 'especialidade_id', as: 'medicos' });

Medico.belongsToMany(Exame, { through: 'medico_exames', foreignKey: 'medico_id', otherKey: 'exame_id', as: 'exames_realizados', timestamps: false });
Exame.belongsToMany(Medico, { through: 'medico_exames', foreignKey: 'exame_id', otherKey: 'medico_id', as: 'medicos_habilitados', timestamps: false });

Agendamento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Paciente.hasMany(Agendamento, { foreignKey: 'paciente_id', as: 'agendamentos' });
Agendamento.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
Medico.hasMany(Agendamento, { foreignKey: 'medico_id', as: 'agendamentos' });
Agendamento.belongsTo(Exame, { foreignKey: 'exame_id', as: 'exame' });
Exame.hasMany(Agendamento, { foreignKey: 'exame_id', as: 'agendamentos' });

DisponibilidadeMedico.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
Medico.hasMany(DisponibilidadeMedico, { foreignKey: 'medico_id', as: 'disponibilidades' });

module.exports = { sequelize, Paciente, Medico, Exame, Agendamento, Especialidade, DisponibilidadeMedico };
