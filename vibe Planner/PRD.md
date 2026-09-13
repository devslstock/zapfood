# ZaapFood

## Objetivo

Plataforma SaaS multi-loja que permite a donos de restaurantes, lanchonetes e sorveterias venderem pelo WhatsApp com cardápio digital, atendimento automatizado via API oficial da Meta, painel administrativo completo e cobrança recorrente automática via Asaas.

## Telas

### Autenticação

**Rota:** `/`

**Objetivo:** Autenticar o dono da loja ou criar nova conta na plataforma.

**Componentes:**

* **Input Email**
* **Input Senha**
* **Botão Entrar**: Autentica o usuário e redireciona para o painel administrativo da sua loja.
* **Link Criar Conta**: Navega para a tela de cadastro self-service.

### Cadastro Self-Service

**Rota:** `/signup`

**Objetivo:** Permitir que o dono crie sua conta com teste grátis de 7 dias e configure a cobrança recorrente automática.

**Componentes:**

* **Input Nome da Loja**
* **Input Nome do Dono**
* **Input Email**
* **Input Telefone/WhatsApp**
* **Input Categoria da Loja**
* **Checkbox Aceitar Termos**: Marca a aceitação dos termos de uso e política de privacidade.
* **Botão Criar Conta Grátis**: Cria a conta, inicia o teste de 7 dias e redireciona para a configuração da loja.
* **Botão Escolher Plano (Cartão/PIX)**: Abre o checkout do Asaas para configurar a cobrança recorrente automática.

### Cardápio Digital

**Rota:** `/loja/\\\[slug]`

**Objetivo:** Exibir o cardápio digital da loja para o cliente montar seu pedido pelo WhatsApp.

**Componentes:**

* **Cabeçalho da Loja (Logo, Nome, Status)**
* **Lista de Categorias**: Permite navegar entre as categorias de produtos do cardápio.
* **Card de Produto (Foto, Nome, Preço)**
* **Botão Adicionar ao Pedido**: Adiciona o item ao carrinho de pedidos com opções de sabores/adicionais.
* **Modal de Opções (Sabores/Adicionais)**: Permite selecionar variações de sabores e adicionais do produto.
* **Carrinho de Compras**: Exibe itens adicionados e permite ajustar quantidades e remover itens.
* **Botão Finalizar Pedido pelo WhatsApp**: Envia o pedido montado para o atendimento automático via WhatsApp.

### Painel Administrativo - Pedidos

**Rota:** `/admin`

**Objetivo:** Gerenciar pedidos em tempo real recebidos via WhatsApp e acompanhar o status de cada um.

**Componentes:**

* **Lista de Pedidos em Tempo Real**: Exibe novos pedidos assim que chegam, com detalhes do cliente e itens.
* **Filtro por Status (Novo, Em Preparo, Sair para Entrega, Entregue)**: Filtra a lista de pedidos pelo status atual.
* **Botão Atualizar Status**: Atualiza o status do pedido e dispara a notificação automática via WhatsApp ao cliente.
* **Detalhes do Pedido (Itens, Total, Endereço)**: Abre o painel com informações completas do pedido.
* **Botão Confirmar Pedido**: Confirma o recebimento do pedido e inicia a preparação.

### Painel Administrativo - Cardápio

**Rota:** `/admin/menu`

**Objetivo:** Permitir que o dono gerencie categorias, produtos, sabores, adicionais, fotos e preços do cardápio.

**Componentes:**

* **Lista de Categorias**: Exibe as categorias cadastradas e permite navegar entre elas.
* **Botão Nova Categoria**: Abre o formulário para criar uma nova categoria.
* **Botão Novo Produto**: Abre o formulário para criar um novo produto com foto, nome e preço.
* **Formulário de Produto (Foto, Nome, Preço)**: Permite preencher os dados do produto e salvar as alterações.
* **Botão Salvar Alterações**: Salva as mudanças no cardápio e atualiza o catálogo digital.
* **Lista de Opções (Sabores/Adicionais)**: Permite gerenciar sabores e adicionais associados a cada produto.

### Painel Kanban de Pedidos

**Rota:** `/admin/kanban`

