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
const TAXAS_CARTAO_CONFIG = {
  debito: 0.02, // 2% para débito
  credito: { 
    "1": 0.0617,
    "2": 0.0958,
    "3": 0.1238,
    "4": 0.1518,
    "5": 0.1798,
    "6": 0.2078,
    "7": 0.2358,
    "8": 0.2638,
    "9": 0.2918,
    "10": 0.3198,
    "11": 0.3478,
    "12": 0.3758,
    "13": 0.4038,
    "14": 0.4318,
    "15": 0.4598,
    "16": 0.4878,
    "17": 0.5158,
    "18": 0.5438
  }
};
let bairroSelecionado = "";
let localizacaoUsuario = "";
let modoEntrega = "entrega";
let formaPagamento = "";
let availabilityUnsubscribe = null;
let adminAutenticado = false;
let lojaAberta = true;

const ADMIN_EMAIL = "edmilsonjosedasilva14@gmail.com";
const AVAILABILITY_STORAGE_KEY = "produtosAvailability";

const produtosRegulares = [
  { id: "coxinha-frango", nome: "Coxinha Frango", disponivel: true, estoque: 99 },
  { id: "coxinha-catupiry", nome: "Coxinha c/ Catupiry", disponivel: true, estoque: 99 },
  { id: "coxinha-cheddar", nome: "Coxinha c/ Cheddar", disponivel: true, estoque: 99 },
  { id: "coxinha-calabresa", nome: "Coxinha Frango c/ Calabresa", disponivel: true, estoque: 99 },
  { id: "coxinha-charque-catupiry", nome: "Coxinha Charque c/ Catupiry", disponivel: true, estoque: 99 },
  { id: "coxinha-charque", nome: "Coxinha de Charque", disponivel: true, estoque: 99 },
  { id: "coxinha-charque-queijo", nome: "Coxinha Charque c/ Queijo", disponivel: true, estoque: 99 },
  { id: "coxinha-frango-queijo", nome: "Coxinha Frango c/ Queijo", disponivel: true, estoque: 99 },
  { id: "bolinho-carne", nome: "Bolinho de Carne", disponivel: true, estoque: 99 },
  { id: "bolinho-pizza", nome: "Bolinho de Pizza", disponivel: true, estoque: 99 },
  { id: "enroladinho", nome: "Enroladinho", disponivel: true, estoque: 99 },
  { id: "pastel", nome: "Pastel c/ Dois Sabores", disponivel: true, estoque: 99 },
  { id: "x-burguer", nome: "X-Burguer", disponivel: true, estoque: 99 },
  { id: "hamburguer", nome: "Hamburguer", disponivel: true, estoque: 99 },
  { id: "x-tudo", nome: "X-Tudo", disponivel: true, estoque: 99 },
  { id: "cachorro-quente", nome: "Cachorro Quente", disponivel: true, estoque: 99 },
  { id: "refri-1l-coca", nome: "Coca-Cola 1L", disponivel: true, estoque: 99 },
  { id: "refri-1l-guarana", nome: "Guaraná 1L", disponivel: true, estoque: 99 },
  { id: "refri-lata-coca", nome: "Coca-Cola Lata", disponivel: true, estoque: 99 },
  { id: "refri-lata-fanta", nome: "Fanta Lata", disponivel: true, estoque: 99 },
  { id: "refri-lata-guarana", nome: "Guaraná Lata", disponivel: true, estoque: 99 }
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
    data[produto.id] = {
      disponivel: !!produto.disponivel,
      estoque: parseInt(produto.estoque) || 0
    };
  });

  return data;
}

