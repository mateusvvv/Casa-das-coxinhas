let carrinho = [];
let quantidades = {};
let taxasPorBairro = {
  "Santo Antônio": 5.00,
  "São Pedro": 7.00,
  "Centro": 6.00,
  "Cohab 1": 8.00,
  "Viana e Moura da br": 8.00,
  "Viana e Moura da faculdade": 12.00,
  "Vila bela": 15.00,
  "Planalto": 10.00,
  "Cavalo morto até a primeira igreja": 8.00,
  "Cavalo morto depois da primeira igreja": 12.00,
  "Maria Cristina": 10.00,
  "Tereza Mendonça": 12.00,
  "Vila da barragem": 15.00,
  "Batinga": 7.00
};
let bairroSelecionado = "";
let modoEntrega = "entrega";
let refriTemp = { tamanho: "", preco: 0 };
let formaPagamento = "";

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function abrirModalRefrigerante(tamanho, preco) {
  refriTemp = { tamanho, preco };
  document.getElementById("modal-refrigerante").classList.add("active");
  document.getElementById("sabor-refri").value = "";
}

function fecharModalRefrigerante() {
  document.getElementById("modal-refrigerante").classList.remove("active");
  document.getElementById("sabor-refri").value = "";
}

function confirmarRefrigerante() {
  const sabor = document.getElementById("sabor-refri").value;

  if (!sabor) {
    alert("Por favor, selecione um sabor!");
    return;
  }

  const descricao = `Refrigerante ${refriTemp.tamanho} - ${sabor}`;
  const qtd = refriTemp.tamanho === "1L" ? (quantidades["refri-1l"] || 1) : (quantidades["refri-lata"] || 1);

  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome: descricao, preco: refriTemp.preco });
  }

  if (refriTemp.tamanho === "1L") {
    quantidades["refri-1l"] = 1;
    document.getElementById("qtd-refri-1l").innerText = 1;
  } else {
    quantidades["refri-lata"] = 1;
    document.getElementById("qtd-refri-lata").innerText = 1;
  }

  fecharModalRefrigerante();
  render();
}

function abrirModalPastel() {
  document.getElementById("modal-pastel").classList.add("active");
}

function fecharModalPastel() {
  document.getElementById("modal-pastel").classList.remove("active");
  document.getElementById("sabor1").value = "";
  document.getElementById("sabor2").value = "";
  document.getElementById("complementos").value = "Completo";
}

function confirmarPastel() {
  const sabor1 = document.getElementById("sabor1").value;
  const sabor2 = document.getElementById("sabor2").value;
  const complementos = document.getElementById("complementos").value;

  if (!sabor1 || !sabor2) {
    alert("Por favor, selecione os dois sabores!");
    return;
  }

  if (sabor1 === sabor2) {
    alert("Os sabores não podem ser iguais!");
    return;
  }

  const descricao = `Pastel c/ ${sabor1} e ${sabor2} (${complementos})`;
  const qtd = quantidades.pastel || 1;

  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome: descricao, preco: 9.00 });
  }

  quantidades.pastel = 1;
  document.getElementById("qtd-pastel").innerText = 1;
  fecharModalPastel();
  render();
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("modal-refrigerante").addEventListener("click", function(e) {
    if (e.target === this) {
      fecharModalRefrigerante();
    }
  });

  document.getElementById("modal-pastel").addEventListener("click", function(e) {
    if (e.target === this) {
      fecharModalPastel();
    }
  });
});

function alterarQtd(id, valor) {
  quantidades[id] = (quantidades[id] || 1) + valor;
  if (quantidades[id] < 1) {
    quantidades[id] = 1;
  }
  document.getElementById(`qtd-${id}`).innerText = quantidades[id];
}

function add(nome, preco, id) {
  const qtd = quantidades[id] || 1;
  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome, preco });
  }
  quantidades[id] = 1;
  document.getElementById(`qtd-${id}`).innerText = 1;
  render();
}

