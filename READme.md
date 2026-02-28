# ConfirmaFácil 🎉

O **ConfirmaFácil** é uma aplicação web desenvolvida para facilitar a organização e confirmação de presença em eventos.

A aplicação permite cadastro de usuários, autenticação segura, gerenciamento de eventos e controle de convidados, utilizando arquitetura fullstack com Node.js.

---

## 🚀 Tecnologias Utilizadas

### 🔹 Backend
- Node.js
- Express
- better-sqlite3
- bcrypt (criptografia de senhas)
- express-session (controle de sessão)
- cors (controle de requisições entre origens)

### 🔹 Banco de Dados
- SQLite (armazenamento leve e eficiente)

### 🔹 Frontend
- HTML5
- CSS3
- JavaScript

---

## 🔐 Segurança Implementada

- Criptografia de senhas utilizando **bcrypt**
- Controle de autenticação com **express-session**
- Proteção básica de rotas autenticadas
- Separação entre backend e frontend

---

## 📌 Funcionalidades

- Cadastro de usuários
- Login com autenticação segura
- Cadastro de eventos
- Cadastro de convidados
- Confirmação de presença
- Persistência de dados em banco SQLite

---

## 🧠 Conceitos Aplicados

Durante o desenvolvimento foram aplicados:

- Estruturação de servidor com Express
- Criação de rotas (GET / POST)
- Middleware
- Gerenciamento de sessões
- Hash de senha
- Integração frontend + backend
- Manipulação de banco de dados com better-sqlite3
- Organização de projeto fullstack
- Versionamento com Git

---

## ⚙️ Como Executar o Projeto

1. Clone o repositório:

```bash
git clone https://github.com/guibanc/confirmafacil.git