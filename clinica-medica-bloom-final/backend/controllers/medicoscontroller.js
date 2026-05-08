/**
 * ============================================================================
 * ARQUIVO: medicoController.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Controlador para gerenciamento de médicos
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const { Medico, Especialidade, Exame, Agendamento } = require('../models');
const { Op } = require('sequelize');

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
// CONTROLADOR: LISTAR TODOS OS MÉDICOS
// ============================================================================
exports.listarMedicos = async (req, res) => {
    try {
        const { especialidade, busca, disponivel, page = 1, limit = 12 } = req.query;
        
        const where = { ativo: true };
        
        if (especialidade) {
            where.especialidade_id = especialidade;
        }
        
        if (disponivel === 'true') {
            where.disponivel = true;
        }
        
        if (busca) {
            where[Op.or] = [
                { nome: { [Op.like]: `%${busca}%` } },
                { crm: { [Op.like]: `%${busca}%` } },
                { especialidade: { [Op.like]: `%${busca}%` } }
            ];
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await Medico.findAndCountAll({
            where,
            include: [
                {
                    model: Especialidade,
                    as: 'especialidade_info',
                    attributes: ['id', 'nome', 'descricao']
                }
            ],
            attributes: ['id', 'nome', 'crm', 'foto', 'especialidade_id', 'avaliacao', 'total_avaliacoes', 'experiencia_anos', 'disponivel', 'resumo', 'email', 'telefone'],
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
};

// ============================================================================
// CONTROLADOR: BUSCAR MÉDICO POR ID
// ============================================================================
exports.buscarMedicoPorId = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: BUSCAR EXAMES DO MÉDICO
// ============================================================================
exports.buscarExamesDoMedico = async (req, res) => {
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
};

// ============================================================================
// CONTROLADOR: BUSCAR HORÁRIOS DISPONÍVEIS DO MÉDICO
// ============================================================================
exports.buscarHorariosDisponiveis = async (req, res) => {
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
        const diaSemana = dataObj.getDay(); // 0=Domingo, 1=Segunda...
        const diasAtendimento = medico.dias_atendimento ? medico.dias_atendimento.split(',').map(Number) : [1, 2, 3, 4, 5];
        const diaAjustado = diaSemana === 0 ? 7 : diaSemana;
        
        if (!diasAtendimento.includes(diaAjustado)) {
            return res.json({
                success: true,
                horarios: [],
                message: 'Médico não atende neste dia da semana'
            });
        }
        
        // Buscar agendamentos existentes nesta data
        const agendamentos = await Agendamento.findAll({
            where: {
                medico_id: id,
                data: data,
                status: { [Op.ne]: 'cancelado' }
            }
        });
        
        const horariosOcupados = agendamentos.map(a => a.horario);
        
        // Gerar horários disponíveis baseados no expediente do médico
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
};

// ============================================================================
// CONTROLADOR: LISTAR MÉDICOS POR ESPECIALIDADE
// ============================================================================
exports.listarMedicosPorEspecialidade = async (req, res) => {
    try {
        const { especialidadeId } = req.params;
        
        const medicos = await Medico.findAll({
            where: {
                especialidade_id: especialidadeId,
                ativo: true,
                disponivel: true
            },
            include: [
                {
                    model: Especialidade,
                    as: 'especialidade_info',
                    attributes: ['id', 'nome']
                }
            ],
            attributes: ['id', 'nome', 'crm', 'foto', 'avaliacao', 'total_avaliacoes', 'experiencia_anos', 'resumo'],
            order: [['nome', 'ASC']]
        });
        
        return res.json({
            success: true,
            medicos
        });
        
    } catch (error) {
        console.error('Erro ao listar médicos por especialidade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar médicos'
        });
    }
};

// ============================================================================
// CONTROLADOR: LISTAR MÉDICOS DESTAQUE (PARA HOME)
// ============================================================================
exports.listarMedicosDestaque = async (req, res) => {
    try {
        const { limite = 8 } = req.query;
        
        const medicos = await Medico.findAll({
            where: {
                ativo: true,
                disponivel: true
            },
            include: [
                {
                    model: Especialidade,
                    as: 'especialidade_info',
                    attributes: ['id', 'nome']
                }
            ],
            attributes: ['id', 'nome', 'crm', 'foto', 'avaliacao', 'total_avaliacoes', 'experiencia_anos', 'resumo'],
            order: [['avaliacao', 'DESC'], ['total_avaliacoes', 'DESC']],
            limit: parseInt(limite)
        });
        
        return res.json({
            success: true,
            medicos
        });
        
    } catch (error) {
        console.error('Erro ao listar médicos destaque:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar médicos em destaque'
        });
    }
};

// ============================================================================
// CONTROLADOR: ATUALIZAR AVALIAÇÃO DO MÉDICO
// ============================================================================
exports.atualizarAvaliacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { avaliacao } = req.body;
        
        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({
                success: false,
                message: 'Avaliação deve ser um número entre 1 e 5'
            });
        }
        
        const medico = await Medico.findByPk(id);
        
        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        // Calcular nova média
        const novaTotal = medico.total_avaliacoes + 1;
        const novaMedia = (medico.avaliacao * medico.total_avaliacoes + avaliacao) / novaTotal;
        
        await medico.update({
            avaliacao: parseFloat(novaMedia.toFixed(2)),
            total_avaliacoes: novaTotal
        });
        
        return res.json({
            success: true,
            message: 'Avaliação registrada com sucesso',
            medico: {
                id: medico.id,
                nome: medico.nome,
                avaliacao: medico.avaliacao,
                total_avaliacoes: medico.total_avaliacoes
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar avaliação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao registrar avaliação'
        });
    }
};