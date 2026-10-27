#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Sengaja TIDAK lagi menjalankan `db push` otomatis: perubahan skema lewat file
# migrasi yang diperiksa dulu (docs/migrasi-database.md).
echo "Ada perubahan skema? Jalankan migrasi secara manual ke database dev dulu: pnpm --filter @workspace/db run migrate"
