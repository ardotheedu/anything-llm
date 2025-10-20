#!/bin/bash

# Script de teste para o sistema de feedback do embed
# Execute este script após iniciar o servidor

echo "🧪 Testando Sistema de Feedback do Embed"
echo "=========================================="
echo ""

# Configurações - AJUSTE ESTES VALORES CONFORME SEU AMBIENTE
BASE_URL="http://localhost:3001"
EMBED_ID="seu-embed-id-aqui"
SESSION_ID="test-session-$(date +%s)"
CHAT_ID=1

echo "⚙️  Configurações:"
echo "   Base URL: $BASE_URL"
echo "   Embed ID: $EMBED_ID"
echo "   Session ID: $SESSION_ID"
echo "   Chat ID: $CHAT_ID"
echo ""

# Função para testar um endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo "📍 Testando: $name"
    echo "   $method $url"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nHTTP_STATUS:%{http_code}")
    else
        response=$(curl -s -X $method "$url" \
            -w "\nHTTP_STATUS:%{http_code}")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✅ Sucesso! (HTTP $http_code)"
        echo "   📦 Resposta: $body"
    else
        echo "   ❌ Falha! (HTTP $http_code)"
        echo "   📦 Resposta: $body"
    fi
    echo ""
}

# Avisos
echo "⚠️  IMPORTANTE:"
echo "   1. Certifique-se de que o servidor está rodando"
echo "   2. Ajuste EMBED_ID no script com um ID válido"
echo "   3. Ajuste CHAT_ID com um ID de chat existente"
echo ""
read -p "Pressione ENTER para continuar ou CTRL+C para cancelar..."
echo ""

# Testes
echo "🚀 Iniciando testes..."
echo ""

# Teste 1: Feedback positivo
test_endpoint \
    "Feedback Positivo (👍)" \
    "POST" \
    "$BASE_URL/embed/$EMBED_ID/$SESSION_ID/chat-feedback/$CHAT_ID" \
    '{"feedback": 1}'

sleep 1

# Teste 2: Feedback negativo
test_endpoint \
    "Feedback Negativo (👎)" \
    "POST" \
    "$BASE_URL/embed/$EMBED_ID/$SESSION_ID/chat-feedback/$CHAT_ID" \
    '{"feedback": 0}'

sleep 1

# Teste 3: Adicionar comentário
test_endpoint \
    "Adicionar Comentário" \
    "POST" \
    "$BASE_URL/embed/$EMBED_ID/$SESSION_ID/chat-feedback/$CHAT_ID/comment" \
    '{"comment": "Teste de comentário - a resposta poderia ser mais detalhada."}'

sleep 1

# Teste 4: Remover feedback (null)
test_endpoint \
    "Remover Feedback" \
    "POST" \
    "$BASE_URL/embed/$EMBED_ID/$SESSION_ID/chat-feedback/$CHAT_ID" \
    '{"feedback": null}'

echo "✨ Testes concluídos!"
echo ""
echo "🔍 Para verificar no banco de dados:"
echo "   cd /home/eduar/anything-llm/server/storage"
echo "   sqlite3 anythingllm.db"
echo "   SELECT id, feedbackScore, feedbackComment FROM embed_chats WHERE id = $CHAT_ID;"
echo ""
