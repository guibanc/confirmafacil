const slug = window.location.pathname.split("/").pop();

async function loadEvent() {

  const response = await fetch(`/api/event/${slug}`);
  const event = await response.json();

  if (event.error) {
    document.body.innerHTML = "<h2>Evento não encontrado</h2>";
    return;
  }

  document.getElementById("eventName").innerText = event.name;
  document.getElementById("confirmedCount").innerText =
    "Confirmados: " + event.total_confirmados;
}

async function confirmPresence() {

  const name = document.getElementById("guestName").value.trim();
  const email = document.getElementById("guestEmail").value.trim();

  if (!name || !email) {
    alert("Preencha nome e email");
    return;
  }

  const response = await fetch(`/confirm/${slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });

  const data = await response.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  if (data.success) {
    document.getElementById("successMsg").style.display = "block";
    document.getElementById("guestName").value = "";
    document.getElementById("guestEmail").value = "";
    loadEvent();
  }
}

document
  .getElementById("confirmBtn")
  .addEventListener("click", confirmPresence);

loadEvent();
