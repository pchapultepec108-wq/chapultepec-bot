#!/bin/bash
cd "$(dirname "$0")"

# Matar instancias previas y WhatsApp Desktop
pkill -9 -f "chapultepec-bot/index\|WhatsApp" 2>/dev/null
sleep 2

echo "🤖 Iniciando bot Parque Chapultepec..."
export $(cat .env | grep -v '^#' | grep '=' | xargs)
node index.js
