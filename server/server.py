#!/usr/bin/env python3
"""Servidor local del tablero WS8. Solo librería estándar de Python 3.

Uso:   python3 server/server.py [puerto]        (por defecto 8742)
Abre:  http://localhost:8742

- Sirve la carpeta public/.
- API de datos: GET y PUT en /api/kv/<clave>. Cada clave se guarda en data/<clave>.json
  (con una copia de la versión anterior en .bak en cada guardado).
- La carpeta de datos se puede cambiar con TABLERO_DATA=/ruta.
- Solo escucha en 127.0.0.1: no es accesible desde otras máquinas.
"""
import json
import os
import re
import shutil
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "public")
DATA_DIR = os.environ.get("TABLERO_DATA") or os.path.join(ROOT, "data")

KEY_RE = re.compile(r"^[A-Za-z0-9._-]{1,100}$")
MAX_BYTES = 5 * 1024 * 1024
API_PREFIX = "/api/kv/"


def make_server(port, data_dir=DATA_DIR, public_dir=PUBLIC_DIR):
    """Crea el servidor (sin arrancarlo). `port=0` elige un puerto libre."""

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=public_dir, **kwargs)

        # ---- utilidades
        def _json(self, code, obj):
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _key(self):
            """Devuelve (clave, ruta) o (None, None) si no es la API, o (clave, False) si no es válida."""
            path = self.path.split("?")[0]
            if not path.startswith(API_PREFIX):
                return None, None
            key = unquote(path[len(API_PREFIX):])
            if not KEY_RE.match(key):
                return key, False
            return key, os.path.join(data_dir, key + ".json")

        # ---- métodos
        def do_GET(self):
            key, fp = self._key()
            if key is None:
                return super().do_GET()
            if fp is False:
                return self._json(400, {"error": "clave no válida"})
            if not os.path.exists(fp):
                return self._json(404, {"error": "no existe"})
            with open(fp, "r", encoding="utf-8") as f:
                self._json(200, {"key": key, "value": f.read()})

        def do_PUT(self):
            key, fp = self._key()
            if key is None:
                return self._json(404, {"error": "no encontrado"})
            if fp is False:
                return self._json(400, {"error": "clave no válida"})
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BYTES:
                return self._json(413, {"error": "demasiado grande"})
            try:
                value = json.loads(self.rfile.read(length).decode("utf-8"))["value"]
                if not isinstance(value, str):
                    raise ValueError("value debe ser texto")
            except Exception:
                return self._json(400, {"error": "cuerpo no válido"})
            os.makedirs(data_dir, exist_ok=True)
            if os.path.exists(fp):
                shutil.copyfile(fp, fp + ".bak")
            tmp = fp + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                f.write(value)
            os.replace(tmp, fp)
            self._json(200, {"ok": True})

        def log_message(self, fmt, *args):
            pass  # sin ruido en la terminal

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8742
    srv = make_server(port)
    print(f"Tablero en http://localhost:{port}  (Ctrl+C para parar)", flush=True)
    print(f"Datos en {DATA_DIR}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nParado.")


if __name__ == "__main__":
    main()
