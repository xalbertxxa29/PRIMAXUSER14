document.addEventListener("DOMContentLoaded", async () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const recordsContainer = document.getElementById("records-container");
    const loadingMessage = document.getElementById("loading-message");
    const backBtn = document.getElementById("back-btn");
  
    // Verificar autenticación
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }
  
      // Obtener el correo y extraer la parte anterior a la arroba
      const userEmail = user.email.trim().toLowerCase();
      const username = userEmail.split("@")[0]; // ejemplo: 'jsolis'
  
      try {
        // 1. Obtener el documento de 'usersMap' que corresponda al usuario
        const userDoc = await db.collection("usersMap").doc(username).get();
  
        // 2. Obtener el campo LOCAL (por ejemplo, '2311 - PRUEBA LIDERMAN')
        let localValue = "";
        if (userDoc.exists && userDoc.data().LOCAL) {
          localValue = userDoc.data().LOCAL;
        } else {
          // Si no se encuentra LOCAL, mostrar error o usar un valor por defecto
          recordsContainer.innerHTML = "<p>No se encontró el campo LOCAL en usersMap.</p>";
          return;
        }
  
        // 3. Consultar la colección 'incidents' buscando estado "Pendiente" y local == localValue
        const snapshot = await db.collection("incidents")
          .where("estado", "==", "Pendiente")
          .where("local", "==", localValue)
          .get();
  
        console.log(`Registros pendientes encontrados: ${snapshot.size}`);
  
        // Ocultar el mensaje de carga
        loadingMessage.style.display = "none";
  
        // 4. Mostrar los registros, si existen
        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            const data = doc.data();
  
            // Crear un elemento para cada registro
            const record = document.createElement("div");
            record.className = "record-item";
            record.innerHTML = `
              <div>
                <p><strong>Local:</strong> ${localValue}</p>
                <p><strong>Fecha:</strong> ${data.date}</p>
                <p><strong>Hora:</strong> ${data.time}</p>
                <p><strong>Incidencia:</strong> ${data.incidentType}</p>
                <p><strong>Sistema:</strong> ${data.systemType}</p>
              </div>
              <img src="${data.photoURL}" alt="Fotografía">
            `;
            recordsContainer.appendChild(record);
          });
        } else {
          recordsContainer.innerHTML = "<p>No tienes registros pendientes.</p>";
        }
      } catch (error) {
        console.error("Error al cargar los registros:", error);
        recordsContainer.innerHTML = "<p>Error al cargar los registros. Intenta nuevamente.</p>";
      }
    });
  
    // Botón para regresar al menú
    backBtn.addEventListener("click", () => {
      window.location.href = "menu.html";
    });
  });
  

