/**
 * ============================================================================
 * ARQUIVO: pacienteController.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Controlador para gerenciamento de pacientes (perfil, dados, etc)
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const { Paciente, Agendamento, Exame, Medico } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ============================================================================
// CONTROLADOR: OBTER PERFIL DO PACIENTE LOGADO
// ============================================================================
exports.obterPerfil = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: ATUALIZAR PERFIL DO PACIENTE
// ============================================================================
exports.atualizarPerfil = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: ALTERAR SENHA (VIA PERFIL)
// ============================================================================
exports.alterarSenha = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: OBTER HISTÓRICO DE AGENDAMENTOS DO PACIENTE
// ============================================================================
exports.obterAgendamentos = async (req, res) => {
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
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto', 'especialidade_id'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] }
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
};

// ============================================================================
// CONTROLADOR: OBTER PRÓXIMAS CONSULTAS DO PACIENTE
// ============================================================================
exports.obterProximasConsultas = async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];

        const agendamentos = await Agendamento.findAll({
            where: {
                paciente_id: req.usuario.id,
                data: { [Op.gte]: hoje },
                status: { [Op.in]: ['agendado', 'confirmado'] }
            },
            include: [
                { model: Medico, as: 'medico', attributes: ['id', 'nome', 'crm', 'foto', 'especialidade_id'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'preco', 'duracao'] }
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
};

// ============================================================================
// CONTROLADOR: OBTER HISTÓRICO DE EXAMES DO PACIENTE
// ============================================================================
exports.obterExames = async (req, res) => {
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
                { model: Medico, as: 'medico', attributes: ['id', 'nome'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome', 'descricao', 'preco'] }
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
};

// ============================================================================
// CONTROLADOR: OBTER ESTATÍSTICAS DO PACIENTE
// ============================================================================
exports.obterEstatisticas = async (req, res) => {
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
                { model: Medico, as: 'medico', attributes: ['id', 'nome'] },
                { model: Exame, as: 'exame', attributes: ['id', 'nome'] }
            ]
        });

        // Valor total gasto
        const agendamentosRealizados = await Agendamento.findAll({
            where: { paciente_id, status: 'realizado' },
            attributes: ['valor']
        });
        
        const totalGasto = agendamentosRealizados.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);

        return res.json({
            success: true,
            estatisticas: {
                total_consultas: totalConsultas,
                consultas_realizadas: consultasRealizadas,
                consultas_futuras: consultasFuturas,
                consultas_canceladas: consultasCanceladas,
                total_gasto: totalGasto,
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
};

// ============================================================================
// CONTROLADOR: BUSCAR PACIENTE POR ID (APENAS PRÓPRIO PERFIL)
// ============================================================================
exports.buscarPacientePorId = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: DESATIVAR CONTA (SOFT DELETE)
// ============================================================================
exports.desativarConta = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: REATIVAR CONTA
// ============================================================================
exports.reativarConta = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'E-mail e senha são obrigatórios'
            });
        }

        const paciente = await Paciente.findOne({ where: { email, ativo: false } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Conta não encontrada ou já ativa'
            });
        }

        // Validar senha
        const senhaValida = await bcrypt.compare(senha, paciente.senha);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Senha incorreta'
            });
        }

        // Reativar conta
        await paciente.update({ ativo: true });

        return res.json({
            success: true,
            message: 'Conta reativada com sucesso! Faça login para continuar.'
        });

    } catch (error) {
        console.error('Erro ao reativar conta:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao reativar conta'
        });
    }
};