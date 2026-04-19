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
let refriTemp = { tamanho: "", preco: 0, id: "" };
let formaPagamento = "";
let availabilityUnsubscribe = null;
let adminAutenticado = false;

const ADMIN_EMAIL = "edmilsonjosedasilva14@gmail.com";
const AVAILABILITY_STORAGE_KEY = "produtosAvailability";

const produtosRegulares = [
  { id: "coxinha-frango", nome: "Coxinha Frango", disponivel: true },
  { id: "coxinha-catupiry", nome: "Coxinha c/ Catupiry", disponivel: true },
  { id: "coxinha-cheddar", nome: "Coxinha c/ Cheddar", disponivel: true },
  { id: "coxinha-calabresa", nome: "Coxinha Frango c/ Calabresa", disponivel: true },
  { id: "coxinha-charque-catupiry", nome: "Coxinha Charque c/ Catupiry", disponivel: true },
  { id: "coxinha-charque", nome: "Coxinha de Charque", disponivel: true },
  { id: "coxinha-charque-queijo", nome: "Coxinha Charque c/ Queijo", disponivel: true },
  { id: "coxinha-frango-queijo", nome: "Coxinha Frango c/ Queijo", disponivel: true },
  { id: "bolinho-carne", nome: "Bolinho de Carne", disponivel: true },
  { id: "bolinho-pizza", nome: "Bolinho de Pizza", disponivel: true },
  { id: "enroladinho", nome: "Enroladinho", disponivel: true },
  { id: "pastel", nome: "Pastel c/ Dois Sabores", disponivel: true },
  { id: "x-burguer", nome: "X-Burguer", disponivel: true },
  { id: "hamburguer", nome: "Hamburguer", disponivel: true },
  { id: "x-tudo", nome: "X-Tudo", disponivel: true },
  { id: "cachorro-quente", nome: "Cachorro Quente", disponivel: true },
  { id: "refri-1l", nome: "Refrigerante 1L", disponivel: true },
  { id: "refri-lata", nome: "Refrigerante Lata", disponivel: true }
];

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterTodosProdutos() {
  return [
    ...produtosRegulares,
    ...produtosEventos.oleo,
    ...produtosEventos.forno
  ];
}

function encontrarProdutoPorId(id) {
  return obterTodosProdutos().find((produto) => produto.id === id);
}

function produtoEstaDisponivel(id) {
  const produto = encontrarProdutoPorId(id);
  return produto ? produto.disponivel : true;
}

function coletarAvailabilityData() {
  const data = {};

  obterTodosProdutos().forEach((produto) => {
    data[produto.id] = !!produto.disponivel;
  });

  return data;
}

function aplicarAvailabilityData(data) {
  if (!data) {
    data = coletarAvailabilityData();
  }

  produtosRegulares.forEach((produto) => {
    if (data[produto.id] !== undefined) {
      produto.disponivel = !!data[produto.id];
    }
  });

  produtosEventos.oleo.forEach((produto) => {
    if (data[produto.id] !== undefined) {
      produto.disponivel = !!data[produto.id];
      if (!produto.disponivel) {
        produto.selecionado = false;
      }
    }
  });

  produtosEventos.forno.forEach((produto) => {
    if (data[produto.id] !== undefined) {
      produto.disponivel = !!data[produto.id];
      if (!produto.disponivel) {
        produto.selecionado = false;
      }
    }
  });

  produtosEventos.salgadosSelecionadosOleo = produtosEventos.oleo.filter((item) => item.selecionado).length;
  produtosEventos.salgadosSelecionadosForno = produtosEventos.forno.filter((item) => item.selecionado).length;

  aplicarDisponibilidadeCardapioRegular();
  atualizarPaginaEventos();
  atualizarPainelAdminPage();
}

