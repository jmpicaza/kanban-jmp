#!/usr/bin/env bash
# Instala el tablero como servicio de usuario de systemd (WSL con systemd activado).
# Uso: ./install-service.sh [puerto]
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8000}"

if ! command -v systemctl >/dev/null || ! systemctl --user show-environment >/dev/null 2>&1; then
  echo "systemd de usuario no está disponible. En WSL activa systemd (ver README, paso 0)." >&2
  exit 1
fi

mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/tablero-ws8.service" <<UNIT
[Unit]
Description=Tablero personal WS8
After=network.target

[Service]
WorkingDirectory=$DIR
ExecStart=$(command -v python3) $DIR/server/server.py $PORT
Restart=on-failure

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now tablero-ws8.service
loginctl enable-linger "$USER" 2>/dev/null || true
echo "Servicio activo: http://localhost:$PORT"
systemctl --user --no-pager status tablero-ws8.service | head -4
