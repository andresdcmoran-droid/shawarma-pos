/* Device-local presentation only. Canonical recipes, IDs, notes, API payloads,
 * backups and editable business fields are never translated or rewritten.
 * Exact UI strings + bounded templates, not browser/remote translation.
 */
(() => {
  'use strict';
  const app=window.app,proto=Object.getPrototypeOf(app),KEY='shawarma_ui_language_v1';
  let locale='es';try{if(localStorage.getItem(KEY)==='en')locale='en';}catch{}
  const dictionary={
    '¿Cerrar este evento y comenzar otro? Primero se generará un respaldo. El evento no se vaciará localmente si el servidor no confirma.':'Close this event and start another? A backup will be generated first. Local event data will not be cleared without server confirmation.',
    'Abre Descargas y comprueba que puedes abrir el respaldo y que contiene tus pedidos. ¿Confirmas que ya lo guardaste y deseas cerrar el evento?':'Open Downloads and check that the backup opens and contains your orders. Is it saved, and do you want to close the event?',
    'El evento cambió mientras se generaba el respaldo. Descárgalo de nuevo antes de cerrar.':'The event changed while creating the backup. Download it again before closing.',
    'Respaldar Excel + JSON':'Back up Excel + JSON','Descargar Excel':'Download Excel','Abrir respaldo JSON':'Open JSON backup',
    'Abrir un respaldo permite consultarlo y archivarlo. No restaura pedidos al servidor.':'Open a backup to review and archive it. It does not restore server orders.',
    'Cerrar o limpiar evento':'Close or clear event','Limpiar evento con respaldo':'Clear event with backup',
    'Primero verifica el respaldo. Después se archiva el evento y se abre uno vacío; no se borra el historial.':'Verify the backup first. Then the event is archived and an empty one opens; history is preserved.',
    'No hay borrado automático por inactividad. El reloj empieza con el primer pedido o con el botón de inicio; recargar no reinicia el servicio.':'No automatic deletion due to inactivity. The timer starts with the first order or the start button; reloading does not restart the service.',
    'Pedidos':'Orders','Cocina KDS':'Kitchen KDS','Monitor Turnos':'Order monitor',
    'Nombre del invitado':'Guest name','Mesa / referencia':'Table / reference','Ej. Mesa 2':'E.g. Table 2',
    '1. Elige la proteína':'1. Choose protein','2. Atajos':'2. Quick choices','3. Ingredientes':'3. Ingredients',
    'Selección obligatoria':'Required','Recetas rápidas':'Quick recipes','Incluir o quitar':'Include or omit',
    'Shawarma Mixto':'Mixed Shawarma','Shawarma de Pollo':'Chicken Shawarma','Shawarma de Carne':'Beef Shawarma',
    'Shawarma Pollo':'Chicken Shawarma','Shawarma Carne':'Beef Shawarma','Shawarma Falafel':'Falafel Shawarma',
    'Mixto':'Mixed','Pollo':'Chicken','Carne':'Beef','Falafel':'Falafel',
    'Especialidad de la casa':'House specialty','Con todo':'With everything','Bowl sin pan':'Bowl · no bread',
    'Para niño':'Kids meal','Sin salsas':'No sauces','Carnes y salsas':'Meat & sauces',
    'Sin cebolla':'No onion','Sin pepinillo':'No pickles','Sin tomate':'No tomato',
    'Incluir':'Yes','Sin':'No','Hummus':'Hummus','Tabule':'Tabbouleh','Cebolla':'Onion','Tomate':'Tomato',
    'Pepinillo':'Pickles','Nabo':'Turnip','Salsa de Ajo':'Garlic sauce','Salsa de Ajonjolí':'Sesame sauce',
    'Picante (Opcional)':'Hot sauce (optional)','Picante':'Hot sauce',
    'Notas para cocina':'Kitchen notes','Otra indicación para cocina…':'Other kitchen instructions…',
    'Salsa Adicional':'Extra sauce','Salsa Aparte':'Sauce on the side','Tabule Aparte':'Tabbouleh on the side',
    'Salsa de Tahini':'Tahini sauce','Cortado por la mitad':'Cut in half','Bien Tostado':'Well toasted',
    'Sin Falafel':'No falafel','Para Llevar':'Takeaway',
    'Próximo turno':'Next order','Editando pedido':'Editing order','Conserva su turno original':'Keeps its original number',
    'Se confirma al recibirlo el servidor':'Confirmed when the server receives it',
    'Resumen del Pedido':'Order summary','Guardar cambios':'Save changes',
    'Confirmar y enviar a cocina':'Confirm & send to kitchen','Cancelar edición':'Cancel edit',
    'Descartar Grupo':'Discard group','Agregar otro shawarma':'Add another shawarma','Guardar este y agregar otro':'Save this & add another',
    'Sin pan · en plato':'No bread · served in a bowl','Menú infantil':'Kids meal','Solo pan y proteína':'Bread and protein only',
    'Verificar ingredientes del pedido':'Check order ingredients','Ver ingredientes incluidos':'View included ingredients',
    'Sin ingredientes adicionales':'No extra ingredients','Servido en plato, sin pan':'Served in a bowl, no bread',
    'Envuelto y tostado en plancha':'Wrapped & toasted on the grill',
    'Pedido actual':'Current order','Revisar pedido':'Review order','Revisar cambios':'Review changes',
    'Cumpleañero':'Birthday guest','Infantil':'Kids meal','Incluye infantil':'Includes kids meal','Incluye bowls':'Includes bowls',
    'Evento':'Event','Pausar / Reanudar Cronómetro':'Pause / resume timer','Reiniciar Cronómetro a 00:00:00':'Reset timer to 00:00:00',
    'Preparaciones iguales':'Matching recipes','No hay pedidos pendientes.':'No pending orders.',
    'En preparación':'Preparing','Por preparar':'Queued','Listos':'Ready','Entregados':'Delivered','Todos':'All',
    'Listo para entregar':'Ready for pickup','Listos para entregar':'Ready for pickup','Entregado':'Delivered','Cancelado':'Cancelled',
    'Revisar estado':'Check status','Cocina al día':'Kitchen is up to date','Sin pedidos en esta sección':'No orders in this section',
    'Los nuevos pedidos aparecerán aquí.':'New orders will appear here.','Usa los filtros para ver las otras comandas.':'Use the filters to see other orders.',
    'Comenzar preparación':'Start preparing','Marcar grupo completo listo':'Mark whole group ready',
    'Marcar como listo':'Mark ready','Confirmar entrega del grupo':'Confirm group pickup','Confirmar entrega':'Confirm pickup',
    'Turno':'Order','Desde el pedido':'Since ordered','Tiempo total':'Total time','Espera prolongada':'Long wait',
    'El invitado viene a retirar':'Guest is coming to collect','Acciones':'Actions','Ver detalle':'View details',
    'Mostrar QR':'Show QR','Editar pedido':'Edit order','Marcar listo directamente':'Mark ready now','Eliminar pedido':'Delete order',
    'Bowls · sin plancha':'Bowls · no grill','No cuentan en las tandas':'Not counted in grill batches',
    'Marcar tanda lista · hasta 6 shawarmas':'Mark batch ready · up to 6 wraps',
    'No hay pedidos en preparación.':'No orders being prepared.','Aquí aparecerán los listos':'Ready orders appear here',
    'Espera a que cocina confirme la preparación.':'Wait for kitchen confirmation.',
    'Listo':'Ready','Preparando':'Preparing','En cola':'Queued','Listo para retirar':'Ready for pickup',
    'Detalle del pedido':'Order details','Cerrar detalle':'Close details','Anterior':'Previous','Siguiente':'Next',
    'Configuración y servicio':'Settings & service','Administración':'Administration','El mismo sistema. Todo en su lugar.':'The same system. Everything in place.',
    'Apariencia':'Appearance','La misma interfaz en Mac, iPad y celular.':'The same interface on Mac, iPad and phone.',
    'Noche':'Night','Día':'Day','Automático':'Auto','Idioma de este dispositivo':'Device language',
    'Dispositivo y operador':'Device & operator','Identifica quién toma los pedidos.':'Identify who takes the orders.','Cambiar nombre':'Change name',
    'Conexión entre pantallas':'Screen connection','Pedidos, cocina y monitor deben usar el mismo servidor.':'Orders, kitchen and monitor must use the same server.',
    'Resumen del evento':'Event summary','Total unidades':'Total items','Bowls · sin pan':'Bowls · no bread',
    'Las proteínas incluyen los bowls. Bowls es un dato adicional, no se suma otra vez al total.':'Protein counts include bowls. The bowl count is a subset, not added again.',
    'Resumen para el cliente':'Customer summary','Exportar pedidos CSV':'Export orders CSV',
    'Costos y rentabilidad':'Costs & profit','Accede con el PIN financiero configurado en este dispositivo.':'Use the finance PIN set on this device.',
    'Abrir módulo financiero':'Open finance','Cambiar PIN':'Change PIN','Bloquear':'Lock',
    'Editar insumos y empaques':'Edit supplies & packaging','Agregar renglón':'Add item','Exportar costos CSV':'Export costs CSV',
    'Ingreso del evento ($)':'Event revenue ($)','Logística y otros gastos ($)':'Logistics & other costs ($)',
    'Costo de insumos':'Supply costs','Resultado neto':'Net profit','Margen':'Margin','Costo por unidad':'Cost per item','Mixto estándar':'Standard mixed',
    'Insumos y empaques':'Supplies & packaging','Desglose de costos':'Cost breakdown','Insumo':'Supply','Uso':'Usage','Cantidad':'Quantity','Costo unitario':'Unit cost','Subtotal':'Subtotal',
    'Historial y respaldos':'History & backups','Consulta los eventos archivados y descarga una copia.':'View archived events and download a copy.',
    'Comandas guardadas':'Saved orders','Eventos archivados':'Archived events','Exportar historial CSV':'Export history CSV',
    'Restaurar pedidos al servidor':'Restore orders to server','Exportar CSV':'Export CSV','Eliminar':'Delete',
    'No hay eventos archivados. Al cerrar un evento con respaldo aparecerá aquí.':'No archived events. Close an event with a backup to see it here.',
    'Protección del evento':'Event protection','El respaldo descargado es independiente del navegador. La permanencia del servidor debe verificarse en Render.':'A downloaded backup is independent of the browser. Server durability must be verified in Render.',
    'Copias de recuperación del dispositivo: sin comprobar.':'Device recovery copies: not checked.',
    'Pantalla activa: sin comprobar.':'Keep screen on: not checked.','Descargar respaldo JSON':'Download JSON backup',
    'Activar / desactivar pantalla activa':'Toggle keep screen on','Cierre y mantenimiento':'Close & maintenance',
    'Cerrar exige respaldo y confirmación del servidor. No hay borrado automático por inactividad.':'Closing requires a backup and server confirmation. Inactivity does not automatically erase events.',
    'Respaldar y cerrar evento':'Back up & close event','Borrar historial local':'Delete local history',
    'Cerrar':'Close','Cancelar':'Cancel','Entrar':'Unlock','Acceso financiero':'Finance access',
    'Ingresa el PIN de cuatro dígitos de este dispositivo.':'Enter this device’s four-digit PIN.','Restablecer PIN':'Reset PIN',
    'Edita nombres, descripción y precios. La descripción es informativa: no cambia el cálculo automático existente. En renglones nuevos, indica cuántas unidades o porciones usaste en este evento.':'Edit names, descriptions and prices. Descriptions do not change automatic calculations. For new items, enter the units or portions used in this event.',
    'Los ajustes se guardan en este navegador; no se sincronizan con otros dispositivos.':'Settings are saved in this browser, not synced to other devices.',
    'Restablecer originales':'Restore defaults','Guardar y recalcular':'Save & recalculate','Nombre':'Name','Descripción de uso':'Usage description',
    'Precio del paquete ($)':'Pack price ($)','Unidades / porciones':'Units / portions','Usadas en este evento':'Used in this event',
    'Cantidad manual. No se añade al menú de Pedidos.':'Manual quantity. Not added to the order menu.',
    'Consumo automático original. Editar su descripción no cambia la cantidad calculada.':'Original automatic usage. Editing the description does not change the calculated quantity.',
    'Servidor conectado':'Server connected','Sin confirmar conexión':'Connection unconfirmed',
    'Los pedidos guardados solo en este dispositivo no están confirmados en cocina.':'Orders saved only on this device are not confirmed in the kitchen.',
    'Abre la aplicación desde su servidor':'Open the app from its server',
    'Esta dirección sirve en este equipo. En iPad o celular usa la IP local del Mac y el mismo puerto, dentro de la misma red.':'This address works on this computer. On iPad or phone, use the Mac’s local IP and the same port on the same network.',
    'Para el servicio local, conecta los dispositivos a la misma red y utiliza la dirección del Mac servidor.':'For local service, connect devices to the same network and use the Mac server’s address.',
    'Prueba local':'Local demo','Prueba local · este navegador':'Local demo · this browser','Prueba local · solo este navegador':'Local demo · this browser only',
    'No sincroniza otros dispositivos. Los datos de prueba se borran al recargar.':'Does not sync other devices. Demo data clears on reload.',
    'Cargar pedidos de ejemplo':'Load sample orders',
    'Las cuatro vistas funcionan dentro de este navegador. No sincroniza dispositivos y se borra al recargar. Usa nombres ficticios. El PIN de esta demostración es 1234.':'All four views work in this browser. No device sync; data clears on reload. Use fictional names. The demo PIN is 1234.',
    'Demostración sin conexión con otras pantallas. Abre Admin para cargar ejemplos.':'Demo without screen sync. Open Admin to load examples.',
    'Demostración temporal: se borra al recargar.':'Temporary demo: clears on reload.',
    'No se pudo guardar la copia del dispositivo. Descarga un JSON y revisa el almacenamiento.':'Could not save the device copy. Download a JSON backup and check storage.',
    'Copia auxiliar en este navegador; no sustituye el disco persistente ni el respaldo descargado.':'Browser recovery copy; not a replacement for durable storage or a downloaded backup.',
    'Pantalla activa: pendiente de comprobar.':'Keep screen on: awaiting check.','Hay un envío sin confirmar.':'An order submission is unconfirmed.',
    'No se ha creado un turno local ni se reenviará automáticamente. Conservamos el formulario. Comprueba en cocina si llegó antes de repetirlo.':'No local order number was created and no automatic retry will occur. Your form is retained. Check the kitchen before sending again.',
    'Ya revisé el envío en cocina':'I checked the kitchen','El servidor devolvió otro evento o faltan pedidos.':'The server returned a different event or orders are missing.',
    'No se confirmó el guardado local.':'Local save was not confirmed.',
    'Conservamos en pantalla la información anterior. No se mezclará ni se enviará automáticamente al servidor. Revisa antes de continuar.':'Previous information is retained on screen. It will not be merged or sent automatically. Review before continuing.',
    'No borres datos ni cierres el evento hasta disponer de un respaldo verificable.':'Do not delete data or close the event until you have a verifiable backup.',
    'Revisar cambio de evento':'Review event change',
    'La protección de pantalla se comprueba en la app real HTTPS.':'Screen protection must be checked in the real HTTPS app.',
    'Pantalla activa: desactivada.':'Keep screen on: off.','Pantalla activa: pausada mientras la página está oculta.':'Keep screen on: paused while the page is hidden.',
    'Pantalla activa no disponible: requiere navegador compatible y HTTPS (o localhost).':'Keep screen on unavailable: requires a supported browser and HTTPS (or localhost).',
    'Pantalla activa: permiso concedido por el navegador.':'Keep screen on: browser permission granted.',
    'El dispositivo liberó la pantalla. Revisa batería, bloqueo o visibilidad.':'The device released the screen. Check battery, locking or visibility.',
    'No se pudo mantener la pantalla activa. Revisa el bloqueo automático y la batería.':'Could not keep the screen on. Check auto-lock and battery.',
    'Escribe un nombre o una referencia para identificar la entrega.':'Enter a name or reference to identify pickup.',
    'Cambio sin confirmar. Conservamos el estado anterior; revisa cocina y la conexión.':'Change unconfirmed. Previous status retained; check kitchen and connection.',
    'Envío sin confirmar. No repetimos ni creamos un turno local. Revisa cocina antes de intentarlo otra vez.':'Submission unconfirmed. No retry or local order number was created. Check the kitchen before trying again.',
    'Hay un envío pendiente de verificar. Revisa el aviso de seguridad y confirma en cocina antes de repetir.':'A submission needs verification. Review the safety notice and check the kitchen before retrying.',
    'No se puede editar ese pedido con el editor individual.':'This order cannot be edited with the individual editor.',
    'La edición de grupos necesita un editor por integrante. No se modificará solo el encabezado.':'Groups require an editor for each item. The header alone will not be changed.',
    'Eliminación sin confirmar. No quitamos la copia local; revisa el servidor antes de repetir.':'Deletion unconfirmed. The local copy is retained; check the server before retrying.',
    'Se solicitó descargar el JSON. Comprueba que el archivo exista antes de borrar o cerrar el evento.':'JSON download requested. Check the file exists before deleting or closing the event.',
    'No se pudo generar el respaldo. No borres el evento.':'Could not create a backup. Do not delete the event.',
    'La restauración automática está desactivada para no mezclar eventos. Descarga el respaldo y revisa el servidor.':'Automatic restore is disabled to avoid mixing events. Download a backup and check the server.',
    'Restauración masiva detenida por seguridad: primero verifica el evento de destino y el respaldo JSON.':'Bulk restore blocked for safety: verify the target event and JSON backup first.',
    'El servidor confirmó el cierre. Conserva y verifica tu respaldo JSON.':'Server confirmed closure. Keep and verify your JSON backup.',
    'No se confirmó el cierre completo. No se ha vaciado la copia local. Revisa el servidor antes de repetir.':'Closure not fully confirmed. The local copy has not been cleared. Check the server before retrying.',
    'El borrado sin respaldo está desactivado. Usa cerrar evento con respaldo.':'Deletion without backup is disabled. Use back up & close event.',
    'Resuelve el cambio o cierre de evento antes de modificar pedidos.':'Resolve the event change or closure before editing orders.',
    '¿Cerrar este evento y comenzar otro? Primero se generará un respaldo JSON. El evento no se vaciará localmente si el servidor no confirma.':'Close this event and start another? A JSON backup will be generated first. Local event data will not be cleared without server confirmation.',
    'Abre Descargas y comprueba que el respaldo JSON existe. ¿Confirmas que ya lo guardaste y deseas cerrar el evento?':'Open Downloads and check the JSON backup exists. Have you saved it and do you want to close the event?',
    'Comprueba el nombre, receta y turno en cocina. Si llegó, NO vuelvas a enviarlo: limpia el formulario. ¿Ya lo verificaste y quieres desbloquear el formulario?':'Check the name, recipe and number in the kitchen. If it arrived, do NOT send again: clear the form. Have you checked and want to unlock the form?',
    '¿Cerrar sin guardar los cambios de insumos?':'Close without saving supply changes?',
    '¿Restablecer nombres, descripciones y precios originales? Los renglones nuevos se conservarán. Después debes pulsar Guardar.':'Restore original names, descriptions and prices? New items will be retained. Press Save afterwards.',
    'El evento cambió. Cierra el editor y vuelve a abrirlo antes de guardar.':'The event changed. Close and reopen the editor before saving.',
    'No se pudieron guardar los insumos en este navegador. Tus cambios siguen abiertos.':'Could not save supplies in this browser. Your edits remain open.',
    'Insumos, nombres y cantidades guardados.':'Supplies, names and quantities saved.',
    'Desglose de insumos exportado con tus nombres y renglones.':'Supply breakdown exported with your names and items.',
    'Escribe un nombre de hasta 160 caracteres.':'Enter a name of up to 160 characters.',
    'La descripción debe tener como máximo 240 caracteres.':'Description must be 240 characters or fewer.',
    'No hay shawarmas pendientes en la plancha.':'No wraps pending on the grill.',
    'Este grupo ocupa más de una tanda o incluye bowls. Confirma el grupo desde su tarjeta cuando esté completo.':'This group spans batches or includes bowls. Confirm from its card when the whole group is ready.',
    'No se confirmó toda la tanda. Revisa los estados y la conexión antes de repetir.':'The whole batch was not confirmed. Check statuses and connection before retrying.',
    'Grupo descartado. Modo individual activo.':'Group discarded. Individual mode active.',
    '¡Nueva comanda recibida en cocina!':'New order received in the kitchen!',
    '¿Deseas reiniciar el cronómetro a 00:00:00?':'Reset the timer to 00:00:00?',
    'Cronómetro reiniciado a 00:00:00':'Timer reset to 00:00:00',
    'Módulo Financiero Desbloqueado':'Finance unlocked','Módulo Financiero Bloqueado':'Finance locked',
    'Clave incorrecta. Intenta de nuevo.':'Incorrect PIN. Try again.','Clave actual incorrecta':'Incorrect current PIN',
    'Ingresa tu clave actual de 4 dígitos:':'Enter your current four-digit PIN:',
    'Ingresa tu NUEVA clave de 4 dígitos (ej: 5678):':'Enter your NEW four-digit PIN (e.g. 5678):',
    'La clave debe ser exactamente de 4 números':'PIN must be exactly four digits','Clave PIN actualizada con éxito':'PIN updated',
    'Para restablecer el PIN a "1234", escribe la palabra "SHAWARMA":':'To reset the PIN to "1234", type "SHAWARMA":',
    'Clave restablecida al valor por defecto: 1234':'PIN reset to default: 1234','Palabra de seguridad incorrecta':'Incorrect verification word',
    'Nombre o identificador de este dispositivo / operador (ej: iPad Barra 1, Caja, Andrés, Leandro):':'Device / operator name (e.g. Counter iPad, Register, Andrés, Leandro):',
    'Este evento no tiene pedidos registrados':'This event has no orders','No hay pedidos registrados en la bóveda aún':'No orders in history yet',
    'No hay pedidos registrados en este evento para exportar':'No orders in this event to export',
    'Bóveda vaciada completamente':'Local history cleared','¡Resumen copiado para WhatsApp!':'Summary copied for WhatsApp!','Resumen preparado':'Summary ready',
    '⚠️ ¡ADVERTENCIA DE SEGURIDAD!\n\n¿Estás seguro de ELIMINAR y VACIAR toda la Bóveda de este dispositivo?\n\nEsta acción borrará todos los eventos anteriores guardados en la memoria física de forma permanente.':'SAFETY WARNING!\n\nDelete and empty all history on this device?\n\nThis permanently deletes all previous events saved in local history.',
    'Carga los ejemplos con la lista vacía. Puedes limpiar la prueba desde Admin.':'Load examples with an empty list. You can clear the demo in Admin.',
    'El QR entre dispositivos requiere ejecutar la aplicación con su servidor.':'Cross-device QR requires running the app with its server.',
    'No se pudo guardar el idioma. Se aplicó solo a esta sesión.':'Could not save language. Applied for this session only.'
  };
  const owns=(o,key)=>Object.prototype.hasOwnProperty.call(o,key);
  // These patterns translate surrounding UI only. Captured names are kept verbatim.
  const patterns=[
    [/^Pedido · (.+)$/,(_,v)=>`Ordered · ${v}`],
    [/^Tanda (\d+)$/,(_,n)=>`Batch ${n}`],
    [/^Turno #(\d+)$/,(_,n)=>`Order #${n}`],
    [/^(\d+)\/(\d+) shawarmas · (\d+) por terminar$/,(_,a,b,c)=>`${a}/${b} wraps · ${c} to finish`],
    [/^(\d+) pedidos?$/,(_,n)=>`${n} order${n==='1'?'':'s'}`],
    [/^(\d+) pedidos? · (\d+) shawarmas$/,(_,a,b)=>`${a} order${a==='1'?'':'s'} · ${b} items`],
    [/^Grupo · (\d+) shawarmas$/,(_,n)=>`Group · ${n} items`],
    [/^Enviar grupo · (\d+) shawarmas$/,(_,n)=>`Send group · ${n} items`],
    [/^Configurando shawarma (\d+) del grupo$/,(_,n)=>`Editing item ${n} in group`],
    [/^(\d+) shawarmas? guardados?$/,(_,n)=>`${n} saved item${n==='1'?'':'s'}`],
    [/^Quitar shawarma (\d+)$/,(_,n)=>`Remove item ${n}`],
    [/^Personalizado · (\d+\/\d+) ingredientes base$/,(_,n)=>`Custom · ${n} base ingredients`],
    [/^· (\d+\/\d+) ingredientes$/,(_,n)=>`· ${n} ingredients`],
    [/^Turnos (#[\d#, ]+)$/,(_,v)=>`Orders ${v}`],
    [/^Recibido (.+)$/,(_,v)=>`Received ${v.replace(/(\d+) shawarmas?$/, '$1 items')}`],
    [/^Última respuesta: (.+)$/,(_,v)=>`Last response: ${v}`],
    [/^Más acciones del turno (\d+)$/,(_,n)=>`More actions for order ${n}`],
    [/^En esta sección: (\d+) de (\d+) unidades del turno\. El pedido queda listo al terminar todas\.$/,(_,a,b)=>`In this section: ${a} of ${b} order items. Ready only when all are finished.`],
    [/^Turno #(\d+): (cambio|recepción) confirmado por el servidor\.$/,(_,n,v)=>`Order #${n}: ${v==='cambio'?'change':'receipt'} confirmed by server.`],
    [/^Turno #(\d+): eliminación confirmada\. Hay una copia en el respaldo de recuperación\.$/,(_,n)=>`Order #${n}: deletion confirmed. A copy remains in recovery backups.`],
    [/^¿Eliminar la comanda Turno #(\d+)\? Conservaremos un punto de recuperación local\. No se quitará de pantalla sin confirmación del servidor\.$/,(_,n)=>`Delete order #${n}? A local recovery point will be kept. It will stay on screen until the server confirms.`],
    [/^Este turno contiene (\d+) unidades en distintas secciones\. ¿Están TODAS terminadas\?$/,(_,n)=>`This order contains ${n} items in different sections. Are ALL finished?`],
    [/^(\d+) shawarmas de la tanda (\d+) confirmados listos\.$/,(_,n,b)=>`${n} wraps in batch ${b} confirmed ready.`],
    [/^¿Terminaste (\d+) shawarmas de la tanda (\d+)\?\nTurnos: ([\d#, ]+)([\s\S]*)$/,(_,n,b,turns,extra)=>`Are ${n} wraps in batch ${b} finished?\nOrders: ${turns}${extra?'\nGroups spanning other batches or including bowls will not be marked complete.':''}`],
    [/^Conservas (\d+) pedidos en pantalla\. El servidor propone “([\s\S]*)” con (\d+)\. ¿Ya descargaste el respaldo y quieres ver el estado del servidor\?$/,(_,n,name,m)=>`${n} orders remain on screen. The server proposes “${name}” with ${m}. Have you downloaded the backup and want to view the server state?`],
    [/^Revisa el precio de ([\s\S]+)\. Debe ser cero o mayor\.$/,(_,name)=>`Check the price of ${name}. It must be zero or greater.`],
    [/^Revisa el rendimiento de ([\s\S]+)\. Debe ser mayor que cero\.$/,(_,name)=>`Check the yield of ${name}. It must be greater than zero.`],
    [/^Revisa el precio y rendimiento de ([\s\S]+)\.$/,(_,name)=>`Check the price and yield of ${name}.`],
    [/^Revisa la cantidad usada de ([\s\S]+)\. Debe ser cero o mayor\.$/,(_,name)=>`Check the used quantity of ${name}. It must be zero or greater.`],
    [/^Operador configurado: ([\s\S]+)$/,(_,name)=>`Operator set: ${name}`],
    [/^Shawarma #(\d+) agregado al grupo\. Configura el siguiente\.\.\.$/,(_,n)=>`Item #${n} added to group. Set up the next one…`],
    [/^Descargado Excel Crudo con (\d+) pedidos$/,(_,n)=>`Exported ${n} orders as CSV`],
    [/^Descargados (\d+) pedidos de la bóveda histórica$/,(_,n)=>`Exported ${n} orders from history`],
    [/^Descargado evento: ([\s\S]+) \((\d+) pedidos\)$/,(_,name,n)=>`Downloaded event: ${name} (${n} orders)`],
    [/^Respaldo de "([\s\S]+)" eliminado con éxito$/,(_,name)=>`Backup of "${name}" deleted`],
    [/^¿Estás seguro de eliminar el respaldo de:\n"([\s\S]+)" \(([^\n]+)\) con (\d+) pedidos\?\n\nEsta acción eliminará únicamente este evento archivado del historial\.$/,(_,name,date,n)=>`Delete the backup of:\n"${name}" (${date}) with ${n} orders?\n\nOnly this archived event will be deleted from history.`]
  ];
  function english(source) {
    if(owns(dictionary,source))return dictionary[source];
    if(source.startsWith('Prueba local · '))return 'Local demo · '+english(source.slice('Prueba local · '.length));
    for(const [pattern,replace] of patterns)if(pattern.test(source))return source.replace(pattern,replace);
    const simple=source.match(/^(?:(\d+) × |(\d+)\. )?(Shawarma|Bowl)(?: de| ·)? (Mixto|Pollo|Carne|Falafel)$/);
    if(simple)return `${simple[1]?simple[1]+' × ':simple[2]?simple[2]+'. ':''}${dictionary[simple[4]]} ${simple[3]}`;
    const mod=source.match(/^(Sin |Con |Incluye: )(.+)$/);
    if(mod)return ({'Sin ':'No ','Con ':'With ','Incluye: ':'Includes: '}[mod[1]])+mod[2].split(/( · |, )/).map(s=>dictionary[s]||s).join('');
    const pref=source.match(/^(.+): (incluido|sin incluir)$/);
    if(pref && owns(dictionary,pref[1]))return `${dictionary[pref[1]]}: ${pref[2]==='incluido'?'included':'omitted'}`;
    if(source.includes(' · '))return source.split(' · ').map(english).join(' · ');
    if(source.includes(' + '))return source.split(' + ').map(english).join(' + ');
    if(source.includes(', '))return source.split(', ').map(english).join(', ');
    const numbered=source.match(/^(\d+) (Mixto|Pollo|Carne|Falafel|shawarmas)$/);
    if(numbered)return `${numbered[1]} ${numbered[2]==='shawarmas'?'wraps':dictionary[numbered[2]]}`;
    return source;
  }
  function translate(value) {
    const source=String(value??'');if(locale!=='en')return source;
    return source.replace(/^(\s*)([\s\S]*?)(\s*)$/,(_,before,body,after)=>before+english(body)+after);
  }
  const excluded='[data-i18n-ignore],script,style,svg,textarea,.toast-msg,.p-note,.p-batch-note,.p-guest-line,.u-turn-guest,#modal-guest-name,#modal-table-name,#admin-operator-display,#cost-breakdown-tbody,.u-archive h3,.u-archive p,.sidebar-watermark-container,#client-invoice-modal,#view-guest,#qr-modal-name';
  const records=new WeakMap();
  function convert(node,key,current,write) {
    let cache=records.get(node);if(!cache){cache={};records.set(node,cache);}
    const previous=cache[key],source=previous && previous.last===current?previous.source:current;
    const next=translate(source);cache[key]={source,last:next};if(next!==current)write(next);
  }
  function apply(root=document.body) {
    if(!root)return;
    const parent=root.nodeType===3?root.parentElement:root;
    if(parent?.closest?.(excluded))return;
    if(root.nodeType===3) {
      if(root.nodeValue?.trim())convert(root,'text',root.nodeValue,v=>{root.nodeValue=v;});
      return;
    }
    if(root.nodeType!==1 && root.nodeType!==9)return;
    if(root.matches?.(excluded))return;
    // Never touch input values, dataset, handlers or customer-filled aria labels.
    for(const key of ['placeholder','title','aria-label']) {
      if(key==='aria-label' && (root.matches?.('.p-ticket,.u-turn-card')))continue;
      const value=root.getAttribute?.(key);if(value)convert(root,key,value,v=>root.setAttribute(key,v));
    }
    if(root.tagName==='INPUT')return;
    for(const child of [...(root.childNodes||[])])apply(child);
  }
  function updateAccessibleOrders() {
    document.querySelectorAll('.p-ticket[data-order-id],.u-turn-card[data-id]').forEach(node=>{
      const order=app.db.orders?.find(o=>String(o.id)===String(node.dataset.orderId||node.dataset.id));if(!order)return;
      const status=translate({pending:'Por preparar',preparing:'En preparación',ready:'Listo para retirar',delivered:'Entregado',cancelled:'Cancelado'}[order.status]||'Revisar estado');
      const name=[order.guest_name||'',order.table||''].filter(Boolean).join(', ');
      const product=window.ShawarmaPremium.orderUnits(order).map(({item,quantity})=>`${quantity} × ${translate(window.ShawarmaPremium.title(item))}`).join('; ');
      const special=window.ShawarmaPremium.specialOrder(order);
      const label=`${locale==='en'?'Order':'Turno'} ${order.turn}, ${name}, ${product}, ${status}${special.birthday?', '+translate('Cumpleañero'):''}${special.kids?', '+translate('Infantil'):''}`;
      if(node.getAttribute('aria-label')!==label)node.setAttribute('aria-label',label);
    });
  }
  function refreshLanguage() {
    document.documentElement?.setAttribute('lang',locale);
    // This prevents built-in browser translation from rewriting order/customer data.
    document.documentElement?.setAttribute('translate','no');
    for(const value of ['es','en'])document.getElementById('u-language-'+value)?.setAttribute('aria-pressed',String(value===locale));
    apply();updateAccessibleOrders();
  }
  proto.setLanguage=function(value) {
    if(!['es','en'].includes(value))return false;
    locale=value;let saved=true;try{localStorage.setItem(KEY,value);}catch{saved=false;}
    refreshLanguage();
    if(typeof this.setInvoiceLang==='function')this.setInvoiceLang(value);
    if(!saved)this.showToast('No se pudo guardar el idioma. Se aplicó solo a esta sesión.','info');
    return true;
  };
  // UI prompts and toasts only; returned answers and default field values are untouched.
  for(const name of ['confirm','prompt']) {
    const original=window[name];if(typeof original==='function')window[name]=function(message,...args){return original.call(window,translate(message),...args);};
  }
  const toast=proto.showToast;
  proto.showToast=function(message,...args){return toast.call(this,translate(window.ShawarmaPremium.stripEmoji(message)),...args);};
  const originalInit=proto.init;
  proto.init=function(...args) {
    originalInit.apply(this,args);refreshLanguage();this.invoiceLang=locale;this.renderInvoiceContent?.();
    for(const value of ['es','en']) {
      const button=document.getElementById('btn-lang-'+value);if(!button)continue;
      button.style.background=value===locale?'#0f172a':'transparent';
      button.style.color=value===locale?'#ffffff':'#64748b';
    }
    if(typeof MutationObserver==='function') {
      const observer=new MutationObserver(changes=>{
        const roots=new Set();
        for(const change of changes) {
          if(change.type==='childList')for(const node of change.addedNodes)roots.add(node);
          else roots.add(change.target);
        }
        roots.forEach(apply);updateAccessibleOrders();
      });
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
    }
  };
  window.ShawarmaI18n={translate,apply,refreshLanguage,updateAccessibleOrders,dictionary,KEY,get locale(){return locale;}};
})();
