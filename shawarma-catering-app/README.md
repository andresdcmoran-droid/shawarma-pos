# 🌯 Shawarma Catering Kiosk & Kitchen Display System (KDS)

Sistema profesional, ultra rápido y **100% Offline (sin internet)** diseñado específicamente para empresas de catering de comida árabe y shawarmas.

---

## 🚀 Inicio Rápido (1 Solo Clic)

1. Abre la terminal en la carpeta del proyecto:
   ```bash
   cd /Users/leandromoran/.gemini/antigravity/scratch/shawarma-catering-app
   ./start_catering_server.sh
   ```
2. La terminal te mostrará la dirección IP local para tus iPads, por ejemplo:
   - **iPad Mesero / Kiosko:** `http://192.168.1.50:8080/?view=order`
   - **iPad Cocina (Maestro Shawarma):** `http://192.168.1.50:8080/?view=kitchen`
   - **Monitor de Turnos:** `http://192.168.1.50:8080/?view=display`
   - **Panel Admin:** `http://192.168.1.50:8080/?view=admin`

---

## 📶 ¿Cómo Funciona 100% Sin Internet en Fincas y Eventos?

1. Enciende la **Zona Wi-Fi (Hotspot)** de tu teléfono móvil o conecta un mini router Wi-Fi portátil.
2. Conecta tu Mac (que corre el servidor) y los 2 iPads a esa misma red Wi-Fi.
3. **No se consumen datos móviles ni se necesita conexión a internet exterior.** La comunicación ocurre directamente en red local con menos de 10ms de latencia.
4. En los iPads, abre Safari, entra a la dirección y selecciona:
   - **Compartir (ícono de cuadro con flecha) ➔ "Agregar a pantalla de inicio"**
   - ¡Listo! Se abrirá como una aplicación nativa a pantalla completa sin barras de navegación.

---

## 🌟 Características Principales

### 1. iPad Mesero / Kiosko (`/?view=order`)
* **Control Estricto de Turnos (FIFO):** Genera automáticamente `Turno #1, #2, #3...` para que ningún invitado sienta que lo saltaron.
* **Presets de 1 Toque:**
  * ⭐ *Completo de la Casa:* Todos los vegetales y salsas recomendadas.
  * 🚫 *Sin Cebolla:* El pedido más frecuente en eventos.
  * 🍖 *Solo Carnes y Salsas:* Cero vegetales, solo proteína y cremas.
* **Matriz Táctil de 8 Ingredientes y Salsas:**
  * *Vegetales:* Lechuga, Tomate, Cebolla con Sumac, Pepinillos encurtidos, Perejil libanés, Nabo encurtido (*Kabees*).
  * *Salsas:* Crema de Ajo (*Toum*), Salsa Tahini (*Tarator*), Picante de la Casa (*Harissa*).
  * *Extras:* Papas fritas dentro del shawarma.

### 2. iPad Cocina / KDS Maestro (`/?view=kitchen`)
* **Barra Superior de Batching (Parrilla en Lote):** Muestra el conteo en tiempo real de cuántos shawarmas de Pollo, Carne, Mixto o Falafel están pendientes para cortar la carne en bloque y no uno a uno.
* **Etiquetas de Alta Visibilidad:** Alertas rojas gigantes `⛔ SIN CEBOLLA` o `⛔ SIN TOMATE` para eliminar errores en el armado.
* **Sonido de Notificación Sintético:** Chime árabe suave cada vez que entra un nuevo pedido y campana triple al marcarlo listo.
* **Flujo 1-Tap:** `[En Espera]` ➔ `[En Parrilla]` ➔ `[¡Listo para Entregar!]` ➔ `[Entregado]`.

### 3. Monitor de Turnos (`/?view=display`)
* Vista de 2 columnas para pantalla o televisor: *"En Preparación"* y *"¡Listos para Retirar!"*.

### 4. Administración y Métricas (`/?view=admin`)
* Descarga de reporte en **CSV** con el desglose de todos los pedidos, tiempos y consumos del evento.
* Botón de reinicio para nuevo evento con respaldo automático.

---

## 🛠️ Estructura Técnica
* **Servidor:** Ruby estándar con WEBrick multihilo y Server-Sent Events (SSE) (cero librerías externas o dependencias que instalar).
* **Persistencia:** Base de datos JSON local en `data/catering_event.json` con respaldos automáticos.
* **Frontend:** HTML5 / CSS3 táctil con Web Audio API y sincronización dual (SSE + BroadcastChannel + localStorage).
