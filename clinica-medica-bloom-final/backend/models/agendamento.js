/**
 * ============================================================================
 * ARQUIVO: Agendamento.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Modelo de Agendamento de Consultas para o banco de dados
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ============================================================================
// DEFINIÇÃO DO MODELO
// ============================================================================
const Agendamento = sequelize.define('Agendamento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único do agendamento'
    },
    paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pacientes',
            key: 'id'
        },
        comment: 'Referência ao paciente'
    },
    medico_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'medicos',
            key: 'id'
        },
        comment: 'Referência ao médico'
    },
    exame_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'exames',
            key: 'id'
        },
        comment: 'Referência ao exame'
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'Data inválida' },
            isAfter: { args: new Date().toISOString().split('T')[0], msg: 'Data deve ser futura' }
        },
        comment: 'Data da consulta'
    },
    horario: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            is: { args: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, msg: 'Horário inválido' }
        },
        comment: 'Horário da consulta'
    },
    status: {
        type: DataTypes.ENUM('agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado', 'pendente'),
        defaultValue: 'agendado',
        comment: 'Status do agendamento'
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Valor da consulta/exame'
    },
    observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observações adicionais'
    },
    data_agendamento: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Data e hora do agendamento'
    },
    data_confirmacao: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data e hora da confirmação'
    },
    data_cancelamento: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data e hora do cancelamento'
    },
    motivo_cancelamento: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo do cancelamento'
    },
    link_telemedicina: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Link para consulta por telemedicina'
    }
}, {
    tableName: 'agendamentos',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
        { fields: ['paciente_id'] },
        { fields: ['medico_id'] },
        { fields: ['data'] },
        { fields: ['status'] },
        { fields: ['data', 'horario'] }
    ]
});

// ============================================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================================

/**
 * Verificar se o agendamento pode ser cancelado
 * @returns {boolean}
 */
Agendamento.prototype.podeCancelar = function() {
    if (this.status === 'realizado') {
        return false;
    }
    
    if (this.status === 'cancelado') {
        return false;
    }
    
    const dataAgendamento = new Date(this.data + ' ' + this.horario);
    const agora = new Date();
    const horasDiferenca = (dataAgendamento - agora) / (1000 * 60 * 60);
    
    return horasDiferenca >= 24;
};

/**
 * Verificar se o agendamento pode ser reagendado
 * @returns {boolean}
 */
Agendamento.prototype.podeReagendar = function() {
    if (this.status === 'realizado') {
        return false;
    }
    
    if (this.status === 'cancelado') {
        return false;
    }
    
    const dataAgendamento = new Date(this.data + ' ' + this.horario);
    const agora = new Date();
    const horasDiferenca = (dataAgendamento - agora) / (1000 * 60 * 60);
    
    return horasDiferenca >= 24;
};

/**
 * Cancelar agendamento
 * @param {string} motivo - Motivo do cancelamento
 */
Agendamento.prototype.cancelar = async function(motivo = null) {
    this.status = 'cancelado';
    this.data_cancelamento = new Date();
    if (motivo) {
        this.motivo_cancelamento = motivo;
    }
    await this.save();
};

/**
 * Confirmar agendamento
 */
Agendamento.prototype.confirmar = async function() {
    this.status = 'confirmado';
    this.data_confirmacao = new Date();
    await this.save();
};

/**
 * Realizar agendamento (marcar como concluído)
 */
Agendamento.prototype.realizar = async function() {
    this.status = 'realizado';
    await this.save();
};

/**
 * Obter dados formatados para exibição
 */
Agendamento.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Formatar data para exibição
    if (values.data) {
        const dataObj = new Date(values.data);
        values.data_formatada = dataObj.toLocaleDateString('pt-BR');
    }
    
    return values;
};

// ============================================================================
// MÉTODOS ESTÁTICOS
// ============================================================================

/**
 * Buscar agendamentos de um paciente
 * @param {number} pacienteId - ID do paciente
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>}
 */
