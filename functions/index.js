/**
 * Función HTTP callable para enviar el correo
 */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Configura tu transporte SMTP usando Gmail (contraseña de aplicación).
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "xalbertxxa@gmail.com",
    pass: "bcur xatb ddyf ryoq",
  },
});

exports.sendTicketEmail = functions.https.onCall(async (incoming) => {
  console.log("Datos recibidos en sendTicketEmail:", incoming);

  const {
    fullName,
    phoneNumber,
    storeEmail,
    incidentType,
    systemType,
    observations,
    photoURL,
    calle,
    coordenadas,
    local,
    localidad,
    provincia,
  } = incoming.data;

  const mailText = `
Nuevo ticket generado:

Nombre: ${fullName}
Teléfono: ${phoneNumber}
Email: ${storeEmail}
Incidencia: ${incidentType}
Sistema: ${systemType}
Observaciones: ${observations}
Foto URL: ${photoURL}

Datos adicionales:
CALLE: ${calle}
COORDENADAS: ${coordenadas}
LOCAL: ${local}
LOCALIDAD: ${localidad}
PROVINCIA: ${provincia}

Este correo fue enviado automáticamente desde la aplicación de Lider Support.
Por favor no respondas a este correo.
`;

  // Aquí se establece el nombre de remitente "LiderSupport" junto a tu correo
  const mailOptions = {
    from: "LiderSupport <xalbertxxa@gmail.com>",
    to: [
      "jsolis@liderman.com.pe",
      "atencionalcliente@liderman.com.pe",
      "rcusi@liderman.com.pe",
      "AValenzuelaM@primax.com",
    ],
    subject: `Nuevo ticket de ${local} - ${systemType} - ${incidentType}`,
    text: mailText,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (error) {
    console.error("Error enviando el correo:", error);
    throw new functions.https.HttpsError(
        "unknown",
        "Error enviando correo",
        error,
    );
  }
});

