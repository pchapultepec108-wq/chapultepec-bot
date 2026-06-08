#!/bin/bash
cd ~/chapultepec-bot
pkill -f "chapultepec-bot/index" 2>/dev/null
sleep 2
export $(cat .env | grep -v '^#' | xargs)
echo "🏠 Arrancando bot Parque Chapultepec..."
node index.js
