/**
 * ============================================================================
 * ARQUIVO: database.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Configuração e conexão com o banco de dados MySQL usando Sequelize
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const { Sequelize } = require('sequelize');
require('dotenv').config();

// ============================================================================
// CONFIGURAÇÕES DO BANCO DE DADOS
// ============================================================================

// Configurações por ambiente
const config = {
    development: {
        database: process.env.DB_NAME || 'bloom_maternity',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log,
        define: {
            timestamps: true,
            underscored: true,
            underscoredAll: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            paranoid: true // Soft delete
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        timezone: '-03:00' // Horário de Brasília
    },

    test: {
        database: process.env.DB_NAME_TEST || 'bloom_maternity_test',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            paranoid: true
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },

    production: {
        database: process.env.DB_NAME_PROD,
        username: process.env.DB_USER_PROD,
        password: process.env.DB_PASSWORD_PROD,
        host: process.env.DB_HOST_PROD,
        port: process.env.DB_PORT_PROD || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            paranoid: true
        },
        pool: {
            max: 20,
            min: 5,
            acquire: 60000,
            idle: 10000
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};

// ============================================================================
// AMBIENTE ATUAL
// ============================================================================
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// ============================================================================
// INICIALIZAÇÃO DO SEQUELIZE
// ============================================================================
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        define: dbConfig.define,
        pool: dbConfig.pool,
        timezone: dbConfig.timezone,
        dialectOptions: dbConfig.dialectOptions || {}
    }
);

// ============================================================================
// TESTE DE CONEXÃO
// ============================================================================
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
        console.log(`📊 Banco: ${dbConfig.database} | Ambiente: ${env}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error.message);
        console.error('Detalhes:', error);
        return false;
    }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Sincronizar modelos com o banco de dados
 * @param {boolean} force - Se deve recriar as tabelas (apenas desenvolvimento)
 */
async function syncDatabase(force = false) {
    try {
        if (force && env === 'development') {
            await sequelize.sync({ force: true, alter: true });
            console.log('🔄 Banco de dados sincronizado com force=true');
        } else if (env === 'development') {
            await sequelize.sync({ alter: true });
            console.log('🔄 Banco de dados sincronizado com alter=true');
        } else {
            await sequelize.sync();
            console.log('🔄 Banco de dados sincronizado');
        }
        return true;
    } catch (error) {
        console.error('❌ Erro ao sincronizar banco de dados:', error);
        return false;
    }
}

/**
 * Fechar conexão com o banco de dados
 */
async function closeConnection() {
    try {
        await sequelize.close();
        console.log('🔌 Conexão com o banco de dados fechada');
    } catch (error) {
        console.error('❌ Erro ao fechar conexão:', error);
    }
}

/**
 * Verificar saúde do banco de dados
 */
async function healthCheck() {
    try {
        await sequelize.query('SELECT 1');
        return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
        return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
}

/**
 * Executar query raw
 * @param {string} query - Query SQL
 * @param {Object} options - Opções da query
 */
async function rawQuery(query, options = {}) {
    try {
        const [results, metadata] = await sequelize.query(query, options);
        return { success: true, results, metadata };
    } catch (error) {
        console.error('❌ Erro na query:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Iniciar transação
 */
async function beginTransaction() {
    return await sequelize.transaction();
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = {
    sequelize,
    Sequelize,
    config: dbConfig,
    testConnection,
    syncDatabase,
    closeConnection,
    healthCheck,
    rawQuery,
    beginTransaction,
    env
};