**Objetivo:** Gerenciar visualmente o fluxo dos pedidos da loja arrastando cartões entre as colunas de status.

**Componentes:**

* **Coluna Recebido**: Exibe os pedidos organizados nas colunas de status. O usuário pode arrastar e soltar os cartões entre as colunas para alterar o status do pedido.
* **Coluna Em preparo**: Exibe os pedidos que estão sendo preparados. Ao soltar um cartão aqui, o status é alterado para 'Em preparo'.
* **Coluna Pronto**: Exibe os pedidos prontos para retirada/entrega. Ao soltar um cartão aqui, o status é alterado para 'Pronto'.
* **Coluna Em entrega**: Exibe os pedidos que estão a caminho da entrega. Ao soltar um cartão aqui, o status é alterado para 'Em entrega'.
* **Coluna Concluído**: Exibe os pedidos finalizados. Ao soltar um cartão aqui, o status é alterado para 'Concluído'.
* **Cartão de Pedido**: Exibe informações resumidas do pedido: número, cliente, itens, valor total e tempo desde a criação.
* **Barra de Filtros**: Filtra os pedidos exibidos no Kanban por data, período ou termo de busca.
* **Indicador de Atualização em Tempo Real**: Atualiza automaticamente os pedidos em tempo real ou manualmente ao clicar. Exibe contagem de pedidos por coluna.

### Painel Administrativo - Relatórios

**Rota:** `/admin/reports`

**Objetivo:** Apresentar relatórios de vendas por período, produtos mais vendidos e desempenho da loja.

**Componentes:**

* **Seletor de Período (Dia, Semana, Mês, Ano)**: Filtra os relatórios de vendas pelo período selecionado.
* **Gráfico de Vendas (Receita, Pedidos)**: Apresenta visualmente a evolução das vendas no período.
* **Tabela de Produtos Mais Vendidos**: Exibe os produtos com maior volume de vendas no período filtrado.
* **Resumo de Receita Total**
* **Botão Exportar Relatório**: Exporta os dados de vendas em formato CSV ou PDF.

### Painel Administrativo - Equipe

**Rota:** `/admin/team`

**Objetivo:** Gerenciar a equipe da loja com permissões por cargo (dono, atendente, cozinha) e definir quais acessos cada membro possui.

**Componentes:**

* **Lista de Membros da Equipe**: Exibe todos os usuários cadastrados na equipe da loja.
* **Botão Adicionar Membro**: Abre o formulário para convidar um novo membro para a equipe.
* **Seletor de Cargo/Permissão**: Define o cargo do membro e suas permissões de acesso ao painel.
* **Botão Salvar Alterações**: Salva as permissões e membros da equipe.

### Painel Administrativo - Configurações

**Rota:** `/admin/settings`

**Objetivo:** Configurar os dados da loja, integração com WhatsApp, forma de pagamento e assinatura da plataforma.

**Componentes:**

* **Formulário de Dados da Loja (Nome, Logo, Endereço)**: Permite editar e salvar as informações cadastrais da loja.
* **Configuração de Integração WhatsApp**: Permite configurar a conexão com a API oficial da Meta para atendimento.
* **Configuração de Pagamento (Asaas)**: Permite gerenciar a forma de cobrança recorrente e o cadastro de cartão/PIX.
* **Botão Salvar Configurações**: Salva todas as alterações de configuração da loja.

### Super Admin - Gestão de Lojas

**Rota:** `/super-admin`

**Objetivo:** Administrar todas as lojas da plataforma, com controle de assinaturas, planos e dados de todas as lojas.

**Componentes:**

* **Tabela de Lojas Cadastradas**: Exibe todas as lojas da plataforma com status de assinatura e dados básicos.
* **Filtro por Status (Ativa, Inativa, Teste)**: Filtra a lista de lojas pelo status da conta.
* **Botão Editar Loja**: Permite visualizar e alterar dados de qualquer loja da plataforma.
* **Botão Gerenciar Assinatura**: Permite alterar o plano, pausar ou cancelar a assinatura de uma loja.
* **Seletor de Período de Relatório Global**: Filtra relatórios agregados de todas as lojas pelo período.
* **Gráfico de Receita Global da Plataforma**: Apresenta a receita total da plataforma por período.

