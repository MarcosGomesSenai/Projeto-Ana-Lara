/**
 * ============================================================================
 * ARQUIVO: auth.js (Middleware)
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Middleware de autenticação JWT para proteger rotas da API
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const jwt = require('jsonwebtoken');
const { Paciente } = require('../models');

// ============================================================================
// CONSTANTES
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'bloom_maternity_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================================================
// FUNÇÕES DE TOKEN
// ============================================================================

/**
 * Gerar token JWT para o usuário
 * @param {Object} usuario - Dados do usuário
 * @returns {string} Token JWT
 */
function gerarToken(usuario) {
    const payload = {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo_usuario: usuario.tipo_usuario || 'paciente',
        is_admin: usuario.is_admin === true
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verificar token JWT
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado ou null
 */
function verificarToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de autenticação - Protege rotas que exigem login
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
async function authMiddleware(req, res, next) {
    try {
        // Obter token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação não fornecido'
            });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer '
        
        // Verificar token
        const decoded = verificarToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado. Faça login novamente.'
            });
        }
        
        // Buscar usuário no banco
        const usuario = await Paciente.findByPk(decoded.id, {
            attributes: { exclude: ['senha', 'token_recuperacao', 'token_recuperacao_expira'] }
        });
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        if (!usuario.ativo) {
            return res.status(401).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o suporte.'
            });
        }
        
        // Adicionar usuário à requisição
        req.usuario = usuario;
        req.usuarioId = usuario.id;
        
        next();
        
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao validar autenticação'
        });
    }
}

// ============================================================================
// MIDDLEWARE OPCIONAL (VERIFICA SE ESTÁ LOGADO MAS NÃO BLOQUEIA)
// ============================================================================

/**
 * Middleware opcional - Adiciona usuário se token for válido, mas não bloqueia
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
async function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verificarToken(token);
            
            if (decoded) {
                const usuario = await Paciente.findByPk(decoded.id, {
                    attributes: { exclude: ['senha', 'token_recuperacao', 'token_recuperacao_expira'] }
                });
                
                if (usuario && usuario.ativo) {
                    req.usuario = usuario;
                    req.usuarioId = usuario.id;
                }
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Erro no optional auth middleware:', error);
        next(); // Continua mesmo com erro
    }
}

// ============================================================================
// MIDDLEWARE DE ADMIN (PARA FUTURAS FUNCIONALIDADES)
// ============================================================================

/**
 * Middleware de admin - Verifica se usuário é administrador
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
async function adminMiddleware(req, res, next) {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: 'Autenticação necessária'
        });
    }

    const adminEmails = ['admin@bloommaternity.com.br', 'contato@bloommaternity.com.br'];
    const isAdmin = req.usuario.is_admin === true || req.usuario.tipo_usuario === 'admin' || adminEmails.includes(req.usuario.email);

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Permissão de administrador necessária.'
        });
    }

    next();
}

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE RECURSO PRÓPRIO
// ============================================================================

/**
 * Verifica se o usuário está acessando seu próprio recurso
 * @param {Function} getResourceId - Função para obter ID do recurso da requisição
 * @returns {Function} Middleware
 */
function ownResourceMiddleware(getResourceId) {
    return async (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Autenticação necessária'
            });
        }
        
        const resourceId = getResourceId(req);
        
        if (req.usuario.id !== resourceId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Você só pode acessar seus próprios recursos.'
            });
        }
        
        next();
    };
}

// ============================================================================
// MIDDLEWARE DE RATE LIMIT PARA LOGIN
// ============================================================================

// Store para tentativas de login
const loginAttempts = new Map();

/**
 * Middleware para limitar tentativas de login
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
function loginRateLimitMiddleware(req, res, next) {
    const email = req.body.email;
    const ip = req.ip;
    const key = `${email}_${ip}`;
    
    const now = Date.now();
    const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: now };
    
    // Resetar após 15 minutos
    if (now - attempts.firstAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
        attempts.firstAttempt = now;
    }
    
    if (attempts.count >= 5) {
        return res.status(429).json({
            success: false,
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
        });
    }
    
    req.loginAttempts = attempts;
    next();
}

/**
 * Registrar tentativa de login (sucesso ou falha)
 * @param {Object} req - Requisição Express
 * @param {boolean} success - Se a tentativa foi bem sucedida
 */
function recordLoginAttempt(req, success) {
    const email = req.body.email;
    const ip = req.ip;
    const key = `${email}_${ip}`;
    
    if (!success) {
        const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        loginAttempts.set(key, attempts);
    } else {
        loginAttempts.delete(key);
    }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware,
    ownResourceMiddleware,
    loginRateLimitMiddleware,
    recordLoginAttempt,
    gerarToken,
    verificarToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};