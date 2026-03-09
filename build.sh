#!/bin/bash
# This script runs on Render.com during build
# It installs system tools needed for full PDF functionality

echo "📦 Installing system dependencies..."

# Install poppler (for PDF to JPG conversion)
apt-get update -qq
apt-get install -y poppler-utils

# Install qpdf (for real PDF password encryption)
apt-get install -y qpdf

# Install LibreOffice (for DOC to PDF with full formatting)
apt-get install -y libreoffice --no-install-recommends

echo "✅ System dependencies installed!"
echo "  - pdftoppm (poppler-utils): $(pdftoppm -v 2>&1 | head -1)"
echo "  - qpdf: $(qpdf --version 2>&1 | head -1)"

# Install Node packages
npm install

echo "🚀 Build complete!"
