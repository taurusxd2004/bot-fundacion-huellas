const axios = require('axios');
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbysun2uoM4X4OzwgmjfXNi7y6aTasu4UByomFLDVw2Y8UCPYFAgNLMCYgt3nzypNqg/exec";


async function enviarAGoogleSheets(data) {
    try {
        const response = await axios.post(URL_GOOGLE_SCRIPT, data);
        console.log(" Datos enviados a Huellas:", response.data);
    } catch (error) {
        console.error(" Error enviando a Google:", error.message);
    }
}
const express = require('express');
const app = express();

// Render exige usar su propio puerto dinámico en producción
const PORT = process.env.PORT || 3000;

// Esta es la ruta principal que visitará UptimeRobot
app.get('/', (req, res) => {
    res.send('🐾 Servidor de la Fundación Huellas activo y despierto');
});

// Arrancamos el mini servidor
app.listen(PORT, () => {
    console.log(`🌐 Servidor web de mantenimiento escuchando en el puerto ${PORT}`);
});
// ---------------------------------------------------------
// 🤖 INICIALIZACIÓN DEL BOT DE WHATSAPP
// ---------------------------------------------------------

// LocalAuth hace que el bot recuerde tu sesión y no te pida el QR cada vez
const bot = new Client({
    authStrategy: new LocalAuth() 
});

// 1. Mostrar el código QR en la terminal
bot.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    console.log('📱 ¡ATENCIÓN! Escanea este código QR con tu WhatsApp.');
});

// 2. Avisar cuando el bot ya entró a la cuenta
bot.on('ready', () => {
    console.log('🐾 ¡El Bot de la Fundación Huellas está conectado y listo!');
});

// 3. Leer mensajes y responder (¡Nuestra primera prueba!)
// ---------------------------------------------------------
// 🧠 MEMORIAS DEL BOT
// ---------------------------------------------------------
const reportesEnProceso = {}; 
const chatsPausados = {}; 

