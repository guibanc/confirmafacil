document
  .getElementById("createBtn")
  .addEventListener("click", createEvent);

async function createEvent() {
  const name = document.getElementById("eventName").value.trim();
  const slug = document.getElementById("eventSlug").value.trim();

  if (!name || !slug) return;

  const response = await fetch("/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name, slug })
  });

  if (response.status === 401) {
    window.location.href = "/";
    return;
  }

  const data = await response.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  document.getElementById("eventName").value = "";
  document.getElementById("eventSlug").value = "";

  loadEvents();
}

async function loadEvents() {
  const response = await fetch("/events", { credentials: "same-origin" });

  if (response.status === 401) {
    window.location.href = "/";
    return;
  }

  const events = await response.json();

  const list = document.getElementById("eventsList");
  list.innerHTML = "";

  if (!events.length) {
    list.innerHTML = "<p style='color:#666;'>Nenhum evento criado ainda.</p>";
    return;
  }

  events.forEach(event => {
    const eventLink = `${window.location.origin}/evento/${event.slug}`;

    list.innerHTML += `
      <div class="event-item" onclick="loadGuests(${event.id})">

        <strong>${event.name}</strong>

        <div style="font-size:0.9rem;color:#666;">
          Confirmados: ${event.total_confirmados}
        </div>

        <div style="margin-top:8px;font-size:0.85rem;word-break:break-all;">
          ${eventLink}
        </div>

        <div class="event-actions" onclick="event.stopPropagation();">
          <button onclick="copyLink('${eventLink}', this)" class="btn-small">
            Copiar
          </button>

          <button onclick="shareLink('${event.name}', '${eventLink}')" class="btn-small">
            Compartilhar
          </button>
        </div>

      </div>
    `;
  });
}

async function loadGuests(eventId) {
  const response = await fetch(`/guests/${eventId}`, { credentials: "same-origin" });

  if (response.status === 401) {
    window.location.href = "/";
    return;
  }

  const guests = await response.json();

  const section = document.getElementById("guestsSection");

  if (!guests.length) {
    section.innerHTML = "<p>Nenhum convidado ainda.</p>";
    return;
  }

  let table = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
  `;

  guests.forEach(g => {
    table += `
      <tr>
        <td>${g.name}</td>
        <td>${g.email}</td>
      </tr>
    `;
  });

  table += "</tbody></table>";

  section.innerHTML = table;
}

async function logout() {
  await fetch("/logout", { method: "POST", credentials: "same-origin" });
  window.location.href = "/";
}

function copyLink(link, button) {
  navigator.clipboard.writeText(link)
    .then(() => {
      const original = button.innerText;
      button.innerText = "Copiado ✓";
      setTimeout(() => { button.innerText = original; }, 2000);
    })
    .catch(() => { alert("Erro ao copiar."); });
}

function shareLink(title, link) {
  if (navigator.share) {
    navigator.share({ title, text: `Confirme presença no evento: ${title}`, url: link });
  } else {
    alert("Compartilhamento não suportado nesse navegador.");
  }
}

loadEvents();
