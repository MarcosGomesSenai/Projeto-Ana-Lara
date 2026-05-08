/**
 * ============================================================================
 * ARQUIVO: Paciente.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Modelo de Paciente para o banco de dados
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================================================
// DEFINIÇÃO DO MODELO
// ============================================================================
const Paciente = sequelize.define('Paciente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único do paciente'
    },
    nome: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome é obrigatório' },
            len: { args: [3, 200], msg: 'Nome deve ter entre 3 e 200 caracteres' }
        },
        comment: 'Nome completo do paciente'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'E-mail inválido' },
            notEmpty: { msg: 'E-mail é obrigatório' }
        },
        comment: 'E-mail do paciente (usado para login)'
    },
    senha: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Senha é obrigatória' },
            len: { args: [6, 255], msg: 'Senha deve ter pelo menos 6 caracteres' }
        },
        comment: 'Hash da senha do paciente'
    },
    cpf: {
        type: DataTypes.STRING(14),
        allowNull: true,
        unique: true,
        validate: {
            is: { args: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, msg: 'CPF inválido' }
        },
        comment: 'CPF do paciente'
    },
    data_nascimento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Data de nascimento inválida' },
            isBefore: { args: new Date().toISOString(), msg: 'Data de nascimento deve ser no passado' }
        },
        comment: 'Data de nascimento do paciente'
    },
    genero: {
        type: DataTypes.ENUM('Feminino', 'Masculino', 'Outro', 'Prefiro não informar'),
        defaultValue: 'Prefiro não informar',
        comment: 'Gênero do paciente'
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Telefone para contato'
    },
    endereco: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Endereço completo do paciente'
    },
    cep: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'CEP do endereço'
    },
    cidade: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Cidade do paciente'
    },
    estado: {
        type: DataTypes.STRING(2),
        allowNull: true,
        comment: 'UF do estado'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Status ativo/inativo do paciente'
    },
    ultimo_login: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data e hora do último login'
    },
    token_recuperacao: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Token para recuperação de senha'
    },
    token_recuperacao_expira: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data de expiração do token de recuperação'
    },
    aceita_comunicacoes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Aceita receber comunicações por e-mail'
    },
    observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observações gerais sobre o paciente'
    },
    tipo_usuario: {
        type: DataTypes.ENUM('paciente', 'admin'),
        defaultValue: 'paciente',
        comment: 'Perfil de acesso do usuário'
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica se o usuário possui acesso administrativo'
    }
}, {
    tableName: 'pacientes',
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft delete
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['cpf'], unique: true },
        { fields: ['ativo'] },
        { fields: ['tipo_usuario'] },
        { fields: ['created_at'] }
    ],
    hooks: {
        beforeCreate: async (paciente) => {
            if (paciente.senha) {
                paciente.senha = await bcrypt.hash(paciente.senha, 10);
            }
        },
        beforeUpdate: async (paciente) => {
            if (paciente.changed('senha')) {
                paciente.senha = await bcrypt.hash(paciente.senha, 10);
            }
        }
    }
});

// ============================================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================================

/**
 * Verificar se a senha está correta
 * @param {string} senha - Senha fornecida pelo usuário
 * @returns {Promise<boolean>} Verdadeiro se a senha for válida
 */
Paciente.prototype.validarSenha = async function(senha) {
    return await bcrypt.compare(senha, this.senha);
};

/**
 * Atualizar último login
 */
Paciente.prototype.atualizarUltimoLogin = async function() {
    this.ultimo_login = new Date();
    await this.save();
};

/**
 * Obter dados públicos do paciente (sem senha)
 */
Paciente.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.senha;
    delete values.token_recuperacao;
    delete values.token_recuperacao_expira;
    return values;
};

// ============================================================================
// MÉTODOS ESTÁTICOS
// ============================================================================

/**
 * Buscar paciente por e-mail
 * @param {string} email - E-mail do paciente
 * @returns {Promise<Paciente|null>}
 */
Paciente.findByEmail = async function(email) {
    return await this.findOne({ where: { email, ativo: true } });
};

/**
 * Buscar paciente por CPF
 * @param {string} cpf - CPF do paciente
 * @returns {Promise<Paciente|null>}
 */
Paciente.findByCPF = async function(cpf) {
    return await this.findOne({ where: { cpf, ativo: true } });
};

/**
 * Buscar pacientes ativos
 * @param {Object} options - Opções de paginação
 * @returns {Promise<Object>}
 */
Paciente.findActive = async function({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { count, rows } = await this.findAndCountAll({
        where: { ativo: true },
        limit,
        offset,
        order: [['nome', 'ASC']]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        pacientes: rows
    };
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = Paciente;