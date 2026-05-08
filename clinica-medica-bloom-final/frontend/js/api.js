/**
 * ============================================================================
 * ARQUIVO: api.js
 * PROJETO: Bloom Maternity - Clínica de Obstetrícia
 * DESCRIÇÃO: Camada de integração com API REST, incluindo funções para
 *            todas as operações CRUD do sistema.
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// CONFIGURAÇÕES DA API
// ============================================================================
const API_BASE = 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 segundos

// ============================================================================
// FUNÇÕES GENÉRICAS DE REQUISIÇÃO
// ============================================================================

/**
 * Realizar requisição HTTP com tratamento de erros
 * @param {string} endpoint - Endpoint da API
 * @param {Object} options - Opções da requisição
 * @returns {Promise<Object>} Resposta da API
 */
async function apiRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: controller.signal
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
        }
        
        return {
            success: true,
            data: data,
            status: response.status
        };
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Tempo limite excedido. Tente novamente.'
            };
        }
        
        return {
            success: false,
            error: error.message || 'Erro na comunicação com o servidor'
        };
    }
}

/**
 * Requisição GET
 * @param {string} endpoint - Endpoint da API
 * @returns {Promise<Object>} Resposta da API
 */
async function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

/**
 * Requisição POST
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados a serem enviados
 * @returns {Promise<Object>} Resposta da API
 */
