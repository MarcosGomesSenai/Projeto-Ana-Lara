-- ============================================================================
-- SCRIPT: script.sql
-- PROJETO: Bloom Maternity - Clínica de Obstetrícia
-- DESCRIÇÃO: Script completo para criação do banco de dados MySQL
-- AUTOR: Bloom Maternity Team
-- VERSÃO: 1.0.0
-- ============================================================================

-- ============================================================================
-- CRIAR BANCO DE DADOS
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bloom_maternity 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE bloom_maternity;

-- ============================================================================
-- TABELA: ESPECIALIDADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS especialidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- TABELA: EXAMES
-- ============================================================================

CREATE TABLE IF NOT EXISTS exames (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria ENUM('Ultrassonografia', 'Análise Clínica', 'Imagem', 'Cardiologia', 'Outros') DEFAULT 'Outros',
    preco DECIMAL(10,2) NOT NULL DEFAULT 0,
    duracao INT DEFAULT 30,
    preparo TEXT,
    contraindicacoes TEXT,
    resultado_entrega VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    imagem VARCHAR(500),
    ordem_exibicao INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_nome (nome),
    INDEX idx_categoria (categoria),
    INDEX idx_ativo (ativo),
    INDEX idx_tipo_usuario (tipo_usuario)
);

-- ============================================================================
-- TABELA: PACIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    genero ENUM('Feminino', 'Masculino', 'Outro', 'Prefiro não informar') DEFAULT 'Prefiro não informar',
    telefone VARCHAR(20),
    endereco TEXT,
    cep VARCHAR(10),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login DATETIME,
    token_recuperacao VARCHAR(255),
    token_recuperacao_expira DATETIME,
    aceita_comunicacoes BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    tipo_usuario ENUM('paciente', 'admin') DEFAULT 'paciente',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_cpf (cpf),
    INDEX idx_ativo (ativo)
);

-- ============================================================================
-- TABELA: MEDICOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS medicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    especialidade_id INT NOT NULL,
    crm VARCHAR(20) NOT NULL UNIQUE,
    foto VARCHAR(500),
    email VARCHAR(100),
    telefone VARCHAR(20),
    resumo TEXT,
    descricao TEXT,
    formacao TEXT,
    experiencia TEXT,
    premios TEXT,
    experiencia_anos INT DEFAULT 0,
    avaliacao DECIMAL(3,2) DEFAULT 5.0,
    total_avaliacoes INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    disponivel BOOLEAN DEFAULT TRUE,
    horario_inicio TIME DEFAULT '08:00:00',
    horario_fim TIME DEFAULT '18:00:00',
    intervalo_consulta INT DEFAULT 30,
    dias_atendimento VARCHAR(50) DEFAULT '1,2,3,4,5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (especialidade_id) REFERENCES especialidades(id) ON DELETE RESTRICT,
    INDEX idx_especialidade (especialidade_id),
    INDEX idx_crm (crm),
    INDEX idx_ativo (ativo)
);

-- ============================================================================
-- TABELA: AGENDAMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agendamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    exame_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    status ENUM('agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado', 'pendente') DEFAULT 'agendado',
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    data_agendamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_confirmacao DATETIME,
    data_cancelamento DATETIME,
    motivo_cancelamento TEXT,
    link_telemedicina VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE RESTRICT,
    FOREIGN KEY (exame_id) REFERENCES exames(id) ON DELETE RESTRICT,
    INDEX idx_paciente (paciente_id),
    INDEX idx_medico (medico_id),
    INDEX idx_data (data),
    INDEX idx_status (status),
    INDEX idx_data_horario (data, horario),
    CONSTRAINT chk_horario_valido CHECK (horario BETWEEN '07:00:00' AND '20:00:00')
);

-- ============================================================================
-- TABELA: DISPONIBILIDADE_MEDICOS (Horários específicos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS disponibilidade_medicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medico_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_medico_data_horario (medico_id, data, horario),
    INDEX idx_medico_data (medico_id, data)
);

