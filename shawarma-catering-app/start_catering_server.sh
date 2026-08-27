#!/bin/bash
# ==============================================================================
# INICIAR SISTEMA DE CATERING SHAWARMA (100% OFFLINE / RED LOCAL)
# ==============================================================================

cd "$(dirname "$0")"

echo "=========================================================="
echo "  🌯 INICIANDO SERVIDOR DE CATERING SHAWARMA 🌯"
echo "=========================================================="

# Run the Ruby server
ruby server.rb