function atualizarEstadoFinalizar() {
  const numeroCasa = document.getElementById("numero-casa");
  const botaoFinalizar = document.getElementById("btn-finalizar");
  const numeroPreenchido = numeroCasa ? numeroCasa.value.trim() !== "" : false;

  const enderecoValido = modoEntrega === "retirada" || (modoEntrega === "entrega" && bairroSelecionado && numeroPreenchido);
  botaoFinalizar.disabled = carrinho.length === 0 || !enderecoValido || !formaPagamento;
}

function atualizarModoEntrega() {
  modoEntrega = document.getElementById("modo-entrega").value;
  const bairroSection = document.getElementById("bairro-section");
  const numeroCasaSection = document.getElementById("numero-casa-section");
  const pontoReferenciaSection = document.getElementById("ponto-referencia-section");
  const retiradaInfoSection = document.getElementById("retirada-info");

  if (modoEntrega === "retirada") {
    bairroSelecionado = "";
    document.getElementById("bairro-select").value = "";
    bairroSection.hidden = true;
    numeroCasaSection.hidden = true;
    pontoReferenciaSection.hidden = true;
    retiradaInfoSection.hidden = false;
  } else {
    bairroSection.hidden = false;
    numeroCasaSection.hidden = false;
    pontoReferenciaSection.hidden = false;
    retiradaInfoSection.hidden = true;
  }
  render();
  atualizarEstadoFinalizar();
}

function atualizarFormaPagamento() {
  formaPagamento = document.getElementById("forma-pagamento").value;
  atualizarEstadoFinalizar();
}

function obterFormaPagamentoTexto() {
  const formasPagamento = {
    pix: "PIX",
    debito: "Cartão de Débito",
    credito: "Cartão de Crédito",
    especie: "Dinheiro em Espécie"
  };

  return formasPagamento[formaPagamento] || "";
}

function render() {
  let container = document.getElementById("carrinho-itens");
  let resumo = document.getElementById("carrinho-resumo");

  if (carrinho.length === 0) {
    container.innerHTML = '<div class="carrinho-vazio">Nenhum item adicionado</div>';
    resumo.hidden = true;
    atualizarEstadoFinalizar();
    return;
  }

  container.innerHTML = "";
  let subtotal = 0;

  let itensAgrupados = {};
  carrinho.forEach((item) => {
    if (!itensAgrupados[item.nome]) {
      itensAgrupados[item.nome] = { preco: item.preco, quantidade: 0 };
    }
    itensAgrupados[item.nome].quantidade++;
    subtotal += item.preco;
  });

  Object.keys(itensAgrupados).forEach((nome) => {
    let item = itensAgrupados[nome];
    let div = document.createElement("div");
    div.className = "item-carrinho";
    div.innerHTML = `
      <div class="item-carrinho-info">
        <div class="item-carrinho-nome">${nome}</div>
        <div class="item-carrinho-qty">Qtd: ${item.quantidade}</div>
        <div class="item-carrinho-preco">${formatarMoeda(item.preco * item.quantidade)}</div>
      </div>
      <button class="item-remover" onclick="removerItem('${nome}')">−</button>
    `;
    container.appendChild(div);
  });

  let taxa = modoEntrega === "retirada" ? 0 : (bairroSelecionado ? taxasPorBairro[bairroSelecionado] : 0);
  let total = subtotal + taxa;
  document.getElementById("subtotal").innerText = formatarMoeda(subtotal);
  document.getElementById("taxa").innerText = formatarMoeda(taxa);
  document.getElementById("total").innerText = formatarMoeda(total);
  resumo.hidden = false;
  atualizarEstadoFinalizar();
}

function removerItem(nome) {
  carrinho = carrinho.filter((item) => item.nome !== nome);
  render();
}

function atualizarTaxa() {
  bairroSelecionado = document.getElementById("bairro-select").value;
  render();
}