function abrirModalRefrigerante(tamanho, preco, id) {
  if (!produtoEstaDisponivel(id)) {
    alert("Este item está esgotado no momento.");
    return;
  }

  refriTemp = { tamanho, preco, id };
  document.getElementById("modal-refrigerante").classList.add("active");
  
  // Lógica para retirar Fanta de 1L
  const selectSabor = document.getElementById("sabor-refri");
  const fantaOption = selectSabor.querySelector('option[value="Fanta"]');
  if (tamanho === "1L" && fantaOption) {
    fantaOption.style.display = "none";
  } else if (fantaOption) {
    fantaOption.style.display = "block";
  }

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

  if (!produtoEstaDisponivel(refriTemp.id)) {
    alert("Este item está esgotado no momento.");
    fecharModalRefrigerante();
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
  if (!produtoEstaDisponivel("pastel")) {
    alert("Este item está esgotado no momento.");
    return;
  }

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

  if (!produtoEstaDisponivel("pastel")) {
    alert("Este item está esgotado no momento.");
    fecharModalPastel();
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

function abrirModalCachorro() {
  if (!produtoEstaDisponivel("cachorro-quente")) {
    alert("Este item está esgotado no momento.");
    return;
  }
  document.getElementById("modal-cachorro").classList.add("active");
}

function fecharModalCachorro() {
  document.getElementById("modal-cachorro").classList.remove("active");
  document.getElementById("dog-base-select").value = "Completo";
  document.getElementById("dog-obs").value = "";
}

function confirmarCachorro() {
  if (!produtoEstaDisponivel("cachorro-quente")) {
    alert("Este item está esgotado no momento.");
    fecharModalCachorro();
    return;
  }

  const base = document.getElementById("dog-base-select").value;
  const obs = document.getElementById("dog-obs").value.trim();
  
  const detalhes = obs ? `${base} - Obs: ${obs}` : base;
  const descricao = `Cachorro Quente (${detalhes})`;

  const qtd = quantidades["cachorro-quente"] || 1;
  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome: descricao, preco: 8.00 });
  }

  quantidades["cachorro-quente"] = 1;
  document.getElementById("qtd-cachorro-quente").innerText = 1;
  fecharModalCachorro();
  render();
}

document.addEventListener("DOMContentLoaded", function() {
  const modalRefrigerante = document.getElementById("modal-refrigerante");
  const modalPastel = document.getElementById("modal-pastel");

  if (modalRefrigerante) {
    modalRefrigerante.addEventListener("click", function(e) {
      if (e.target === this) {
        fecharModalRefrigerante();
      }
    });
  }

  if (modalPastel) {
    modalPastel.addEventListener("click", function(e) {
      if (e.target === this) {
        fecharModalPastel();
      }
    });
  }

  const modalCachorro = document.getElementById("modal-cachorro");
  if (modalCachorro) {
    modalCachorro.addEventListener("click", function(e) {
      if (e.target === this) {
        fecharModalCachorro();
      }
    });
  }

  const modalRetirada = document.getElementById("modal-retirada");
  if (modalRetirada) {
    modalRetirada.addEventListener("click", function(e) {
      if (e.target === this) {
        fecharModalRetirada();
      }
    });
  }
});

function alterarQtd(id, valor) {
  if (!produtoEstaDisponivel(id)) {
    return;
  }

  quantidades[id] = (quantidades[id] || 1) + valor;
  if (quantidades[id] < 1) {
    quantidades[id] = 1;
  }
  const contador = document.getElementById(`qtd-${id}`);
  if (contador) {
    contador.innerText = quantidades[id];
  }
}

function add(nome, preco, id) {
  if (!produtoEstaDisponivel(id)) {
    alert("Este item está esgotado no momento.");
    return;
  }

  const qtd = quantidades[id] || 1;
  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome, preco });
  }
  quantidades[id] = 1;
  const contador = document.getElementById(`qtd-${id}`);
  if (contador) {
    contador.innerText = 1;
  }
  render();
}

