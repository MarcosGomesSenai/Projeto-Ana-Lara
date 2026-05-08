# Bloom Maternity — versão final corrigida

## Principais correções aplicadas

- Carrossel de médicos corrigido: agora os botões laterais movem os cards horizontalmente.
- Perfil do médico corrigido: cada card abre o perfil correto pelo parâmetro `id`.
- Dados oficiais dos médicos incluídos em `frontend/js/bloom-data.js` como fallback quando o back-end não estiver rodando.
- Fotos e logo adicionadas em `frontend/assets/images/`.
- Navbar reduzida e com logo visual.
- Seção “Como Chegar” da página de unidades corrigida: HTML quebrado, cards desalinhados e texto incompleto.
- Modo noturno reforçado: cards, textos, dropdowns, tabelas e fundos não somem mais.
- Perfil admin adicionado em `frontend/pages/admin.html`.
- Banco de dados atualizado com campos `tipo_usuario` e `is_admin` na tabela `pacientes`.
- Back-end corrigido com `models/index.js`, modelo de `Especialidade`, modelo de `DisponibilidadeMedico` e associações Sequelize.
- Cadastro corrigido para não aplicar hash duplo na senha.

## Como rodar

### Front-end
Abra `frontend/pages/index.html` com Live Server no VS Code.

### Back-end
Entre na pasta `backend` e rode:

```bash
npm install
npm start
```

Por padrão, a API usa MySQL local e o banco `bloom_maternity`.

### Banco de dados
Execute o arquivo:

```text
backend/database/script.sql
```

Depois configure as variáveis no `.env`, se necessário:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bloom_maternity
DB_USER=root
DB_PASSWORD=
PORT=3000
FRONTEND_URL=http://127.0.0.1:5500
```

## Perfil admin
Para liberar acesso administrativo real no back-end, marque um usuário no banco:

```sql
UPDATE pacientes
SET tipo_usuario = 'admin', is_admin = TRUE
WHERE email = 'email-do-admin@exemplo.com';
```


## Correções finais 2
- Logo aumentada sem criar faixa branca extra no topo.
- Removido o espaço branco antes do hero/carrossel principal.
- Cards dos médicos harmonizados com mesma largura, altura mínima, imagem padronizada e botão alinhado no rodapé.
- Carrossel dos médicos com cálculo dinâmico de avanço, reset de posição e botões anterior/próximo atualizados.
- Página de detalhe do médico agora renderiza primeiro os dados locais corretos pelo ID da URL, evitando aparecer Dra. Ana antes de trocar para o médico certo.
- A resposta da API só atualiza o perfil se o ID retornado for o mesmo da URL.
- Botão “Ver mais avaliações” agora executa ação no front-end e não fica inativo.
- Validação de sintaxe JS executada com node --check.


## Correção v3
- Navbar e footer foram inseridos diretamente nas páginas para não depender de jQuery `.load()`, que pode falhar ao abrir pelo Live Server/arquivo local.
- Carrossel dos médicos corrigido para rolar o container correto, não o track interno.
- Cards dos médicos padronizados com largura, altura, imagem e botão alinhados.
- Carrossel renderiza primeiro os dados locais oficiais e só depois tenta API, evitando atraso visual ou cards vazios.