function finalizar() {
  if (carrinho.length === 0) {
    return;
  }

  if (modoEntrega === "entrega" && !bairroSelecionado) {
    alert("Por favor, selecione seu bairro!");
    return;
  }

  if (!formaPagamento) {
    alert("Por favor, selecione a forma de pagamento!");
    return;
  }

  const numeroCasa = document.getElementById("numero-casa").value.trim();
  const pontoReferencia = document.getElementById("ponto-referencia").value.trim();

  if (modoEntrega === "entrega" && !numeroCasa) {
    alert("Por favor, informe o número da casa!");
    return;
  }

  let subtotal = carrinho.reduce((sum, item) => sum + item.preco, 0);
  let taxa = modoEntrega === "retirada" ? 0 : taxasPorBairro[bairroSelecionado];
  let total = subtotal + taxa;

  let itensAgrupados = {};
  carrinho.forEach((item) => {
    if (!itensAgrupados[item.nome]) {
      itensAgrupados[item.nome] = { preco: item.preco, quantidade: 0 };
    }
    itensAgrupados[item.nome].quantidade++;
  });

  let msg = "*PEDIDO - CASA DAS COXINHAS*\n\n";

  msg += "*ITENS DO PEDIDO:*\n";
  Object.keys(itensAgrupados).forEach((nome) => {
    let item = itensAgrupados[nome];
    msg += `${nome} (x${item.quantidade}) - ${formatarMoeda(item.preco * item.quantidade)}\n`;
  });

  msg += "\n*RESUMO DO PEDIDO:*\n";
  msg += `Subtotal: ${formatarMoeda(subtotal)}\n`;
  msg += `Taxa de Entrega: ${formatarMoeda(taxa)}\n`;
  msg += `TOTAL: ${formatarMoeda(total)}\n\n`;

  msg += "*FORMA DE PAGAMENTO ESCOLHIDA:*\n";
  msg += `${obterFormaPagamentoTexto()}\n`;
  if (formaPagamento === "pix") {
    msg += "Chave PIX: 81982116454\n";
    msg += "Titular: Edmilson José da Silva\n";
  } else if (formaPagamento === "credito") {
    msg += "Obs: No cartão de crédito há acréscimo da maquineta\n";
  } else if (formaPagamento === "debito") {
    msg += "Obs: No cartão de débito, o entregador irá levar a maquineta\n";
  }
  msg += "\n";

  if (modoEntrega === "retirada") {
    msg += "*RETIRADA NO ESTABELECIMENTO:*\n";
    msg += "Endereço: Cohab 3, Rua 5, nº 28\n";
    msg += "Link: https://maps.app.goo.gl/fyMBq6BQkoCWQYBM7\n";
    msg += "Obs: Informe o horário desejado no WhatsApp.\n\n";
  } else {
    msg += "*ENDERECO DE ENTREGA:*\n";
    msg += `Bairro: ${bairroSelecionado}\n`;
    msg += `Numero: ${numeroCasa}\n`;
    if (pontoReferencia) {
      msg += `Referencia: ${pontoReferencia}\n`;
    }
    msg += "Obs: Envie localizacao em tempo real para facilitar a entrega\n\n";
  }

  msg += "═══════════════════════════════════════\n";
  msg += "*AVISO IMPORTANTE - LEIA COM ATENÇÃO*\n";
  msg += "═══════════════════════════════════════\n\n";
  if (formaPagamento === "pix") {
    msg += "O PEDIDO SERÁ CONFIRMADO APÓS O ENVIO DO COMPROVANTE\n\n";
  } else if (formaPagamento === "credito" || formaPagamento === "debito") {
    msg += "O entregador irá levar a maquineta\n\n";
  }
  msg += "═══════════════════════════════════════\n\n";
  msg += "Obrigado por escolher a Casa da Coxinha!";

  window.open("https://wa.me/5581982116454?text=" + encodeURIComponent(msg));
}
