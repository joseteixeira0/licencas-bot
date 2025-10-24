// script.js

async function carregarLicencas() {
  try {
    const res = await fetch("http://localhost:3000/api/licencas");
    const data = await res.json();

    const tabela = document.getElementById("tabelaLicencas");
    tabela.innerHTML = "";

    data.forEach(l => {
      const tr = document.createElement("tr");
      const validadeTexto = l.validade ? new Date(l.validade).toLocaleDateString() : 'Vitalícia';
      const statusTexto = l.ativa ? (l.bloqueado ? '🔒 Bloqueada' : '✅ Ativa') : '❌ Inativa';

      tr.innerHTML = `
  <td>${l.cliente}</td>
  <td>${l.chave}</td>
  <td>${validadeTexto}</td>
  <td>${statusTexto}</td>
  <td>
    <button class="revogar" onclick="revogar('${l.id}')">Revogar</button>
    <button class="bloquear" onclick="toggleBloqueio('${l.id}')">${l.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
  </td>
`;

      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar licenças:", err);
    alert("Erro ao carregar licenças. Verifique se o servidor está rodando.");
  }
}

async function gerarLicenca() {
  const cliente = document.getElementById("cliente").value;
  const ilimitado = document.getElementById("tempoIlimitado").checked;
  const dias = ilimitado ? 0 : Number(document.getElementById("dias").value);

  if (!cliente) {
    alert("Digite o nome do cliente.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, dias })
    });

    const nova = await res.json();
    alert(`Chave gerada: ${nova.chave}`);
    carregarLicencas();
  } catch (err) {
    console.error("Erro ao gerar licença:", err);
    alert("Erro ao gerar licença.");
  }
}

async function revogar(id) {
  if (!confirm("Tem certeza que deseja revogar esta licença?")) return;

  try {
    await fetch(`http://localhost:3000/api/revogar/${id}`, { method: "POST" });
    carregarLicencas();
  } catch (err) {
    console.error("Erro ao revogar licença:", err);
    alert("Erro ao revogar licença.");
  }
}

async function toggleBloqueio(id) {
  const senha = prompt("Digite a senha de administrador para bloquear/desbloquear:");
  if (!senha) return;

  try {
    const res = await fetch(`http://localhost:3000/api/bloquear/${id}`, {
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
    alert("Erro ao alterar bloqueio.");
  }
}

// Desativa input de dias se tempo ilimitado estiver marcado
document.getElementById("tempoIlimitado").addEventListener("change", function() {
  document.getElementById("dias").disabled = this.checked;
});

document.getElementById("btnGerar").onclick = gerarLicenca;
document.getElementById("btnAtualizar").onclick = carregarLicencas;
window.onload = carregarLicencas;
