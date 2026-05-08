/**
 * ============================================================================
 * ARQUIVO: medicos.js
 * PROJETO: Bloom Maternity - Clínica de Obstetrícia
 * DESCRIÇÃO: Gerenciamento de médicos, incluindo listagem, filtros,
 *            busca, detalhes do médico e integração com agendamento.
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// VARIÁVEIS GLOBAIS DE MÉDICOS
// ============================================================================
let medicosCompletos = [];
let medicoSelecionado = null;

function getBloomDoctorsFallback() {
    return Array.isArray(window.BLOOM_DOCTORS) ? window.BLOOM_DOCTORS : [];
}

function normalizarMedico(medico) {
    if (!medico) return medico;
    const especialidadeNome = medico.especialidade || medico.especialidade_info?.nome || 'Obstetrícia';
    return { ...medico, especialidade: especialidadeNome };
}
let currentFilter = 'all';
let searchTerm = '';
let currentPage = 1;
const itemsPerPage = 12;

// ============================================================================
// INICIALIZAÇÃO DA PÁGINA DE MÉDICOS
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar página de médicos se estiver na página correta
    if (document.getElementById('doctorsGrid')) {
        carregarMedicosGrid();
    }
    
    // Inicializar carrossel de médicos na home (se existir)
    if (document.getElementById('doctorsTrack')) {
        initDoctorCarousel();
    }
    
    // Inicializar página de detalhe do médico
    if (document.querySelector('.doctor-details-section')) {
        carregarDetalhesMedico();
    }
    
    // Inicializar busca e filtros de médicos
    initDoctorSearch();
    initDoctorFilters();
});

// ============================================================================
// CARREGAMENTO DE MÉDICOS PARA GRID (PÁGINA DE MÉDICOS)
// ============================================================================
async function carregarMedicosGrid() {
    const doctorsGrid = document.getElementById('doctorsGrid');
    const loadingDiv = document.getElementById('loadingDoctors');
    
    if (!doctorsGrid) return;
    
    try {
        if (loadingDiv) loadingDiv.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/medicos`);
        const data = await response.json();
        
        if (data.medicos && data.medicos.length > 0) {
            medicosCompletos = data.medicos.map(normalizarMedico);
            renderDoctorsGrid(medicosCompletos);
        } else {
            doctorsGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-people fs-1 text-muted"></i>
                    <h4 class="mt-3">Nenhum médico encontrado</h4>
                    <p class="text-muted">Tente novamente mais tarde.</p>
                </div>
            `;
        }
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        
    } catch (error) {
        console.warn('API de médicos indisponível. Usando dados locais oficiais:', error);
        if (loadingDiv) loadingDiv.style.display = 'none';
        const fallback = getBloomDoctorsFallback().map(normalizarMedico);
        if (fallback.length) {
            medicosCompletos = fallback;
            renderDoctorsGrid(medicosCompletos);
        } else {
            doctorsGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-bug fs-1 text-danger"></i>
                    <h4 class="mt-3">Erro ao carregar médicos</h4>
                    <p class="text-muted">Verifique sua conexão e tente novamente.</p>
                    <button class="btn btn-pink rounded-pill" onclick="carregarMedicosGrid()">
                        <i class="bi bi-arrow-repeat"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

function renderDoctorsGrid(medicos) {
    const doctorsGrid = document.getElementById('doctorsGrid');
    if (!doctorsGrid) return;
    
    // Aplicar filtros e busca
    let filteredMedicos = medicos;
    
    // Filtrar por especialidade. Usa comparação flexível para funcionar com
    // especialidades compostas, como "Medicina Fetal e Ultrassonografia".
    if (currentFilter !== 'all') {
        const filterTerm = String(currentFilter).trim().toLowerCase();
        filteredMedicos = filteredMedicos.filter(m => {
            const specialty = String(m.especialidade || '').trim().toLowerCase();
            const areas = Array.isArray(m.areas) ? m.areas.join(' ').toLowerCase() : '';
            return specialty === filterTerm ||
                   specialty.includes(filterTerm) ||
                   filterTerm.includes(specialty) ||
                   areas.includes(filterTerm);
        });
    }
    
    // Filtrar por busca
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredMedicos = filteredMedicos.filter(m => 
            m.nome.toLowerCase().includes(term) ||
            m.especialidade?.toLowerCase().includes(term) ||
            m.crm?.toLowerCase().includes(term)
        );
    }
    
    // Paginação
    const totalPages = Math.ceil(filteredMedicos.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedMedicos = filteredMedicos.slice(start, start + itemsPerPage);
    
    if (paginatedMedicos.length === 0) {
        doctorsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search fs-1 text-muted"></i>
                <h4 class="mt-3">Nenhum médico encontrado</h4>
                <p class="text-muted">Tente ajustar seus filtros de busca.</p>
            </div>
        `;
        return;
    }
    
    doctorsGrid.innerHTML = paginatedMedicos.map(medico => `
        <div class="col-lg-4 col-md-6 doctor-card-item" data-especialidade="${medico.especialidade}">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition">
                <div class="doctor-image-wrapper position-relative">
                    <img src="${medico.foto || 'https://randomuser.me/api/portraits/women/68.jpg'}" 
                         class="card-img-top" 
                         alt="${medico.nome}"
                         style="height: 280px; object-fit: cover;">
                    <div class="doctor-social-overlay">
                        <a href="#" class="btn-social" onclick="event.preventDefault()"><i class="bi bi-instagram"></i></a>
                        <a href="#" class="btn-social" onclick="event.preventDefault()"><i class="bi bi-linkedin"></i></a>
                        <a href="#" class="btn-social" onclick="event.preventDefault()"><i class="bi bi-envelope"></i></a>
                    </div>
                    ${medico.disponivel ? '<span class="badge bg-success position-absolute top-0 start-0 m-3">Disponível</span>' : ''}
                </div>
                <div class="card-body text-center p-4">
                    <h4 class="card-title fw-bold mb-1">${medico.nome}</h4>
                    <p class="text-pink fw-semibold mb-2">${medico.especialidade || 'Obstetrícia'}</p>
                    <p class="text-muted small">CRM: ${medico.crm || '12345-SP'}</p>
                    <div class="rating mb-3">
                        ${gerarEstrelasGrid(medico.avaliacao || 5)}
                        <span class="ms-2 small">(${medico.total_avaliacoes || 0} avaliações)</span>
                    </div>
                    <p class="card-text text-muted small">${medico.resumo || 'Especialista em obstetrícia e cuidados maternos.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <a href="medico-detalhe.html?id=${medico.id}" class="btn btn-outline-pink rounded-pill flex-grow-1">
                            <i class="bi bi-person"></i> Perfil
                        </a>
                        <button class="btn btn-gradient rounded-pill flex-grow-1" onclick="agendarComMedico(${medico.id})">
                            <i class="bi bi-calendar-heart"></i> Agendar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Adicionar paginação se necessário
    if (totalPages > 1) {
        renderPagination(totalPages);
    } else {
        const existingPagination = document.getElementById('paginationContainer');
        if (existingPagination) existingPagination.remove();
    }
}

function gerarEstrelasGrid(avaliacao) {
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

function renderPagination(totalPages) {
    let paginationContainer = document.getElementById('paginationContainer');
    
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'd-flex justify-content-center mt-5';
        document.getElementById('doctorsGrid')?.parentNode?.appendChild(paginationContainer);
    }
    
    let paginationHtml = '<nav><ul class="pagination">';
    
    // Botão anterior
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="mudarPagina(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;
    
    // Números das páginas
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><button class="page-link" onclick="mudarPagina(1)">1</button></li>`;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <button class="page-link" onclick="mudarPagina(${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `<li class="page-item"><button class="page-link" onclick="mudarPagina(${totalPages})">${totalPages}</button></li>`;
    }
    
    // Botão próximo
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="mudarPagina(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;
    
    paginationHtml += '</ul></nav>';
    paginationContainer.innerHTML = paginationHtml;
}

function mudarPagina(page) {
    if (page < 1) return;
    currentPage = page;
    renderDoctorsGrid(medicosCompletos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function agendarComMedico(medicoId) {
    const token = getAuthToken();
    if (!token) {
        showToast('Por favor, faça login para agendar uma consulta', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    window.location.href = `agendamento.html?medico=${medicoId}`;
}

// ============================================================================
// FILTROS E BUSCA DE MÉDICOS
// ============================================================================
function initDoctorSearch() {
    const searchInput = document.getElementById('doctorSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            searchTerm = e.target.value;
            currentPage = 1;
            renderDoctorsGrid(medicosCompletos);
        }, 500));
    }
}

function initDoctorFilters() {
    const filterButtons = document.querySelectorAll('#filterButtons .filter-btn');
    if (!filterButtons.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter || 'all';

            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'btn-pink');
                btn.classList.add('btn-outline-pink');
            });

            button.classList.add('active', 'btn-pink');
            button.classList.remove('btn-outline-pink');
            aplicarFiltro(filter);
        });
    });
}

function aplicarFiltro(filter) {
    currentFilter = filter || 'all';
    currentPage = 1;
    renderDoctorsGrid(medicosCompletos);
}

// ============================================================================
// CARROSSEL DE MÉDICOS (HOME PAGE)
// ============================================================================
function initDoctorCarousel() {
    const track = document.getElementById('doctorsTrack');
    const prevBtn = document.getElementById('doctorsPrev');
    const nextBtn = document.getElementById('doctorsNext');
    
    if (!track) return;
    
    let currentPosition = 0;
    const getCardStep = () => {
        const card = track.querySelector('.doctor-card');
        const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 24) || 24;
        return card ? card.getBoundingClientRect().width + gap : 344;
    };
    const getMaxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const updateNavButtons = () => {
        currentPosition = track.scrollLeft;
        if (prevBtn) prevBtn.disabled = currentPosition <= 2;
        if (nextBtn) nextBtn.disabled = currentPosition >= getMaxScroll() - 2;
    };
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentPosition = Math.max(0, track.scrollLeft - getCardStep());
            track.scrollTo({ left: currentPosition, behavior: 'smooth' });
            setTimeout(updateNavButtons, 350);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPosition = Math.min(getMaxScroll(), track.scrollLeft + getCardStep());
            track.scrollTo({ left: currentPosition, behavior: 'smooth' });
            setTimeout(updateNavButtons, 350);
        });
    }

    track.addEventListener('scroll', debounce(updateNavButtons, 80));
    window.addEventListener('resize', debounce(updateNavButtons, 120));
    updateNavButtons();
    
    // Carregar médicos para o carrossel
    carregarMedicosCarrossel();
}

async function carregarMedicosCarrossel() {
    const track = document.getElementById('doctorsTrack');
    if (!track) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/medicos?limite=8`);
        const data = await response.json();
        
        if (data.medicos && data.medicos.length > 0) {
            track.innerHTML = data.medicos.map(normalizarMedico).map(medico => `
                <div class="doctor-card">
                    <div class="card h-100 border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="doctor-image-wrapper">
                            <img src="${medico.foto || 'https://randomuser.me/api/portraits/women/68.jpg'}" 
                                 class="card-img-top" 
                                 alt="${medico.nome}"
                                 style="height: 280px; object-fit: cover;">
                            <div class="doctor-social-overlay">
                                <a href="#" class="btn-social" onclick="event.preventDefault()"><i class="bi bi-instagram"></i></a>
                                <a href="#" class="btn-social" onclick="event.preventDefault()"><i class="bi bi-linkedin"></i></a>
                            </div>
                        </div>
                        <div class="card-body text-center p-4">
                            <h4 class="card-title fw-bold mb-1">${medico.nome}</h4>
                            <p class="text-pink fw-semibold mb-2">${medico.especialidade || 'Obstetrícia'}</p>
                            <p class="text-muted small">CRM: ${medico.crm || '12345-SP'}</p>
                            <div class="rating mb-3">
                                ${gerarEstrelasGrid(medico.avaliacao || 5)}
                                <span class="ms-2 small">(${medico.total_avaliacoes || 0})</span>
                            </div>
                            <p class="card-text text-muted small">${(medico.resumo || 'Especialista em obstetrícia').substring(0, 80)}...</p>
                            <a href="medico-detalhe.html?id=${medico.id}" class="btn btn-pink rounded-pill w-100 mt-2">
                                Ver Perfil <i class="bi bi-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
            harmonizarCarrosselMedicos(track);
        }
        
    } catch (error) {
        console.warn('API do carrossel indisponível. Usando dados locais oficiais:', error);
        const fallback = getBloomDoctorsFallback();
        if (fallback.length) {
            track.innerHTML = fallback.map(medico => `
                <div class="doctor-card">
                    <div class="card h-100 border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="doctor-image-wrapper">
                            <img src="${medico.foto}" class="card-img-top" alt="${medico.nome}" style="height: 280px; object-fit: cover;">
                        </div>
                        <div class="card-body text-center p-4">
                            <h4 class="card-title fw-bold mb-1">${medico.nome}</h4>
                            <p class="text-pink fw-semibold mb-2">${medico.especialidade}</p>
                            <p class="text-muted small">CRM: ${medico.crm} | RQE: ${medico.rqe}</p>
                            <div class="rating mb-3">${gerarEstrelasGrid(medico.avaliacao || 5)} <span class="ms-2 small">(${medico.total_avaliacoes || 0})</span></div>
                            <p class="card-text text-muted small">${medico.resumo}</p>
                            <a href="medico-detalhe.html?id=${medico.id}" class="btn btn-pink rounded-pill w-100 mt-2">Ver Perfil <i class="bi bi-arrow-right"></i></a>
                        </div>
                    </div>
                </div>`).join('');
            harmonizarCarrosselMedicos(track);
        }
    }
}

function harmonizarCarrosselMedicos(track) {
    if (!track) return;
    track.scrollLeft = 0;
    track.querySelectorAll('.doctor-card .card-body').forEach(body => {
        body.classList.add('d-flex', 'flex-column');
    });
    track.querySelectorAll('.doctor-card .btn').forEach(btn => {
        btn.classList.add('mt-auto');
    });
}

// ============================================================================
// PÁGINA DE DETALHES DO MÉDICO
// ============================================================================
async function carregarDetalhesMedico() {
    const urlParams = new URLSearchParams(window.location.search);
    const medicoId = urlParams.get('id');
    
    if (!medicoId) {
        showToast('Médico não encontrado', 'error');
        setTimeout(() => {
            window.location.href = 'medicos.html';
        }, 1200);
        return;
    }

    const medicoLocal = getBloomDoctorsFallback().find(m => String(m.id) === String(medicoId));

    // Renderiza primeiro os dados locais oficiais. Assim a página nunca aparece
    // temporariamente com a Dra. Ana e depois troca para outro médico.
    if (medicoLocal) {
        medicoSelecionado = medicoLocal;
        window.medicoSelecionado = medicoLocal;
        renderizarDetalhesMedico(medicoLocal);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/medicos/${medicoId}`);
        if (!response.ok) throw new Error('API indisponível');
        const data = await response.json();
        
        if (data.medico && String(data.medico.id) === String(medicoId)) {
            medicoSelecionado = normalizarMedico(data.medico);
            window.medicoSelecionado = medicoSelecionado;
            renderizarDetalhesMedico(medicoSelecionado);
        } else if (!medicoLocal) {
            throw new Error('Médico não encontrado');
        }
        
    } catch (error) {
        console.warn('API de detalhes indisponível ou divergente. Usando dados locais oficiais:', error);
        if (!medicoLocal) {
            showToast('Médico não encontrado', 'error');
        }
    }
}

function renderizarDetalhesMedico(medico) {
    medico = normalizarMedico(medico);

    const setText = (selector, value) => {
        const el = document.querySelector(selector);
        if (el && value !== undefined && value !== null) el.textContent = value;
    };
    const setHTML = (selector, value) => {
        const el = document.querySelector(selector);
        if (el && value !== undefined && value !== null) el.innerHTML = value;
    };

    const foto = medico.foto || '../assets/images/dra-ana-carolina-mendes.png';
    const img = document.querySelector('.doctor-profile-image img');
    if (img) {
        img.src = foto;
        img.alt = medico.nome;
    }

    document.title = `${medico.nome} | Bloom Maternity`;
    setText('.doctor-info h1', medico.nome);
    setText('.doctor-info .lead.text-pink', medico.especialidade);
    setText('.doctor-info p.lead.mb-4', medico.descricao || medico.resumo);

    setHTML('.doctor-meta', `
        <span class="badge bg-light-pink text-pink me-2 p-2"><i class="bi bi-person-badge"></i> CRM: ${medico.crm || 'CRM não informado'}</span>
        <span class="badge bg-light-pink text-pink me-2 p-2"><i class="bi bi-award"></i> RQE: ${medico.rqe || 'Não informado'}</span>
        <span class="badge bg-light-pink text-pink p-2"><i class="bi bi-clock-history"></i> ${medico.experiencia_anos || 0} anos de experiência</span>
    `);

    setHTML('.rating', `
        ${gerarEstrelasGrid(medico.avaliacao || 5)}
        <span class="ms-2 fw-semibold">${Number(medico.avaliacao || 5).toFixed(1)} (${medico.total_avaliacoes || 0} avaliações)</span>
    `);

    setHTML('#sobre .card', `
        <h3 class="fw-bold mb-4">Sobre ${medico.nome}</h3>
        <p>${medico.descricao || medico.resumo || ''}</p>
        <div class="row mt-4">
            <div class="col-md-6">
                <h5><i class="bi bi-check-circle-fill text-pink"></i> Áreas de atuação:</h5>
                <ul class="list-unstyled">${(medico.areas || []).map(a => `<li><i class="bi bi-caret-right-fill text-pink"></i> ${a}</li>`).join('')}</ul>
            </div>
            <div class="col-md-6">
                <h5><i class="bi bi-heart-pulse-fill text-pink"></i> Perfil de atendimento:</h5>
                <ul class="list-unstyled">
                    <li><i class="bi bi-caret-right-fill text-pink"></i> Atendimento humanizado</li>
                    <li><i class="bi bi-caret-right-fill text-pink"></i> Plano de cuidado individualizado</li>
                    <li><i class="bi bi-caret-right-fill text-pink"></i> Comunicação clara com a paciente</li>
                </ul>
            </div>
        </div>
    `);

    setHTML('#formacao .card', `
        <h3 class="fw-bold mb-4">Formação Acadêmica</h3>
        <div class="timeline">${(medico.formacao || []).map(item => `
            <div class="timeline-item mb-4">
                <div class="timeline-icon bg-pink"><i class="bi bi-mortarboard text-white"></i></div>
                <div class="timeline-content"><h5>${item}</h5><p class="text-muted">Formação vinculada à especialidade de ${medico.especialidade}.</p></div>
            </div>`).join('')}</div>
    `);

    setHTML('#experiencia .card', `
        <h3 class="fw-bold mb-4">Experiência Profissional</h3>
        ${(medico.experiencia || []).map(item => `
            <div class="experience-item mb-4 p-3 border-bottom">
                <h5><i class="bi bi-building text-pink"></i> ${item}</h5>
                <p class="text-muted mb-0">Atuação clínica na Bloom Maternity com foco em cuidado seguro, técnico e acolhedor.</p>
            </div>`).join('')}
    `);

    setHTML('#exames .card .row', (medico.areas || []).map(area => `
        <div class="col-md-6">
            <div class="exam-item p-3 bg-light-pink rounded-3 h-100">
                <i class="bi bi-clipboard2-pulse fs-3 text-pink"></i>
                <h6 class="mt-2 fw-bold">${area}</h6>
                <p class="small text-muted mb-0">Serviço relacionado à especialidade de ${medico.especialidade}.</p>
            </div>
        </div>`).join(''));

    setHTML('#avaliacoes .reviews-list', `
        <div class="review-item mb-4 p-3 border-bottom">
            <div class="d-flex justify-content-between mb-2"><h6 class="fw-bold">Paciente Bloom</h6><div>${gerarEstrelasGrid(5)}</div></div>
            <p class="text-muted mb-2">Atendimento acolhedor, explicações claras e muita segurança durante a consulta.</p>
            <small class="text-muted"><i class="bi bi-calendar"></i> Avaliação recente</small>
        </div>
    `);

    const fixedLink = document.querySelector('.fixed-booking-btn a');
    if (fixedLink) fixedLink.href = `agendamento.html?medico=${medico.id}`;
    document.querySelectorAll('[onclick^="agendarHorario"]').forEach(btn => {
        btn.onclick = () => { window.location.href = `agendamento.html?medico=${medico.id}`; };
    });

    const moreReviewsBtn = document.getElementById('btnMoreReviews') || document.querySelector('#avaliacoes .btn-outline-pink');
    if (moreReviewsBtn) {
        moreReviewsBtn.id = 'btnMoreReviews';
        moreReviewsBtn.onclick = () => {
            const list = document.querySelector('#avaliacoes .reviews-list');
            if (!list) return;
            const extraReviews = [
                'Consulta muito organizada, equipe gentil e informações claras sobre cada etapa do atendimento.',
                'Gostei da pontualidade, do cuidado e da explicação sobre exames e próximos passos.',
                'Ambiente acolhedor e profissional atencioso. Recomendo para acompanhamento completo.'
            ];
            list.insertAdjacentHTML('beforeend', extraReviews.map((texto, index) => `
                <div class="review-item mb-4 p-3 border-bottom">
                    <div class="d-flex justify-content-between mb-2"><h6 class="fw-bold">Paciente Bloom ${index + 2}</h6><div>${gerarEstrelasGrid(5)}</div></div>
                    <p class="text-muted mb-2">${texto}</p>
                    <small class="text-muted"><i class="bi bi-calendar"></i> Avaliação verificada</small>
                </div>`).join(''));
            moreReviewsBtn.disabled = true;
            moreReviewsBtn.textContent = 'Todas as avaliações foram exibidas';
        };
    }

}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================
window.mudarPagina = mudarPagina;
window.aplicarFiltro = aplicarFiltro;
window.agendarComMedico = agendarComMedico;

// ============================================================================
// ESTILOS DINÂMICOS PARA PÁGINA DE MÉDICOS
// ============================================================================
const medicosStyles = document.createElement('style');
medicosStyles.textContent = `
    .doctor-card-item {
        transition: all 0.3s ease;
    }
    .doctor-card-item:hover {
        transform: translateY(-5px);
    }
    .filter-btn {
        transition: all 0.3s ease;
    }
    .filter-btn:hover {
        transform: translateY(-2px);
    }
    .pagination .page-link {
        cursor: pointer;
        border-radius: 8px;
        margin: 0 3px;
    }
    .pagination .page-item.active .page-link {
        background: linear-gradient(135deg, #ff6b9d, #c8a2c8);
        border-color: transparent;
        color: white;
    }
    @media (max-width: 768px) {
        .doctor-profile-image img {
            width: 200px !important;
            height: 200px !important;
        }
        .doctor-info h1 {
            font-size: 1.75rem;
        }
    }
`;
document.head.appendChild(medicosStyles);

/* === BLOOM FIX V3: carrossel independente, sem atraso e com scroll no container correto === */
(function () {
    'use strict';

    function getCarouselParts() {
        const track = document.getElementById('doctorsTrack');
        if (!track) return null;
        const container = track.closest('.doctors-carousel-container') || track.parentElement || track;
        return {
            track,
            container,
            prevBtn: document.getElementById('doctorsPrev'),
            nextBtn: document.getElementById('doctorsNext')
        };
    }

    function doctorsFallbackSafe() {
        return Array.isArray(window.BLOOM_DOCTORS) ? window.BLOOM_DOCTORS : [];
    }

    function renderDoctorCarouselCards(doctors) {
        const parts = getCarouselParts();
        if (!parts || !doctors || !doctors.length) return;

        parts.track.innerHTML = doctors.map((doctor) => {
            const id = doctor.id;
            const nome = doctor.nome || 'Médico Bloom';
            const foto = doctor.foto || '../assets/images/logo-bloom.png';
            const especialidade = doctor.especialidade || 'Obstetrícia';
            const crm = doctor.crm || 'CRM não informado';
            const rqe = doctor.rqe ? ` | RQE: ${doctor.rqe}` : '';
            const total = doctor.total_avaliacoes || 0;
            const resumo = doctor.resumo || 'Atendimento humanizado e especializado na Bloom Maternity.';
            return `
                <div class="doctor-card">
                    <article class="card h-100 border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="doctor-image-wrapper">
                            <img src="${foto}" class="card-img-top" alt="${nome}">
                        </div>
                        <div class="card-body text-center p-4">
                            <h4 class="card-title fw-bold mb-1">${nome}</h4>
                            <p class="text-pink fw-semibold mb-2">${especialidade}</p>
                            <p class="text-muted small">CRM: ${crm}${rqe}</p>
                            <div class="rating mb-3">${typeof gerarEstrelasGrid === 'function' ? gerarEstrelasGrid(doctor.avaliacao || 5) : ''}<span class="ms-2 small">(${total} avaliações)</span></div>
                            <p class="card-text text-muted small">${resumo}</p>
                            <a href="medico-detalhe.html?id=${id}" class="btn btn-pink rounded-pill w-100 mt-auto">Ver Perfil <i class="bi bi-arrow-right"></i></a>
                        </div>
                    </article>
                </div>`;
        }).join('');

        parts.container.scrollLeft = 0;
        requestAnimationFrame(updateDoctorCarouselButtons);
    }

    function updateDoctorCarouselButtons() {
        const parts = getCarouselParts();
        if (!parts) return;
        const maxScroll = Math.max(0, parts.container.scrollWidth - parts.container.clientWidth);
        if (parts.prevBtn) parts.prevBtn.disabled = parts.container.scrollLeft <= 2;
        if (parts.nextBtn) parts.nextBtn.disabled = parts.container.scrollLeft >= maxScroll - 2;
    }

    window.initDoctorCarousel = function initDoctorCarouselFixed() {
        const parts = getCarouselParts();
        if (!parts) return;

        renderDoctorCarouselCards(doctorsFallbackSafe());

        const getStep = () => {
            const card = parts.track.querySelector('.doctor-card');
            const style = window.getComputedStyle(parts.track);
            const gap = parseFloat(style.columnGap || style.gap || '24') || 24;
            return card ? Math.round(card.getBoundingClientRect().width + gap) : 344;
        };

        if (parts.prevBtn && !parts.prevBtn.dataset.bloomFixed) {
            parts.prevBtn.dataset.bloomFixed = 'true';
            parts.prevBtn.addEventListener('click', function () {
                parts.container.scrollBy({ left: -getStep(), behavior: 'smooth' });
                setTimeout(updateDoctorCarouselButtons, 350);
            });
        }

        if (parts.nextBtn && !parts.nextBtn.dataset.bloomFixed) {
            parts.nextBtn.dataset.bloomFixed = 'true';
            parts.nextBtn.addEventListener('click', function () {
                parts.container.scrollBy({ left: getStep(), behavior: 'smooth' });
                setTimeout(updateDoctorCarouselButtons, 350);
            });
        }

        if (!parts.container.dataset.bloomFixed) {
            parts.container.dataset.bloomFixed = 'true';
            parts.container.addEventListener('scroll', function () {
                window.requestAnimationFrame(updateDoctorCarouselButtons);
            }, { passive: true });
            window.addEventListener('resize', updateDoctorCarouselButtons);
        }

        window.carregarMedicosCarrossel();
        updateDoctorCarouselButtons();
    };

    window.carregarMedicosCarrossel = async function carregarMedicosCarrosselFixed() {
        const fallback = doctorsFallbackSafe();
        if (fallback.length) renderDoctorCarouselCards(fallback);

        if (typeof API_BASE_URL === 'undefined' || !window.fetch) {
            updateDoctorCarouselButtons();
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        try {
            const response = await fetch(`${API_BASE_URL}/medicos?limite=8`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('API indisponível');
            const data = await response.json();
            if (data && Array.isArray(data.medicos) && data.medicos.length) {
                const normalized = typeof normalizarMedico === 'function' ? data.medicos.map(normalizarMedico) : data.medicos;
                renderDoctorCarouselCards(normalized);
            }
        } catch (error) {
            clearTimeout(timeout);
            console.warn('Carrossel usando dados locais oficiais:', error.message || error);
            updateDoctorCarouselButtons();
        }
    };
})();
