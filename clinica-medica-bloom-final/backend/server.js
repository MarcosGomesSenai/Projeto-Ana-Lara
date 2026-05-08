/**
 * ============================================================================
 * ARQUIVO: server.js
 * PROJETO: Bloom Maternity - Backend
 * DESCRIÇÃO: Servidor principal da API REST com Express
 * AUTOR: Bloom Maternity Team
 * VERSÃO: 1.0.0
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Importar configurações do banco de dados
const { sequelize, testConnection, syncDatabase } = require('./config/database');

// Importar modelos para garantir associações
const { Paciente, Medico, Especialidade, Exame, Agendamento, DisponibilidadeMedico } = require('./models');

// Importar rotas
const authRoutes = require('./routes/auth');
const medicosRoutes = require('./routes/medicos');
const agendamentosRoutes = require('./routes/agendamentos');
const pacientesRoutes = require('./routes/pacientes');

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARES GLOBAIS
// ============================================================================

// Segurança - Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// CORS - Permitir requisições do frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging - Morgan
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Parse JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (opcional)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// ROTAS DA API
// ============================================================================

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/pacientes', pacientesRoutes);

// Rota de health check
app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        database: dbStatus ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'Bloom Maternity API',
        version: '1.0.0',
        description: 'API REST para clínica de obstetrícia',
        endpoints: {
            auth: '/api/auth',
            medicos: '/api/medicos',
            agendamentos: '/api/agendamentos',
            pacientes: '/api/pacientes',
            health: '/health'
        }
    });
});

// ============================================================================
// TRATAMENTO DE ERROS GLOBAIS
// ============================================================================

// 404 - Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Rota ${req.method} ${req.originalUrl} não encontrada`
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    const status = err.status || 500;
    const message = err.message || 'Erro interno do servidor';
    
    res.status(status).json({
        success: false,
        message: message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================================
// FUNÇÃO PARA POPULAR DADOS INICIAIS
// ============================================================================
async function seedInitialData() {
    try {
        // Verificar se já existem dados
        const especialidadesCount = await Especialidade.count();
        const examesCount = await Exame.count();
        
        if (especialidadesCount === 0) {
            console.log('📦 Populando dados iniciais...');
            
            // Criar especialidades
            const especialidades = await Especialidade.bulkCreate([
                { nome: 'Obstetrícia', descricao: 'Acompanhamento da gestação e parto' },
                { nome: 'Ginecologia', descricao: 'Saúde da mulher' },
                { nome: 'Medicina Fetal', descricao: 'Diagnóstico e tratamento de doenças fetais' },
                { nome: 'Reprodução Humana', descricao: 'Fertilidade e reprodução assistida' },
                { nome: 'Ultrassonografia', descricao: 'Exames de imagem obstétrica' }
            ]);
            console.log(`✅ Criadas ${especialidades.length} especialidades`);
            
            // Criar exames
            const examesData = Exame.exemplosIniciais || [];
            if (examesData.length > 0) {
                await Exame.bulkCreate(examesData);
                console.log(`✅ Criados ${examesData.length} exames`);
            }
            
            // Criar médicos de exemplo
            const medicosData = [
                {
                    nome: 'Dra. Ana Beatriz Santos',
                    especialidade_id: especialidades.find(e => e.nome === 'Obstetrícia').id,
                    crm: '12345-SP',
                    email: 'ana.santos@bloommaternity.com.br',
                    telefone: '(11) 99999-1111',
                    resumo: 'Especialista em gestação de alto risco e parto humanizado',
                    descricao: 'Formada pela USP com residência no Hospital das Clínicas...',
                    experiencia_anos: 12,
                    avaliacao: 4.9,
                    total_avaliacoes: 128,
                    disponivel: true,
                    horario_inicio: '08:00:00',
                    horario_fim: '18:00:00',
                    intervalo_consulta: 30,
                    dias_atendimento: '1,2,3,4,5'
                },
                {
                    nome: 'Dr. Ricardo Mendes',
                    especialidade_id: especialidades.find(e => e.nome === 'Medicina Fetal').id,
                    crm: '54321-SP',
                    email: 'ricardo.mendes@bloommaternity.com.br',
                    telefone: '(11) 99999-2222',
                    resumo: 'Diagnóstico pré-natal avançado e ultrassonografia fetal',
                    experiencia_anos: 10,
                    avaliacao: 4.8,
                    total_avaliacoes: 95,
                    disponivel: true,
                    horario_inicio: '09:00:00',
                    horario_fim: '19:00:00',
                    intervalo_consulta: 30,
                    dias_atendimento: '1,2,3,4,5'
                },
                {
                    nome: 'Dra. Carla Ferreira',
                    especialidade_id: especialidades.find(e => e.nome === 'Reprodução Humana').id,
                    crm: '98765-SP',
                    email: 'carla.ferreira@bloommaternity.com.br',
                    telefone: '(11) 99999-3333',
                    resumo: 'Especialista em fertilidade, inseminação e FIV',
                    experiencia_anos: 8,
                    avaliacao: 4.9,
                    total_avaliacoes: 87,
                    disponivel: true,
                    horario_inicio: '08:00:00',
                    horario_fim: '17:00:00',
                    intervalo_consulta: 45,
                    dias_atendimento: '1,2,3,4,5'
                },
                {
                    nome: 'Dra. Marina Oliveira',
                    especialidade_id: especialidades.find(e => e.nome === 'Ultrassonografia').id,
                    crm: '24680-SP',
                    email: 'marina.oliveira@bloommaternity.com.br',
                    telefone: '(11) 99999-4444',
                    resumo: 'Ultrassom morfológico, doppler e 3D/4D com excelência',
                    experiencia_anos: 15,
                    avaliacao: 5.0,
                    total_avaliacoes: 156,
                    disponivel: true,
                    horario_inicio: '08:00:00',
                    horario_fim: '16:00:00',
                    intervalo_consulta: 40,
                    dias_atendimento: '1,2,3,4,5,6'
                }
            ];
            
            await Medico.bulkCreate(medicosData);
            console.log(`✅ Criados ${medicosData.length} médicos`);
            
            console.log('🎉 Dados iniciais populados com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao popular dados iniciais:', error);
    }
}

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================
async function startServer() {
    try {
        // Testar conexão com o banco de dados
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Não foi possível conectar ao banco de dados. Servidor não iniciado.');
            process.exit(1);
        }
        
        // Sincronizar modelos (criar tabelas se não existirem)
        await syncDatabase(false);
        console.log('✅ Modelos sincronizados com o banco de dados');
        
        // Popular dados iniciais (apenas em desenvolvimento)
        if (NODE_ENV === 'development') {
            await seedInitialData();
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏥 Bloom Maternity - API Backend                          ║
║                                                              ║
║   📍 Servidor rodando em: http://localhost:${PORT}            ║
║   🌍 Ambiente: ${NODE_ENV.padEnd(20)}                          ║
║   📚 Documentação: http://localhost:${PORT}/                  ║
║   ❤️ Health Check: http://localhost:${PORT}/health            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// ============================================================================
// TRATAMENTO DE ENCERRAMENTO GRACEFUL
// ============================================================================
process.on('SIGINT', async () => {
    console.log('\n🛑 Recebido sinal SIGINT. Encerrando servidor...');
    await sequelize.close();
    console.log('✅ Conexão com banco de dados fechada');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Recebido sinal SIGTERM. Encerrando servidor...');
    await sequelize.close();
    console.log('✅ Conexão com banco de dados fechada');
    process.exit(0);
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================
startServer();

// ============================================================================
// EXPORTAÇÕES PARA TESTES
// ============================================================================
module.exports = { app };