Agendamento.findByPaciente = async function(pacienteId, { page = 1, limit = 10, status = null } = {}) {
    const offset = (page - 1) * limit;
    const where = { paciente_id: pacienteId };
    
    if (status) {
        where.status = status;
    }
    
    const { count, rows } = await this.findAndCountAll({
        where,
        limit,
        offset,
        order: [['data', 'DESC'], ['horario', 'DESC']],
        include: [
            { association: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
            { association: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] }
        ]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        agendamentos: rows
    };
};

/**
 * Buscar agendamentos de um médico
 * @param {number} medicoId - ID do médico
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>}
 */
Agendamento.findByMedico = async function(medicoId, { page = 1, limit = 20, data = null, status = null } = {}) {
    const offset = (page - 1) * limit;
    const where = { medico_id: medicoId };
    
    if (data) {
        where.data = data;
    }
    
    if (status) {
        where.status = status;
    }
    
    const { count, rows } = await this.findAndCountAll({
        where,
        limit,
        offset,
        order: [['data', 'ASC'], ['horario', 'ASC']],
        include: [
            { association: 'paciente', attributes: ['id', 'nome', 'email', 'telefone'] },
            { association: 'exame', attributes: ['id', 'nome', 'preco'] }
        ]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        agendamentos: rows
    };
};

/**
 * Buscar horários ocupados de um médico em uma data
 * @param {number} medicoId - ID do médico
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {Promise<string[]>}
 */
Agendamento.findHorariosOcupados = async function(medicoId, data) {
    const { Op } = require('sequelize');
    
    const agendamentos = await this.findAll({
        where: {
            medico_id: medicoId,
            data: data,
            status: { [Op.ne]: 'cancelado' }
        },
        attributes: ['horario']
    });
    
    return agendamentos.map(a => a.horario.substring(0, 5));
};

/**
 * Buscar próximos agendamentos de um paciente
 * @param {number} pacienteId - ID do paciente
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Agendamento[]>}
 */
Agendamento.findProximos = async function(pacienteId, limit = 5) {
    const { Op } = require('sequelize');
    const hoje = new Date().toISOString().split('T')[0];
    
    return await this.findAll({
        where: {
            paciente_id: pacienteId,
            data: { [Op.gte]: hoje },
            status: { [Op.in]: ['agendado', 'confirmado'] }
        },
        limit,
        order: [['data', 'ASC'], ['horario', 'ASC']],
        include: [
            { association: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
            { association: 'exame', attributes: ['id', 'nome'] }
        ]
    });
};

/**
 * Buscar histórico de agendamentos de um paciente
 * @param {number} pacienteId - ID do paciente
 * @param {Object} options - Opções de paginação
 * @returns {Promise<Object>}
 */
Agendamento.findHistorico = async function(pacienteId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');
    const hoje = new Date().toISOString().split('T')[0];
    
    const { count, rows } = await this.findAndCountAll({
        where: {
            paciente_id: pacienteId,
            [Op.or]: [
                { status: 'realizado' },
                { status: 'cancelado' },
                { data: { [Op.lt]: hoje } }
            ]
        },
        limit,
        offset,
        order: [['data', 'DESC'], ['horario', 'DESC']],
        include: [
            { association: 'medico', attributes: ['id', 'nome', 'crm'] },
            { association: 'exame', attributes: ['id', 'nome', 'preco'] }
        ]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        agendamentos: rows
    };
};

/**
 * Verificar conflito de horário
 * @param {number} medicoId - ID do médico
 * @param {string} data - Data
 * @param {string} horario - Horário
 * @param {number} excludeId - ID do agendamento a ser excluído da verificação
 * @returns {Promise<boolean>}
 */
Agendamento.hasConflito = async function(medicoId, data, horario, excludeId = null) {
    const { Op } = require('sequelize');
    const where = {
        medico_id: medicoId,
        data: data,
        horario: horario,
        status: { [Op.ne]: 'cancelado' }
    };
    
    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }
    
    const conflito = await this.findOne({ where });
    return !!conflito;
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = Agendamento;