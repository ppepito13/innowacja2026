#!/bin/bash

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Błąd: Skrypt wymaga uprawnień administratora. Uruchom używając sudo."
  exit 1
fi

echo "Rozpoczęto konfigurację środowiska..."

apt-get update -y && apt-get upgrade -y

curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs git ufw

npm install -g pm2

ufw allow OpenSSH
ufw allow 3000/tcp
ufw --force enable

echo "Konfiguracja zakończona pomyślnie."