function aplicarAvailabilityData(data) {
  if (!data) {
    data = coletarAvailabilityData();
  }

  // Suporta o novo formato do Firebase
  const itens = data.itens || data;
  if (data.lojaAberta !== undefined) {
    lojaAberta = data.lojaAberta;
  }

  produtosRegulares.forEach((produto) => {
    const itemRemoto = itens[produto.id];
    if (itemRemoto !== undefined) {
      // Suporta tanto o formato antigo (boolean) quanto o novo (objeto)
      produto.disponivel = typeof itemRemoto === 'object' ? !!itemRemoto.disponivel : !!itemRemoto;
      produto.estoque = typeof itemRemoto === 'object' ? (parseInt(itemRemoto.estoque) || 0) : 99;
    }
  });

  produtosEventos.oleo.forEach((produto) => {
    const itemRemoto = itens[produto.id];
    if (itemRemoto !== undefined) {
      produto.disponivel = typeof itemRemoto === 'object' ? !!itemRemoto.disponivel : !!itemRemoto;
      produto.estoque = typeof itemRemoto === 'object' ? (parseInt(itemRemoto.estoque) || 0) : 99;
      if (!produto.disponivel) {
        produto.selecionado = false;
      }
    }
  });

  produtosEventos.forno.forEach((produto) => {
    const itemRemoto = itens[produto.id];
    if (itemRemoto !== undefined) {
      produto.disponivel = typeof itemRemoto === 'object' ? !!itemRemoto.disponivel : !!itemRemoto;
      produto.estoque = typeof itemRemoto === 'object' ? (parseInt(itemRemoto.estoque) || 0) : 99;
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
  atualizarStatusLojaUI();
}

function atualizarStatusLojaUI() {
  const statusHeader = document.querySelectorAll("#header-loja");
  const statusTexto = document.querySelectorAll("#header-loja-status");

  const text = lojaAberta ? "Estamos Abertos!" : "Estamos Fechados";

  statusHeader.forEach(el => el.classList.toggle("fechado", !lojaAberta));
  statusTexto.forEach(el => el.innerText = text);

  atualizarEstadoFinalizar();
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
    carrinho.push({ nome: descricao, preco: 9.00, id: "pastel" });
  }

  quantidades.pastel = 1;
  document.getElementById("qtd-pastel").innerText = 1;
  fecharModalPastel();
  atualizarAvisoEstoque("pastel");
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
    carrinho.push({ nome: descricao, preco: 5.00, id: "cachorro-quente" });
  }

  quantidades["cachorro-quente"] = 1;
  document.getElementById("qtd-cachorro-quente").innerText = 1;
  fecharModalCachorro();
  atualizarAvisoEstoque("cachorro-quente");
  render();
}

document.addEventListener("DOMContentLoaded", function() {

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

function abrirModalDev() {
  const modal = document.getElementById("modal-dev");
  if (modal) modal.classList.add("active");
}

function fecharModalDev() {
  const modal = document.getElementById("modal-dev");
  if (modal) modal.classList.remove("active");
}

// Adicionar fechamento ao clicar fora do modal dev
window.addEventListener("click", function(e) {
  const modal = document.getElementById("modal-dev");
  if (e.target === modal) fecharModalDev();
});

function obterLocalizacao() {
  const btn = document.getElementById("btn-localizacao");
  if (!("geolocation" in navigator)) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  btn.innerText = "⌛ Obtendo...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      localizacaoUsuario = `https://www.google.com/maps?q=${latitude},${longitude}`;
      btn.innerText = "📍 Localização Capturada!";
      btn.style.background = "#16a34a";
      alert("Localização capturada com sucesso! O link do GPS será enviado no WhatsApp.");
    },
    (error) => {
      btn.innerText = "📍 Enviar Localização Atual";
      let msgErro = "Não foi possível obter sua localização.";
      if (error.code === 1) msgErro = "Por favor, autorize o acesso à localização no seu navegador nas configurações de privacidade.";
      alert(msgErro);
      console.error(error);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function alterarQtd(id, valor) {
  if (!produtoEstaDisponivel(id)) {
    return;
  }
  
  const produto = encontrarProdutoPorId(id);
  const qtdNoCarrinho = carrinho.filter(i => i.id === id).length;
  const maxDisponivel = (produto && produto.estoque !== undefined) ? (produto.estoque - qtdNoCarrinho) : 99;

  quantidades[id] = (quantidades[id] || 1) + valor;
  if (quantidades[id] > maxDisponivel) {
    quantidades[id] = Math.max(1, maxDisponivel);
  } else if (quantidades[id] < 1) {
    quantidades[id] = 1;
  }
  const contador = document.getElementById(`qtd-${id}`);
  if (contador) {
    contador.innerText = quantidades[id];
  }
  atualizarAvisoEstoque(id);
}

function toggleCarrinho(abrir) {
  const cart = document.getElementById("carrinho");
  const overlay = document.getElementById("carrinho-overlay");
  if (!cart) return;

  if (abrir) {
    cart.classList.add("active");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Trava o scroll da página de fundo
    cart.scrollTop = 0; // Reseta o scroll do carrinho para o topo
  } else {
    cart.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "auto"; // Libera o scroll ao fechar
  }
}

function add(nome, preco, id) {
  if (!produtoEstaDisponivel(id)) {
    alert("Este item está esgotado no momento.");
    return;
  }
  
  const produto = encontrarProdutoPorId(id);
  const qtdNoCarrinho = carrinho.filter(i => i.id === id).length;
  const qtdDesejada = quantidades[id] || 1;

  if (produto && (qtdNoCarrinho + qtdDesejada) > produto.estoque) {
    alert(`Ops! Temos apenas ${produto.estoque} unidades de "${nome}" em estoque.`);
    return;
  }

  const qtd = quantidades[id] || 1;
  for (let i = 0; i < qtd; i++) {
    carrinho.push({ nome, preco, id }); // Adicionado ID para controle de estoque
  }
  quantidades[id] = 1;
  const contador = document.getElementById(`qtd-${id}`);
  if (contador) {
    contador.innerText = 1;
  }
  atualizarAvisoEstoque(id);
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
  
  // No tradicional, não exige agendamento. No eventos (identificado pela presença do grid de óleo), exige.
  const isPaginaEventos = !!document.getElementById("grid-oleo");
  const agendamentoOK = isPaginaEventos ? (diaRetirada && horaRetirada) : true;

  const retiradaValida = modoEntrega === "retirada" && agendamentoOK;
  const entregaValida = modoEntrega === "entrega" && bairroSelecionado && numeroPreenchido;

  botaoFinalizar.disabled = !lojaAberta || carrinho.length === 0 || !(retiradaValida || entregaValida) || !formaPagamento;
}

function atualizarModoEntrega() {
  modoEntrega = document.getElementById("modo-entrega").value;
  const bairroSection = document.getElementById("bairro-section");
  const numeroCasaSection = document.getElementById("numero-casa-section");
  const pontoReferenciaSection = document.getElementById("ponto-referencia-section");
  const retiradaInfoSection = document.getElementById("retirada-info");
  const localizacaoSection = document.getElementById("localizacao-section");

  if (modoEntrega === "retirada") {
    bairroSelecionado = "";
    document.getElementById("bairro-select").value = "";
    bairroSection.hidden = true;
    numeroCasaSection.hidden = true;
    pontoReferenciaSection.hidden = true;
    if (localizacaoSection) localizacaoSection.hidden = true;
    retiradaInfoSection.hidden = false;
    
    // Só abre o modal de agendamento se for a página de eventos
    const isPaginaEventos = !!document.getElementById("grid-oleo");
    if (isPaginaEventos) {
      abrirModalRetirada();
    }
  } else {
    bairroSection.hidden = false;
    numeroCasaSection.hidden = false;
    pontoReferenciaSection.hidden = false;
    if (localizacaoSection) localizacaoSection.hidden = false;
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
  const parcelasSection = document.getElementById("parcelas-section");
  const avisoCartao = document.getElementById("aviso-cartao");

  if (parcelasSection) parcelasSection.hidden = (formaPagamento !== "credito");
  
  if (avisoCartao) avisoCartao.hidden = !(formaPagamento === "credito" || formaPagamento === "debito");
  
  render();
  atualizarEstadoFinalizar();
}

function obterFormaPagamentoTexto() {
  const formasPagamento = {
    pix: "Pix",
    debito: "Cartão de Débito",
    credito: "Cartão de Crédito",
    especie: "Em Espécie"
  };

  return formasPagamento[formaPagamento] || "";
}

function calcularResumoCarrinho() {
  const subtotal = carrinho.reduce((sum, item) => sum + item.preco, 0);
  const taxa = modoEntrega === "retirada" ? 0 : (bairroSelecionado ? taxasPorBairro[bairroSelecionado] : 0);
  
  let taxaCartao = 0;
  if (formaPagamento === "debito") {
    taxaCartao = (subtotal + taxa) * TAXAS_CARTAO_CONFIG.debito;
  } else if (formaPagamento === "credito") {
    const p = document.getElementById("parcelas-select")?.value || "1";
    taxaCartao = (subtotal + taxa) * TAXAS_CARTAO_CONFIG.credito[p];
  }

  return {
    subtotal,
    taxa,
    taxaCartao,
    total: subtotal + taxa + taxaCartao,
    quantidade: carrinho.length
  };
}

function atualizarBadgeCarrinho() {
  const resumo = calcularResumoCarrinho();
  
  // Atualiza o badge do botão flutuante
  const badge = document.getElementById("cart-badge");
  if (badge) badge.innerText = resumo.quantidade;
}

function irParaCarrinho() {
  toggleCarrinho(true);
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
    atualizarBadgeCarrinho();
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

  const resumoCalculado = calcularResumoCarrinho();
  let taxa = resumoCalculado.taxa;
  let taxaCartao = resumoCalculado.taxaCartao;
  let total = resumoCalculado.total;

  document.getElementById("subtotal").innerText = formatarMoeda(subtotal);
  document.getElementById("taxa").innerText = formatarMoeda(taxa);
  const elTaxaCartao = document.getElementById("taxa-cartao");
  if (elTaxaCartao) {
    elTaxaCartao.innerText = formatarMoeda(taxaCartao);
    elTaxaCartao.parentElement.style.display = taxaCartao > 0 ? "flex" : "none";
  }
  document.getElementById("total").innerText = formatarMoeda(total);
  resumo.hidden = false;
  atualizarBadgeCarrinho();
  atualizarEstadoFinalizar();
}

function removerItem(nome) {
  const item = carrinho.find(i => i.nome === nome);
  const id = item ? item.id : null;

  carrinho = carrinho.filter((item) => item.nome !== nome);
  render();
  if (id) {
    atualizarAvisoEstoque(id);
  }
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
  const obsPedido = document.getElementById("obs-pedido")?.value.trim();

  if (modoEntrega === "entrega" && !numeroCasa) {
    alert("Por favor, informe o número da casa!");
    return;
  }

  const resumoCalculado = calcularResumoCarrinho();
  let subtotal = resumoCalculado.subtotal;
  let taxa = resumoCalculado.taxa;
  let taxaCartao = resumoCalculado.taxaCartao;
  let total = resumoCalculado.total;

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
  if (taxaCartao > 0) {
    const p = document.getElementById("parcelas-select")?.value || "1";
    const perc = formaPagamento === "debito" ? "2%" : (TAXAS_CARTAO_CONFIG.credito[p] * 100) + "%";
    const label = formaPagamento === "credito" ? ` (${p}x)` : "";
    msg += `Acréscimo Cartão ${perc}${label}: ${formatarMoeda(taxaCartao)}\n`;
  }
  msg += `*TOTAL: ${formatarMoeda(total)}*\n\n`;

  msg += "*FORMA DE PAGAMENTO ESCOLHIDA:*\n";
  msg += `${obterFormaPagamentoTexto()}\n`;
  if (obsPedido) {
    msg += `*Observações:* ${obsPedido}\n`;
  }
  msg += "\n";

  if (formaPagamento === "pix") {
    msg += "Chave pix: *81982116454*\n";
    msg += "Titular: Edmilson José da Silva\n";
  } else if (formaPagamento === "credito") {
    msg += "Obs: No cartão de crédito tem acréscimo da maquineta\n";
  } else if (formaPagamento === "debito") {
    msg += "Obs: No cartão de débito, o entregador irá levar a maquineta\n";
  }
  msg += "\n";

  if (modoEntrega === "retirada") {
    const diaInput = document.getElementById("retirada-dia");
    const horaInput = document.getElementById("retirada-horario");
    const dia = diaInput ? diaInput.value.trim() : "";
    const hora = horaInput ? horaInput.value.trim() : "";

    msg += "*RETIRADA NO ESTABELECIMENTO:*\n";
    if (dia) msg += `Data: ${dia}\n`;
    if (hora) msg += `Horário: ${hora}\n`;
    msg += "Endereço: Cohab 3, Rua 5, nº 28\n";
    msg += "Prazo médio de entrega do pedido: 35 a 50 minutos\n";
    msg += "Link: https://maps.app.goo.gl/fyMBq6BQkoCWQYBM7\n";
    msg += "Obs: Sujeito a disponibilidade de agenda.\n\n";
  } else {
    msg += "*ENDEREÇO DE ENTREGA:*\n";
    msg += `Bairro: ${bairroSelecionado}\n`;
    msg += `Número: ${numeroCasa}\n`;
    if (pontoReferencia) {
      msg += `Referência: ${pontoReferencia}\n`;
    }
    if (localizacaoUsuario) {
      msg += `📍 Localização GPS: ${localizacaoUsuario}\n`;
    }
    msg += "Prazo médio de entrega do pedido: 35 a 50 minutos\n";
    msg += "\n";
  }

  const temEvento = carrinho.some(item => item.nome.includes("Cardápio de Eventos"));

  if (formaPagamento !== "especie" || temEvento) {
    msg += "══════════════\n";
    msg += "*AVISO IMPORTANTE*\n";
    msg += "══════════════\n\n";

    if (formaPagamento === "pix") {
      msg += "*O pedido será confirmado após o pagamento e ENVIO DO COMPROVANTE ou confirmação da equipe*.\n\n";
    } else if (temEvento) {
      msg += "*NÃO PAGUE AGORA:* Se o seu pedido for para *EVENTO*, por favor, aguarde o nosso 'OK' aqui no WhatsApp primeiro. Precisamos validar se temos vaga disponível para a data e horário que você escolheu.\n\n";
    }

    if (formaPagamento === "credito" || formaPagamento === "debito") {
      msg += "Lembrando que pagamentos no cartão possuem acréscimo da taxa da maquineta. ";
      if (modoEntrega === "entrega") {
        msg += "O entregador irá levar a maquineta.";
      }
      msg += "\n\n";
    }
  }
  window.open("https://wa.me/5581982116454?text=" + encodeURIComponent(msg));
}

// Removida a função processarPagamentoOnline() pois a integração foi desativada.

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

function atualizarAvisoEstoque(id) {
  const card = document.querySelector(`[data-product-id="${id}"]`);
  if (!card) return;

  const produto = encontrarProdutoPorId(id);
  if (!produto) return;

  const qtdNoCarrinho = carrinho.filter(i => i.id === id).length;
  const estoqueDisponivelReal = produto.estoque - qtdNoCarrinho;
  const qtdDesejada = quantidades[id] || 1;

  let aviso = card.querySelector(".aviso-estoque");
  const botaoAdicionar = card.querySelector("button.adicionar");

  if (produto.disponivel && estoqueDisponivelReal > 0 && estoqueDisponivelReal <= 5) {
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.className = "aviso-estoque";
      card.insertBefore(aviso, botaoAdicionar);
    }
    // Se o cliente selecionar mais no contador, mostramos o que sobraria
    const restantes = Math.max(0, estoqueDisponivelReal - (qtdDesejada - 1));
    aviso.innerHTML = `⚠️ Últimas ${restantes} unidades!`;
  } else if (aviso) {
    aviso.remove();
  }
}

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
      botaoAdicionar.textContent = disponivel ? "Adicionar ao Carrinho" : "ITEM ESGOTADO";
    }
    atualizarAvisoEstoque(id);
  });
}