// ---------------------------------------------------------
// 🤖 LÓGICA DE CONVERSACIÓN
// ---------------------------------------------------------
bot.on('message_create', async (mensaje) => {
    const numero = mensaje.fromMe ? mensaje.to : mensaje.from;
    const texto = mensaje.body.toLowerCase();

    // 1. Comandos secretos para el VOLUNTARIO (desde el teléfono oficial)
    if (mensaje.fromMe) {
        if (texto === '!bot') {
            delete chatsPausados[numero];
            mensaje.reply('🤖 El bot ha sido reactivado y vuelve a tomar el control de este chat.');
            return; 
        }
        if (texto === '!pausar') {
            chatsPausados[numero] = true;
            mensaje.reply('🤫 Bot silenciado manualmente. El voluntario tiene el control del chat.');
            return;
        }
        // Si el voluntario escribe cualquier otra cosa a un usuario, el bot lo ignora
        return;
    }

    // --- A PARTIR DE AQUÍ, EL BOT SOLO ESCUCHA LO QUE DICE EL USUARIO ---

    // 2. Si el chat está pausado, el bot ignora por completo al usuario
    if (chatsPausados[numero]) return;

    // 3. Opción global para cancelar en cualquier momento
    if (texto === 'cancelar') {
        if (reportesEnProceso[numero]) {
            delete reportesEnProceso[numero];
            mensaje.reply('🚫 Reporte cancelado. Puedes escribir "hola" si deseas empezar de nuevo.');
        }
        return;
    }

    // 4. Opción para hablar con un voluntario
    if (texto === 'asesor' || texto === 'humano' || texto === 'persona') {
        chatsPausados[numero] = true; // Pausamos el bot
        mensaje.reply('👩‍💻 Entendido. Te hemos transferido con un voluntario de la Fundación Huellas. En breve leerán tu caso y te responderán.\n\n*(El bot se ha pausado para este chat)*');
        return;
    }

    // Para ver los mensajes en tu terminal
    console.log(`Mensaje de ${numero}: ${mensaje.body}`);

    // PASO 0: Inicio
    if (texto === 'hola' || texto === 'buenas' || texto === 'reporte' || texto === 'Hola' || texto === 'Buenas' || texto === 'Reporte' || texto === 'Buenos dias' || texto === 'Buenos días' || texto === 'Buenas tardes' || texto === 'Buenas noches' || texto === 'Buenos dias' || texto === 'buenos días' || texto === 'buenas tardes' || texto === 'buenas noches') {
        reportesEnProceso[numero] = { paso: 1, datos: {} };
        mensaje.reply('🐾 ¡Hola! Bienvenido al canal de reportes de la Fundación Huellas.\n\nPara iniciar tu reporte, dime: ¿Qué tipo de caso es? (Ejemplo: Maltrato, Abandono, Rescate)\n\n*(Escribe "cancelar" en cualquier momento para salir).*');
        return; 
    }

    if (reportesEnProceso[numero]) {
        let estado = reportesEnProceso[numero];

        // PASO 1: Guardamos TIPO y preguntamos ESPECIE
        if (estado.paso === 1) {
            estado.datos.tipo = mensaje.body;
            estado.paso = 2; 
            mensaje.reply('🐶🐱 ¿De qué ESPECIE es el animal? (Ejemplo: Perro, Gato, Ave, etc.)');
        }
        // PASO 2: Guardamos ESPECIE y preguntamos DESCRIPCIÓN
        else if (estado.paso === 2) {
            estado.datos.especie = mensaje.body;
            estado.paso = 3;
            mensaje.reply('📝 Entendido. Por favor, danos una breve DESCRIPCIÓN de lo que está sucediendo.');
        }
        // PASO 3: Guardamos DESCRIPCIÓN y preguntamos UBICACIÓN
        else if (estado.paso === 3) {
            estado.datos.descripcion = mensaje.body;
            estado.paso = 4;
            mensaje.reply('📍 Gracias. Ahora dime, ¿cuál es la UBICACIÓN exacta?');
        }
        // PASO 4: Guardamos UBICACIÓN y preguntamos TELÉFONO
        else if (estado.paso === 4) {
            estado.datos.ubicacion = mensaje.body;
            estado.paso = 5;
            mensaje.reply('📞 Perfecto. Por favor, déjame un número de TELÉFONO de contacto adicional.');
        }
        // PASO 5: Guardamos TELÉFONO y pedimos FOTO
        else if (estado.paso === 5) {
            if (!/\d/.test(texto)) {
                mensaje.reply('⚠️ Escribe un número válido.');
                return; 
            }
            estado.datos.telefono = mensaje.body;
            estado.paso = 6;
            mensaje.reply('📸 Por último, envíanos una FOTO o responde "no tengo" para finalizar.');
        }
        // PASO 6: Cierre del reporte
        else if (estado.paso === 6) {
            mensaje.reply('⏳ Procesando reporte...');
            
            if (mensaje.hasMedia) {
                estado.datos.evidencia = "Archivo recibido en WhatsApp";
            } else {
                estado.datos.evidencia = "Sin multimedia. Nota: " + mensaje.body;
            }
            
            const reporteFinal = {
                origen: "WhatsApp",
                telefono: estado.datos.telefono,
                tipo: estado.datos.tipo,
                especie: estado.datos.especie, // <-- ENVIAMOS EL NUEVO DATO
                descripcion: estado.datos.descripcion,
                ubicacion: estado.datos.ubicacion,
                evidencia: estado.datos.evidencia
            };

            await enviarAGoogleSheets(reporteFinal);
            mensaje.reply('✅ ¡Reporte registrado con éxito!');
            delete reportesEnProceso[numero];
        }
    }
});

// Encender el bot
bot.initialize();

// ---------------------------------------------------------

app.listen(3000, () => {
    console.log("Servidor iniciado...");
});

app.listen(3000, () => {
    console.log("Servidor del bot corriendo en el puerto 3000");
});