/**
 * ============================================================================
 * ARQUIVO: agendamento.js
 * PROJETO: Bloom Maternity - Clínica de Obstetrícia
 * DESCRIÇÃO: Gerenciamento completo do fluxo de agendamento de consultas,
 *            incluindo seleção de médico, exame, data/horário e confirmação.
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// VARIÁVEIS GLOBAIS DO AGENDAMENTO
// ============================================================================
let currentStep = 1;
let selectedMedico = null;
let selectedExame = null;
let selectedData = null;
let selectedHorario = null;
let medicosList = [];
let examesList = [];
let horariosDisponiveis = [];

// Elementos DOM
let step1Content, step2Content, step3Content, step4Content;
let nextButtons, prevButtons;
let resumoAgendamento;

// ============================================================================
// INICIALIZAÇÃO DO AGENDAMENTO
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos DOM
    step1Content = document.getElementById('step1Content');
    step2Content = document.getElementById('step2Content');
    step3Content = document.getElementById('step3Content');
    step4Content = document.getElementById('step4Content');
    resumoAgendamento = document.getElementById('resumoAgendamento');
    
    // Inicializar botões de navegação
    initNavigationButtons();
    
    // Inicializar date picker
    initDatePicker();
    
    // Verificar parâmetros da URL (para pré-seleção)
    handleURLParamsAgendamento();
});

// ============================================================================
// NAVEGAÇÃO ENTRE ETAPAS
// ============================================================================
function initNavigationButtons() {
    nextButtons = document.querySelectorAll('.next-step');
    prevButtons = document.querySelectorAll('.prev-step');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.getAttribute('data-next'));
            goToStep(nextStep);
        });
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.getAttribute('data-prev'));
            goToStep(prevStep);
        });
    });
}

function goToStep(step) {
    // Validar step atual antes de avançar
    if (step > currentStep) {
        if (!validateCurrentStep()) {
            return;
        }
    }
    
    // Esconder todos os conteúdos
    step1Content.style.display = 'none';
    step2Content.style.display = 'none';
    step3Content.style.display = 'none';
    step4Content.style.display = 'none';
    
    // Mostrar o step selecionado
    switch(step) {
        case 1:
            step1Content.style.display = 'block';
            break;
        case 2:
            step2Content.style.display = 'block';
            if (selectedMedico) {
                carregarExamesPorMedico(selectedMedico.id);
            }
            break;
        case 3:
            step3Content.style.display = 'block';
            if (selectedMedico && selectedExame) {
                carregarHorariosDisponiveis();
            }
            break;
        case 4:
            step4Content.style.display = 'block';
            atualizarResumoConfirmacao();
            break;
    }
    
    // Atualizar steps visuais
    updateStepIndicators(step);
    
    currentStep = step;
}

function updateStepIndicators(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((s, index) => {
        const stepNum = index + 1;
        if (stepNum < step) {
            s.classList.add('completed');
            s.classList.remove('active');
        } else if (stepNum === step) {
            s.classList.add('active');
            s.classList.remove('completed');
        } else {
            s.classList.remove('active', 'completed');
        }
    });
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            if (!selectedMedico) {
                showToast('Por favor, selecione um médico', 'warning');
                return false;
            }
            return true;
        case 2:
            if (!selectedExame) {
                showToast('Por favor, selecione um exame', 'warning');
                return false;
            }
            return true;
        case 3:
            if (!selectedData || !selectedHorario) {
                showToast('Por favor, selecione data e horário', 'warning');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// ============================================================================
// CARREGAMENTO DE MÉDICOS
// ============================================================================
async function carregarMedicos() {
    const medicosListDiv = document.getElementById('medicosList');
    
    if (!medicosListDiv) return;
    
    try {
        medicosListDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-pink" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3 text-muted">Carregando médicos disponíveis...</p>
            </div>
        `;
        
        // Buscar médicos da API
        const response = await fetch(`${API_BASE_URL}/medicos`);
        const data = await response.json();
        
        if (data.medicos && data.medicos.length > 0) {
            medicosList = data.medicos.map(m => ({...m, especialidade: m.especialidade || m.especialidade_info?.nome || 'Obstetrícia'}));
            renderMedicosList(medicosList);
        } else {
            medicosListDiv.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle"></i>
                    Nenhum médico disponível no momento. Tente novamente mais tarde.
                </div>
            `;
        }
        
    } catch (error) {
        console.warn('API de médicos indisponível no agendamento. Usando dados locais oficiais:', error);
        medicosList = Array.isArray(window.BLOOM_DOCTORS) ? window.BLOOM_DOCTORS : [];
        if (medicosList.length) {
            renderMedicosList(medicosList);
        } else {
            medicosListDiv.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="bi bi-bug"></i>
                    Erro ao carregar médicos. Verifique sua conexão.
                </div>
            `;
        }
    }
}

function renderMedicosList(medicos) {
    const medicosListDiv = document.getElementById('medicosList');
    
    if (!medicosListDiv) return;
    
    medicosListDiv.innerHTML = `
        <div class="row g-3">
            ${medicos.map(medico => `
                <div class="col-md-6">
                    <div class="medico-card card h-100 border-0 shadow-sm rounded-4 cursor-pointer ${selectedMedico?.id === medico.id ? 'border-pink border-2' : ''}" 
                         onclick="selecionarMedico(${medico.id})"
                         data-medico-id="${medico.id}">
                        <div class="card-body p-3">
                            <div class="d-flex gap-3">
                                <div class="flex-shrink-0">
                                    <img src="${medico.foto || 'https://randomuser.me/api/portraits/women/68.jpg'}" 
                                         class="rounded-circle" 
                                         style="width: 70px; height: 70px; object-fit: cover;">
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="fw-bold mb-1">${medico.nome}</h5>
                                    <p class="text-pink mb-1">${medico.especialidade}</p>
                                    <p class="text-muted small mb-0">CRM: ${medico.crm} | ${medico.experiencia_anos} anos de exp.</p>
                                    <div class="rating mt-1">
                                        ${gerarEstrelas(medico.avaliacao || 5)}
                                        <span class="ms-1 small">(${medico.total_avaliacoes || 0} avaliações)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function gerarEstrelas(avaliacao) {
    const estrelasCheias = Math.floor(avaliacao);
    const temMeiaEstrela = avaliacao % 1 >= 0.5;
    let html = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= estrelasCheias) {
            html += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (temMeiaEstrela && i === estrelasCheias + 1) {
            html += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            html += '<i class="bi bi-star text-warning"></i>';
        }
    }
    
    return html;
}

function selecionarMedico(medicoId) {
    selectedMedico = medicosList.find(m => m.id === medicoId);
    
    // Atualizar visual dos cards
    document.querySelectorAll('.medico-card').forEach(card => {
        card.classList.remove('border-pink', 'border-2');
        if (parseInt(card.getAttribute('data-medico-id')) === medicoId) {
            card.classList.add('border-pink', 'border-2');
        }
    });
    
    // Atualizar resumo
    atualizarResumoAgendamento();
    
    showToast(`Médico ${selectedMedico.nome} selecionado!`, 'success');
}

// ============================================================================
// CARREGAMENTO DE EXAMES
// ============================================================================
async function carregarExamesPorMedico(medicoId) {
    const examesListDiv = document.getElementById('examesList');
    
    if (!examesListDiv) return;
    
    try {
        examesListDiv.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-pink spinner-border-sm" role="status"></div>
                <p class="mt-2 text-muted small">Carregando exames...</p>
            </div>
        `;
        
        // Buscar exames do médico
        const response = await fetch(`${API_BASE_URL}/medicos/${medicoId}/exames`);
        const data = await response.json();
        
        if (data.exames && data.exames.length > 0) {
            examesList = data.exames;
            renderExamesList(examesList);
        } else {
            examesListDiv.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i>
                    Este médico não possui exames cadastrados no momento.
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar exames:', error);
        examesListDiv.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-bug"></i>
                Erro ao carregar exames.
            </div>
        `;
    }
}

function renderExamesList(exames) {
    const examesListDiv = document.getElementById('examesList');
    
    if (!examesListDiv) return;
    
    examesListDiv.innerHTML = `
        <div class="row g-3">
            ${exames.map(exame => `
                <div class="col-md-6">
                    <div class="exame-card card h-100 border-0 shadow-sm rounded-4 cursor-pointer ${selectedExame?.id === exame.id ? 'border-pink border-2' : ''}" 
                         onclick="selecionarExame(${exame.id})"
                         data-exame-id="${exame.id}">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="fw-bold mb-1">${exame.nome}</h5>
                                    <p class="text-muted small mb-2">${exame.descricao || 'Descrição não disponível'}</p>
                                    <div class="d-flex gap-3 small">
                                        <span><i class="bi bi-clock text-pink"></i> Duração: ${exame.duracao || '30min'}</span>
                                        <span><i class="bi bi-currency-dollar text-pink"></i> ${formatCurrency(exame.preco || 0)}</span>
                                    </div>
                                </div>
                                <i class="bi bi-clipboard2-pulse fs-3 text-pink"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function selecionarExame(exameId) {
    selectedExame = examesList.find(e => e.id === exameId);
    
    // Atualizar visual dos cards
    document.querySelectorAll('.exame-card').forEach(card => {
        card.classList.remove('border-pink', 'border-2');
        if (parseInt(card.getAttribute('data-exame-id')) === exameId) {
            card.classList.add('border-pink', 'border-2');
        }
    });
    
    // Atualizar resumo
    atualizarResumoAgendamento();
    
    showToast(`Exame selecionado: ${selectedExame.nome}`, 'success');
}

// ============================================================================
// CARREGAMENTO DE HORÁRIOS DISPONÍVEIS
// ============================================================================
function initDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) return;
    
    flatpickr(datePicker, {
        locale: 'pt',
        dateFormat: 'd/m/Y',
        minDate: 'today',
        maxDate: new Date().fp_incr(60), // 60 dias no futuro
        disable: [
            function(date) {
                // Desabilitar domingos
                return date.getDay() === 0;
            }
        ],
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                selectedData = selectedDates[0];
                carregarHorariosPorData(selectedData);
                atualizarResumoAgendamento();
            }
        }
    });
}

async function carregarHorariosDisponiveis() {
    if (!selectedMedico || !selectedExame) return;
    
    const horarioSelect = document.getElementById('horarioSelect');
    if (!horarioSelect) return;
    
    horarioSelect.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    horarioSelect.disabled = true;
}

async function carregarHorariosPorData(data) {
    if (!selectedMedico || !selectedExame || !data) return;
    
    const horarioSelect = document.getElementById('horarioSelect');
    if (!horarioSelect) return;
    
    try {
        horarioSelect.innerHTML = '<option value="">Carregando horários...</option>';
        horarioSelect.disabled = true;
        
        const dataFormatada = formatDateForAPI(data);
        
        const response = await fetch(`${API_BASE_URL}/agendamentos/disponibilidade?medicoId=${selectedMedico.id}&data=${dataFormatada}`);
        const result = await response.json();
        
        if (result.horarios && result.horarios.length > 0) {
            horariosDisponiveis = result.horarios;
            horarioSelect.innerHTML = `
                <option value="">Selecione um horário</option>
                ${horariosDisponiveis.map(h => `<option value="${h}">${h}</option>`).join('')}
            `;
            horarioSelect.disabled = false;
        } else {
            horarioSelect.innerHTML = '<option value="">Nenhum horário disponível nesta data</option>';
            horarioSelect.disabled = true;
            showToast('Nenhum horário disponível para esta data. Selecione outra data.', 'warning');
        }
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        horarioSelect.innerHTML = '<option value="">Erro ao carregar horários</option>';
        horarioSelect.disabled = true;
    }
}

// Event listener para seleção de horário
document.addEventListener('DOMContentLoaded', function() {
    const horarioSelect = document.getElementById('horarioSelect');
    if (horarioSelect) {
        horarioSelect.addEventListener('change', function() {
            selectedHorario = this.value;
            atualizarResumoAgendamento();
            
            if (selectedHorario) {
                showToast(`Horário selecionado: ${selectedHorario}`, 'success');
            }
        });
    }
});

// ============================================================================
// RESUMO E CONFIRMAÇÃO
// ============================================================================
function atualizarResumoAgendamento() {
    if (!resumoAgendamento) return;
    
    let html = '';
    
    if (selectedMedico) {
        html += `
            <div class="resumo-item mb-3 pb-2 border-bottom">
                <small class="text-muted d-block">Médico</small>
                <strong>${selectedMedico.nome}</strong>
                <br><small class="text-muted">${selectedMedico.especialidade}</small>
            </div>
        `;
    }
    
    if (selectedExame) {
        html += `
            <div class="resumo-item mb-3 pb-2 border-bottom">
                <small class="text-muted d-block">Exame</small>
                <strong>${selectedExame.nome}</strong>
                <br><small class="text-muted">${formatCurrency(selectedExame.preco || 0)}</small>
            </div>
        `;
    }
    
    if (selectedData && selectedHorario) {
        html += `
            <div class="resumo-item mb-3 pb-2 border-bottom">
                <small class="text-muted d-block">Data e Horário</small>
                <strong>${formatDate(selectedData)} às ${selectedHorario}</strong>
            </div>
        `;
    }
    
    if (!selectedMedico && !selectedExame && !selectedData) {
        html = '<p class="text-muted text-center">Nenhum item selecionado ainda</p>';
    }
    
    resumoAgendamento.innerHTML = html;
}

function atualizarResumoConfirmacao() {
    const confirmationDetails = document.getElementById('confirmationDetails');
    if (!confirmationDetails) return;
    
    const usuario = getCurrentUser();
    
    confirmationDetails.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">Paciente</label>
                    <p class="fw-bold mb-0">${usuario?.nome || 'Não informado'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">E-mail</label>
                    <p class="fw-bold mb-0">${usuario?.email || 'Não informado'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">Médico</label>
                    <p class="fw-bold mb-0">${selectedMedico?.nome || 'Não selecionado'}</p>
                    <small class="text-muted">${selectedMedico?.especialidade}</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">Exame</label>
                    <p class="fw-bold mb-0">${selectedExame?.nome || 'Não selecionado'}</p>
                    <small class="text-muted">${formatCurrency(selectedExame?.preco || 0)}</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">Data</label>
                    <p class="fw-bold mb-0">${selectedData ? formatDate(selectedData) : 'Não selecionada'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-group">
                    <label class="text-muted small">Horário</label>
                    <p class="fw-bold mb-0">${selectedHorario || 'Não selecionado'}</p>
                </div>
            </div>
        </div>
        <hr class="my-3">
        <div class="total-value text-end">
            <label class="text-muted small">Valor Total</label>
            <p class="display-6 fw-bold text-pink mb-0">${formatCurrency(selectedExame?.preco || 0)}</p>
        </div>
    `;
}

// ============================================================================
// CONFIRMAR AGENDAMENTO
// ============================================================================
async function confirmarAgendamento() {
    const confirmBtn = document.getElementById('confirmarAgendamento');
    if (!confirmBtn) return;
    
    // Verificar se todos os dados estão preenchidos
    if (!selectedMedico || !selectedExame || !selectedData || !selectedHorario) {
        showToast('Por favor, complete todas as etapas do agendamento', 'warning');
        return;
    }
    
    const usuario = getCurrentUser();
    if (!usuario) {
        showToast('Você precisa estar logado para agendar', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
        
        const agendamentoData = {
            paciente_id: usuario.id,
            medico_id: selectedMedico.id,
            exame_id: selectedExame.id,
            data: formatDateForAPI(selectedData),
            horario: selectedHorario,
            status: 'agendado',
            valor: selectedExame.preco
        };
        
        const response = await fetch(`${API_BASE_URL}/agendamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(agendamentoData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Agendamento realizado com sucesso!', 'success');
            
            // Limpar sessão de agendamento
            localStorage.removeItem('agendamento_temp');
            
            // Redirecionar para página de confirmação ou meus agendamentos
            setTimeout(() => {
                window.location.href = 'meus-agendamentos.html';
            }, 2000);
        } else {
            throw new Error(result.message || 'Erro ao realizar agendamento');
        }
        
    } catch (error) {
        console.error('Erro no agendamento:', error);
        showToast(error.message || 'Erro ao realizar agendamento. Tente novamente.', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Confirmar Agendamento';
    }
}

// Adicionar event listener para o botão de confirmar
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirmarAgendamento');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmarAgendamento);
    }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================
function formatDateForAPI(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function handleURLParamsAgendamento() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const medicoId = urlParams.get('medico');
    const exameId = urlParams.get('exame');
    const dataParam = urlParams.get('data');
    const horarioParam = urlParams.get('horario');
    const unidadeParam = urlParams.get('unidade');
    
    if (medicoId) {
        // Pré-selecionar médico quando disponível
        setTimeout(() => {
            const medicoCard = document.querySelector(`.medico-card[data-medico-id="${medicoId}"]`);
            if (medicoCard) {
                medicoCard.click();
            }
        }, 1000);
    }
    
    if (exameId) {
        setTimeout(() => {
            const exameCard = document.querySelector(`.exame-card[data-exame-id="${exameId}"]`);
            if (exameCard) {
                exameCard.click();
            }
        }, 1500);
    }
    
    if (unidadeParam) {
        showToast(`Agendamento para unidade ${unidadeParam}`, 'info');
    }
}

// ============================================================================
// ESTILOS DINÂMICOS
// ============================================================================
const style = document.createElement('style');
style.textContent = `
    .medico-card, .exame-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    .medico-card:hover, .exame-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
    }
    .border-pink {
        border-color: #ff6b9d !important;
    }
    .resumo-item {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);