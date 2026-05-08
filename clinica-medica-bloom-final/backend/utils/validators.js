/**
 * ============================================================================
 * ARQUIVO: validators.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Funções de validação para dados de entrada da API
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// VALIDAÇÕES DE EMAIL
// ============================================================================

/**
 * Validar formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean}
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar e retornar erro de email
 * @param {string} email - Email a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateEmail(email) {
    if (!email) {
        return 'E-mail é obrigatório';
    }
    if (!isValidEmail(email)) {
        return 'E-mail inválido';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE CPF
// ============================================================================

/**
 * Validar CPF (formato e dígitos verificadores)
 * @param {string} cpf - CPF a ser validado (pode conter pontos e traço)
 * @returns {boolean}
 */
function isValidCPF(cpf) {
    // Remover caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit = remainder === 10 || remainder === 11 ? 0 : remainder;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    digit = remainder === 10 || remainder === 11 ? 0 : remainder;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

/**
 * Validar e retornar erro de CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateCPF(cpf) {
    if (!cpf) return null; // CPF é opcional
    if (!isValidCPF(cpf)) {
        return 'CPF inválido';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE TELEFONE
// ============================================================================

/**
 * Validar formato de telefone
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean}
 */
function isValidPhone(phone) {
    const phoneClean = phone.replace(/\D/g, '');
    return phoneClean.length >= 10 && phoneClean.length <= 11;
}

/**
 * Validar e retornar erro de telefone
 * @param {string} phone - Telefone a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validatePhone(phone) {
    if (!phone) return null; // Telefone é opcional
    if (!isValidPhone(phone)) {
        return 'Telefone inválido. Use o formato (11) 99999-9999';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE SENHA
// ============================================================================

/**
 * Validar senha
 * @param {string} password - Senha a ser validada
 * @param {number} minLength - Tamanho mínimo
 * @returns {boolean}
 */
function isValidPassword(password, minLength = 6) {
    return password && password.length >= minLength;
}

/**
 * Validar e retornar erro de senha
 * @param {string} password - Senha a ser validada
 * @param {number} minLength - Tamanho mínimo
 * @returns {string|null} Mensagem de erro ou null
 */
function validatePassword(password, minLength = 6) {
    if (!password) {
        return 'Senha é obrigatória';
    }
    if (password.length < minLength) {
        return `Senha deve ter pelo menos ${minLength} caracteres`;
    }
    return null;
}

/**
 * Validar confirmação de senha
 * @param {string} password - Senha
 * @param {string} confirmPassword - Confirmação da senha
 * @returns {string|null} Mensagem de erro ou null
 */
function validatePasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return 'As senhas não coincidem';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE DATA
// ============================================================================

/**
 * Validar formato de data
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {boolean}
 */
function isValidDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

/**
 * Validar se a data é futura
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {boolean}
 */
function isFutureDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(date);
    return dateObj >= today;
}

/**
 * Validar data de nascimento (maior de idade)
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {boolean}
 */
function isAdult(date) {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= 18;
}

/**
 * Validar e retornar erro de data
 * @param {string} date - Data a ser validada
 * @param {boolean} requireFuture - Se deve ser futura
 * @returns {string|null} Mensagem de erro ou null
 */
