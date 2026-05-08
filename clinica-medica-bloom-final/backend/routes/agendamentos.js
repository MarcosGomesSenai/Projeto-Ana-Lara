/**
 * ============================================================================
 * ARQUIVO: agendamentos.js (Routes)
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Rotas para gerenciamento de agendamentos de consultas
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const express = require('express');
const router = express.Router();
const { Agendamento, Medico, Paciente, Exame } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

// ============================================================================
// ROTA: CRIAR NOVO AGENDAMENTO
// ============================================================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { medico_id, exame_id, data, horario, observacoes } = req.body;
        const paciente_id = req.usuario.id;

        // Validações
        if (!medico_id || !exame_id || !data || !horario) {
            return res.status(400).json({
                success: false,
                message: 'Médico, exame, data e horário são obrigatórios'
            });
        }

        // Verificar se médico existe
        const medico = await Medico.findOne({ where: { id: medico_id, ativo: true } });
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        // Verificar se exame existe
        const exame = await Exame.findByPk(exame_id);
        if (!exame) {
            return res.status(404).json({
                success: false,
                message: 'Exame não encontrado'
            });
        }

        // Verificar conflito de horário
        const agendamentoExistente = await Agendamento.findOne({
            where: {
                medico_id,
                data,
                horario,
                status: { [Op.ne]: 'cancelado' }
            }
        });

        if (agendamentoExistente) {
            return res.status(409).json({
                success: false,
                message: 'Horário já ocupado. Escolha outro horário.'
            });
        }

        // Criar agendamento
        const agendamento = await Agendamento.create({
            paciente_id,
            medico_id,
            exame_id,
            data,
            horario,
            status: 'agendado',
            valor: exame.preco,
            observacoes,
            data_agendamento: new Date()
        });

        // Buscar agendamento com relacionamentos
        const agendamentoCompleto = await Agendamento.findByPk(agendamento.id, {
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'especialidade_id'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] },
                { model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'email', 'telefone'] }
            ]
        });

        return res.status(201).json({
            success: true,
            message: 'Agendamento realizado com sucesso!',
            agendamento: agendamentoCompleto
        });

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao criar agendamento'
        });
    }
});

// ============================================================================
// ROTA: LISTAR AGENDAMENTOS DO PACIENTE LOGADO
// ============================================================================
router.get('/paciente', authMiddleware, async (req, res) => {
    try {
        const paciente_id = req.usuario.id;
        const { status, page = 1, limit = 10 } = req.query;

        const where = { paciente_id };
        
        if (status) {
            where.status = status;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Agendamento.findAndCountAll({
            where,
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['data', 'DESC'], ['horario', 'ASC']]
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
        console.error('Erro ao listar agendamentos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar agendamentos'
        });
    }
});

// ============================================================================
// ROTA: LISTAR AGENDAMENTOS DE UM PACIENTE ESPECÍFICO (ADMIN)
// ============================================================================
router.get('/paciente/:paciente_id', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        // Verificar se é o próprio paciente (permissão)
        if (req.usuario.id !== parseInt(paciente_id)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const where = { paciente_id };
        
        if (status) {
            where.status = status;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Agendamento.findAndCountAll({
            where,
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['data', 'DESC'], ['horario', 'ASC']]
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
        console.error('Erro ao listar agendamentos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar agendamentos'
        });
    }
});

// ============================================================================
// ROTA: LISTAR AGENDAMENTOS DE UM MÉDICO
// ============================================================================
router.get('/medico/:medico_id', authMiddleware, async (req, res) => {
    try {
        const { medico_id } = req.params;
        const { data, page = 1, limit = 20 } = req.query;

        const where = { medico_id };
        
        if (data) {
            where.data = data;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Agendamento.findAndCountAll({
            where,
            include: [
                { model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'email', 'telefone'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['data', 'ASC'], ['horario', 'ASC']]
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
        console.error('Erro ao listar agendamentos do médico:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar agendamentos'
        });
    }
});

// ============================================================================
// ROTA: BUSCAR AGENDAMENTO POR ID
// ============================================================================
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const agendamento = await Agendamento.findByPk(id, {
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto', 'especialidade_id'] },
                { model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'email', 'telefone', 'cpf'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao', 'preparo'] }
            ]
        });

        if (!agendamento) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        // Verificar permissão (próprio paciente ou admin)
        if (agendamento.paciente_id !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        return res.json({
            success: true,
            agendamento
        });

    } catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar agendamento'
        });
    }
});

// ============================================================================
// ROTA: CANCELAR AGENDAMENTO
// ============================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const agendamento = await Agendamento.findByPk(id);

        if (!agendamento) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        // Verificar permissão
        if (agendamento.paciente_id !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Verificar se já foi realizado
        if (agendamento.status === 'realizado') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar uma consulta já realizada'
            });
        }

        // Verificar antecedência mínima (24h)
        const dataAgendamento = new Date(agendamento.data + ' ' + agendamento.horario);
        const agora = new Date();
        const horasDiferenca = (dataAgendamento - agora) / (1000 * 60 * 60);

        if (horasDiferenca < 24 && agendamento.status === 'agendado') {
            return res.status(400).json({
                success: false,
                message: 'Cancelamento deve ser feito com pelo menos 24 horas de antecedência'
            });
        }

        // Atualizar status
        await agendamento.update({ status: 'cancelado' });

        return res.json({
            success: true,
            message: 'Agendamento cancelado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao cancelar agendamento'
        });
    }
});

// ============================================================================
// ROTA: REAGENDAR CONSULTA
// ============================================================================
router.put('/:id/reagendar', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, horario } = req.body;

        if (!data || !horario) {
            return res.status(400).json({
                success: false,
                message: 'Nova data e horário são obrigatórios'
            });
        }

        const agendamento = await Agendamento.findByPk(id);

        if (!agendamento) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        // Verificar permissão
        if (agendamento.paciente_id !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Verificar conflito de horário
        const conflito = await Agendamento.findOne({
            where: {
                medico_id: agendamento.medico_id,
                data,
                horario,
                status: { [Op.ne]: 'cancelado' },
                id: { [Op.ne]: id }
            }
        });

        if (conflito) {
            return res.status(409).json({
                success: false,
                message: 'Horário já ocupado. Escolha outro horário.'
            });
        }

        // Atualizar agendamento
        await agendamento.update({
            data,
            horario,
            status: 'reagendado'
        });

        return res.json({
            success: true,
            message: 'Consulta reagendada com sucesso',
            agendamento
        });

    } catch (error) {
        console.error('Erro ao reagendar:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao reagendar consulta'
        });
    }
});

// ============================================================================
// ROTA: CONFIRMAR AGENDAMENTO (PRESENÇA)
// ============================================================================
router.put('/:id/confirmar', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const agendamento = await Agendamento.findByPk(id);

        if (!agendamento) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        if (agendamento.paciente_id !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        if (agendamento.status !== 'agendado') {
            return res.status(400).json({
                success: false,
                message: 'Apenas agendamentos pendentes podem ser confirmados'
            });
        }

        await agendamento.update({ status: 'confirmado' });

        return res.json({
            success: true,
            message: 'Consulta confirmada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao confirmar agendamento'
        });
    }
});

// ============================================================================
// ROTA: VERIFICAR DISPONIBILIDADE DE HORÁRIO
// ============================================================================
router.get('/disponibilidade', async (req, res) => {
    try {
        const { medico_id, data, horario } = req.query;

        if (!medico_id || !data || !horario) {
            return res.status(400).json({
                success: false,
                message: 'Médico, data e horário são obrigatórios'
            });
        }

        const agendamento = await Agendamento.findOne({
            where: {
                medico_id,
                data,
                horario,
                status: { [Op.ne]: 'cancelado' }
            }
        });

        return res.json({
            success: true,
            disponivel: !agendamento
        });

    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade'
        });
    }
});

// ============================================================================
// ROTA: PRÓXIMAS CONSULTAS DO PACIENTE
// ============================================================================
router.get('/proximas/consultas', authMiddleware, async (req, res) => {
    try {
        const paciente_id = req.usuario.id;
        const hoje = new Date().toISOString().split('T')[0];

        const agendamentos = await Agendamento.findAll({
            where: {
                paciente_id,
                data: { [Op.gte]: hoje },
                status: { [Op.in]: ['agendado', 'confirmado'] }
            },
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome'] }
            ],
            order: [['data', 'ASC'], ['horario', 'ASC']],
            limit: 5
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
// EXPORTAÇÕES
// ============================================================================
module.exports = router;