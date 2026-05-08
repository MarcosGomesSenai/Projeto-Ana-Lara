/**
 * ============================================================================
 * ARQUIVO: medicos.js (Routes)
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Rotas para gerenciamento de médicos
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const express = require('express');
const router = express.Router();
const { Medico, Especialidade, Exame } = require('../models');
const { Op } = require('sequelize');

// ============================================================================
// ROTA: LISTAR TODOS OS MÉDICOS
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const { especialidade, busca, page = 1, limit = 12 } = req.query;
        
        const where = { ativo: true };
        
        if (especialidade) {
            where.especialidade_id = especialidade;
        }
        
        if (busca) {
            where[Op.or] = [
                { nome: { [Op.like]: `%${busca}%` } },
                { crm: { [Op.like]: `%${busca}%` } }
            ];
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await Medico.findAndCountAll({
            where,
            include: [
                {
                    model: Especialidade,
                    as: 'especialidade_info',
                    attributes: ['id', 'nome']
                }
            ],
            attributes: ['id', 'nome', 'crm', 'foto', 'especialidade_id', 'avaliacao', 'total_avaliacoes', 'experiencia_anos', 'disponivel', 'resumo'],
            limit: parseInt(limit),
            offset,
            order: [['nome', 'ASC']]
        });
        
        return res.json({
            success: true,
            medicos: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar médicos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar médicos'
        });
    }
});

// ============================================================================
// ROTA: BUSCAR MÉDICO POR ID
// ============================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const medico = await Medico.findOne({
            where: { id, ativo: true },
            include: [
                {
                    model: Especialidade,
                    as: 'especialidade_info',
                    attributes: ['id', 'nome', 'descricao']
                },
                {
                    model: Exame,
                    as: 'exames_realizados',
                    attributes: ['id', 'nome', 'descricao', 'preco', 'duracao', 'preparo'],
                    through: { attributes: [] }
                }
            ]
        });
        
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        return res.json({
            success: true,
            medico
        });
        
    } catch (error) {
        console.error('Erro ao buscar médico:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do médico'
        });
    }
});

// ============================================================================
// ROTA: BUSCAR EXAMES DO MÉDICO
// ============================================================================
router.get('/:id/exames', async (req, res) => {
    try {
        const { id } = req.params;
        
        const medico = await Medico.findByPk(id, {
            include: [
                {
                    model: Exame,
                    as: 'exames_realizados',
                    attributes: ['id', 'nome', 'descricao', 'preco', 'duracao', 'preparo'],
                    through: { attributes: [] }
                }
            ]
        });
        
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        return res.json({
            success: true,
            exames: medico.exames_realizados || []
        });
        
    } catch (error) {
        console.error('Erro ao buscar exames do médico:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar exames'
        });
    }
});

// ============================================================================
// ROTA: BUSCAR HORÁRIOS DISPONÍVEIS
// ============================================================================
router.get('/:id/horarios', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.query;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data é obrigatória'
            });
        }
        
        const medico = await Medico.findByPk(id);
        
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        // Verificar dia da semana
        const dataObj = new Date(data);
        const diaSemana = dataObj.getDay();
        const diasAtendimento = medico.dias_atendimento ? medico.dias_atendimento.split(',').map(Number) : [1, 2, 3, 4, 5];
        const diaAjustado = diaSemana === 0 ? 7 : diaSemana;
        
        if (!diasAtendimento.includes(diaAjustado)) {
            return res.json({
                success: true,
                horarios: [],
                message: 'Médico não atende neste dia'
            });
        }
        
        // Buscar agendamentos existentes
        const Agendamento = require('../models/Agendamento');
        const agendamentos = await Agendamento.findAll({
            where: {
                medico_id: id,
                data: data,
                status: { [Op.ne]: 'cancelado' }
            }
        });
        
        const horariosOcupados = agendamentos.map(a => a.horario);
        
        // Gerar horários disponíveis
        const horarioInicio = medico.horario_inicio || '08:00:00';
        const horarioFim = medico.horario_fim || '18:00:00';
        const intervalo = medico.intervalo_consulta || 30;
        
        const horariosDisponiveis = gerarHorarios(horarioInicio, horarioFim, intervalo, horariosOcupados);
        
        return res.json({
            success: true,
            horarios: horariosDisponiveis,
            medico: {
                id: medico.id,
                nome: medico.nome
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar horários:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar horários disponíveis'
        });
    }
});

// ============================================================================
// FUNÇÃO AUXILIAR: GERAR HORÁRIOS
// ============================================================================
function gerarHorarios(horarioInicio, horarioFim, intervaloMinutos, horariosOcupados = []) {
    const horarios = [];
    
    const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFim.split(':').map(Number);
    
    let horaAtual = horaInicio;
    let minAtual = minInicio;
    
    while (horaAtual < horaFim || (horaAtual === horaFim && minAtual < minFim)) {
        const horarioFormatado = `${horaAtual.toString().padStart(2, '0')}:${minAtual.toString().padStart(2, '0')}`;
        
        if (!horariosOcupados.includes(horarioFormatado)) {
            horarios.push(horarioFormatado);
        }
        
        minAtual += intervaloMinutos;
        if (minAtual >= 60) {
            horaAtual++;
            minAtual -= 60;
        }
    }
    
    return horarios;
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = router;