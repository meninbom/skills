# Serve esta pasta (montar_biblioteca/) e grava POST /salvar?ef=NOME&n=NNNN (dataURL) em ../quadros/NOME/fNNNN.jpg
# Uso: python servidor.py 4870   → abrir http://127.0.0.1:4870/biblioteca.html
import http.server, sys, os, base64, urllib.parse, functools, re
raiz = os.path.dirname(os.path.abspath(__file__))
saida = os.path.join(os.path.dirname(raiz), 'quadros')
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        d = self.rfile.read(int(self.headers['Content-Length'])).decode()
        nome = re.sub(r'[^\w.-]', '_', q['ef'][0]); n = re.sub(r'\D', '', q['n'][0])
        p = os.path.join(saida, nome); os.makedirs(p, exist_ok=True)
        open(os.path.join(p, 'f%s.jpg' % n), 'wb').write(base64.b64decode(d.split(',', 1)[1]))
        self.send_response(200); self.end_headers()
    def log_message(self, *a): pass
porta = int(sys.argv[1]) if len(sys.argv) > 1 else 4870
print('http://127.0.0.1:%d/biblioteca.html' % porta)
http.server.ThreadingHTTPServer(('127.0.0.1', porta), functools.partial(H, directory=raiz)).serve_forever()
