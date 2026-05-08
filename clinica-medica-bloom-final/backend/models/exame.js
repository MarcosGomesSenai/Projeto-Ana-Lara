/**
 * ============================================================================
 * ARQUIVO: Exame.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Modelo de Exame para o banco de dados
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
const Exame = sequelize.define('Exame', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único do exame'
    },
    nome: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome do exame é obrigatório' }
        },
        comment: 'Nome do exame'
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada do exame'
    },
    categoria: {
        type: DataTypes.ENUM('Ultrassonografia', 'Análise Clínica', 'Imagem', 'Cardiologia', 'Outros'),
        defaultValue: 'Outros',
        comment: 'Categoria do exame'
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Preço do exame para particular'
    },
    duracao: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Duração estimada do exame em minutos'
    },
    preparo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Instruções de preparo para o exame'
    },
    contraindicacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Contraindicações do exame'
    },
    resultado_entrega: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Prazo para entrega do resultado'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Status ativo/inativo do exame'
    },
    imagem: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL da imagem ilustrativa do exame'
    },
    ordem_exibicao: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Ordem de exibição no site'
    }
}, {
    tableName: 'exames',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
        { fields: ['nome'] },
        { fields: ['categoria'] },
        { fields: ['ativo'] },
        { fields: ['ordem_exibicao'] }
    ]
});

// ============================================================================
// MÉTODOS DE INSTÂNCIA
// ============================================================================

/**
 * Obter dados públicos do exame
 */
Exame.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.created_at;
    delete values.updated_at;
    delete values.deleted_at;
    return values;
};

/**
 * Formatar preço para exibição
 * @returns {string}
 */
Exame.prototype.precoFormatado = function() {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(this.preco);
};

// ============================================================================
// MÉTODOS ESTÁTICOS
// ============================================================================

/**
 * Buscar exames por categoria
 * @param {string} categoria - Categoria do exame
 * @returns {Promise<Exame[]>}
 */
Exame.findByCategoria = async function(categoria) {
    return await this.findAll({
        where: { categoria, ativo: true },
        order: [['ordem_exibicao', 'ASC'], ['nome', 'ASC']]
    });
};

/**
 * Buscar exames ativos com paginação
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>}
 */
Exame.findActive = async function({ page = 1, limit = 20, categoria = null, search = null } = {}) {
    const offset = (page - 1) * limit;
    const where = { ativo: true };
    
    if (categoria) {
        where.categoria = categoria;
    }
    
    if (search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
            { nome: { [Op.like]: `%${search}%` } },
            { descricao: { [Op.like]: `%${search}%` } }
        ];
    }
    
    const { count, rows } = await this.findAndCountAll({
        where,
        limit,
        offset,
        order: [['ordem_exibicao', 'ASC'], ['nome', 'ASC']]
    });
    
    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        exames: rows
    };
};

/**
 * Buscar exames em destaque (para homepage)
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Exame[]>}
 */
Exame.findDestaque = async function(limit = 8) {
    return await this.findAll({
        where: { ativo: true },
        order: [['ordem_exibicao', 'ASC']],
        limit
    });
};

/**
 * Buscar exames realizados por um médico
 * @param {number} medicoId - ID do médico
 * @returns {Promise<Exame[]>}
 */
Exame.findByMedico = async function(medicoId) {
    const { Medico } = require('./Medico');
    
    const medico = await Medico.findByPk(medicoId, {
        include: [{
            association: 'exames_realizados',
            through: { attributes: [] }
        }]
    });
    
    return medico ? medico.exames_realizados : [];
};

/**
 * Buscar exames por IDs
 * @param {number[]} ids - Array de IDs
 * @returns {Promise<Exame[]>}
 */
Exame.findByIds = async function(ids) {
    return await this.findAll({
        where: {
            id: ids,
            ativo: true
        },
        order: [['nome', 'ASC']]
    });
};

/**
 * Obter todas as categorias disponíveis
 * @returns {Promise<string[]>}
 */
Exame.getCategorias = async function() {
    const categorias = await this.findAll({
        where: { ativo: true },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('categoria')), 'categoria']],
        raw: true
    });
    
    return categorias.map(c => c.categoria).filter(Boolean);
};

