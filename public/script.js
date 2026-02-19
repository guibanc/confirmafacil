/* ======================
   MESSAGE SYSTEM
====================== */
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);

  el.innerText = text;
  el.className = "message " + type;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

/* ======================
   LOGIN
====================== */
async function login() {

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showMessage("loginMessage", "Preencha email e senha", "error");
    return;
  }

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.error) {
    showMessage("loginMessage", data.error, "error");
    return;
  }

  showMessage("loginMessage", "Login realizado com sucesso!", "success");

  setTimeout(() => {
    window.location.href = "/dashboard";
  }, 800);
}

/* ======================
   REGISTER
====================== */
async function register() {

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  if (!name || !email || !password) {
    showMessage("registerMessage", "Preencha todos os campos", "error");
    return;
  }

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();

  if (data.error) {
    showMessage("registerMessage", data.error, "error");
    return;
  }

  showMessage("registerMessage", "Conta criada com sucesso!", "success");

  setTimeout(() => {
    window.location.href = "/dashboard";
  }, 800);
}
