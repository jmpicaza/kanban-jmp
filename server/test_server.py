import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

from server import make_server


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.public = tempfile.TemporaryDirectory()
        with open(os.path.join(cls.public.name, "index.html"), "w", encoding="utf-8") as f:
            f.write("<h1>hola</h1>")
        cls.srv = make_server(0, data_dir=cls.tmp.name, public_dir=cls.public.name)
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        cls.tmp.cleanup()
        cls.public.cleanup()

    def request(self, method, path, body=None):
        data = None if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        req = urllib.request.Request(self.base + path, data=data, method=method, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, r.read().decode()
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode()

    def test_sirve_la_pagina(self):
        status, body = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("hola", body)

    def test_clave_inexistente_da_404(self):
        self.assertEqual(self.request("GET", "/api/kv/no-existe")[0], 404)

    def test_guardar_y_leer(self):
        self.assertEqual(self.request("PUT", "/api/kv/tareas", {"value": '[{"id":"a"}]'})[0], 200)
        status, body = self.request("GET", "/api/kv/tareas")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["value"], '[{"id":"a"}]')
        self.assertTrue(os.path.exists(os.path.join(self.tmp.name, "tareas.json")))

    def test_deja_copia_de_la_version_anterior(self):
        self.request("PUT", "/api/kv/copia", {"value": "uno"})
        self.request("PUT", "/api/kv/copia", {"value": "dos"})
        with open(os.path.join(self.tmp.name, "copia.json.bak"), encoding="utf-8") as f:
            self.assertEqual(f.read(), "uno")
        self.assertEqual(json.loads(self.request("GET", "/api/kv/copia")[1])["value"], "dos")

    def test_rechaza_claves_peligrosas(self):
        self.assertEqual(self.request("GET", "/api/kv/..%2F..%2Fetc%2Fpasswd")[0], 400)
        self.assertEqual(self.request("PUT", "/api/kv/..%2Fescape", {"value": "x"})[0], 400)
        self.assertFalse(os.path.exists(os.path.join(os.path.dirname(self.tmp.name), "escape.json")))

    def test_rechaza_cuerpos_no_validos(self):
        self.assertEqual(self.request("PUT", "/api/kv/x", b"basura")[0], 400)
        self.assertEqual(self.request("PUT", "/api/kv/x", {"value": 5})[0], 400)
        self.assertEqual(self.request("PUT", "/api/kv/x", {"otra": "cosa"})[0], 400)

    def test_put_fuera_de_la_api_da_404(self):
        self.assertEqual(self.request("PUT", "/otra-ruta", {"value": "x"})[0], 404)


if __name__ == "__main__":
    unittest.main()
