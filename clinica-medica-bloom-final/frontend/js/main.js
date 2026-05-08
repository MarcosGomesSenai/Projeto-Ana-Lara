/**
 * ============================================================================
 * ARQUIVO: main.js
 * PROJETO: Bloom Maternity - Clínica de Obstetrícia
 * DESCRIÇÃO: Funções principais do site, incluindo utilitários globais,
 *            manipulação de DOM, animações, carrosséis, e funcionalidades
 *            comuns a todas as páginas.
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let currentTheme = localStorage.getItem('theme') || 'light';
let scrollPosition = 0;
let backToTopButton = null;
let themeSwitch = null;

// ============================================================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bloom Maternity - Site Inicializado com Sucesso!');
    
    // Inicializar todas as funcionalidades
    initBackToTop();
    initSmoothScroll();
    initNavbarScroll();
    initAnimations();
    initLazyLoading();
    initFormValidation();
    initTooltips();
    initPopovers();
    initThemeSwitch();
    initCarousels();
    initCounters();
    initModalHandlers();
    initFormMasks();
    initFileUploads();
    initPasswordToggles();
    initScrollReveal();
    
    // Verificar se há parâmetros na URL
    handleURLParams();
});

// ============================================================================
// BACK TO TOP BUTTON
// ============================================================================
function initBackToTop() {
    // Criar botão se não existir
    if (!document.querySelector('.back-to-top')) {
        backToTopButton = document.createElement('button');
        backToTopButton.className = 'back-to-top';
        backToTopButton.innerHTML = '<i class="bi bi-arrow-up"></i>';
        backToTopButton.setAttribute('aria-label', 'Voltar ao topo');
        document.body.appendChild(backToTopButton);
    } else {
        backToTopButton = document.querySelector('.back-to-top');
    }
    
    // Evento de scroll para mostrar/esconder botão
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    // Evento de clique para voltar ao topo
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================================================
// SMOOTH SCROLL PARA LINKS ANCORA
// ============================================================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const offsetTop = targetElement.offsetTop - 80; // Altura do navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Atualizar URL sem recarregar a página
                history.pushState(null, null, targetId);
            }
        });
    });
}

// ============================================================================
// NAVBAR SCROLL EFFECT
// ============================================================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}

// ============================================================================
// ANIMAÇÕES DE ENTRADA
// ============================================================================
function initAnimations() {
    // Adicionar classe de animação para elementos com data-animate
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animation = element.getAttribute('data-animate');
                element.classList.add(`animate-${animation}`);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ============================================================================
// LAZY LOADING DE IMAGENS
// ============================================================================
function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        // Navegador suporta lazy loading nativo
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
    } else {
        // Fallback para navegadores antigos
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

// ============================================================================
// VALIDAÇÃO DE FORMULÁRIOS
// ============================================================================
function initFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

// ============================================================================
// TOOLTIPS INICIALIZAÇÃO
// ============================================================================
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// ============================================================================
// POPOVERS INICIALIZAÇÃO
// ============================================================================
function initPopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// ============================================================================
// TEMA (CLARO/ESCURO)
// ============================================================================
function initThemeSwitch() {
    // Aplicar tema salvo
    applyTheme(currentTheme);
    
    // Criar botão de tema se não existir
    if (!document.querySelector('.theme-switch')) {
        themeSwitch = document.createElement('div');
        themeSwitch.className = 'theme-switch';
        themeSwitch.innerHTML = '<i class="bi bi-moon-stars"></i>';
        themeSwitch.setAttribute('aria-label', 'Alternar tema');
        document.body.appendChild(themeSwitch);
        
        themeSwitch.addEventListener('click', toggleTheme);
    }
    
    // Verificar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!localStorage.getItem('theme') && prefersDark) {
        applyTheme('dark');
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    
    // Atualizar ícone do botão
    if (themeSwitch) {
        const icon = themeSwitch.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'bi bi-sun';
        } else {
            icon.className = 'bi bi-moon-stars';
        }
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
    // Mostrar toast de notificação
    showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, 'success');
}

// ============================================================================
// CARROSSÉIS DINÂMICOS
// ============================================================================
function initCarousels() {
    // Carrossel de médicos
    initDoctorCarousel();
    
    // Carrossel de depoimentos
    initTestimonialCarousel();
}

function initDoctorCarousel() {
    const track = document.getElementById('doctorsTrack');
    const prevBtn = document.getElementById('doctorsPrev');
    const nextBtn = document.getElementById('doctorsNext');
    const scroller = track?.closest('.doctors-carousel-container');
    
    if (!track || !scroller || !prevBtn || !nextBtn) return;
    
    const getStep = () => {
        const firstCard = track.querySelector('.doctor-card');
        const gap = parseInt(getComputedStyle(track).gap || '24', 10);
        return firstCard ? firstCard.offsetWidth + gap : 344;
    };
    const updateButtons = () => {
        const maxScroll = scroller.scrollWidth - scroller.clientWidth;
        prevBtn.disabled = scroller.scrollLeft <= 4;
        nextBtn.disabled = scroller.scrollLeft >= maxScroll - 4;
    };
    const move = (direction) => {
        scroller.scrollBy({ left: direction * getStep(), behavior: 'smooth' });
        setTimeout(updateButtons, 350);
    };
    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move(1));
    scroller.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    updateButtons();
}

function initTestimonialCarousel() {
    const carousel = document.querySelector('#testimonialCarousel');
    if (carousel) {
        new bootstrap.Carousel(carousel, {
            interval: 5000,
            pause: 'hover',
            wrap: true
        });
    }
}

// ============================================================================
// CONTADORES ANIMADOS
// ============================================================================
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
                animateCounter(counter, target, duration);
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target, duration) {
    let start = 0;
    const increment = target / (duration / 16); // 60fps
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================
function initModalHandlers() {
    // Fechar modal ao clicar fora
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                const modalInstance = bootstrap.Modal.getInstance(this);
                modalInstance.hide();
            }
        });
    });
}

// ============================================================================
// MASCARAS DE FORMULÁRIO
// ============================================================================
function initFormMasks() {
    // Máscara para CPF
    const cpfInputs = document.querySelectorAll('input[data-mask="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        });
    });
    
    // Máscara para Telefone
    const phoneInputs = document.querySelectorAll('input[data-mask="phone"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length > 2) {
                    value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
                }
                if (value.length > 10) {
                    value = value.replace(/(\(\d{2}\) \d{5})(\d{4})/, '$1-$2');
                } else if (value.length > 7) {
                    value = value.replace(/(\(\d{2}\) \d{4})(\d{4})/, '$1-$2');
                }
                e.target.value = value;
            }
        });
    });
    
    // Máscara para CEP
    const cepInputs = document.querySelectorAll('input[data-mask="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                if (value.length > 5) {
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                }
                e.target.value = value;
            }
        });
    });
    
    // Máscara para Data
    const dateInputs = document.querySelectorAll('input[data-mask="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                if (value.length > 4) {
                    value = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
                } else if (value.length > 2) {
                    value = value.replace(/(\d{2})(\d{2})/, '$1/$2');
                }
                e.target.value = value;
            }
        });
    });
}

// ============================================================================
// UPLOAD DE ARQUIVOS
// ============================================================================
function initFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"][data-show-preview]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const previewId = this.getAttribute('data-preview-id');
            const previewContainer = document.getElementById(previewId);
            
            if (previewContainer && this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.className = 'img-fluid rounded-3 mt-2';
                    img.style.maxHeight = '150px';
                    previewContainer.innerHTML = '';
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    });
}

// ============================================================================
// TOGGLE DE SENHA
// ============================================================================
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-eye');
                    icon.classList.toggle('bi-eye-slash');
                }
            }
        });
    });
}

// ============================================================================
// SCROLL REVEAL
// ============================================================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// ============================================================================
// HANDLE URL PARAMETERS
// ============================================================================
function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Abrir modal específico via URL
    const modalParam = urlParams.get('modal');
    if (modalParam) {
        const modal = document.getElementById(`${modalParam}Modal`);
        if (modal) {
            setTimeout(() => {
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
            }, 500);
        }
    }
    
    // Scroll para seção específica
    const sectionParam = urlParams.get('section');
    if (sectionParam) {
        const section = document.getElementById(sectionParam);
        if (section) {
            setTimeout(() => {
                const offsetTop = section.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }, 300);
        }
    }
    
    // Preencher formulário via URL
    const formData = {};
    for (let [key, value] of urlParams.entries()) {
        if (key.startsWith('form_')) {
            const fieldName = key.replace('form_', '');
            formData[fieldName] = decodeURIComponent(value);
        }
    }
    
    if (Object.keys(formData).length > 0) {
        setTimeout(() => {
            fillFormData(formData);
        }, 500);
    }
}

function fillFormData(data) {
    for (const [name, value] of Object.entries(data)) {
        const field = document.querySelector(`[name="${name}"]`);
        if (field) {
            field.value = value;
        }
    }
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS GLOBAIS
// ============================================================================

/**
 * Mostrar toast de notificação
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Verificar se já existe um toast
    let toast = document.querySelector('.toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Formatar moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em reais
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formatar data para padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (dd/mm/yyyy)
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

/**
 * Validar e-mail
 * @param {string} email - E-mail a ser validado
 * @returns {boolean} Verdadeiro se for válido
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} Verdadeiro se for válido
 */
function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

/**
 * Validar telefone
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} Verdadeiro se for válido
 */
function isValidPhone(phone) {
    phone = phone.replace(/\D/g, '');
    return phone.length >= 10 && phone.length <= 11;
}

/**
 * Debounce para eventos que disparam muitas vezes
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copiar texto para clipboard
 * @param {string} text - Texto a ser copiado
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado para a área de transferência!', 'success');
    }).catch(() => {
        showToast('Erro ao copiar texto', 'error');
    });
}

/**
 * Gerar ID único
 * @returns {string} ID único
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Adicionar efeito ripple a um elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {Event} event - Evento do clique
 */
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// ============================================================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================================================
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.isValidEmail = isValidEmail;
window.isValidCPF = isValidCPF;
window.isValidPhone = isValidPhone;
window.copyToClipboard = copyToClipboard;
window.generateUniqueId = generateUniqueId;
window.addRippleEffect = addRippleEffect;