#!/bin/bash
# Copy circuit artifacts to frontend public directory

set -e

FRONTEND_DIR="../frontend/public/circuits"

echo "Creating frontend circuits directory..."
mkdir -p "${FRONTEND_DIR}"

echo "Copying WASM file..."
cp build/x402_payment_js/x402_payment.wasm "${FRONTEND_DIR}/"

echo "Copying proving key..."
cp keys/x402_payment_final.zkey "${FRONTEND_DIR}/"

echo "Copying verification key..."
cp keys/verification_key.json "${FRONTEND_DIR}/"

echo ""
echo "✓ Circuit artifacts copied to frontend"
echo ""
echo "Files in ${FRONTEND_DIR}:"
ls -lh "${FRONTEND_DIR}"