function atualizarEstadoFinalizar() {
  const numeroCasa = document.getElementById("numero-casa");
  const botaoFinalizar = document.getElementById("btn-finalizar");
  if (!botaoFinalizar) {
    return;
  }
  const numeroPreenchido = numeroCasa ? numeroCasa.value.trim() !== "" : false;
  
  const diaRetirada = document.getElementById("retirada-dia")?.value;
  const horaRetirada = document.getElementById("retirada-horario")?.value;
  
  const retiradaValida = modoEntrega === "retirada" && diaRetirada && horaRetirada;
  const entregaValida = modoEntrega === "entrega" && bairroSelecionado && numeroPreenchido;

  botaoFinalizar.disabled = carrinho.length === 0 || !(retiradaValida || entregaValida) || !formaPagamento;
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
    abrirModalRetirada();
  } else {
    bairroSection.hidden = false;
    numeroCasaSection.hidden = false;
    pontoReferenciaSection.hidden = false;
    retiradaInfoSection.hidden = true;
  }
  render();
  atualizarEstadoFinalizar();
}

function abrirModalRetirada() {
  const modal = document.getElementById("modal-retirada");
  if (modal) modal.classList.add("active");
}

function fecharModalRetirada() {
  const modal = document.getElementById("modal-retirada");
  if (modal) modal.classList.remove("active");
}

