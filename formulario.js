document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  const welcomeMessage = document.getElementById("welcome-message");
  const form = document.getElementById("incident-form");
  const backBtn = document.getElementById("back-btn");
  const photoButton = document.getElementById("photo-btn");

  // Crear contenedor para la vista previa de la foto
  const photoPreviewContainer = document.createElement("div");
  photoPreviewContainer.id = "photo-preview-container";
  const photoPreview = document.createElement("img");
  photoPreview.id = "photo-preview";
  photoPreview.style.display = "none";
  photoPreview.style.marginTop = "15px";
  photoPreview.style.width = "150px";
  photoPreview.style.height = "auto";
  photoPreview.style.borderRadius = "5px";
  photoPreview.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
  photoPreviewContainer.appendChild(photoPreview);
  form.insertBefore(photoPreviewContainer, form.querySelector("button[type='submit']"));

  let photoURL = ""; // Se almacenará la URL de la foto subida a Firebase

  // Verificar autenticación y configurar bienvenida
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Extraer la parte anterior a '@' del correo
      const userEmail = user.email.trim().toLowerCase();
      const emailName = userEmail.split('@')[0];

      try {
        // Buscar en Firestore el documento con id = emailName
        const userDoc = await db.collection("usersMap").doc(emailName).get();

        // Por defecto, muestra el nombre de usuario
        let displayName = emailName;
        if (userDoc.exists && userDoc.data().LOCAL) {
          // Si existe, muestra el campo "LOCAL" como bienvenida
          displayName = userDoc.data().LOCAL;
        }
        welcomeMessage.textContent = `Bienvenido, ${displayName}`;
      } catch (error) {
        console.error("Error obteniendo el nombre del usuario:", error);
        welcomeMessage.textContent = "Bienvenido";
      }
    } else {
      // Si no hay usuario autenticado, redirige al login
      window.location.href = "index.html";
    }
  });

  // Botón "Tomar Fotografía"
  photoButton.addEventListener("click", async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = document.createElement("video");
      video.srcObject = mediaStream;
      video.play();

      // Contenedor para la cámara en pantalla completa
      const captureContainer = document.createElement("div");
      captureContainer.style.position = "fixed";
      captureContainer.style.top = "0";
      captureContainer.style.left = "0";
      captureContainer.style.width = "100vw";
      captureContainer.style.height = "100vh";
      captureContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      captureContainer.style.zIndex = "1000";
      captureContainer.style.display = "flex";
      captureContainer.style.justifyContent = "center";
      captureContainer.style.alignItems = "center";

      captureContainer.appendChild(video);
      document.body.appendChild(captureContainer);

      // Al hacer clic en el video, captura la imagen
      video.addEventListener("click", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          // Subir la imagen a Firebase Storage
          const storageRef = storage.ref(`photos/${Date.now()}.jpg`);
          await storageRef.put(blob);
          photoURL = await storageRef.getDownloadURL();

          // Mostrar la foto en la vista previa
          photoPreview.src = photoURL;
          photoPreview.style.display = "block";

          console.log("Foto subida con éxito:", photoURL);

          // Cerrar la cámara
          mediaStream.getTracks().forEach((track) => track.stop());
          document.body.removeChild(captureContainer);
        }, "image/jpeg");
      });
    } catch (error) {
      console.error("Error al abrir la cámara:", error);
      alert("No se pudo abrir la cámara. Verifica los permisos del navegador.");
    }
  });

  // Manejar el envío del formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtener valores del formulario
    const fullName = document.getElementById("full-name").value.trim();
    const phoneNumber = document.getElementById("phone-number").value.trim();
    const storeEmail = document.getElementById("store-email").value.trim();
    const incidentTypeElement = document.getElementById("incident-type");
    const incidentType = incidentTypeElement.options[incidentTypeElement.selectedIndex].text;
    const systemTypeElement = document.getElementById("system-type");
    const systemType = systemTypeElement.options[systemTypeElement.selectedIndex].text;
    const observations = document.getElementById("observations").value.trim();

    // Verificar que los campos tengan contenido
    console.log("Valores del formulario:", { fullName, phoneNumber, storeEmail, incidentType, systemType, observations });

    // Validar campos requeridos
    if (!/^\d{9}$/.test(phoneNumber)) {
      alert("El número celular debe contener exactamente 9 dígitos.");
      return;
    }
    if (!fullName || !phoneNumber || !storeEmail || !incidentType || !systemType || !observations) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Mostrar overlay de carga
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <img src="loading.gif" alt="Cargando...">
        <p>Enviando información, por favor espera...</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);

    try {
      // Obtener usuario actual y extraer parte anterior al '@'
      const user = auth.currentUser;
      const emailName = user.email.split("@")[0];

      // Consultar usersMap para obtener campos extra
      const userDoc = await db.collection("usersMap").doc(emailName).get();

      // Inicializar las variables extras
      let calle = "";
      let coordenadas = "";
      let local = "";
      let localidad = "";
      let provincia = "";

      if (userDoc.exists) {
        const data = userDoc.data();
        // Asegúrate de que los nombres de los campos coincidan con los de tu base de datos
        calle = data.CALLE || "";
        coordenadas = data.COORDENADAS || "";
        local = data.LOCAL || "";
        localidad = data.LOCALIDAD || "";
        provincia = data.PROVINCIA || "";
      }

      // Guardar la incidencia en la colección "incidents"
      await db.collection("incidents").add({
        fullName,
        phoneNumber,
        storeEmail,
        incidentType,
        systemType,
        observations,
        photoURL,
        // Campos extraídos de usersMap
        calle,
        coordenadas,
        local,
        localidad,
        provincia,
        // Información complementaria
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        estado: "Pendiente",
        tecnico: "rcusi",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Preparar los parámetros para la función callable
      const params = {
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
      };

      console.log("Parámetros enviados a la Cloud Function:", JSON.stringify(params, null, 2));

      // Llamar a la función callable en Firebase Cloud Functions para enviar el correo
      const sendEmail = firebase.functions().httpsCallable("sendTicketEmail");
      sendEmail(params)
        .then((result) => {
          console.log("Respuesta de la Cloud Function:", result.data);
        })
        .catch((error) => {
          console.error("Error al enviar el correo desde la función:", error);
        });

      // Quitar overlay de carga
      document.body.removeChild(loadingOverlay);

      // Mostrar modal de éxito con botón deshabilitado inicialmente
      const successModal = document.createElement("div");
      successModal.style.position = "fixed";
      successModal.style.top = "0";
      successModal.style.left = "0";
      successModal.style.width = "100vw";
      successModal.style.height = "100vh";
      successModal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      successModal.style.display = "flex";
      successModal.style.flexDirection = "column";
      successModal.style.justifyContent = "center";
      successModal.style.alignItems = "center";
      successModal.style.zIndex = "1000";

      // El botón se inicializa inactivo (disabled) y con cursor "not-allowed"
      successModal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h2 style="color: #28a745;">¡Solicitud enviada correctamente!</h2>
          <button id="success-button" disabled 
                  style="margin-top: 20px; padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; background-color: #007BFF; color: white; cursor: not-allowed;">
            Aceptar
          </button>
        </div>
      `;

      document.body.appendChild(successModal);

      // Esperar 7 segundos y luego activar el botón
      setTimeout(() => {
        const successBtn = document.getElementById("success-button");
        successBtn.disabled = false;
        successBtn.style.cursor = "pointer";
      }, 7000);

      // Al hacer clic en "Aceptar", volver al menú
      document.getElementById("success-button").addEventListener("click", () => {
        window.location.href = "menu.html";
      });
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Error al enviar el formulario. Intenta nuevamente.");
      document.body.removeChild(loadingOverlay);
    }
  });

  // Botón para volver al menú
  backBtn.addEventListener("click", () => {
    window.location.href = "menu.html";
  });
});
