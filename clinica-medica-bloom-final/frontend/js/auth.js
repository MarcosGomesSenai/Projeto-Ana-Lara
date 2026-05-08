/**
 * ============================================================================
 * ARQUIVO: auth.js
 * PROJETO: Bloom Maternity - Clínica de Obstetrícia
 * DESCRIÇÃO: Gerenciamento de autenticação de usuários, incluindo registro,
 *            login, logout, validação de token, e gerenciamento de sessão.
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
const API_BASE_URL = 'http://localhost:3000/api'; // URL da API backend
const TOKEN_KEY = 'bloom_token';
const USER_KEY = 'bloom_user';
const USER_ID_KEY = 'bloom_user_id';

// ============================================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================================

/**
 * Registrar novo usuário
 * @param {Object} userData - Dados do usuário (nome, email, senha, etc)
 * @returns {Promise<Object>} Resposta do servidor
 */
async function register(userData) {
    try {
        // Validar dados antes de enviar
        if (!userData.nome || userData.nome.trim() === '') {
            throw new Error('Nome é obrigatório');
        }
        
        if (!userData.email || !isValidEmail(userData.email)) {
            throw new Error('E-mail inválido');
        }
        
        if (!userData.senha || userData.senha.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
        }
        
        if (userData.cpf && !isValidCPF(userData.cpf)) {
            throw new Error('CPF inválido');
        }
        
        // Preparar dados para envio
        const payload = {
            nome: userData.nome,
            email: userData.email,
            senha: userData.senha,
            cpf: userData.cpf || null,
            data_nascimento: userData.data_nascimento || null,
            genero: userData.genero || null,
            telefone: userData.telefone || null,
            endereco: userData.endereco || null
        };
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao realizar cadastro');
        }
        
        return {
            success: true,
            message: 'Cadastro realizado com sucesso!',
            data: data
        };
        
    } catch (error) {
        console.error('Erro no registro:', error);
        return {
            success: false,
            message: error.message || 'Erro ao realizar cadastro. Tente novamente.'
        };
    }
}

/**
 * Login do usuário
 * @param {string} email - E-mail do usuário
 * @param {string} password - Senha do usuário
 * @param {boolean} remember - Se deve manter logado
 * @returns {Promise<Object>} Resposta do servidor
 */
async function login(email, password, remember = false) {
    try {
        // Validar dados
        if (!email || !isValidEmail(email)) {
            throw new Error('E-mail inválido');
        }
        
        if (!password || password.trim() === '') {
            throw new Error('Senha é obrigatória');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha: password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'E-mail ou senha incorretos');
        }
        
        // Salvar token e dados do usuário
        if (data.token) {
            if (remember) {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
                localStorage.setItem(USER_ID_KEY, data.usuario.id);
            } else {
                sessionStorage.setItem(TOKEN_KEY, data.token);
                sessionStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
                sessionStorage.setItem(USER_ID_KEY, data.usuario.id);
            }
        }
        
        return {
            success: true,
            message: 'Login realizado com sucesso!',
            user: data.usuario,
            token: data.token
        };
        
    } catch (error) {
        console.error('Erro no login:', error);
        return {
            success: false,
            message: error.message || 'Erro ao fazer login. Tente novamente.'
        };
    }
}

/**
 * Logout do usuário
 */
function logout() {
    // Remover dados de autenticação
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    
    // Redirecionar para página de login
    window.location.href = 'login.html';
    
    // Mostrar mensagem de sucesso
    showToast('Logout realizado com sucesso!', 'success');
}

/**
 * Verificar se usuário está autenticado
 * @returns {boolean} Verdadeiro se estiver logado
 */
function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const user = getCurrentUser();
    
    return !!(token && user && user.id);
}

/**
 * Obter usuário atual
 * @returns {Object|null} Dados do usuário logado ou null
 */
function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    
    if (!userStr) {
        return null;
    }
    
    try {
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Erro ao parsear usuário:', error);
        return null;
    }
}

/**
 * Obter token de autenticação
 * @returns {string|null} Token JWT ou null
 */
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Obter ID do usuário atual
 * @returns {number|null} ID do usuário ou null
 */
function getCurrentUserId() {
    const userId = localStorage.getItem(USER_ID_KEY) || sessionStorage.getItem(USER_ID_KEY);
    return userId ? parseInt(userId) : null;
}

/**
 * Atualizar dados do usuário
 * @param {Object} userData - Novos dados do usuário
 * @returns {Promise<Object>} Resposta do servidor
 */
