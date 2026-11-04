"""Prueba de extremo a extremo (opcional). Arranca su propio servidor con datos temporales.

Qué hace: abre el tablero en un Chromium real (controlado por Playwright), hace clic como
lo haría una persona (crear tareas, arrastrar, importar, exportar…) y comprueba el resultado.
Usa un servidor y unos datos temporales: no toca tus tareas.

Preparación (una vez):  npm run setup:e2e      (crea .venv e instala Playwright y Chromium)
Uso:                    npm run test:e2e
"""
import json, os, re, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8771"))
TMP = tempfile.mkdtemp(prefix="tablero-e2e-")
URL = f"http://localhost:{PORT}/"
DATA = os.path.join(TMP, "meridian-ws8-kanban-v2.json")
server = subprocess.Popen([sys.executable, os.path.join(ROOT, "server", "server.py"), str(PORT)],
                          env={**os.environ, "TABLERO_DATA": TMP})
time.sleep(1)
failures = []
def ok(c, m):
    print(("OK   " if c else "FALLA") + " " + m)
    if not c:
        failures.append(m)

def order(pg,col): return pg.locator(f"[aria-label='{col}'] .card-title").all_inner_texts()
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(permissions=["clipboard-read","clipboard-write"],viewport={"width":1300,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".card")
    ok(pg.locator(".card").count()==1,"1 arranca con la tarea de ejemplo")
    ok(not os.path.exists(DATA),"2 solo cargar no escribe en disco")
    # --- nueva tarea completa
    pg.click("text=Nueva tarea")
    pg.fill(".modal label.field:has-text('Tarea') input >> nth=0","Mapear procesos de backoffice")
    pg.fill("#kb-notes","Hablar con Plasencia y Adrian.")
    pg.click("text=+ Entrada con fecha de hoy"); pg.keyboard.type("llamada hecha")
    pg.click("text=+ Añadir atributo"); sels=pg.locator(".attr-row select"); n=sels.count()
    opts=sels.nth(n-1).locator("option").all_inner_texts()
    ok(opts[0]=="Elegir clave…" and opts[-1].endswith("Añadir nuevo…") and "responsable" in opts,"3 desplegable: claves existentes y «Añadir nuevo…» la última")
    sels.nth(n-1).select_option("responsable"); pg.locator(".attr-row .val").nth(n-1).fill("Marta")
    pg.click("text=+ Añadir atributo"); sels=pg.locator(".attr-row select"); n=sels.count()
    sels.nth(n-1).select_option("__nuevo__"); pg.fill("input[aria-label='Nueva clave']","Reunión"); pg.locator(".attr-row .val").nth(n-1).fill("WS8 14-oct")
    pg.click(".dp-btn"); ok(pg.locator(".dp-wd").all_inner_texts()==["L","M","X","J","V","S","D"],"4 calendario con la semana desde el lunes")
    pg.click(".dp-day:text-is('20')"); pg.click("text=Guardar tarea"); pg.wait_for_timeout(600)
    card=pg.locator(".card:has(.card-title:text-is('Mapear procesos de backoffice'))")
    ok(card.evaluate("el=>[...el.children].map(c=>c.className)")==["card-head","notes","meta","meta"],"5 en la tarjeta: título, notas y etiquetas, sin botones de mover")
    ok("29-oct-2026" in card.locator(".notes").inner_text() or re.search(r"\d+-\w{3}-2026: llamada hecha",card.locator(".notes").inner_text()) is not None,"6 entrada de log con fecha en las notas")
    ok(os.path.exists(DATA) and pg.locator(".saved").inner_text()=="Guardado","7 se guarda en disco")
    # --- filtro
    keys=pg.locator("#kb-fkey option").all_inner_texts(); ok("reunión" in keys and "ámbito" in keys,"8 filtro por clave: "+str(keys))
    ok(pg.locator("#kb-fkey").input_value()=="ámbito","9 filtro por defecto en ámbito")
    pg.click(".scope:has-text('WS8')"); ok(pg.locator(".card").count()==1,"10 filtrar por WS8 deja 1 tarjeta"); pg.click(".scope:has-text('All')")
    # --- importar (actualizar + añadir)
    csv="id,titulo,columna,atributos\nejemplo,,hecho,\n,Desde CSV A,backlog,tema=prueba\n,Desde CSV B,backlog,tema=prueba\n,Desde CSV C,backlog,\n"
    pg.click("text=Importar"); pg.fill("textarea",csv); pg.click("button:has-text('Importar tareas')"); pg.wait_for_timeout(300)
    ok("Actualizadas 1, añadidas 3, ignoradas 0" in pg.locator(".hint >> nth=1").inner_text() or "Actualizadas 1, añadidas 3" in pg.locator(".modal").inner_text(),"11 importar actualizar: resumen")
    pg.keyboard.press("Escape"); ok(pg.locator(".modal").count()==0,"12 Escape cierra el diálogo")
    # --- ordenar a mano arrastrando
    A=pg.locator("[aria-label='Backlog'] .card:has(.card-title:text-is('Desde CSV A'))"); C=pg.locator("[aria-label='Backlog'] .card:has(.card-title:text-is('Desde CSV C'))")
    before=order(pg,"Backlog"); C.drag_to(A,target_position={"x":60,"y":4}); pg.wait_for_timeout(200)
    after=order(pg,"Backlog"); ok(after.index("Desde CSV C")<after.index("Desde CSV A") and before.index("Desde CSV C")>before.index("Desde CSV A"),"13 arrastrar C antes de A: "+str(after))
    B=pg.locator("[aria-label='Backlog'] .card:has(.card-title:text-is('Desde CSV B'))"); bb=B.bounding_box()
    pg.locator("[aria-label='Backlog'] .card:has(.card-title:text-is('Desde CSV A'))").drag_to(B,target_position={"x":60,"y":bb["height"]-4}); pg.wait_for_timeout(200)
    a2=order(pg,"Backlog"); ok(a2[-1]=="Desde CSV A" or a2.index("Desde CSV A")>a2.index("Desde CSV B"),"14 arrastrar A después de B: "+str(a2))
    pg.locator("[aria-label='Backlog'] .card:has(.card-title:text-is('Desde CSV B'))").drag_to(pg.locator("[aria-label='En curso']")); pg.wait_for_timeout(200)
    ok(order(pg,"En curso")==["Desde CSV B"],"15 arrastrar a otra columna (vacía)")
    # --- botón Claude (copia en un clic)
    big=pg.locator(".card:has(.card-title:text-is('Mapear procesos de backoffice'))"); big.locator(".claude-btn").click(); pg.wait_for_timeout(200)
    clip=pg.evaluate("navigator.clipboard.readText()")
    ok(clip.startswith("Tarea [id: ") and "Notas:" in clip and "responsable=Marta" in clip and "Relacionadas" not in clip and "Petición" not in clip,"16 botón Claude copia el resumen mínimo")
    ok(big.locator(".claude-btn").inner_text()=="Copiado","17 el botón confirma «Copiado»")
    big.locator(".card-title").click(); pg.click("summary:has-text('Para Claude')"); pg.click("button.scope:has-text('Plan')")
    ok("Petición: Prepárame un plan" in pg.input_value("#kb-brief"),"18 atajo en el diálogo añade la petición")
    pg.fill(".modal label.field:has-text('Tarea') input >> nth=0","Título editado sin guardar"); ok("Título editado sin guardar" in pg.input_value("#kb-brief"),"19 el resumen usa el borrador del formulario")
    pg.click("text=Cancelar"); ok(pg.locator(".card-title:text-is('Título editado sin guardar')").count()==0,"20 cancelar no guarda cambios")
    # --- exportar
    pg.click("text=Exportar"); csvout=pg.input_value("#kb-export"); pg.click("text=Texto para el chat"); txt=pg.input_value("#kb-export"); pg.click("text=Cerrar")
    ok(csvout.splitlines()[0]=="id,columna,titulo,fecha,atributos,notas" and "id: " in txt,"21 exportar CSV y texto con ids")
    # --- persistencia + copia
    pg.reload(); pg.wait_for_selector(".card"); ok(pg.locator(".card").count()==5,"22 recargar conserva las 5 tareas")
    saved=json.load(open(DATA)); ok(len(saved)==5 and os.path.exists(DATA+".bak"),"23 archivo en disco con 5 tareas y copia .bak")
    # --- borrar todo
    pg.click("text=Borrar todo y dejar la tarea de ejemplo"); pg.click("text=Sí, borrar todo"); pg.wait_for_timeout(400)
    ok(pg.locator(".card").count()==1,"24 borrar todo deja la tarea de ejemplo")
    # --- sin servidor: no se pisan datos
    pg2=ctx.new_page(); puts=[]
    pg2.on("request",lambda r: puts.append(r.method) if r.method=="PUT" else None)
    pg2.route("**/api/kv/**",lambda r:r.abort()); pg2.goto(URL); pg2.wait_for_timeout(800)
    ok("No se pudieron leer los datos" in pg2.locator(".kb").inner_text() and pg2.locator(".card").count()==0 and not puts,"25 sin servidor: avisa y no guarda nada")
    print("errores JS:", errs)
    if errs:
        failures.append("errores de JavaScript")
    b.close()

server.terminate()
print("\nTodo correcto." if not failures else f"\n{len(failures)} fallo(s): {failures}")
sys.exit(1 if failures else 0)