function validateDate(date, requireFuture = false) {
    if (!date) return null;
    if (!isValidDate(date)) {
        return 'Data inválida. Use o formato YYYY-MM-DD';
    }
    if (requireFuture && !isFutureDate(date)) {
        return 'Data deve ser futura';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE NOME
// ============================================================================

/**
 * Validar nome
 * @param {string} name - Nome a ser validado
 * @returns {boolean}
 */
function isValidName(name) {
    return name && name.trim().length >= 3;
}

/**
 * Validar e retornar erro de nome
 * @param {string} name - Nome a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateName(name) {
    if (!name) {
        return 'Nome é obrigatório';
    }
    if (name.trim().length < 3) {
        return 'Nome deve ter pelo menos 3 caracteres';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE HORÁRIO
// ============================================================================

/**
 * Validar formato de horário
 * @param {string} time - Horário no formato HH:MM
 * @returns {boolean}
 */
function isValidTime(time) {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
}

/**
 * Validar e retornar erro de horário
 * @param {string} time - Horário a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateTime(time) {
    if (!time) {
        return 'Horário é obrigatório';
    }
    if (!isValidTime(time)) {
        return 'Horário inválido. Use o formato HH:MM';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE CEP
// ============================================================================

/**
 * Validar formato de CEP
 * @param {string} cep - CEP a ser validado
 * @returns {boolean}
 */
function isValidCEP(cep) {
    const cepClean = cep.replace(/\D/g, '');
    return cepClean.length === 8;
}

/**
 * Validar e retornar erro de CEP
 * @param {string} cep - CEP a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateCEP(cep) {
    if (!cep) return null;
    if (!isValidCEP(cep)) {
        return 'CEP inválido. Use o formato 00000-000';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE VALOR MONETÁRIO
// ============================================================================

/**
 * Validar valor monetário
 * @param {number} value - Valor a ser validado
 * @returns {boolean}
 */
function isValidMoney(value) {
    return !isNaN(value) && value >= 0;
}

/**
 * Validar e retornar erro de valor monetário
 * @param {number} value - Valor a ser validado
 * @returns {string|null} Mensagem de erro ou null
 */
function validateMoney(value) {
    if (value === undefined || value === null) return null;
    if (isNaN(value) || value < 0) {
        return 'Valor inválido. Deve ser um número positivo';
    }
    return null;
}

// ============================================================================
// VALIDAÇÕES DE ID
// ============================================================================

/**
 * Validar ID numérico
 * @param {number|string} id - ID a ser validado
 * @returns {boolean}
 */
function isValidId(id) {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
}

/**
 * Validar e retornar erro de ID
 * @param {number|string} id - ID a ser validado
 * @param {string} fieldName - Nome do campo para mensagem
 * @returns {string|null} Mensagem de erro ou null
 */
function validateId(id, fieldName = 'ID') {
    if (!id) {
        return `${fieldName} é obrigatório`;
    }
    if (!isValidId(id)) {
        return `${fieldName} inválido`;
    }
    return null;
}

// ============================================================================
// MIDDLEWARES DE VALIDAÇÃO PARA EXPRESS
// ============================================================================

/**
 * Middleware para validar cadastro de paciente
 */
const validateRegister = (req, res, next) => {
    const { nome, email, senha, confirmar_senha, cpf, telefone, data_nascimento } = req.body;
    
    const errors = [];
    
    const nameError = validateName(nome);
    if (nameError) errors.push(nameError);
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    const passwordError = validatePassword(senha);
    if (passwordError) errors.push(passwordError);
    
    if (confirmar_senha) {
        const matchError = validatePasswordMatch(senha, confirmar_senha);
        if (matchError) errors.push(matchError);
    }
    
    const cpfError = validateCPF(cpf);
    if (cpfError) errors.push(cpfError);
    
    const phoneError = validatePhone(telefone);
    if (phoneError) errors.push(phoneError);
    
    const dateError = validateDate(data_nascimento);
    if (dateError) errors.push(dateError);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors
        });
    }
    
    next();
};

/**
 * Middleware para validar login
 */
const validateLogin = (req, res, next) => {
    const { email, senha } = req.body;
    
    const errors = [];
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    const passwordError = validatePassword(senha);
    if (passwordError) errors.push(passwordError);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors
        });
    }
    
    next();
};

/**
 * Middleware para validar alteração de senha
 */
const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    const errors = [];
    
    if (!currentPassword) {
        errors.push('Senha atual é obrigatória');
    }
    
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.push(newPasswordError);
    
    const matchError = validatePasswordMatch(newPassword, confirmNewPassword);
    if (matchError) errors.push(matchError);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors
        });
    }
    
    next();
};

/**
 * Middleware para validar agendamento
 */
const validateAgendamento = (req, res, next) => {
    const { medico_id, exame_id, data, horario } = req.body;
    
    const errors = [];
    
    const medicoIdError = validateId(medico_id, 'Médico');
    if (medicoIdError) errors.push(medicoIdError);
    
    const exameIdError = validateId(exame_id, 'Exame');
    if (exameIdError) errors.push(exameIdError);
    
    const dateError = validateDate(data, true);
    if (dateError) errors.push(dateError);
    
    const timeError = validateTime(horario);
    if (timeError) errors.push(timeError);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors
        });
    }
    
    next();
};

/**
 * Middleware para validar atualização de perfil
 */
const validatePerfilUpdate = (req, res, next) => {
    const { nome, telefone, cep, email } = req.body;
    
    const errors = [];
    
    if (nome) {
        const nameError = validateName(nome);
        if (nameError) errors.push(nameError);
    }
    
    if (telefone) {
        const phoneError = validatePhone(telefone);
        if (phoneError) errors.push(phoneError);
    }
    
    if (cep) {
        const cepError = validateCEP(cep);
        if (cepError) errors.push(cepError);
    }
    
    if (email) {
        const emailError = validateEmail(email);
        if (emailError) errors.push(emailError);
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors
        });
    }
    
    next();
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================
module.exports = {
    // Funções de validação
    isValidEmail,
    isValidCPF,
    isValidPhone,
    isValidPassword,
    isValidDate,
    isFutureDate,
    isAdult,
    isValidName,
    isValidTime,
    isValidCEP,
    isValidMoney,
    isValidId,
    
    // Funções com retorno de erro
    validateEmail,
    validateCPF,
    validatePhone,
    validatePassword,
    validatePasswordMatch,
    validateDate,
    validateName,
    validateTime,
    validateCEP,
    validateMoney,
    validateId,
    
    // Middlewares
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateAgendamento,
    validatePerfilUpdate
};