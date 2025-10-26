const API_URL = "https://licencas-bot.onrender.com/api"; // URL do servidor Render

// ==========================
// CARREGAR LICENÇAS
async function carregarLicencas() {
  try {
    const res = await fetch(`${API_URL}/licencas`);
    const data = await res.json();

    const tabela = document.getElementById("tabelaLicencas");
    tabela.innerHTML = "";

    data.forEach(l => {
      const validadeTexto = l.validade ? new Date(l.validade).toLocaleDateString() : 'Vitalícia';
      const statusTexto = l.ativa ? (l.bloqueado ? '🔒 Bloqueada' : '✅ Ativa') : '❌ Inativa';
      const usados = l.devices ? l.devices.length : 0;
      const limite = l.maxDevices || 1;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.cliente}</td>
        <td>${l.chave}</td>
        <td>${validadeTexto}</td>
        <td>${statusTexto}</td>
        <td>${usados}/${limite}</td>
        <td>
          <button class="revogar" onclick="revogar('${l.id}')">Revogar</button>
          <button class="bloquear" onclick="toggleBloqueio('${l.id}')">${l.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
          <button class="excluir" onclick="excluir('${l.id}')">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar licenças:", err);
    alert("Erro ao carregar licenças. Verifique se o servidor está online.");
  }
}

// ==========================
// GERAR NOVA LICENÇA
async function gerarLicenca() {
  const cliente = document.getElementById("cliente").value;
  const ilimitado = document.getElementById("tempoIlimitado").checked;
  const dias = ilimitado ? 0 : Number(document.getElementById("dias").value);
  const maxDevices = Number(document.getElementById("limite").value) || 1;

  if (!cliente) {
    alert("Digite o nome do cliente.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/criar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, dias, maxDevices })
    });

    const nova = await res.json();
    alert(`Chave gerada: ${nova.chave}\nLimite de dispositivos: ${maxDevices}`);
    carregarLicencas();
  } catch (err) {
    console.error("Erro ao gerar licença:", err);
    alert("Erro ao gerar licença. Verifique se o servidor está online.");
  }
}

// ==========================
// REVOGAR LICENÇA
async function revogar(id) {
  if (!confirm("Tem certeza que deseja revogar esta licença?")) return;

  try {
    await fetch(`${API_URL}/revogar/${id}`, { method: "POST" });
    carregarLicencas();
  } catch (err) {
    console.error("Erro ao revogar licença:", err);
    alert("Erro ao revogar licença. Verifique se o servidor está online.");
  }
}

// ==========================
// BLOQUEAR / DESBLOQUEAR LICENÇA
async function toggleBloqueio(id) {
  const senha = prompt("Digite a senha de administrador para bloquear/desbloquear:");
  if (!senha) return;

  try {
    const res = await fetch(`${API_URL}/bloquear/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha })
    });

    const json = await res.json();
    if (json.erro) {
      alert(json.erro);
    } else {
      alert(json.bloqueado ? "Usuário bloqueado" : "Usuário desbloqueado");
    }

    carregarLicencas();
  } catch (err) {
    console.error("Erro ao alterar bloqueio:", err);
    alert("Erro ao alterar bloqueio. Verifique se o servidor está online.");
  }
}

// ==========================
// EXCLUIR LICENÇA
async function excluir(id) {
  if (!confirm("Tem certeza que deseja excluir esta licença permanentemente?")) return;

  try {
    await fetch(`${API_URL}/excluir/${id}`, { method: "DELETE" });
    carregarLicencas();
  } catch (err) {
    console.error("Erro ao excluir licença:", err);
    alert("Erro ao excluir licença. Verifique se o servidor está online.");
  }
}

// ==========================
// DESATIVA INPUT DE DIAS SE TEMPO ILIMITADO ESTIVER MARCADO
document.getElementById("tempoIlimitado").addEventListener("change", function() {
  document.getElementById("dias").disabled = this.checked;
});

// ==========================
// EVENTOS DE BOTÃO
document.getElementById("btnGerar").onclick = gerarLicenca;
document.getElementById("btnAtualizar").onclick = carregarLicencas;

// ==========================
// CARREGAR LICENÇAS AO ABRIR PÁGINA
window.onload = carregarLicencas;