function confirmarModalRetirada() {
  const dia = document.getElementById("retirada-dia").value.trim();
  const hora = document.getElementById("retirada-horario").value.trim();

  const status = document.getElementById("retirada-status");
  if (status) {
    if (dia && hora) {
      status.innerHTML = `<strong>Agendado para:</strong><br>${dia} às ${hora}`;
      status.style.color = "#FFB81C";
    } else {
      status.innerText = "Nenhum horário selecionado";
      status.style.color = "#cbd5e1";
    }
  }

  fecharModalRetirada();
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

function calcularResumoCarrinho() {
  const subtotal = carrinho.reduce((sum, item) => sum + item.preco, 0);
  const taxa = modoEntrega === "retirada" ? 0 : (bairroSelecionado ? taxasPorBairro[bairroSelecionado] : 0);

  return {
    subtotal,
    taxa,
    total: subtotal + taxa,
    quantidade: carrinho.length
  };
}

function criarAtalhoCarrinhoMobile() {
  if (!document.getElementById("mobile-cart-bar") && document.getElementById("carrinho")) {
    const bar = document.createElement("button");
    bar.id = "mobile-cart-bar";
    bar.className = "mobile-cart-bar";
    bar.type = "button";
    bar.onclick = irParaCarrinho;
    bar.innerHTML = `
      <span class="mobile-cart-info">
        <span class="mobile-cart-title">Carrinho</span>
        <span class="mobile-cart-meta" id="mobile-cart-meta">0 itens</span>
      </span>
      <span class="mobile-cart-total" id="mobile-cart-total">R$ 0,00</span>
    `;
    document.body.appendChild(bar);
  }
}

function atualizarAtalhoCarrinhoMobile() {
  const bar = document.getElementById("mobile-cart-bar");
  const meta = document.getElementById("mobile-cart-meta");
  const total = document.getElementById("mobile-cart-total");

  if (!bar || !meta || !total) {
    return;
  }

  const resumo = calcularResumoCarrinho();
  const temItens = resumo.quantidade > 0;

  meta.innerText = `${resumo.quantidade} ${resumo.quantidade === 1 ? "item" : "itens"}`;
  total.innerText = formatarMoeda(resumo.total);
  bar.classList.toggle("is-empty", !temItens);
}

function irParaCarrinho() {
  const carrinhoElemento = document.getElementById("carrinho");
  if (!carrinhoElemento) {
    return;
  }

  carrinhoElemento.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function render() {
  let container = document.getElementById("carrinho-itens");
  let resumo = document.getElementById("carrinho-resumo");
  if (!container || !resumo) {
    return;
  }

  if (carrinho.length === 0) {
    container.innerHTML = '<div class="carrinho-vazio">Nenhum item adicionado</div>';
    resumo.hidden = true;
    atualizarAtalhoCarrinhoMobile();
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
  atualizarAtalhoCarrinhoMobile();
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

function formatarItensParaWhatsApp(itensAgrupados) {
  let texto = "";
  Object.keys(itensAgrupados).forEach((nome) => {
    let item = itensAgrupados[nome];
    texto += `${nome} (x${item.quantidade}) - ${formatarMoeda(item.preco * item.quantidade)}\n`;
  });
  return texto;
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
  msg += formatarItensParaWhatsApp(itensAgrupados);

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
    msg += "Obs: No cartão de crédito tem acréscimo da maquineta\n";
  } else if (formaPagamento === "debito") {
    msg += "Obs: No cartão de débito, o entregador irá levar a maquineta\n";
  }
  msg += "\n";

  if (modoEntrega === "retirada") {
    const dia = document.getElementById("retirada-dia").value.trim();
    const hora = document.getElementById("retirada-horario").value.trim();

    msg += "*RETIRADA NO ESTABELECIMENTO:*\n";
    msg += `Data: ${dia}\n`;
    msg += `Horário: ${hora}\n`;
    msg += "Endereço: Cohab 3, Rua 5, nº 28\n";
    msg += "Link: https://maps.app.goo.gl/fyMBq6BQkoCWQYBM7\n";
    msg += "Obs: Sujeito a disponibilidade de agenda.\n\n";
  } else {
    msg += "*ENDEREÇO DE ENTREGA:*\n";
    msg += `Bairro: ${bairroSelecionado}\n`;
    msg += `Número: ${numeroCasa}\n`;
    if (pontoReferencia) {
      msg += `Referência: ${pontoReferencia}\n`;
    }
    msg += "Obs: Envie a localização em tempo atual para facilitar a entrega\n\n";
  }

  if (formaPagamento !== "especie") {
    msg += "══════════════\n";
    msg += "*AVISO IMPORTANTE*\n";
    msg += "══════════════\n\n";
    if (formaPagamento === "pix") {
      msg += " *NÃO PAGUE AGORA:* Se o seu pedido for para *RETIRADA* ou *EVENTO*, por favor, aguarde o nosso 'OK' aqui no WhatsApp antes de fazer o PIX. Precisamos validar se temos vaga disponível para a data e horário que você escolheu. Isso evita transtornos de pagamentos adiantados sem vaga na agenda.\n\n";
    } else if (formaPagamento === "credito" || formaPagamento === "debito") {
      msg += "O entregador irá levar a maquineta. Lembrando que pagamentos no cartão possuem acréscimo da taxa da maquineta.\n\n";
    }
  }
  window.open("https://wa.me/5581982116454?text=" + encodeURIComponent(msg));
}

// ========== NOVOS SISTEMAS ==========

// Dados de Eventos
const produtosEventos = {
  oleo: [
    { id: 'coxinha', nome: 'Coxinha', disponivel: true, selecionado: false },
    { id: 'risole', nome: 'Risole', disponivel: true, selecionado: false },
    { id: 'bolinho-carne-ev', nome: 'Bolinho de Carne', disponivel: true, selecionado: false },
    { id: 'bolinho-pizza-ev', nome: 'Bolinho de Pizza', disponivel: true, selecionado: false },
    { id: 'bolinha-queijo', nome: 'Bolinha de Queijo', disponivel: true, selecionado: false },
    { id: 'pastelzinho', nome: 'Pastelzinho', disponivel: true, selecionado: false },
    { id: 'enroladinho-ev', nome: 'Enroladinho', disponivel: true, selecionado: false },
    { id: 'pastel-pernambucano', nome: 'Pastel Pernambucano', disponivel: true, selecionado: false }
  ],
  forno: [
    { id: 'pastelzinho-forno', nome: 'Pastelzinho', disponivel: true, selecionado: false },
    { id: 'bolinha-queijo-forno', nome: 'Bolinha de Queijo', disponivel: true, selecionado: false },
    { id: 'tortilete', nome: 'Tortilete', disponivel: true, selecionado: false },
    { id: 'canudinho', nome: 'Canudinho', disponivel: true, selecionado: false },
    { id: 'empada', nome: 'Empada', disponivel: true, selecionado: false },
    { id: 'enroladinho-forno', nome: 'Enroladinho', disponivel: true, selecionado: false },
    { id: 'esfirra', nome: 'Esfirra', disponivel: true, selecionado: false }
  ],
  salgadosSelecionadosOleo: 0,
  salgadosSelecionadosForno: 0
};

function aplicarDisponibilidadeCardapioRegular() {
  const cards = document.querySelectorAll("[data-product-id]");

  cards.forEach((card) => {
    const id = card.dataset.productId;
    const disponivel = produtoEstaDisponivel(id);

    card.classList.toggle("indisponivel", !disponivel);

    const botoesQuantidade = card.querySelectorAll(".quantidade-selector button");
    botoesQuantidade.forEach((botao) => {
      botao.disabled = !disponivel;
    });

    const botaoAdicionar = card.querySelector("button.adicionar");
    if (botaoAdicionar) {
      botaoAdicionar.disabled = !disponivel;
      botaoAdicionar.textContent = disponivel ? "Adicionar ao Carrinho" : "Item Esgotado";
    }
  });
}

function atualizarPainelAdminPage() {
  const painelCardapio = document.getElementById("painel-cardapio-regular");
  const painelOleo = document.getElementById("painel-eventos-oleo");
  const painelForno = document.getElementById("painel-eventos-forno");

  if (!painelCardapio || !painelOleo || !painelForno) {
    return;
  }

  painelCardapio.innerHTML = produtosRegulares.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}">${produto.nome}</label>
    </div>
  `).join("");

  painelOleo.innerHTML = produtosEventos.oleo.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}">${produto.nome}</label>
    </div>
  `).join("");

  painelForno.innerHTML = produtosEventos.forno.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}">${produto.nome}</label>
    </div>
  `).join("");
}

async function carregarAvailability() {
  if (window.firebaseService) {
    try {
      const data = await window.firebaseService.loadAvailability();
      aplicarAvailabilityData(data || coletarAvailabilityData());

      if (!availabilityUnsubscribe) {
        availabilityUnsubscribe = await window.firebaseService.subscribeAvailability((snapshotData) => {
          aplicarAvailabilityData(snapshotData || coletarAvailabilityData());
        });
      }
      return;
    } catch (error) {
      console.error("Erro ao carregar disponibilidade do Firebase:", error);
    }
  }

  const saved = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
  if (saved) {
    try {
      aplicarAvailabilityData(JSON.parse(saved));
      return;
    } catch (error) {
      console.error("Erro ao ler disponibilidade local:", error);
    }
  }

  aplicarAvailabilityData(coletarAvailabilityData());
}

function irParaPagina(pagina, botao) {
  const paginas = document.querySelectorAll(".pagina-conteudo");
  paginas.forEach((item) => item.classList.remove("active"));

  const paginaAtiva = document.getElementById(`pagina-${pagina}`);
  if (paginaAtiva) {
    paginaAtiva.classList.add("active");
  }

  if (botao) {
    document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.remove("active"));
    botao.classList.add("active");
  }
}

function obterConfiguracaoEvento(tipo) {
  if (tipo === "oleo") {
    return {
      titulo: "Cardápio de Eventos - Óleo",
      preco: 45.00,
      limite: 3,
      quantidade: 100
    };
  }

  return {
    titulo: "Cardápio de Eventos - Forno",
    preco: 50.00,
    limite: 2,
    quantidade: 100
  };
}

function atualizarContadorEventos() {
  const contadorOleo = document.getElementById("contador-oleo");
  const contadorForno = document.getElementById("contador-forno");
  const btnOleo = document.getElementById("btn-add-oleo");
  const btnForno = document.getElementById("btn-add-forno");

  if (contadorOleo) {
    contadorOleo.innerText = `Selecionados: ${produtosEventos.salgadosSelecionadosOleo}/3`;
    const completo = produtosEventos.salgadosSelecionadosOleo === 3;
    contadorOleo.classList.toggle("completo", completo);
    if (btnOleo) {
      btnOleo.disabled = !completo;
      btnOleo.classList.toggle("ready", completo);
    }
  }

  if (contadorForno) {
    contadorForno.innerText = `Selecionados: ${produtosEventos.salgadosSelecionadosForno}/2`;
    const completo = produtosEventos.salgadosSelecionadosForno === 2;
    contadorForno.classList.toggle("completo", completo);
    if (btnForno) {
      btnForno.disabled = !completo;
      btnForno.classList.toggle("ready", completo);
    }
  }
}

function criarCardEvento(produto, tipo) {
  const bloqueado = !produto.disponivel;

  return `
    <div class="produto ${produto.selecionado ? "selecionado" : ""} ${bloqueado ? "indisponivel" : ""}">
      <h3>${produto.nome}</h3>
      <p>${bloqueado ? "Item esgotado no momento" : "Disponível para compor seu cardápio de 100 unidades"}</p>
      <label class="checkbox-salgado">
        <input
          type="checkbox"
          ${produto.selecionado ? "checked" : ""}
          ${bloqueado ? "disabled" : ""}
          onchange="toggleSelecaoEvento('${tipo}', '${produto.id}')"
        >
        <span class="checkbox-custom"></span>
        <span>${bloqueado ? "Indisponível" : "Selecionar este sabor"}</span>
      </label>
    </div>
  `;
}

function atualizarPaginaEventos() {
  const gridOleo = document.getElementById("grid-oleo");
  const gridForno = document.getElementById("grid-forno");

  if (!gridOleo || !gridForno) {
    return;
  }

  gridOleo.innerHTML = produtosEventos.oleo.map((produto) => criarCardEvento(produto, "oleo")).join("");
  gridForno.innerHTML = produtosEventos.forno.map((produto) => criarCardEvento(produto, "forno")).join("");

  atualizarContadorEventos();
}

function toggleSelecaoEvento(tipo, id) {
  const lista = produtosEventos[tipo];
  const produto = lista.find((item) => item.id === id);

  if (!produto || !produto.disponivel) {
    return;
  }

  const config = obterConfiguracaoEvento(tipo);
  const chaveContador = tipo === "oleo" ? "salgadosSelecionadosOleo" : "salgadosSelecionadosForno";
  const totalSelecionado = produtosEventos[chaveContador];

  if (!produto.selecionado && totalSelecionado >= config.limite) {
    alert(`Você pode selecionar apenas ${config.limite} tipos no cardápio ${tipo === "oleo" ? "de óleo" : "de forno"}.`);
    atualizarPaginaEventos();
    return;
  }

  produto.selecionado = !produto.selecionado;
  produtosEventos[chaveContador] = lista.filter((item) => item.selecionado).length;
  atualizarPaginaEventos();
}

function obterDescricaoComboEvento(tipo) {
  const config = obterConfiguracaoEvento(tipo);
  const selecionados = produtosEventos[tipo]
    .filter((item) => item.selecionado)
    .map((item) => item.nome);

  return `${config.titulo} - ${config.quantidade} unidades (${selecionados.join(", ")})`;
}

function limparSelecaoEventos(tipo) {
  produtosEventos[tipo].forEach((item) => {
    item.selecionado = false;
  });

  if (tipo === "oleo") {
    produtosEventos.salgadosSelecionadosOleo = 0;
  } else {
    produtosEventos.salgadosSelecionadosForno = 0;
  }
}

function adicionarComboEvento(tipo) {
  const config = obterConfiguracaoEvento(tipo);
  const selecionados = produtosEventos[tipo].filter((item) => item.selecionado);

  if (selecionados.length !== config.limite) {
    alert(`Selecione exatamente ${config.limite} tipos para adicionar o cardápio ${tipo === "oleo" ? "de óleo" : "de forno"} ao carrinho.`);
    return;
  }

  carrinho.push({
    nome: obterDescricaoComboEvento(tipo),
    preco: config.preco
  });

  limparSelecaoEventos(tipo);
  atualizarPaginaEventos();
  render();
}

function finalizarEventos() {
  const selecaoPendente =
    produtosEventos.oleo.some((item) => item.selecionado) ||
    produtosEventos.forno.some((item) => item.selecionado);

  if (selecaoPendente && carrinho.length === 0) {
    alert("Adicione primeiro o cardápio de eventos ao carrinho antes de finalizar o pedido.");
    return;
  }

  finalizar();
}

async function salvarAvailability() {
  const data = {};

  produtosRegulares.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    data[produto.id] = checkbox ? checkbox.checked : produto.disponivel;
    produto.disponivel = data[produto.id];
  });

  produtosEventos.oleo.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    data[produto.id] = checkbox ? checkbox.checked : produto.disponivel;
    produto.disponivel = data[produto.id];
  });

  produtosEventos.forno.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    data[produto.id] = checkbox ? checkbox.checked : produto.disponivel;
    produto.disponivel = data[produto.id];
  });

  aplicarAvailabilityData(data);

  if (window.firebaseService) {
    try {
      await window.firebaseService.saveAvailability(data);
      alert("Disponibilidade dos produtos salva com sucesso!");
      return;
    } catch (error) {
      console.error("Erro ao salvar disponibilidade no Firebase:", error);
      alert("Não foi possível salvar no Firebase. Verifique a configuração e tente novamente.");
      return;
    }
  }

  localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(data));
  alert("Disponibilidade dos produtos salva localmente com sucesso!");
}

function adminEstaAutenticado() {
  return adminAutenticado;
}

function atualizarVisibilidadePainelAdmin() {
  const loginBox = document.getElementById("admin-login-box");
  const painelBox = document.getElementById("admin-panel-box");

  if (!loginBox || !painelBox) {
    return;
  }

  const autenticado = adminEstaAutenticado();
  loginBox.hidden = autenticado;
  painelBox.hidden = !autenticado;

  if (autenticado) {
    atualizarPainelAdminPage();
    carregarAvailability();
  }
}

function autenticarAdmin(event) {
  if (event) {
    event.preventDefault();
  }

  const emailInput = document.getElementById("admin-email");
  const senhaInput = document.getElementById("admin-senha");
  const erro = document.getElementById("admin-login-erro");

  if (!emailInput || !senhaInput || !erro) {
    return false;
  }

  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  if (email !== ADMIN_EMAIL) {
    erro.textContent = "Somente o administrador autorizado pode acessar este painel.";
    erro.hidden = false;
    return false;
  }

  if (!window.firebaseService) {
    erro.textContent = "Firebase não foi carregado. Verifique a configuração e tente novamente.";
    erro.hidden = false;
    return false;
  }

  window.firebaseService.loginAdmin(email, senha)
    .then((user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        erro.textContent = "Usuário sem permissão para este painel.";
        erro.hidden = false;
        window.firebaseService.logoutAdmin();
        return;
      }

      erro.hidden = true;
      senhaInput.value = "";
    })
    .catch((authError) => {
      console.error("Erro ao autenticar admin:", authError);
      erro.textContent = "Usuário ou senha inválidos.";
      erro.hidden = false;
    });

  return false;
}

function logoutAdmin() {
  if (!window.firebaseService) {
    adminAutenticado = false;
    atualizarVisibilidadePainelAdmin();
    return;
  }

  window.firebaseService.logoutAdmin().catch((error) => {
    console.error("Erro ao sair do admin:", error);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  criarAtalhoCarrinhoMobile();
  atualizarAtalhoCarrinhoMobile();
  carregarAvailability();

  if (document.getElementById("admin-login-box")) {
    if (window.firebaseService) {
      window.firebaseService.onAdminAuthChanged((user) => {
        adminAutenticado = !!(user && user.email === ADMIN_EMAIL);
        atualizarVisibilidadePainelAdmin();
      });
    } else {
      atualizarVisibilidadePainelAdmin();
    }
  }
});
