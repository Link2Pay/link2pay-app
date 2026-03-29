#!/bin/bash
# Download Powers of Tau ceremony file for Groth16 setup
# Using hermez ceremony (universal and trusted)

set -e

PTAU_FILE="powersOfTau28_hez_final_14.ptau"
PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/${PTAU_FILE}"

mkdir -p keys

if [ -f "keys/${PTAU_FILE}" ]; then
    echo "✓ Powers of Tau file already exists: keys/${PTAU_FILE}"
    exit 0
fi

echo "Downloading Powers of Tau ceremony file..."
echo "This may take a few minutes (157 MB)..."

curl -L "${PTAU_URL}" -o "keys/${PTAU_FILE}"

echo "✓ Downloaded: keys/${PTAU_FILE}"
echo ""
echo "File info:"
ls -lh "keys/${PTAU_FILE}"
