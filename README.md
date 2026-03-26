# Casher

Aplicativo de gestão financeira.

## Escopo

Este repositório contém o código-fonte do **Casher**, um aplicativo móvel voltado para o gerenciamento financeiro e controle de despesas. A aplicação lida com o gerenciamento de categorias de gastos, orçamentos mensais, definição de metas financeiras, controle de parcelas e registro de transações detalhadas (incluindo Entradas, Saídas, Investimentos e Juros). 

O aplicativo possui uma abordagem de funcionamento **Local-First**, ou seja offline (via banco de dados local SQLite) projetada para posterior sincronização de dados com a nuvem (Supabase).

## Tecnologias Utilizadas

* **React Native & Expo**: Framework para desenvolvimento mobile multiplataforma (Android e iOS).
* **TypeScript**: Tipagem estática para garantir maior segurança e clareza no desenvolvimento.
* **SQLite (`expo-sqlite`)**: Banco de dados relacional local para armazenamento de dados no dispositivo.
* **Jest & `jest-expo`**: Framework para criação e execução de testes unitários.
* **Supabase**: Backend-as-a-Service (BaaS) mapeado para sincronização de dados estruturais.
* **UUID**: Geração de identificadores únicos universais para os registros.

## Arquitetura

O projeto é estruturado de forma rigorosa utilizando conceitos de **Clean Architecture** e princípios **SOLID**, separando as responsabilidades em diferentes camadas para facilitar a manutenção, testabilidade e escalabilidade.

| Pasta/Caminho | Descrição |
| --- | --- |
| `src/core/entities` | **Camada de Domínio**: Contém as entidades de negócio (ex: `Transacao`, `Meta`, `Categoria`), interfaces e os DTOs que trafegam os dados puros. |
| `src/core/usecases` | **Camada de Aplicação**: Contém as regras de negócio e Casos de Uso da aplicação (ex: `RegistrarTransacaoUC`, processamentos de entradas e saídas). |
| `src/core/repositories` | **Contratos de Interface**: Contém as interfaces dos repositórios (ex: `ITransacaoRepository`), definindo como a camada de dados deve se comportar sem acoplar tecnologia. |
| `src/data/local` | **Configuração de Infraestrutura**: Configurações de conexão e inicialização das tabelas do banco de dados local SQLite (`database.ts`). |
| `src/data/repositories` | **Implementações de Infraestrutura**: Adaptadores concretos dos repositórios que implementam os contratos da camada core, interagindo diretamente com o SQLite. |
| `tests/` | **Camada de Testes**: Contém os testes unitários isolados da aplicação (ex: testes dos UseCases e Repositories) utilizando mocks (Jest). |
| `app.json` / `package.json` | Arquivos de configuração do Expo, declaração de dependências e scripts de execução. |

## Eventos e Processamento

A aplicação utiliza o padrão de Casos de Uso (Use Cases) para separar as lógicas de negócio no momento de registrar os dados financeiros. Ao registrar uma transação, os seguintes processamentos são acionados dependendo de seu tipo:

* **`ProcessarEntradaUC`**: Acionado automaticamente se a transação for do tipo *Entrada*.
* **`ProcessarSaidaUC`**: Acionado automaticamente se a transação for do tipo *Saida*. Valida e debita do orçamento/categoria correspondente.
* **`ProcessarInvestimentoUC`**: Acionado se a transação for do tipo *Investimento*.
* **Transações de Juros**: São diretamente salvas como registro sem acionar processamentos de fluxo diretos extras.

## Compilação e Execução

### Pré-requisitos

* **Node.js** (versão LTS recomendada)
* **Gerenciador de pacotes**: `npm`, `yarn` ou `pnpm`
* Emulador configurado (Android Studio ou Xcode) ou o aplicativo **Expo Go** instalado no seu smartphone físico.

### Passos para Execução

1. **Clone o repositório** e acesse a pasta do projeto:
   ```bash
   git clone <url-do-repositorio>
   cd casher
   ```

2. **Instale as dependências** listadas no `package.json`:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento (Modo Padrão/LAN)**:
   ```bash
   npm start
   ```
   *Após a execução, um QR Code aparecerá no terminal. Certifique-se de que o celular e o computador estão na mesma rede Wi-Fi e escaneie o código com o aplicativo Expo Go (Android) ou com o app de Câmera (iOS).*

### Comandos Úteis do Expo

* **Modo Tunnel (Celular e PC em redes diferentes)**:
  Caso tenha problemas de conexão com o Wi-Fi ou firewall bloqueando as portas, inicie o Expo criando um túnel seguro:
  ```bash
  npx expo start --tunnel
  ```

* **Modo Web**:
  Para rodar a aplicação no navegador (se o suporte web estiver configurado):
  ```bash
  npx expo start --web
  ```

### Testes

* **Executar os testes unitários (Jest)**:
  ```bash
  npm run test
  ```

* **Executar os testes em modo de observação (Watch mode)**:
  ```bash
  npm run test:watch
  ```