async function apiPost(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Requisição PUT
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados a serem enviados
 * @returns {Promise<Object>} Resposta da API
 */
async function apiPut(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * Requisição DELETE
 * @param {string} endpoint - Endpoint da API
 * @returns {Promise<Object>} Resposta da API
 */
async function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

// ============================================================================
// MÉDICOS
// ============================================================================

/**
 * Listar todos os médicos
 * @param {Object} params - Parâmetros de filtro
 * @returns {Promise<Object>} Lista de médicos
 */
async function listarMedicos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/medicos${queryString ? `?${queryString}` : ''}`;
    return apiGet(endpoint);
}

/**
 * Buscar médico por ID
 * @param {number} id - ID do médico
 * @returns {Promise<Object>} Dados do médico
 */
async function buscarMedico(id) {
    return apiGet(`/medicos/${id}`);
}

/**
 * Buscar horários disponíveis do médico
 * @param {number} medicoId - ID do médico
 * @param {string} data - Data para buscar horários
 * @returns {Promise<Object>} Lista de horários disponíveis
 */
async function buscarHorariosMedico(medicoId, data) {
    return apiGet(`/medicos/${medicoId}/horarios?data=${data}`);
}

/**
 * Buscar exames realizados pelo médico
 * @param {number} medicoId - ID do médico
 * @returns {Promise<Object>} Lista de exames
 */
async function buscarExamesMedico(medicoId) {
    return apiGet(`/medicos/${medicoId}/exames`);
}

// ============================================================================
// AGENDAMENTOS
// ============================================================================

/**
 * Criar novo agendamento
 * @param {Object} agendamento - Dados do agendamento
 * @returns {Promise<Object>} Agendamento criado
 */
async function criarAgendamento(agendamento) {
    return apiPost('/agendamentos', agendamento);
}

/**
 * Listar agendamentos do paciente
 * @param {number} pacienteId - ID do paciente
 * @returns {Promise<Object>} Lista de agendamentos
 */
async function listarAgendamentosPaciente(pacienteId) {
    return apiGet(`/agendamentos/paciente/${pacienteId}`);
}

/**
 * Listar agendamentos do médico
 * @param {number} medicoId - ID do médico
 * @returns {Promise<Object>} Lista de agendamentos
 */
async function listarAgendamentosMedico(medicoId) {
    return apiGet(`/agendamentos/medico/${medicoId}`);
}

/**
 * Cancelar agendamento
 * @param {number} agendamentoId - ID do agendamento
 * @returns {Promise<Object>} Resultado do cancelamento
 */
async function cancelarAgendamento(agendamentoId) {
    return apiDelete(`/agendamentos/${agendamentoId}`);
}

/**
 * Reagendar consulta
 * @param {number} agendamentoId - ID do agendamento
 * @param {Object} novaData - Nova data e horário
 * @returns {Promise<Object>} Agendamento atualizado
 */
async function reagendarConsulta(agendamentoId, novaData) {
    return apiPut(`/agendamentos/${agendamentoId}/reagendar`, novaData);
}

/**
 * Confirmar agendamento
 * @param {number} agendamentoId - ID do agendamento
 * @returns {Promise<Object>} Agendamento confirmado
 */
async function confirmarAgendamento(agendamentoId) {
    return apiPut(`/agendamentos/${agendamentoId}/confirmar`, {});
}

// ============================================================================
// EXAMES
// ============================================================================

/**
 * Listar todos os exames
 * @param {Object} params - Parâmetros de filtro
 * @returns {Promise<Object>} Lista de exames
 */
async function listarExames(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiGet(`/exames${queryString ? `?${queryString}` : ''}`);
}

/**
 * Buscar exame por ID
 * @param {number} id - ID do exame
 * @returns {Promise<Object>} Dados do exame
 */
async function buscarExame(id) {
    return apiGet(`/exames/${id}`);
}

/**
 * Buscar resultados de exame do paciente
 * @param {number} pacienteId - ID do paciente
 * @returns {Promise<Object>} Lista de resultados
 */
async function buscarResultadosExames(pacienteId) {
    return apiGet(`/exames/paciente/${pacienteId}/resultados`);
}

// ============================================================================
// PACIENTES
// ============================================================================

/**
 * Buscar dados do paciente
 * @param {number} id - ID do paciente
 * @returns {Promise<Object>} Dados do paciente
 */
async function buscarPaciente(id) {
    return apiGet(`/pacientes/${id}`);
}

/**
 * Atualizar dados do paciente
 * @param {number} id - ID do paciente
 * @param {Object} dados - Novos dados
 * @returns {Promise<Object>} Paciente atualizado
 */
async function atualizarPaciente(id, dados) {
    return apiPut(`/pacientes/${id}`, dados);
}

// ============================================================================
// ESPECIALIDADES
// ============================================================================

/**
 * Listar especialidades
 * @returns {Promise<Object>} Lista de especialidades
 */
async function listarEspecialidades() {
    return apiGet('/especialidades');
}

// ============================================================================
// UNIDADES
// ============================================================================

/**
 * Listar unidades da clínica
 * @returns {Promise<Object>} Lista de unidades
 */
async function listarUnidades() {
    return apiGet('/unidades');
}

/**
 * Buscar horários de funcionamento da unidade
 * @param {number} unidadeId - ID da unidade
 * @returns {Promise<Object>} Horários de funcionamento
 */
async function buscarHorariosUnidade(unidadeId) {
    return apiGet(`/unidades/${unidadeId}/horarios`);
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS DA API
// ============================================================================

/**
 * Verificar disponibilidade de horário
 * @param {number} medicoId - ID do médico
 * @param {string} data - Data
 * @param {string} horario - Horário
 * @returns {Promise<Object>} Disponibilidade
 */
async function verificarDisponibilidade(medicoId, data, horario) {
    return apiGet(`/agendamentos/disponibilidade?medicoId=${medicoId}&data=${data}&horario=${horario}`);
}

/**
 * Buscar consultas futuras do paciente
 * @param {number} pacienteId - ID do paciente
 * @returns {Promise<Object>} Lista de consultas futuras
 */
async function consultasFuturas(pacienteId) {
    return apiGet(`/agendamentos/paciente/${pacienteId}/futuras`);
}

/**
 * Buscar histórico de consultas do paciente
 * @param {number} pacienteId - ID do paciente
 * @returns {Promise<Object>} Histórico de consultas
 */
async function historicoConsultas(pacienteId) {
    return apiGet(`/agendamentos/paciente/${pacienteId}/historico`);
}

// ============================================================================
// WEBHOOKS E NOTIFICAÇÕES
// ============================================================================

/**
 * Enviar notificação push
 * @param {Object} notificacao - Dados da notificação
 * @returns {Promise<Object>} Resultado do envio
 */
async function enviarNotificacao(notificacao) {
    return apiPost('/notificacoes', notificacao);
}

// ============================================================================
// EXPORTAR FUNÇÕES (DISPOSIÇÃO GLOBAL)
// ============================================================================
window.api = {
    // Genéricas
    request: apiRequest,
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    
    // Médicos
    listarMedicos,
    buscarMedico,
    buscarHorariosMedico,
    buscarExamesMedico,
    
    // Agendamentos
    criarAgendamento,
    listarAgendamentosPaciente,
    listarAgendamentosMedico,
    cancelarAgendamento,
    reagendarConsulta,
    confirmarAgendamento,
    verificarDisponibilidade,
    consultasFuturas,
    historicoConsultas,
    
    // Exames
    listarExames,
    buscarExame,
    buscarResultadosExames,
    
    // Pacientes
    buscarPaciente,
    atualizarPaciente,
    
    // Especialidades
    listarEspecialidades,
    
    // Unidades
    listarUnidades,
    buscarHorariosUnidade,
    
    // Notificações
    enviarNotificacao
};