function atualizarPainelAdminPage() {
  const painelCardapio = document.getElementById("painel-cardapio-regular");
  const painelOleo = document.getElementById("painel-eventos-oleo");
  const painelForno = document.getElementById("painel-eventos-forno");
  const painelStatus = document.getElementById("painel-status-loja");

  if (painelStatus) {
    const statusClass = lojaAberta ? "status-neon-verde" : "status-neon-vermelho";
    const statusText = lojaAberta ? "ESTAMOS ABERTO" : "ESTAMOS FECHADOS";
    
    painelStatus.innerHTML = `
      <div class="painel-secao">
        <h4>Status de Funcionamento</h4>
        <div class="painel-produto" style="justify-content: center; gap: 20px; background: rgba(0,0,0,0.3); border-width: 3px;">
          <input type="checkbox" id="check-loja-aberta" ${lojaAberta ? "checked" : ""}>
          <label for="check-loja-aberta" class="${statusClass}" style="font-weight: 900; font-size: 1.5em; letter-spacing: 2px; cursor: pointer;">
            ${statusText}
          </label>
        </div>
      </div>
    `;
  }

  if (!painelCardapio || !painelOleo || !painelForno) {
    return;
  }

  painelCardapio.innerHTML = produtosRegulares.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}" style="flex: 1;">${produto.nome}</label>
      <input type="number" class="admin-stock-input" id="stock-${produto.id}" value="${produto.estoque || 0}" min="0" title="Estoque">
    </div>
  `).join("");

  painelOleo.innerHTML = produtosEventos.oleo.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}">${produto.nome}</label>
      <input type="number" class="admin-stock-input" id="stock-${produto.id}" value="${produto.estoque || 0}" min="0">
    </div>
  `).join("");

  painelForno.innerHTML = produtosEventos.forno.map((produto) => `
    <div class="painel-produto ${produto.disponivel ? "" : "indisponivel"}">
      <input type="checkbox" id="check-${produto.id}" ${produto.disponivel ? "checked" : ""}>
      <label for="check-${produto.id}">${produto.nome}</label>
      <input type="number" class="admin-stock-input" id="stock-${produto.id}" value="${produto.estoque || 0}" min="0">
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
      <p>${bloqueado ? "ITEM ESGOTADO" : "Disponível para compor seu cardápio de 100 unidades"}</p>
      <label class="checkbox-salgado">
        <input
          type="checkbox"
          ${produto.selecionado ? "checked" : ""}
          ${bloqueado ? "disabled" : ""}
          onchange="toggleSelecaoEvento('${tipo}', '${produto.id}')"
        >
        <span class="checkbox-custom"></span>
        <span>${bloqueado ? "ITEM ESGOTADO" : "Selecionar este sabor"}</span>
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

function mostrarNotificacaoSucesso(mensagem) {
  const toast = document.createElement("div");
  toast.className = "toast-sucesso";
  toast.innerHTML = mensagem;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("mostrar"), 100);

  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

async function salvarAvailability() {
  const data = {};

  const checkLoja = document.getElementById("check-loja-aberta");
  const novaLojaAberta = checkLoja ? checkLoja.checked : lojaAberta;

  produtosRegulares.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    const stockInput = document.getElementById(`stock-${produto.id}`);
    const isAvailable = checkbox ? checkbox.checked : produto.disponivel;
    const stockQty = stockInput ? parseInt(stockInput.value) : (produto.estoque || 0);
    data[produto.id] = { disponivel: isAvailable, estoque: stockQty };
    produto.disponivel = isAvailable;
    produto.estoque = stockQty;
  });

  produtosEventos.oleo.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    const stockInput = document.getElementById(`stock-${produto.id}`);
    data[produto.id] = { 
      disponivel: checkbox ? checkbox.checked : produto.disponivel,
      estoque: stockInput ? parseInt(stockInput.value) : (produto.estoque || 0)
    };
  });

  produtosEventos.forno.forEach((produto) => {
    const checkbox = document.getElementById(`check-${produto.id}`);
    const stockInput = document.getElementById(`stock-${produto.id}`);
    data[produto.id] = { 
      disponivel: checkbox ? checkbox.checked : produto.disponivel,
      estoque: stockInput ? parseInt(stockInput.value) : (produto.estoque || 0)
    };
  });

  aplicarAvailabilityData(data);

  if (window.firebaseService) {
    try {
      await window.firebaseService.saveAvailability(data, novaLojaAberta);
      mostrarNotificacaoSucesso("✅ Alterações salvas com sucesso!");
      return;
    } catch (error) {
      console.error("Erro ao salvar disponibilidade no Firebase:", error);
      alert("Não foi possível salvar no Firebase. Verifique a configuração e tente novamente.");
      return;
    }
  }

  localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(data));
  mostrarNotificacaoSucesso("💾 Salvo localmente com sucesso!");
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
  atualizarBadgeCarrinho();
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