-- ============================================================================
-- TABELA: MEDICO_EXAMES (Relacionamento N:N)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medico_exames (
    medico_id INT NOT NULL,
    exame_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (medico_id, exame_id),
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (exame_id) REFERENCES exames(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABELA: AVALIACOES (Avaliações de pacientes sobre médicos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    agendamento_id INT NOT NULL,
    nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_paciente_agendamento (paciente_id, agendamento_id),
    INDEX idx_medico (medico_id)
);

-- ============================================================================
-- INSERTS DE DADOS INICIAIS
-- ============================================================================

-- Inserir especialidades
INSERT INTO especialidades (nome, descricao) VALUES
('Obstetrícia', 'Acompanhamento da gestação e parto'),
('Ginecologia', 'Saúde da mulher'),
('Medicina Fetal', 'Diagnóstico e tratamento de doenças fetais'),
('Reprodução Humana', 'Fertilidade e reprodução assistida'),
('Ultrassonografia', 'Exames de imagem obstétrica');

-- Inserir exames
INSERT INTO exames (nome, descricao, categoria, preco, duracao, preparo, resultado_entrega, ordem_exibicao) VALUES
('Ultrassonografia Obstétrica', 'Exame de imagem que permite visualizar o feto, avaliar o desenvolvimento gestacional e identificar possíveis anomalias.', 'Ultrassonografia', 250.00, 30, 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.', '24 horas úteis', 1),
('Ultrassom Morfológico (1º Trimestre)', 'Exame detalhado para avaliar a anatomia fetal no primeiro trimestre da gestação.', 'Ultrassonografia', 380.00, 45, 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.', '24 horas úteis', 2),
('Ultrassom Morfológico (2º Trimestre)', 'Exame detalhado para avaliar a anatomia fetal no segundo trimestre da gestação.', 'Ultrassonografia', 380.00, 45, 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.', '24 horas úteis', 3),
('Ultrassom 3D/4D', 'Exame que gera imagens tridimensionais do feto, permitindo visualizar detalhes do rosto e movimentos.', 'Ultrassonografia', 450.00, 40, 'Bexiga cheia. Ingerir 1 litro de água 1 hora antes do exame.', '24 horas úteis', 4),
('Hemograma Completo', 'Exame de sangue que avalia as células sanguíneas, identificando anemias, infecções e outras condições.', 'Análise Clínica', 60.00, 15, 'Jejum de 8 horas.', '24 horas úteis', 5),
('Glicemia em Jejum', 'Exame que mede o nível de açúcar no sangue, importante para diagnóstico de diabetes gestacional.', 'Análise Clínica', 30.00, 10, 'Jejum de 8 horas.', '24 horas úteis', 6),
('Curva Glicêmica (TOTG)', 'Exame para diagnóstico de diabetes gestacional, com medição da glicemia após ingestão de glicose.', 'Análise Clínica', 90.00, 120, 'Jejum de 8 horas. O exame dura 2 horas com coletas de sangue em jejum, 1h e 2h após ingestão de glicose.', '48 horas úteis', 7),
('Cardiotocografia (CTG)', 'Exame que monitora os batimentos cardíacos do feto e as contrações uterinas.', 'Cardiologia', 200.00, 30, 'Não necessita de preparo especial.', 'Imediato', 8),
('Preventivo (Papanicolau)', 'Exame ginecológico para rastreamento do câncer de colo de útero.', 'Outros', 80.00, 15, 'Não estar menstruada. Evitar relação sexual 48h antes. Não usar cremes ou duchas 48h antes.', '7 dias úteis', 9);

-- Inserir médicos oficiais da clínica
INSERT INTO medicos (nome, especialidade_id, crm, foto, email, telefone, resumo, descricao, formacao, experiencia, experiencia_anos, avaliacao, total_avaliacoes, disponivel) VALUES
('Dr. Gustavo Henrique Martins', 4, '145987-SP', '../assets/images/dr-gustavo-henrique-martins.png', 'gustavo.martins@bloommaternity.com.br', '(11) 99999-1111', 'Fertilidade do casal, inseminação artificial e FIV.', 'Especialista em Reprodução Humana, com foco em investigação da infertilidade, fertilidade do casal, inseminação artificial e fertilização in vitro.', 'Medicina pela USP; Especialização em Reprodução Assistida', 'Atendimento em reprodução humana assistida; acompanhamento de casais em investigação de infertilidade.', 12, 4.9, 128, TRUE),
('Dr. Ricardo Almeida Costa', 3, '132456-SP', '../assets/images/dr-ricardo-almeida-costa.png', 'ricardo.costa@bloommaternity.com.br', '(11) 99999-2222', 'Ultrassom morfológico, acompanhamento fetal e gestação de risco.', 'Especialista em Medicina Fetal e Ultrassonografia, com atuação em ultrassom morfológico, acompanhamento fetal e gestação de risco.', 'Medicina pela UNICAMP; Residência em Ginecologia e Obstetrícia; Fellowship em Medicina Fetal', 'Diagnóstico pré-natal avançado; rotina de medicina fetal; acompanhamento de gestações de alto risco.', 10, 4.8, 95, TRUE),
('Dra. Fernanda Ribeiro Alves', 4, '149876-SP', '../assets/images/dra-fernanda-ribeiro-alves.png', 'fernanda.alves@bloommaternity.com.br', '(11) 99999-3333', 'Hormônios femininos, infertilidade e menopausa.', 'Especialista em Fertilidade e Ginecologia Endócrina, dedicada ao cuidado hormonal feminino, infertilidade e menopausa.', 'Medicina pela UNIFESP; Pós-graduação em Reprodução Humana', 'Avaliação hormonal feminina; tratamento de infertilidade; acompanhamento de menopausa e climatério.', 8, 4.9, 87, TRUE),
('Dra. Mariana Costa Ferreira', 1, '181654-SP', '../assets/images/dra-mariana-costa-ferreira.png', 'mariana.ferreira@bloommaternity.com.br', '(11) 99999-4444', 'Gestação, parto normal, puerpério e amamentação.', 'Especialista em Obstetrícia e Parto Humanizado, com atendimento voltado para gestação, parto normal, puerpério e amamentação.', 'Medicina pela PUC-SP; Residência na Santa Casa de São Paulo; Certificação em Assistência ao Parto Humanizado', 'Pré-natal humanizado; assistência ao parto; acompanhamento no pós-parto.', 15, 5.0, 156, TRUE),
('Dra. Ana Carolina Mendes', 2, '154789-SP', '../assets/images/dra-ana-carolina-mendes.png', 'ana.mendes@bloommaternity.com.br', '(11) 99999-5555', 'Pré-natal, parto humanizado, contracepção e saúde feminina.', 'Especialista em Ginecologia e Obstetrícia, com atuação em pré-natal, parto humanizado, contracepção e saúde feminina.', 'Medicina pela Universidade de São Paulo (USP); Residência no Hospital das Clínicas – FMUSP; Título FEBRASGO / AMB', 'Consultas ginecológicas preventivas; acompanhamento obstétrico; planejamento familiar.', 11, 4.9, 142, TRUE);

-- Relacionar médicos com exames
INSERT INTO medico_exames (medico_id, exame_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5), (1, 6), (1, 7),
(2, 1), (2, 2), (2, 3), (2, 4),
(3, 5), (3, 6), (3, 7),
(4, 1), (4, 2), (4, 3), (4, 4),
(5, 5), (5, 6), (5, 7), (5, 9);

-- ============================================================================
-- VIEWS PARA CONSULTAS COMUNS
-- ============================================================================

-- View: Agenda do dia
CREATE OR REPLACE VIEW view_agenda_dia AS
SELECT 
    a.id,
    p.nome AS paciente_nome,
    p.telefone AS paciente_telefone,
    m.nome AS medico_nome,
    m.crm,
    e.nome AS exame_nome,
    a.data,
    a.horario,
    a.status,
    a.valor
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
JOIN medicos m ON a.medico_id = m.id
JOIN exames e ON a.exame_id = e.id
WHERE a.data = CURDATE()
AND a.status NOT IN ('cancelado', 'realizado')
ORDER BY a.horario;

-- View: Próximas consultas
CREATE OR REPLACE VIEW view_proximas_consultas AS
SELECT 
    a.id,
    p.nome AS paciente_nome,
    p.email AS paciente_email,
    m.nome AS medico_nome,
    e.nome AS exame_nome,
    a.data,
    a.horario,
    DATEDIFF(a.data, CURDATE()) AS dias_restantes
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
JOIN medicos m ON a.medico_id = m.id
JOIN exames e ON a.exame_id = e.id
WHERE a.data >= CURDATE()
AND a.status IN ('agendado', 'confirmado')
ORDER BY a.data, a.horario
LIMIT 50;

-- ============================================================================
-- PROCEDURES E FUNCTIONS
-- ============================================================================

-- Procedure: Cancelar consultas antigas (mais de 30 dias sem comparecimento)
DELIMITER //
CREATE PROCEDURE sp_cancelar_consultas_antigas()
BEGIN
    UPDATE agendamentos 
    SET status = 'cancelado', 
        motivo_cancelamento = 'Cancelamento automático - consulta antiga',
        data_cancelamento = NOW()
    WHERE status = 'agendado' 
    AND data < DATE_SUB(CURDATE(), INTERVAL 30 DAY);
END //
DELIMITER ;

-- Procedure: Atualizar avaliação média do médico
DELIMITER //
CREATE PROCEDURE sp_atualizar_media_medico(IN p_medico_id INT)
BEGIN
    UPDATE medicos m
    SET 
        m.avaliacao = (
            SELECT AVG(nota) 
            FROM avaliacoes 
            WHERE medico_id = p_medico_id
        ),
        m.total_avaliacoes = (
            SELECT COUNT(*) 
            FROM avaliacoes 
            WHERE medico_id = p_medico_id
        )
    WHERE m.id = p_medico_id;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Atualizar data de agendamento ao criar
DELIMITER //
CREATE TRIGGER trg_agendamento_before_insert
BEFORE INSERT ON agendamentos
FOR EACH ROW
BEGIN
    SET NEW.data_agendamento = NOW();
END //
DELIMITER ;

-- Trigger: Log de cancelamento
DELIMITER //
CREATE TRIGGER trg_agendamento_before_update
BEFORE UPDATE ON agendamentos
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        SET NEW.data_cancelamento = NOW();
    END IF;
    
    IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
        SET NEW.data_confirmacao = NOW();
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- PERMISSÕES DE USUÁRIO (OPCIONAL)
-- ============================================================================

-- Criar usuário para a aplicação (descomente se necessário)
-- CREATE USER IF NOT EXISTS 'bloom_user'@'localhost' IDENTIFIED BY 'bloom_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bloom_maternity.* TO 'bloom_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- CONSULTAS DE VERIFICAÇÃO
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bloom_maternity'
ORDER BY TABLE_NAME;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================