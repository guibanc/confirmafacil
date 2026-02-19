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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }
}));

/* ========================
   SERVIR INDEX
======================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard.html", (req, res) => {
  return res.redirect("/dashboard");
});

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

  const existingUser = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (existingUser)
    return res.status(400).json({ error: "Email já cadastrado" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = db
    .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
    .run(name, email, hashedPassword);

  req.session.user = {
    id: result.lastInsertRowid,
    name,
    email
  };

  res.json({ success: true });
});

/* ========================
   LOGIN
======================== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

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

  try {
    const result = db
      .prepare("INSERT INTO events (name, slug, user_id) VALUES (?, ?, ?)")
      .run(name, slug, user_id);

    res.json({
      id: result.lastInsertRowid,
      link: `${req.protocol}://${req.get("host")}/evento/${slug}`
    });
  } catch (err) {
    return res.status(400).json({ error: "Slug já existe" });
  }
});

/* ========================
   LISTAR EVENTOS
======================== */
app.get("/events", authMiddleware, (req, res) => {
  const user_id = req.session.user.id;

  const rows = db.prepare(`
    SELECT e.*,
    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as total_confirmados
    FROM events e
    WHERE user_id = ?
  `).all(user_id);

  res.json(rows);
});

/* ========================
   LISTAR CONVIDADOS
======================== */
app.get("/guests/:event_id", authMiddleware, (req, res) => {
  const rows = db
    .prepare("SELECT name, email FROM guests WHERE event_id = ?")
    .all(req.params.event_id);

  res.json(rows);
});

/* ========================
   API EVENTO
======================== */
app.get("/api/event/:slug", (req, res) => {
  const event = db.prepare(`
    SELECT e.*,
    (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as total_confirmados
    FROM events e
    WHERE slug = ?
  `).get(req.params.slug);

  if (!event)
    return res.status(404).json({ error: "Evento não encontrado" });

  res.json(event);
});

/* ========================
   CONFIRMAR PRESENÇA
======================== */
app.post("/confirm/:slug", (req, res) => {
  const { name, email } = req.body;
  const { slug } = req.params;

  if (!name || !email)
    return res.status(400).json({ error: "Dados incompletos" });

  const event = db
    .prepare("SELECT * FROM events WHERE slug = ?")
    .get(slug);

  if (!event)
    return res.status(404).json({ error: "Evento não encontrado" });

  db.prepare(
    "INSERT INTO guests (name, email, event_id) VALUES (?, ?, ?)"
  ).run(name, email, event.id);

  res.json({ success: true });
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
   PORTA DINÂMICA
======================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
