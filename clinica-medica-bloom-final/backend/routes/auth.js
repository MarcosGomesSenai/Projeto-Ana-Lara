/**
 * ============================================================================
 * ARQUIVO: auth.js (Routes)
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Rotas de autenticação (login, cadastro, recuperação de senha)
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Paciente } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// ============================================================================
// CONSTANTES
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'bloom_maternity_secret_key_2024';
const JWT_EXPIRES_IN = '7d';

// ============================================================================
// FUNÇÃO AUXILIAR: GERAR TOKEN
// ============================================================================
function gerarToken(usuario) {
    const payload = {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ============================================================================
// ROTA: CADASTRO DE PACIENTE
// ============================================================================
router.post('/register', async (req, res) => {
    try {
        const { nome, email, senha, cpf, data_nascimento, genero, telefone, endereco } = req.body;

        // Validações básicas
        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Nome, e-mail e senha são obrigatórios'
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }

        // Verificar se e-mail já existe
        const emailExistente = await Paciente.findOne({ where: { email } });
        if (emailExistente) {
            return res.status(400).json({
                success: false,
                message: 'E-mail já cadastrado'
            });
        }

        // Verificar se CPF já existe
        if (cpf) {
            const cpfExistente = await Paciente.findOne({ where: { cpf } });
            if (cpfExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'CPF já cadastrado'
                });
            }
        }

        // Criptografar senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Criar paciente
        const paciente = await Paciente.create({
            nome,
            email,
            senha: hashedPassword,
            cpf,
            data_nascimento,
            genero,
            telefone,
            endereco,
            ativo: true
        });

        // Gerar token
        const token = gerarToken(paciente);

        // Remover senha da resposta
        const pacienteData = {
            id: paciente.id,
            nome: paciente.nome,
            email: paciente.email,
            cpf: paciente.cpf,
            data_nascimento: paciente.data_nascimento,
            genero: paciente.genero,
            telefone: paciente.telefone,
            endereco: paciente.endereco
        };

        return res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            token,
            usuario: pacienteData
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao cadastrar usuário'
        });
    }
});

// ============================================================================
// ROTA: LOGIN
// ============================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'E-mail e senha são obrigatórios'
            });
        }

        // Buscar paciente
        const paciente = await Paciente.findOne({ where: { email, ativo: true } });

        if (!paciente) {
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Validar senha
        const senhaValida = await bcrypt.compare(senha, paciente.senha);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Atualizar último login
        await paciente.update({ ultimo_login: new Date() });

        // Gerar token
        const token = gerarToken(paciente);

        // Dados do usuário (sem senha)
        const usuarioData = {
            id: paciente.id,
            nome: paciente.nome,
            email: paciente.email,
            cpf: paciente.cpf,
            telefone: paciente.telefone
        };

        return res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token,
            usuario: usuarioData
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao fazer login'
        });
    }
});

// ============================================================================
// ROTA: VALIDAR TOKEN
// ============================================================================
router.get('/validate', authMiddleware, async (req, res) => {
    return res.json({
        success: true,
        message: 'Token válido',
        usuario: req.usuario
    });
});

// ============================================================================
// ROTA: ALTERAR SENHA
// ============================================================================
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual e nova senha são obrigatórias'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }

        // Buscar paciente com a senha
        const paciente = await Paciente.findByPk(req.usuario.id);

        // Validar senha atual
        const senhaValida = await bcrypt.compare(currentPassword, paciente.senha);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Criptografar nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha
        await paciente.update({ senha: hashedPassword });

        return res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao alterar senha'
        });
    }
});

// ============================================================================
// ROTA: ESQUECI MINHA SENHA
// ============================================================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-mail é obrigatório'
            });
        }

        const paciente = await Paciente.findOne({ where: { email } });

        // Não revelar se o e-mail existe (segurança)
        if (!paciente) {
            return res.json({
                success: true,
                message: 'Se o e-mail estiver cadastrado, você receberá as instruções'
            });
        }

        // Gerar token de recuperação
        const token = crypto.randomBytes(32).toString('hex');
        const expiraEm = new Date();
        expiraEm.setHours(expiraEm.getHours() + 1);

        await paciente.update({
            token_recuperacao: token,
            token_recuperacao_expira: expiraEm
        });

        // Aqui você enviaria um e-mail com o link
        console.log(`Link de recuperação para ${email}: http://localhost:3000/reset-password.html?token=${token}`);

        return res.json({
            success: true,
            message: 'Se o e-mail estiver cadastrado, você receberá as instruções'
        });

    } catch (error) {
        console.error('Erro no forgot password:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação'
        });
    }
});

// ============================================================================
// ROTA: REDEFINIR SENHA
// ============================================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token e nova senha são obrigatórios'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }

        const paciente = await Paciente.findOne({
            where: {
                token_recuperacao: token,
                token_recuperacao_expira: { [Op.gt]: new Date() }
            }
        });

        if (!paciente) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await paciente.update({
            senha: hashedPassword,
            token_recuperacao: null,
            token_recuperacao_expira: null
        });

        return res.json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });

    } catch (error) {
        console.error('Erro no reset password:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao redefinir senha'
        });
    }
});

// ============================================================================
// ROTA: LOGOUT
// ============================================================================
router.post('/logout', authMiddleware, async (req, res) => {
    return res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = router;