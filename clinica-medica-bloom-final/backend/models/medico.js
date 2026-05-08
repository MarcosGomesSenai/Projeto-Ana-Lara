/**
 * ============================================================================
 * ARQUIVO: Medico.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Modelo de Médico para o banco de dados
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
const Medico = sequelize.define('Medico', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único do médico'
    },
    nome: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome é obrigatório' }
        },
        comment: 'Nome completo do médico'
    },
    especialidade_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'especialidades',
            key: 'id'
        },
        comment: 'Referência à especialidade do médico'
    },
    crm: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Número do CRM (Conselho Regional de Medicina)'
    },
    foto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'https://randomuser.me/api/portraits/women/68.jpg',
        comment: 'URL da foto do médico'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: { msg: 'E-mail inválido' }
        },
        comment: 'E-mail profissional do médico'
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Telefone de contato'
    },
    resumo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Resumo profissional curto'
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada do médico'
    },
    formacao: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Formação acadêmica'
    },
    experiencia: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Experiência profissional'
    },
    premios: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Prêmios e reconhecimentos'
    },
    experiencia_anos: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Anos de experiência'
    },
    avaliacao: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 5.0,
        validate: {
            min: 0,
            max: 5
        },
        comment: 'Avaliação média do médico'
    },
    total_avaliacoes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Número total de avaliações'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Status ativo/inativo do médico'
    },
    disponivel: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Disponibilidade para agendamentos'
    },
    horario_inicio: {
        type: DataTypes.TIME,
        defaultValue: '08:00:00',
        comment: 'Horário de início do expediente'
    },
    horario_fim: {
        type: DataTypes.TIME,
        defaultValue: '18:00:00',
        comment: 'Horário de fim do expediente'
    },
    intervalo_consulta: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Duração da consulta em minutos'
    },
    dias_atendimento: {
        type: DataTypes.STRING(50),
        defaultValue: '1,2,3,4,5',
        comment: 'Dias da semana que atende (1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado)'
    }
}, {
    tableName: 'medicos',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
        { fields: ['crm'], unique: true },
        { fields: ['especialidade_id'] },
        { fields: ['ativo'] },
        { fields: ['disponivel'] }
    ]
});

// ============================================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================================

/**
 * Verificar se o médico atende em um dia específico
 * @param {number} diaSemana - Dia da semana (1=Segunda a 7=Domingo)
 * @returns {boolean}
 */
Medico.prototype.atendeNoDia = function(diaSemana) {
    if (!this.dias_atendimento) return false;
    const dias = this.dias_atendimento.split(',').map(Number);
    return dias.includes(diaSemana);
};

/**
 * Obter dias de atendimento como array
 * @returns {number[]}
 */
Medico.prototype.getDiasAtendimento = function() {
    if (!this.dias_atendimento) return [1, 2, 3, 4, 5];
    return this.dias_atendimento.split(',').map(Number);
};

/**
 * Atualizar avaliação média
 * @param {number} novaAvaliacao - Nova avaliação (1-5)
 */
Medico.prototype.atualizarAvaliacao = async function(novaAvaliacao) {
    const novaTotal = this.total_avaliacoes + 1;
    const novaMedia = (this.avaliacao * this.total_avaliacoes + novaAvaliacao) / novaTotal;
    
    this.avaliacao = parseFloat(novaMedia.toFixed(2));
    this.total_avaliacoes = novaTotal;
    await this.save();
};

/**
 * Verificar disponibilidade em uma data específica
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {Promise<boolean>}
 */
Medico.prototype.verificarDisponibilidadeData = async function(data) {
    const dataObj = new Date(data);
    const diaSemana = dataObj.getDay();
    const diaAjustado = diaSemana === 0 ? 7 : diaSemana;
    
    if (!this.atendeNoDia(diaAjustado)) {
        return false;
    }
    
    const { Agendamento } = require('./Agendamento');
    const { Op } = require('sequelize');
    
    const agendamentos = await Agendamento.count({
        where: {
            medico_id: this.id,
            data: data,
            status: { [Op.ne]: 'cancelado' }
        }
    });
    
    // Calcular total de horários disponíveis no dia
    const horarioInicio = this.horario_inicio.substring(0, 5);
    const horarioFim = this.horario_fim.substring(0, 5);
    const intervalo = this.intervalo_consulta;
    
    const totalHorarios = this.calcularTotalHorarios(horarioInicio, horarioFim, intervalo);
    
    return agendamentos < totalHorarios;
};

/**
 * Calcular total de horários disponíveis no dia
 */
Medico.prototype.calcularTotalHorarios = function(horarioInicio, horarioFim, intervaloMinutos) {
    const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFim.split(':').map(Number);
    
    let total = 0;
    let horaAtual = horaInicio;
    let minAtual = minInicio;
    
    while (horaAtual < horaFim || (horaAtual === horaFim && minAtual < minFim)) {
        total++;
        minAtual += intervaloMinutos;
        if (minAtual >= 60) {
            horaAtual++;
            minAtual -= 60;
        }
    }
    
    return total;
};

/**
 * Obter dados públicos do médico
 */
Medico.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.created_at;
    delete values.updated_at;
    delete values.deleted_at;
    return values;
};

// ============================================================================
// MÉTODOS ESTÁTICOS
// ============================================================================

/**
 * Buscar médicos por especialidade
 * @param {number} especialidadeId - ID da especialidade
 * @returns {Promise<Medico[]>}
 */
Medico.findByEspecialidade = async function(especialidadeId) {
    return await this.findAll({
        where: { especialidade_id: especialidadeId, ativo: true, disponivel: true },
        order: [['nome', 'ASC']]
    });
};

/**
 * Buscar médicos disponíveis em uma data específica
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {Promise<Medico[]>}
 */
Medico.findDisponiveisNaData = async function(data) {
    const diaSemana = new Date(data).getDay();
    const diaAjustado = diaSemana === 0 ? 7 : diaSemana;
    
    return await this.findAll({
        where: {
            ativo: true,
            disponivel: true
        },
        order: [['nome', 'ASC']]
    }).then(medicos => {
        return medicos.filter(medico => medico.atendeNoDia(diaAjustado));
    });
};

/**
 * Buscar médicos com paginação e filtros
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>}
 */
Medico.findWithPagination = async function({ page = 1, limit = 12, especialidade = null, search = null, disponivel = true } = {}) {
    const offset = (page - 1) * limit;
    const where = { ativo: true };
    
    if (especialidade) {
        where.especialidade_id = especialidade;
    }
    
    if (disponivel) {
        where.disponivel = true;
    }
    
    if (search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
            { nome: { [Op.like]: `%${search}%` } },
            { crm: { [Op.like]: `%${search}%` } }
        ];
    }
    
    const { count, rows } = await this.findAndCountAll({
        where,
        limit,
        offset,
        order: [['nome', 'ASC']],
        include: [{
            association: 'especialidade_info',
            attributes: ['id', 'nome']
        }]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        medicos: rows
    };
};

/**
 * Buscar médicos em destaque (mais bem avaliados)
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Medico[]>}
 */
Medico.findDestaque = async function(limit = 8) {
    return await this.findAll({
        where: { ativo: true, disponivel: true },
        order: [['avaliacao', 'DESC'], ['total_avaliacoes', 'DESC']],
        limit,
        include: [{
            association: 'especialidade_info',
            attributes: ['id', 'nome']
        }]
    });
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = Medico;