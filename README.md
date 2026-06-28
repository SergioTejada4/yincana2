# Generador de preguntas y respuestas para yincanas

Aplicación sencilla para crear preguntas, generar una SEED determinista y jugar desde un móvil.

## Cómo usarlo
1. Abre https://sergiotejada4.github.io/yincana/ en el navegador.
2. Añade preguntas, responde correctamente.
3. Genera el QR.
4. Abre el enlace o escanea el QR y empieza a responder.

## Archivos
- index.html: generador de preguntas y SEED
- player.html: pantalla para introducir la SEED y responder
- generator.js: lógica del generador
- player.js: lógica del jugador

## Notas
- Las respuestas se comparan sin distinguir mayúsculas/minúsculas y sin tildes.
- La SEED se genera de forma determinista usando LZ-String y JSON.
- El diseño está preparado para pantallas pequeñas.