async function updateUserProfile(userData) {
    try {
        const token = getAuthToken();
        const userId = getCurrentUserId();
        
        if (!token || !userId) {
            throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/pacientes/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao atualizar perfil');
        }
        
        // Atualizar dados no localStorage
        const currentUser = getCurrentUser();
        const updatedUser = { ...currentUser, ...userData };
        
        if (localStorage.getItem(USER_KEY)) {
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        } else {
            sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        
        return {
            success: true,
            message: 'Perfil atualizado com sucesso!',
            user: updatedUser
        };
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return {
            success: false,
            message: error.message || 'Erro ao atualizar perfil. Tente novamente.'
        };
    }
}

/**
 * Alterar senha do usuário
 * @param {string} currentPassword - Senha atual
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Resposta do servidor
 */
async function changePassword(currentPassword, newPassword) {
    try {
        const token = getAuthToken();
        const userId = getCurrentUserId();
        
        if (!token || !userId) {
            throw new Error('Usuário não autenticado');
        }
        
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Nova senha deve ter pelo menos 6 caracteres');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId,
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao alterar senha');
        }
        
        return {
            success: true,
            message: 'Senha alterada com sucesso!'
        };
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return {
            success: false,
            message: error.message || 'Erro ao alterar senha. Tente novamente.'
        };
    }
}

/**
 * Recuperar senha (enviar link de redefinição)
 * @param {string} email - E-mail do usuário
 * @returns {Promise<Object>} Resposta do servidor
 */
async function forgotPassword(email) {
    try {
        if (!email || !isValidEmail(email)) {
            throw new Error('E-mail inválido');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao enviar link de recuperação');
        }
        
        return {
            success: true,
            message: 'Link de recuperação enviado para seu e-mail!'
        };
        
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        return {
            success: false,
            message: error.message || 'Erro ao recuperar senha. Tente novamente.'
        };
    }
}

/**
 * Redefinir senha com token
 * @param {string} token - Token de redefinição
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Resposta do servidor
 */
async function resetPassword(token, newPassword) {
    try {
        if (!token) {
            throw new Error('Token inválido');
        }
        
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao redefinir senha');
        }
        
        return {
            success: true,
            message: 'Senha redefinida com sucesso!'
        };
        
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return {
            success: false,
            message: error.message || 'Erro ao redefinir senha. Tente novamente.'
        };
    }
}

/**
 * Validar token de autenticação
 * @returns {Promise<boolean>} Verdadeiro se token for válido
 */
async function validateToken() {
    try {
        const token = getAuthToken();
        
        if (!token) {
            return false;
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return false;
    }
}

/**
 * Obter agendamentos do usuário
 * @returns {Promise<Array>} Lista de agendamentos
 */
async function getUserAppointments() {
    try {
        const token = getAuthToken();
        const userId = getCurrentUserId();
        
        if (!token || !userId) {
            throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/agendamentos/paciente/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar agendamentos');
        }
        
        return {
            success: true,
            appointments: data.agendamentos || []
        };
        
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return {
            success: false,
            message: error.message || 'Erro ao buscar agendamentos',
            appointments: []
        };
    }
}

/**
 * Obter histórico de exames do usuário
 * @returns {Promise<Array>} Lista de exames
 */
async function getUserExams() {
    try {
        const token = getAuthToken();
        const userId = getCurrentUserId();
        
        if (!token || !userId) {
            throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`${API_BASE_URL}/exames/paciente/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar exames');
        }
        
        return {
            success: true,
            exams: data.exames || []
        };
        
    } catch (error) {
        console.error('Erro ao buscar exames:', error);
        return {
            success: false,
            message: error.message || 'Erro ao buscar exames',
            exams: []
        };
    }
}

// ============================================================================
// INTERCEPTOR DE REQUISIÇÕES
// ============================================================================

/**
 * Adicionar token de autenticação a todas as requisições fetch
 */
function setupAuthInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const token = getAuthToken();
        
        if (token && args[1]) {
            if (!args[1].headers) {
                args[1].headers = {};
            }
            args[1].headers['Authorization'] = `Bearer ${token}`;
        }
        
        return originalFetch.apply(this, args);
    };
}

// Inicializar interceptor
setupAuthInterceptor();

// ============================================================================
// AUTO LOGIN CHECK (para páginas protegidas)
// ============================================================================
function checkAuthAndRedirect() {
    const protectedPages = ['agendamento.html', 'perfil.html', 'meus-agendamentos.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        showToast('Você precisa estar logado para acessar esta página', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    
    return true;
}

// Executar verificação automática
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRedirect();
});