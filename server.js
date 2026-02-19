const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const db = require("./database");
const path = require("path");

const app = express();

/* ========================
   MIDDLEWARES
======================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "confirmafacil-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // seguro em produção
    sameSite: "lax"
  }
}));

/* ========================
   SERVIR INDEX
======================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* Bloqueia acesso direto ao dashboard.html */
app.get("/dashboard.html", (req, res) => {
  return res.redirect("/dashboard");
});

/* Arquivos estáticos */
app.use(express.static("public", { index: false }));

/* ========================
   AUTH MIDDLEWARE
======================== */
function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

/* ========================
   REGISTER
======================== */
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Preencha todos os campos" });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (user)
      return res.status(400).json({ error: "Email já cadastrado" });

    db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err)
          return res.status(500).json({ error: "Erro ao cadastrar" });

        req.session.user = {
          id: this.lastID,
          name,
          email
        };

        res.json({ success: true });
      }
    );
  });
});

/* ========================
   LOGIN
======================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user)
      return res.status(401).json({ error: "Usuário não encontrado" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: "Senha incorreta" });

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.json({ success: true });
  });
});

/* ========================
   LOGOUT
======================== */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/* ========================
   CRIAR EVENTO
======================== */
app.post("/events", authMiddleware, (req, res) => {
  const { name, slug } = req.body;
  const user_id = req.session.user.id;

  if (!name || !slug)
    return res.status(400).json({ error: "Dados incompletos" });

  db.run(
    "INSERT INTO events (name, slug, user_id) VALUES (?, ?, ?)",
    [name, slug, user_id],
    function (err) {
      if (err)
        return res.status(400).json({ error: "Slug já existe" });

      res.json({
        id: this.lastID,
        link: `${req.protocol}://${req.get("host")}/evento/${slug}`
      });
    }
  );
});

/* ========================
   LISTAR EVENTOS
======================== */
app.get("/events", authMiddleware, (req, res) => {
  const user_id = req.session.user.id;

  db.all(`
    SELECT e.*,
    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as total_confirmados
    FROM events e
    WHERE user_id = ?
  `, [user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar eventos" });
    res.json(rows);
  });
});

/* ========================
   LISTAR CONVIDADOS
======================== */
app.get("/guests/:event_id", authMiddleware, (req, res) => {
  db.all(
    "SELECT name, email FROM guests WHERE event_id = ?",
    [req.params.event_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar convidados" });
      res.json(rows);
    }
  );
});

/* ========================
   API EVENTO
======================== */
app.get("/api/event/:slug", (req, res) => {
  db.get(`
    SELECT e.*,
    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as total_confirmados
    FROM events e
    WHERE slug = ?
  `, [req.params.slug], (err, event) => {
    if (!event) return res.status(404).json({ error: "Evento não encontrado" });
    res.json(event);
  });
});

/* ========================
   CONFIRMAR PRESENÇA
======================== */
app.post("/confirm/:slug", (req, res) => {
  const { name, email } = req.body;
  const { slug } = req.params;

  if (!name || !email)
    return res.status(400).json({ error: "Dados incompletos" });

  db.get("SELECT * FROM events WHERE slug = ?", [slug], (err, event) => {
    if (!event)
      return res.status(404).json({ error: "Evento não encontrado" });

    db.run(
      "INSERT INTO guests (name, email, event_id) VALUES (?, ?, ?)",
      [name, email, event.id],
      function (err) {
        if (err)
          return res.status(500).json({ error: "Erro ao confirmar presença" });

        res.json({ success: true });
      }
    );
  });
});

/* ========================
   DASHBOARD PROTEGIDA
======================== */
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ========================
   SERVIR PÁGINA DO EVENTO
======================== */
app.get("/evento/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "event.html"));
});

/* ========================
   PORTA DINÂMICA (IMPORTANTE)
======================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
