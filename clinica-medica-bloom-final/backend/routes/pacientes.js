/**
 * ============================================================================
 * ARQUIVO: pacientes.js (Routes)
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Rotas para gerenciamento de pacientes (perfil, dados, etc)
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const express = require('express');
const router = express.Router();
const { Paciente, Agendamento, Exame } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ============================================================================
// ROTA: OBTER PERFIL DO PACIENTE LOGADO
// ============================================================================
router.get('/perfil', authMiddleware, async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.usuario.id, {
            attributes: { exclude: ['senha', 'token_recuperacao', 'token_recuperacao_expira'] }
        });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        return res.json({
            success: true,
            paciente
        });

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do perfil'
        });
    }
});

// ============================================================================
// ROTA: ATUALIZAR PERFIL DO PACIENTE
// ============================================================================
router.put('/perfil', authMiddleware, async (req, res) => {
    try {
        const { nome, telefone, endereco, cep, cidade, estado, data_nascimento, genero, aceita_comunicacoes } = req.body;

        const paciente = await Paciente.findByPk(req.usuario.id);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        // Atualizar apenas campos permitidos
        await paciente.update({
            nome: nome || paciente.nome,
            telefone: telefone || paciente.telefone,
            endereco: endereco || paciente.endereco,
            cep: cep || paciente.cep,
            cidade: cidade || paciente.cidade,
            estado: estado || paciente.estado,
            data_nascimento: data_nascimento || paciente.data_nascimento,
            genero: genero || paciente.genero,
            aceita_comunicacoes: aceita_comunicacoes !== undefined ? aceita_comunicacoes : paciente.aceita_comunicacoes
        });

        const pacienteAtualizado = await Paciente.findByPk(req.usuario.id, {
            attributes: { exclude: ['senha', 'token_recuperacao', 'token_recuperacao_expira'] }
        });

        return res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            paciente: pacienteAtualizado
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil'
        });
    }
});

// ============================================================================
// ROTA: ALTERAR SENHA (VIA PERFIL)
// ============================================================================
router.put('/alterar-senha', authMiddleware, async (req, res) => {
    try {
        const { senha_atual, nova_senha } = req.body;

        if (!senha_atual || !nova_senha) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual e nova senha são obrigatórias'
            });
        }

        if (nova_senha.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }

        const paciente = await Paciente.findByPk(req.usuario.id);

        // Validar senha atual
        const senhaValida = await bcrypt.compare(senha_atual, paciente.senha);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Criptografar nova senha
        const hashedPassword = await bcrypt.hash(nova_senha, 10);
        await paciente.update({ senha: hashedPassword });

        return res.json({
            success: true,
            message: 'Senha alterada com sucesso'
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
// ROTA: OBTER HISTÓRICO DE AGENDAMENTOS DO PACIENTE
// ============================================================================
router.get('/agendamentos', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = { paciente_id: req.usuario.id };
        
        if (status) {
            where.status = status;
        }

        const { count, rows } = await Agendamento.findAndCountAll({
            where,
            include: [
                { model: require('../models/Medico'), as: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
                { model: require('../models/Exame'), as: 'exame', attributes: ['id', 'nome', 'preco'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['data', 'DESC'], ['horario', 'DESC']]
        });

        return res.json({
            success: true,
            agendamentos: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de agendamentos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico de agendamentos'
        });
    }
});

// ============================================================================
// ROTA: OBTER PRÓXIMAS CONSULTAS DO PACIENTE
// ============================================================================
router.get('/proximas-consultas', authMiddleware, async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];

        const agendamentos = await Agendamento.findAll({
            where: {
                paciente_id: req.usuario.id,
                data: { [Op.gte]: hoje },
                status: { [Op.in]: ['agendado', 'confirmado'] }
            },
            include: [
                { model: require('../models/Medico'), as: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
                { model: require('../models/Exame'), as: 'exame', attributes: ['id', 'nome', 'preco'] }
            ],
            order: [['data', 'ASC'], ['horario', 'ASC']],
            limit: 10
        });

        return res.json({
            success: true,
            proximas_consultas: agendamentos
        });

    } catch (error) {
        console.error('Erro ao buscar próximas consultas:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar próximas consultas'
        });
    }
});

// ============================================================================
// ROTA: OBTER HISTÓRICO DE EXAMES DO PACIENTE
// ============================================================================
router.get('/exames', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Buscar agendamentos com status "realizado" (exames concluídos)
        const { count, rows } = await Agendamento.findAndCountAll({
            where: {
                paciente_id: req.usuario.id,
                status: 'realizado'
            },
            include: [
                { model: require('../models/Medico'), as: 'medico', attributes: ['id', 'nome'] },
                { model: require('../models/Exame'), as: 'exame', attributes: ['id', 'nome', 'descricao'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['data', 'DESC']]
        });

        return res.json({
            success: true,
            exames: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de exames:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico de exames'
        });
    }
});

// ============================================================================
// ROTA: OBTER ESTATÍSTICAS DO PACIENTE
// ============================================================================
router.get('/estatisticas', authMiddleware, async (req, res) => {
    try {
        const paciente_id = req.usuario.id;

        // Total de consultas
        const totalConsultas = await Agendamento.count({
            where: { paciente_id }
        });

        // Consultas realizadas
        const consultasRealizadas = await Agendamento.count({
            where: { paciente_id, status: 'realizado' }
        });

        // Consultas agendadas (futuras)
        const hoje = new Date().toISOString().split('T')[0];
        const consultasFuturas = await Agendamento.count({
            where: {
                paciente_id,
                data: { [Op.gte]: hoje },
                status: { [Op.in]: ['agendado', 'confirmado'] }
            }
        });

        // Consultas canceladas
        const consultasCanceladas = await Agendamento.count({
            where: { paciente_id, status: 'cancelado' }
        });

        // Última consulta
        const ultimaConsulta = await Agendamento.findOne({
            where: { paciente_id, status: 'realizado' },
            order: [['data', 'DESC'], ['horario', 'DESC']],
            include: [
                { model: require('../models/Medico'), as: 'medico', attributes: ['id', 'nome'] },
                { model: require('../models/Exame'), as: 'exame', attributes: ['id', 'nome'] }
            ]
        });

        return res.json({
            success: true,
            estatisticas: {
                total_consultas: totalConsultas,
                consultas_realizadas: consultasRealizadas,
                consultas_futuras: consultasFuturas,
                consultas_canceladas: consultasCanceladas,
                ultima_consulta: ultimaConsulta
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

// ============================================================================
// ROTA: BUSCAR PACIENTE POR ID (APENAS PRÓPRIO PERFIL)
// ============================================================================
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se é o próprio paciente
        if (parseInt(id) !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const paciente = await Paciente.findByPk(id, {
            attributes: { exclude: ['senha', 'token_recuperacao', 'token_recuperacao_expira'] }
        });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        return res.json({
            success: true,
            paciente
        });

    } catch (error) {
        console.error('Erro ao buscar paciente:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do paciente'
        });
    }
});

// ============================================================================
// ROTA: DELETAR CONTA (DESATIVAR)
// ============================================================================
router.delete('/conta', authMiddleware, async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.usuario.id);

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        // Desativar conta (soft delete)
        await paciente.update({ ativo: false });

        return res.json({
            success: true,
            message: 'Conta desativada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao desativar conta:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao desativar conta'
        });
    }
});

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = router;