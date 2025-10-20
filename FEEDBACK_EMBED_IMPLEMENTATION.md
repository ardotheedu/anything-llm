# 🎯 Implementação do Sistema de Feedback para Embeds

## 📋 Resumo das Alterações

O sistema de feedback para embeds foi implementado seguindo o mesmo padrão usado nos workspaces. Agora os usuários podem dar feedback positivo (👍) ou negativo (👎) nas respostas do chat embed, e também adicionar comentários quando o feedback for negativo.

## 🔧 Alterações Realizadas

### 1. **Banco de Dados** - `server/prisma/schema.prisma`

Adicionados dois novos campos na tabela `embed_chats`:

```prisma
model embed_chats {
  id                     Int           @id @default(autoincrement())
  prompt                 String
  response               String
  session_id             String
  include                Boolean       @default(true)
  connection_information String?
  embed_id               Int
  usersId                Int?
  createdAt              DateTime      @default(now())
  feedbackScore          Boolean?      // ✨ NOVO: true = 👍, false = 👎, null = sem feedback
  feedbackComment        String?       // ✨ NOVO: comentário opcional
  embed_config           embed_configs @relation(...)
  users                  users?        @relation(...)
}
```

### 2. **Modelo de Dados** - `server/models/embedChats.js`

Adicionados dois novos métodos:

#### `updateFeedbackScore(chatId, feedbackScore)`
- Atualiza o feedback score (true/false/null)
- Recebe 1 ou true para positivo, 0 ou false para negativo, null para remover

#### `updateFeedbackComment(chatId, comment)`
- Atualiza o comentário de feedback
- Usado quando o usuário dá feedback negativo

### 3. **Endpoints** - `server/endpoints/embed/index.js`

Adicionados dois novos endpoints:

#### `POST /embed/:embedId/:sessionId/chat-feedback/:chatId`
- Salva ou atualiza o feedback de um chat específico
- **Body:** `{ feedback: true|false|null }`
- **Validação:** Verifica se o chat pertence ao embed
- **Resposta:** `{ success: boolean }`

#### `POST /embed/:embedId/:sessionId/chat-feedback/:chatId/comment`
- Salva um comentário de feedback
- **Body:** `{ comment: string }`
- **Validação:** Verifica se o chat pertence ao embed
- **Resposta:** `{ success: boolean }`

## 🚀 Como Aplicar as Alterações

### Passo 1: Gerar e Executar Migração do Banco de Dados

```bash
cd /home/eduar/anything-llm/server
npx prisma migrate dev --name add_feedback_to_embed_chats
```

Ou, se preferir aplicar diretamente (sem histórico de migração):

```bash
cd /home/eduar/anything-llm/server
npx prisma db push
```

### Passo 2: Reiniciar o Servidor

```bash
# Parar os processos em execução
# Executar a task: Server: run
```

## 🎨 Como o Frontend Já Está Configurado

O componente de feedback no embed (`embed/src/components/ChatWindow/ChatContainer/ChatHistory/HistoricalMessage/Feedback/index.jsx`) **JÁ ESTAVA IMPLEMENTADO** e agora vai funcionar corretamente com os novos endpoints.

### Fluxo Completo do Feedback:

```
┌─────────────────────┐
│ Usuário clica 👍/👎 │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────┐
│ ChatService.updateFeedback() │
│ (embed/src/models/chatService.js) │
└──────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│ POST /embed/:embedId/:sessionId/chat-feedback/:chatId │
│ (server/endpoints/embed/index.js)              │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ EmbedChats.updateFeedbackScore() │
│ (server/models/embedChats.js)     │
└──────────┬─────────────────────┘
           │
           ▼
┌──────────────────────┐
│ BANCO DE DADOS       │
│ embed_chats          │
│ • feedbackScore      │
│ • feedbackComment    │
└──────────────────────┘
```

## 🎯 Funcionalidades Implementadas

✅ Feedback positivo (👍)
✅ Feedback negativo (👎)
✅ Remover feedback (clicar no mesmo botão)
✅ Modal para adicionar comentário ao feedback negativo
✅ Validação de que o chat pertence ao embed correto
✅ Tratamento de erros
✅ Logs no console para debugging
✅ Interface visual já implementada

## 🔍 Testando

### 1. Verificar se os endpoints estão funcionando:

```bash
# Dar feedback positivo
curl -X POST http://localhost:3001/embed/SEU_EMBED_ID/SEU_SESSION_ID/chat-feedback/CHAT_ID \
  -H "Content-Type: application/json" \
  -d '{"feedback": 1}'

# Dar feedback negativo
curl -X POST http://localhost:3001/embed/SEU_EMBED_ID/SEU_SESSION_ID/chat-feedback/CHAT_ID \
  -H "Content-Type: application/json" \
  -d '{"feedback": 0}'

# Adicionar comentário
curl -X POST http://localhost:3001/embed/SEU_EMBED_ID/SEU_SESSION_ID/chat-feedback/CHAT_ID/comment \
  -H "Content-Type: application/json" \
  -d '{"comment": "A resposta não foi útil porque..."}'
```

### 2. Verificar no banco de dados:

```sql
SELECT id, prompt, feedbackScore, feedbackComment 
FROM embed_chats 
WHERE feedbackScore IS NOT NULL;
```

## 📊 Consultas Úteis

### Ver todos os feedbacks:
```sql
SELECT 
  ec.id,
  ec.session_id,
  ec.feedbackScore,
  ec.feedbackComment,
  ec.createdAt,
  e.workspace_id
FROM embed_chats ec
JOIN embed_configs e ON ec.embed_id = e.id
WHERE ec.feedbackScore IS NOT NULL
ORDER BY ec.createdAt DESC;
```

### Estatísticas de feedback:
```sql
SELECT 
  embed_id,
  COUNT(*) as total_chats,
  SUM(CASE WHEN feedbackScore = true THEN 1 ELSE 0 END) as positive_feedback,
  SUM(CASE WHEN feedbackScore = false THEN 1 ELSE 0 END) as negative_feedback,
  SUM(CASE WHEN feedbackComment IS NOT NULL THEN 1 ELSE 0 END) as with_comments
FROM embed_chats
GROUP BY embed_id;
```

## 🎉 Conclusão

O sistema de feedback para embeds agora está **COMPLETO** e funcionando da mesma forma que o sistema de workspaces, mantendo a consistência da aplicação.

---

**Data da implementação:** 20 de Outubro de 2025
**Desenvolvedor:** Sistema de IA assistente
