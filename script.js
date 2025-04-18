document.addEventListener("DOMContentLoaded", () => {
  // --- Splash Screen ---
  const splashScreen = document.getElementById("splash-screen");
  const splashVideo = document.getElementById("splash-video");

  // Si usas un video, cuando termine se oculta el splash:
  if (splashVideo) {
    splashVideo.addEventListener("ended", () => {
      // Agrega una transición para ocultarlo suavemente
      splashScreen.classList.add("fade-out");
      setTimeout(() => {
        splashScreen.style.display = "none";
      }, 500); // 500 ms (ajusta según prefieras)
    });
  } else {
    // En caso de no usar video, oculta el splash después de 3 segundos
    setTimeout(() => {
      splashScreen.classList.add("fade-out");
      setTimeout(() => {
        splashScreen.style.display = "none";
      }, 500);
    }, 3000);
  }

  // --- Funcionalidad de Login ---
  const loginBtn = document.getElementById("login-btn");
  const loader = document.getElementById("loader");
  const errorModal = document.getElementById("errorModal");
  const modalMessage = document.getElementById("modalMessage");
  const modalClose = document.getElementById("modalClose");
  const usernameInput = document.getElementById("username");
  const rememberCheckbox = document.getElementById("remember");

  // Prefiltrar el email si se guardó previamente
  const rememberedEmail = localStorage.getItem("rememberedEmail");
  if (rememberedEmail) {
    usernameInput.value = rememberedEmail;
    rememberCheckbox.checked = true;
  }

  // Redirigir a menu.html si el usuario ya está autenticado
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "menu.html";
    }
  });

  // Cerrar el modal al hacer clic en la X o fuera del contenido
  modalClose.addEventListener("click", closeModal);
  errorModal.addEventListener("click", (e) => {
    if (e.target === errorModal) {
      closeModal();
    }
  });

  // Manejar el envío del formulario de login
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const password = document.getElementById("password").value.trim();

    // Validación de campos obligatorios
    if (!email || !password) {
      showModal("Por favor, completa todos los campos.");
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    // Guardar o remover el email en localStorage según "Recordarme"
    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    loginBtn.disabled = true;
    loader.style.display = "block";

    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log(`Bienvenido ${userCredential.user.email}`);
      window.location.href = "menu.html";
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          showModal("⚠️ Usuario y contraseña incorrectos");
          break;
        case "auth/too-many-requests":
          showModal("⚠️ Demasiados intentos fallidos. Intenta más tarde.");
          break;
        default:
          showModal("⚠️ Error: " + error.message);
          break;
      }
    } finally {
      loginBtn.disabled = false;
      loader.style.display = "none";
    }
  });

  function showModal(message) {
    modalMessage.textContent = message;
    errorModal.style.display = "flex";

    // Reiniciar animación "shake" en el modal
    const modalContent = document.querySelector('.modal-content');
    modalContent.classList.remove('shake');
    void modalContent.offsetWidth;
    modalContent.classList.add('shake');

    modalClose.focus();
  }

  function closeModal() {
    errorModal.style.display = "none";
    loginBtn.focus();
  }

  // --- Toggle para mostrar/ocultar la contraseña ---
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  togglePasswordBtn.addEventListener("click", () => {
    // Si el tipo es password, cámbialo a text y viceversa
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordBtn.textContent = "🙈"; // Cambiar el icono (ej. ojo cerrado)
    } else {
      passwordInput.type = "password";
      togglePasswordBtn.textContent = "👁️"; // Icono original (ojo abierto)
    }
  });
});

