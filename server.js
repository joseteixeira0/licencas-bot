const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve HTML/JS

const DB_FILE = path.join(__dirname, "licencas.json");

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

// Criar nova licença
app.post("/api/criar", (req, res) => {
  const { cliente, dias, maxDevices } = req.body;
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
    validade: validade ? validade.toISOString() : null,
    ativa: true,
    bloqueado: false,
    criacao: new Date().toISOString(),
    devices: [],
    maxDevices: maxDevices || 1
  };

  licencas.push(nova);
  salvarLicencas(licencas);
  res.json(nova);
});

// Listar todas as licenças
app.get("/api/licencas", (req, res) => {
  res.json(carregarLicencas());
});

// Revogar licença
app.post("/api/revogar/:id", (req, res) => {
  const licencas = carregarLicencas();
  const lic = licencas.find(l => l.id === req.params.id);
  if (!lic) return res.status(404).json({ erro: "Licença não encontrada" });

  lic.ativa = false;
  salvarLicencas(licencas);
  res.json({ sucesso: true });
});

// Bloquear / desbloquear licença
app.post("/api/bloquear/:id", (req, res) => {
  const { senha } = req.body;
  const MASTER_SENHA = "123456";
  if (senha !== MASTER_SENHA) return res.status(403).json({ erro: "Senha incorreta" });

  const licencas = carregarLicencas();
  const lic = licencas.find(l => l.id === req.params.id);
  if (!lic) return res.status(404).json({ erro: "Licença não encontrada" });

  lic.bloqueado = !lic.bloqueado;
  salvarLicencas(licencas);
  res.json({ sucesso: true, bloqueado: lic.bloqueado });
});

// Excluir licença
app.delete("/api/excluir/:id", (req, res) => {
  const licencas = carregarLicencas();
  const index = licencas.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: "Licença não encontrada" });

  licencas.splice(index, 1);
  salvarLicencas(licencas);
  res.json({ sucesso: true });
});

// Porta dinâmica para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
