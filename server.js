const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, "licencas.json");

// ==========================
// Funções auxiliares
function carregarLicencas() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}

function salvarLicencas(licencas) {
  fs.writeFileSync(DB_FILE, JSON.stringify(licencas, null, 2));
}

// ==========================
// Criar nova licença
app.post("/api/criar", (req, res) => {
  const { cliente, dias } = req.body;
  const licencas = carregarLicencas();

  const chave = crypto.randomBytes(8).toString("hex").toUpperCase();

  let validade = null;
  if (dias && dias > 0) {
    validade = new Date();
    validade.setDate(validade.getDate() + dias);
  }

  const nova = {
    id: crypto.randomUUID(),
    cliente,
    chave,
    validade: validade ? validade.toISOString() : null, // null = vitalícia
    ativa: true,
    bloqueado: false,
    criacao: new Date().toISOString(),
    ativacoes: []
  };

  licencas.push(nova);
  salvarLicencas(licencas);
  res.json(nova);
});

// ==========================
// Listar todas as licenças
app.get("/api/licencas", (req, res) => {
  const licencas = carregarLicencas();
  res.json(licencas);
});

// ==========================
// Buscar licença por chave
app.get("/api/licencas/:chave", (req, res) => {
  const chave = req.params.chave.toUpperCase(); // maiúscula
  const licencas = carregarLicencas();
  const lic = licencas.find(l => l.chave.toUpperCase() === chave);

  if (!lic) return res.status(404).json({ erro: "Licença não encontrada" });

  res.json(lic);
});


// ==========================
// Bloquear/Desbloquear licença
app.post("/api/bloquear/:id", (req, res) => {
  const { senha } = req.body;
  const MASTER_SENHA = "123456"; // Defina uma senha forte
  if (senha !== MASTER_SENHA) return res.status(403).json({ erro: "Senha incorreta" });

  const licencas = carregarLicencas();
  const lic = licencas.find(l => l.id === req.params.id);
  if (!lic) return res.status(404).json({ erro: "Licença não encontrada" });

  lic.bloqueado = !lic.bloqueado;
  salvarLicencas(licencas);
  res.json({ sucesso: true, bloqueado: lic.bloqueado });
});

// ==========================
// Revogar licença
app.post("/api/revogar/:id", (req, res) => {
  const licencas = carregarLicencas();
  const lic = licencas.find(l => l.id === req.params.id);
  if (!lic) return res.status(404).json({ erro: "Licença não encontrada" });

  lic.ativa = false;
  salvarLicencas(licencas);
  res.json({ sucesso: true });
});

// ==========================
app.listen(3000, () =>
  console.log("Servidor de licenças rodando em http://localhost:3000")
);