// ============================================================================
// DADOS DE EXEMPLO PARA POPULAR O BANCO
// ============================================================================
Exame.exemplosIniciais = [
    {
        nome: 'Ultrassonografia Obstétrica',
        descricao: 'Exame de imagem que permite visualizar o feto, avaliar o desenvolvimento gestacional e identificar possíveis anomalias.',
        categoria: 'Ultrassonografia',
        preco: 250.00,
        duracao: 30,
        preparo: 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 1
    },
    {
        nome: 'Ultrassom Morfológico (1º Trimestre)',
        descricao: 'Exame detalhado para avaliar a anatomia fetal no primeiro trimestre da gestação.',
        categoria: 'Ultrassonografia',
        preco: 380.00,
        duracao: 45,
        preparo: 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 2
    },
    {
        nome: 'Ultrassom Morfológico (2º Trimestre)',
        descricao: 'Exame detalhado para avaliar a anatomia fetal no segundo trimestre da gestação.',
        categoria: 'Ultrassonografia',
        preco: 380.00,
        duracao: 45,
        preparo: 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 3
    },
    {
        nome: 'Ultrassom 3D/4D',
        descricao: 'Exame que gera imagens tridimensionais do feto, permitindo visualizar detalhes do rosto e movimentos.',
        categoria: 'Ultrassonografia',
        preco: 450.00,
        duracao: 40,
        preparo: 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 4
    },
    {
        nome: 'Ultrassom Doppler',
        descricao: 'Exame que avalia o fluxo sanguíneo nos vasos do feto, cordão umbilical e útero.',
        categoria: 'Ultrassonografia',
        preco: 300.00,
        duracao: 35,
        preparo: 'Jejum de 4 horas.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 5
    },
    {
        nome: 'Hemograma Completo',
        descricao: 'Exame de sangue que avalia as células sanguíneas, identificando anemias, infecções e outras condições.',
        categoria: 'Análise Clínica',
        preco: 60.00,
        duracao: 15,
        preparo: 'Jejum de 8 horas.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 6
    },
    {
        nome: 'Glicemia em Jejum',
        descricao: 'Exame que mede o nível de açúcar no sangue, importante para diagnóstico de diabetes gestacional.',
        categoria: 'Análise Clínica',
        preco: 30.00,
        duracao: 10,
        preparo: 'Jejum de 8 horas.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 7
    },
    {
        nome: 'Curva Glicêmica (TOTG)',
        descricao: 'Exame para diagnóstico de diabetes gestacional, com medição da glicemia após ingestão de glicose.',
        categoria: 'Análise Clínica',
        preco: 90.00,
        duracao: 120,
        preparo: 'Jejum de 8 horas. O exame dura 2 horas com coletas de sangue em jejum, 1h e 2h após ingestão de glicose.',
        resultado_entrega: '48 horas úteis',
        ordem_exibicao: 8
    },
    {
        nome: 'Tipagem Sanguínea e Fator Rh',
        descricao: 'Exame que determina o tipo sanguíneo e o fator Rh da gestante.',
        categoria: 'Análise Clínica',
        preco: 45.00,
        duracao: 10,
        preparo: 'Jejum de 4 horas.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 9
    },
    {
        nome: 'Sorologias Pré-natal (HIV, Sífilis, Hepatites)',
        descricao: 'Conjunto de exames para rastreamento de doenças infecciosas na gestação.',
        categoria: 'Análise Clínica',
        preco: 180.00,
        duracao: 15,
        preparo: 'Jejum de 8 horas.',
        resultado_entrega: '3 dias úteis',
        ordem_exibicao: 10
    },
    {
        nome: 'Exame de Urina Tipo I',
        descricao: 'Exame que avalia a presença de infecções urinárias e outras alterações renais.',
        categoria: 'Análise Clínica',
        preco: 35.00,
        duracao: 10,
        preparo: 'Coleta do primeiro jato da manhã. Higiene íntima antes da coleta.',
        resultado_entrega: '24 horas úteis',
        ordem_exibicao: 11
    },
    {
        nome: 'Cardiotocografia (CTG)',
        descricao: 'Exame que monitora os batimentos cardíacos do feto e as contrações uterinas.',
        categoria: 'Cardiologia',
        preco: 200.00,
        duracao: 30,
        preparo: 'Não necessita de preparo especial.',
        resultado_entrega: 'Imediato',
        ordem_exibicao: 12
    },
    {
        nome: 'Preventivo (Papanicolau)',
        descricao: 'Exame ginecológico para rastreamento do câncer de colo de útero.',
        categoria: 'Outros',
        preco: 80.00,
        duracao: 15,
        preparo: 'Não estar menstruada. Evitar relação sexual 48h antes. Não usar cremes ou duchas 48h antes.',
        resultado_entrega: '7 dias úteis',
        ordem_exibicao: 13
    }
];

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = Exame;