document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const statusMessage = document.getElementById("status-message");
    const addRecordBtn = document.getElementById("add-record-btn");
    const viewPendingRecordsBtn = document.getElementById("view-pending-records-btn");
    const viewVideoBtn = document.getElementById("view-video-btn");
    const logoutBtn = document.getElementById("logout-btn");

    // Seleccionar el contenedor del video
    const videoContainer = document.getElementById("video-container");
    const videoFrame = document.getElementById("video-frame");
    const closeVideoBtn = document.getElementById("close-video-btn");

    // Crear un modal para el mensaje de cierre de sesión
    const logoutModal = document.createElement("div");
    logoutModal.id = "logout-modal";
    logoutModal.classList.add("modal");

    const modalContent = document.createElement("div");
    modalContent.id = "logout-modal-content";
    modalContent.classList.add("modal-content");

    const modalMessage = document.createElement("p");
    modalMessage.textContent = "Gracias por preferir a Liderman Alarmas.";
    modalMessage.classList.add("modal-message");

    const continueButton = document.createElement("button");
    continueButton.textContent = "Continuar";
    continueButton.classList.add("modal-button");

    continueButton.addEventListener("click", async () => {
        try {
            await auth.signOut();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Error al cerrar sesión. Intenta nuevamente.");
        }
    });

    modalContent.appendChild(modalMessage);
    modalContent.appendChild(continueButton);
    logoutModal.appendChild(modalContent);
    document.body.appendChild(logoutModal);

    // Ocultar el contenedor del video al cargar la página
    videoContainer.style.display = "none";

    // Verificar autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Obtener el correo del usuario, limpiarlo y extraer la parte antes de la arroba
            const userEmail = user.email.trim().toLowerCase();
            const emailName = userEmail.split('@')[0];

            try {
                // Consultar Firestore en la colección "usersMap" usando el valor antes de la '@' como ID
                const userDoc = await db.collection("usersMap").doc(emailName).get();
                // Valor por defecto es el propio emailName
                let displayName = emailName;
                
                // Si el documento existe y tiene el campo "LOCAL", actualizar displayName
                if (userDoc.exists && userDoc.data().LOCAL) {
                    displayName = userDoc.data().LOCAL;
                }

                // Actualizar el mensaje de bienvenida con el nombre obtenido del campo LOCAL
                statusMessage.textContent = `Bienvenido, ${displayName}`;

                // Consultar registros pendientes en Firestore
                const incidentsRef = db.collection("incidents");
                const pendingIncidentsQuery = await incidentsRef
                    .where("estado", "==", "Pendiente")
                    .where("local", "in", [emailName, displayName])
                    .get();

                console.log(`Registros pendientes encontrados: ${pendingIncidentsQuery.size}`);

                if (!pendingIncidentsQuery.empty) {
                    statusMessage.textContent += ` - Tienes ${pendingIncidentsQuery.size} registro(s) pendiente(s).`;
                }
            } catch (error) {
                console.error("Error al consultar usuario en Firestore:", error);
                statusMessage.textContent = "Error al cargar datos del usuario.";
            }
        } else {
            window.location.href = "index.html";
        }
    });

    // Botón para agregar nuevo registro
    addRecordBtn.addEventListener("click", () => {
        window.location.href = "formulario.html";
    });

    // Botón para ver registros pendientes
    viewPendingRecordsBtn.addEventListener("click", () => {
        window.location.href = "registros-pendientes.html";
    });

    // Botón para ver el video instructivo
    viewVideoBtn.addEventListener("click", () => {
        videoContainer.style.display = "block"; // Mostrar contenedor del video
        videoFrame.src += "?autoplay=1&mute=0"; // Añadir parámetros para reproducir automáticamente con volumen
    });

    // Botón para cerrar el video
    closeVideoBtn.addEventListener("click", () => {
        videoContainer.style.display = "none"; // Ocultar contenedor del video
        videoFrame.src = videoFrame.src.split("?")[0]; // Restablecer el video al cerrarlo
    });

    // Botón para cerrar sesión
    logoutBtn.addEventListener("click", () => {
        logoutModal.style.display = "flex";
    });
});
