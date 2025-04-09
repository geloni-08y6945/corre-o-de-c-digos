/*
 * =============================================================================
 * Garagem Inteligente - Interface Unificada - v2.1 (Improved)
 * =============================================================================
 * ... (existing large comment block remains here) ...
 * ---- IMPROVEMENTS in v2.1 ----
 * - Replaced alert() with non-blocking notifications.
 * - Used Event Delegation for action buttons.
 * - Cached frequently accessed DOM elements.
 * - Improved variable naming and code formatting.
 * - Added Constants for magic numbers/strings.
 * - Minor UI feedback enhancements (e.g., image modification note).
 * =============================================================================
 */

// --- Constants ---
const STORAGE_KEY = 'garagemInteligenteDados';
const DEFAULT_FUEL = 100;
const FUEL_CAPACITY = 100;
const STARTUP_FUEL_COST = 0.5;
const ACCEL_FUEL_COST = 1;
const TURBO_FUEL_COST_MULTIPLIER = 3; // Multiplies ACCEL_FUEL_COST
const FLYING_FUEL_COST_MULTIPLIER = 2; // Multiplies ACCEL_FUEL_COST
const TRUCK_FUEL_COST_MULTIPLIER = 1.5; // Multiplies ACCEL_FUEL_COST
const TAKEOFF_FUEL_COST = 10;
const TURBO_ACTIVATION_FUEL_COST = 5;
const MAX_VISUAL_SPEED = 300;
const MIN_TAKEOFF_SPEED = 80;
const MAX_LANDING_SPEED = 120;
const DEFAULT_VOLUME = 0.5;
const NOTIFICATION_DURATION = 3500; // ms

// --- DOM Element Cache (Populated in DOMContentLoaded) ---
const Cache = {
    // Sections
    selecaoVeiculoSection: null,
    detalhesVeiculoContainer: null,
    criarVeiculoSection: null,
    informacoesVeiculoSection: null,
    acoesVeiculoSection: null,
    musicaVeiculoSection: null,
    manutencaoVeiculoSection: null,
    configuracaoSomSection: null,
    // Selection Info
    tipoSelecionadoInfoDiv: null,
    // Creation/Modification Form
    criarModificarTituloH2: null,
    modeloInput: null,
    corInput: null,
    nicknameInput: null,
    imagemInput: null,
    labelCapacidadeCarga: null,
    capacidadeCargaInput: null,
    labelEnvergadura: null,
    envergaduraInput: null,
    labelTipoBicicleta: null,
    tipoBicicletaSelect: null,
    btnCriarVeiculo: null,
    btnCancelarModificar: null,
    // Info Display
    informacoesVeiculoDiv: null,
    nicknameDisplaySpan: null,
    imagemExibidaImg: null,
    statusVeiculoDiv: null,
    velocidadeValorSpan: null,
    progressoVelocidadeDiv: null,
    fuelDisplayContainerDiv: null,
    fuelLevelValorSpan: null,
    fuelLevelBarDiv: null,
    cargaAtualDisplayDiv: null,
    cargaAtualValorSpan: null,
    altitudeDisplayDiv: null,
    altitudeValorSpan: null,
    btnMostrarModificarForm: null,
    // Music
    musicaInputElement: null,
    btnTocarMusica: null,
    btnPararMusica: null,
    nomeMusicaDiv: null,
    // Maintenance
    historicoManutencaoListaDiv: null,
    agendamentosFuturosListaDiv: null,
    formAgendarManutencao: null,
    manutencaoDataInput: null,
    manutencaoTipoInput: null,
    manutencaoCustoInput: null,
    manutencaoDescricaoTextarea: null,
    // Global Settings
    volumeGeralInput: null,
    // Notifications
    notificationAreaDiv: null,
};


// --- Classe Manutencao ---
class Manutencao {
    // ... (Manutencao class remains the same as in the previous corrected version) ...
    constructor(data, tipo, custo, descricao = '') {
        if (!this.validarData(data)) { throw new Error("Data inválida fornecida para manutenção."); }
        if (typeof tipo !== 'string' || tipo.trim() === '') { throw new Error("Tipo de serviço inválido."); }
        const custoNum = parseFloat(custo);
        if (isNaN(custoNum) || custoNum < 0) { throw new Error("Custo inválido. Deve ser um número não negativo."); }
        const dateObj = new Date(data); dateObj.setUTCHours(0, 0, 0, 0); this.data = dateObj.toISOString();
        this.tipo = tipo.trim(); this.custo = custoNum; this.descricao = descricao.trim();
    }
    validarData(dataStr) { if (!dataStr || typeof dataStr !== 'string' || !dataStr.trim()) return false; const data = new Date(dataStr); return !isNaN(data.getTime()); }
    getDataObj() { return new Date(this.data); }
    isAgendamento() { const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0); return this.getDataObj() >= hoje; }
    isHistorico() { const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0); return this.getDataObj() < hoje; }
    formatar() { const dF=this.getDataObj().toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}); const cF=this.custo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); let b=`<span class="tipo-servico">${this.tipo}</span> em ${dF} <span class="custo-servico">${cF}</span>`; if(this.descricao){b+=` - Descrição: ${this.descricao}`;} return b; }
    toPlainObject() { return { data: this.data, tipo: this.tipo, custo: this.custo, descricao: this.descricao }; }
    static fromPlainObject(obj){if(!obj||!obj.data||!obj.tipo||obj.custo===undefined){console.error("Manutenção inválida:",obj);return null;}try{return new Manutencao(obj.data,obj.tipo,obj.custo,obj.descricao||'');}catch(e){console.error("Erro recriar Manutencao:",obj,e);return null;}}
}

// --- Classes de Veículo ---
class Veiculo {
    constructor(modelo, cor, nickname = null, imagem = null, ligado = false, velocidade = 0, fuelLevel = DEFAULT_FUEL, historicoManutencao = []) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') throw new Error("Modelo inválido.");
        if (!cor || typeof cor !== 'string' || cor.trim() === '') throw new Error("Cor inválida.");
        this.modelo = modelo.trim(); this.cor = cor.trim(); this.nickname = nickname ? nickname.trim() : null; this.imagem = imagem; this.ligado = Boolean(ligado); this.velocidade = Math.max(0, Number(velocidade)) || 0; this.volume = DEFAULT_VOLUME; this.musica = null; this.musicaTocando = false; this.musicaNome = "Nenhuma música selecionada";
        this.fuelCapacity = FUEL_CAPACITY; this.fuelLevel = Math.max(0, Math.min(Number(fuelLevel) || DEFAULT_FUEL, this.fuelCapacity));
        this.historicoManutencao = Array.isArray(historicoManutencao) ? historicoManutencao.map(item => item instanceof Manutencao ? item : Manutencao.fromPlainObject(item)).filter(Boolean) : [];
    }
    // --- Fuel Methods ---
    consumirCombustivel(quantidade) { if(this instanceof Bicicleta)return true; if(this.fuelLevel<=0)return false; const cR=Math.max(0,quantidade); if(this.fuelLevel<cR){console.warn(`${this.modelo} sem combustível.`); this.fuelLevel=0; if(this.ligado){this.ligado=false; this.velocidade=0; if(this instanceof CarroEsportivo)this.turboAtivado=false; this.pararMusica(); playSound("desligar",this.volume);} this.updateDisplay(); return false;} this.fuelLevel-=cR; this.updateDisplay(); return true; }
    reabastecer() { if(this instanceof Bicicleta){showNotification("Bicicletas não usam combustível!",'info');return;} if(this.fuelLevel>=this.fuelCapacity){showNotification(`${this.modelo} já está cheio.`,'info');return;} this.fuelLevel=this.fuelCapacity; showNotification(`${this.modelo} reabastecido!`,'success'); this.updateDisplay(); salvarGaragem(); }
    // --- Basic Actions ---
    ligar() { if(this instanceof Bicicleta){showNotification("Bicicletas não ligam!",'info');return;} if(this.ligado)return; if(this.fuelLevel<=0){showNotification(`${this.modelo} sem combustível!`,'warning');return;} if(!this.consumirCombustivel(STARTUP_FUEL_COST)){showNotification(`${this.modelo} sem combustível p/ ligar!`,'error');return;} playSound("ligar",this.volume); this.ligado=true; this.updateDisplay(); salvarGaragem(); }
    desligar() { if(this instanceof Bicicleta){showNotification("Bicicletas não desligam!",'info');return;} if(this.voando&&this instanceof Aviao){showNotification("Aterrisse antes.",'warning');return;} if(!this.ligado)return; playSound("desligar",this.volume); this.pararMusica(); this.ligado=false; this.velocidade=0; if(this instanceof CarroEsportivo)this.turboAtivado=false; this.updateDisplay(); salvarGaragem(); }
    acelerar(incremento=10){ incremento=Math.abs(Number(incremento))||10; if(this instanceof Bicicleta){const m=40; this.velocidade=Math.min(m,this.velocidade+incremento/2); this.updateDisplay(); salvarGaragem(); return;} if(!this.ligado){showNotification("Ligue para acelerar.",'warning');return;} let fC=ACCEL_FUEL_COST; if(this instanceof CarroEsportivo&&this.turboAtivado)fC*=TURBO_FUEL_COST_MULTIPLIER; if(this instanceof Aviao&&this.voando)fC*=FLYING_FUEL_COST_MULTIPLIER; if(this instanceof Caminhao)fC*=TRUCK_FUEL_COST_MULTIPLIER; if(!this.consumirCombustivel(fC)){showNotification(`${this.modelo} sem combustível!`,'warning');return;} let mS=150; if(this instanceof CarroEsportivo)mS=this.turboAtivado?300:200; else if(this instanceof Caminhao)mS=120; else if(this instanceof Aviao)mS=this.voando?900:100; else if(this instanceof Moto)mS=180; if(!this.voando&&this instanceof Aviao&&this.velocidade>=mS){showNotification(`Vel max solo (${mS}).`,'info');this.velocidade=mS;} else if(this.velocidade<mS){playSound("acelerar",this.volume);this.velocidade=Math.min(mS,this.velocidade+incremento);} this.updateDisplay(); salvarGaragem(); }
    frear(decremento=10){ decremento=Math.abs(Number(decremento))||10; if(this.velocidade===0)return; if(this.voando&&this instanceof Aviao){showNotification("Aterrisse p/ frear.",'warning');return;} if(!(this instanceof Bicicleta)){playSound("frear",this.volume);} this.velocidade=Math.max(0,this.velocidade-decremento); this.updateDisplay(); salvarGaragem(); }
    buzinar() { playSound(this instanceof Bicicleta?"buzina_bike":"buzina",this.volume); }
    // --- Music Methods ---
    setMusica(aE, nA){ this.pararMusica(); this.musica=aE; this.musicaNome=nA||"Música carregada"; if(this.musica instanceof Audio){this.musica.loop=true;this.musica.volume=this.volume;} if(Cache.nomeMusicaDiv) Cache.nomeMusicaDiv.textContent=`Música: ${this.musicaNome}`; }
    tocarMusica(){ if(this instanceof Bicicleta){showNotification("Bikes não têm som.",'info');return;} if(this.musica instanceof Audio){this.musica.volume=this.volume; this.musica.play().then(()=>{this.musicaTocando=true;}).catch(e=>{showNotification(`Erro música: ${e.message}.`,'error');this.musicaTocando=false;});}else{showNotification("Nenhuma música carregada.", 'warning');}}
    pararMusica(){ if(this.musicaTocando&&this.musica instanceof Audio){this.musica.pause(); this.musica.currentTime=0; this.musicaTocando=false;}}
    // --- Maintenance Methods ---
    adicionarManutencao(m){ if(!(m instanceof Manutencao)){showNotification("Erro: Manutenção inválida.", "error"); return;} this.historicoManutencao.push(m); this.historicoManutencao.sort((a,b)=>b.getDataObj()-a.getDataObj()); salvarGaragem(); updateManutencaoDisplay(); showNotification("Manutenção registrada!",'success');}
    getHistoricoFormatado(){const h=this.historicoManutencao.filter(m=>m.isHistorico()).map(m=>`<p>${m.formatar()}</p>`); return h.length>0?h.join(''):"<p>Nenhum histórico.</p>";}
    getAgendamentosFormatados(){const a=this.historicoManutencao.filter(m=>m.isAgendamento()).sort((a,b)=>a.getDataObj()-b.getDataObj()).map(m=>`<p>${m.formatar()}</p>`); return a.length>0?a.join(''):"<p>Nenhum agendamento.</p>";}
    // --- Display & Info ---
    exibirInformacoesBase(){const n=this.nickname?`"${this.nickname}" `:''; return `${n}Modelo: ${this.modelo}, Cor: ${this.cor}`;}
    exibirInformacoes(){return this.exibirInformacoesBase();}
    updateDisplay() {
        if(Cache.informacoesVeiculoDiv) Cache.informacoesVeiculoDiv.innerHTML = this.exibirInformacoes();
        if(Cache.nicknameDisplaySpan) Cache.nicknameDisplaySpan.textContent = this.nickname ? `(${this.nickname})` : '';
        updateVelocidadeDisplay(this.velocidade); updateStatusVeiculo(this.ligado);
        if(Cache.imagemExibidaImg){ if(this.imagem){Cache.imagemExibidaImg.src=this.imagem; Cache.imagemExibidaImg.style.display='block';}else{Cache.imagemExibidaImg.src=''; Cache.imagemExibidaImg.style.display='none';} }
        if(Cache.nomeMusicaDiv) Cache.nomeMusicaDiv.textContent = `Música: ${this.musicaNome}`;

        const isCaminhao=this instanceof Caminhao; const isAviao=this instanceof Aviao; const isEsportivo=this instanceof CarroEsportivo; const isBicicleta=this instanceof Bicicleta;

        if(Cache.fuelDisplayContainerDiv && Cache.fuelLevelValorSpan && Cache.fuelLevelBarDiv){ if(isBicicleta){Cache.fuelDisplayContainerDiv.style.display='none';}else{Cache.fuelDisplayContainerDiv.style.display='block'; const p=Math.round((this.fuelLevel/this.fuelCapacity)*100); Cache.fuelLevelValorSpan.textContent=p; Cache.fuelLevelBarDiv.style.width=`${p}%`; Cache.fuelLevelBarDiv.style.backgroundColor=p<20?'#f44336':p<50?'#ff9800':'#4CAF50';}}
        if(Cache.cargaAtualDisplayDiv){ Cache.cargaAtualDisplayDiv.style.display=isCaminhao?'block':'none'; if(isCaminhao&&Cache.cargaAtualValorSpan)Cache.cargaAtualValorSpan.textContent=this.cargaAtual; }
        if(Cache.altitudeDisplayDiv){ Cache.altitudeDisplayDiv.style.display=isAviao?'block':'none'; if(isAviao&&Cache.altitudeValorSpan)Cache.altitudeValorSpan.textContent=this.altitude; }

        document.querySelector('button[data-acao="turbo"]')?.style.setProperty('display',isEsportivo?'inline-block':'none');
        document.getElementById("btnCarregar")?.style.setProperty('display',isCaminhao?'inline-block':'none'); document.getElementById("btnDescarregar")?.style.setProperty('display',isCaminhao?'inline-block':'none');
        document.getElementById("btnDecolar")?.style.setProperty('display',isAviao?'inline-block':'none'); document.getElementById("btnAterrissar")?.style.setProperty('display',isAviao?'inline-block':'none');
        document.getElementById("btnReabastecer")?.style.setProperty('display',isBicicleta?'none':'inline-block');
        const dSM=isBicicleta?'none':'inline-block'; document.querySelector('button[data-acao="ligar"]')?.style.setProperty('display',dSM); document.querySelector('button[data-acao="desligar"]')?.style.setProperty('display',dSM);

        this.volume = parseFloat(Cache.volumeGeralInput?.value || DEFAULT_VOLUME); if(this.musica&&this.musicaTocando){this.musica.volume=this.volume;}
    }
    // --- Persistence ---
    toPlainObject(){ let p={tipoVeiculo:this.constructor.name,modelo:this.modelo,cor:this.cor,nickname:this.nickname,imagem:this.imagem,ligado:this.ligado,velocidade:this.velocidade,fuelLevel:this.fuelLevel,musicaNome:this.musicaNome,volume:this.volume,historicoManutencao:this.historicoManutencao.map(m=>m.toPlainObject())}; if(this instanceof CarroEsportivo)p.turboAtivado=this.turboAtivado; if(this instanceof Caminhao){p.capacidadeCarga=this.capacidadeCarga; p.cargaAtual=this.cargaAtual;} if(this instanceof Aviao){p.envergadura=this.envergadura; p.altitude=this.altitude; p.voando=this.voando;} if(this instanceof Bicicleta){p.tipo=this.tipo;} return p; }
}

// --- Subclasses ---
class Carro extends Veiculo { exibirInformacoes(){return `[Carro] ${super.exibirInformacoesBase()}`;}}
class CarroEsportivo extends Veiculo { constructor(m,c,n,i,l,v,f,h,t){super(m,c,n,i,l,v,f,h);this.turboAtivado=Boolean(t);} ativarTurbo(){if(!this.ligado){showNotification("Ligue antes.","warning");return;} if(this.turboAtivado)return; if(!this.consumirCombustivel(TURBO_ACTIVATION_FUEL_COST)){showNotification("Sem comb. p/ turbo!","warning");return;} playSound("turbo",this.volume);this.turboAtivado=true;showNotification("Turbo ATIVADO!",'info');this.updateDisplay();salvarGaragem();} exibirInformacoes(){return `[Esportivo] ${super.exibirInformacoesBase()}, Turbo: ${this.turboAtivado?'ON':'OFF'}`;}}
class Caminhao extends Veiculo { constructor(m,c,n,cap,i,l,v,f,h,car){super(m,c,n,i,l,v,f,h);const cN=parseInt(cap)||1000;if(cN<=0)throw new Error("Capacidade inválida.");this.capacidadeCarga=cN;this.cargaAtual=Math.max(0,Math.min(parseInt(car)||0,this.capacidadeCarga));} carregar(q){const num=parseInt(q);if(isNaN(num)||num<=0){showNotification("Qtd inválida.","warning");return;}const e=this.capacidadeCarga-this.cargaAtual;if(num>e){showNotification(`Excede capacidade. Max: ${e}.`,"warning");return;}this.cargaAtual+=num;showNotification(`Carregado: ${num}. Atual: ${this.cargaAtual}.`,'info');this.updateDisplay();salvarGaragem();} descarregar(q){const num=parseInt(q);if(isNaN(num)||num<=0){showNotification("Qtd inválida.","warning");return;}if(num>this.cargaAtual){showNotification(`Insuficiente. Atual: ${this.cargaAtual}.`,"warning");return;}this.cargaAtual-=num;showNotification(`Descarregado: ${num}. Atual: ${this.cargaAtual}.`,'info');this.updateDisplay();salvarGaragem();} exibirInformacoes(){return `[Caminhão] ${super.exibirInformacoesBase()}, Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;}}
class Aviao extends Veiculo { constructor(m,c,n,env,i,l,v,f,h,alt,voa){super(m,c,n,i,l,v,f,h);const eN=parseFloat(env)||30;if(eN<=0)throw new Error("Envergadura inválida.");this.envergadura=eN;this.altitude=Math.max(0,parseInt(alt)||0);this.voando=Boolean(voa);} decolar(){if(!this.ligado){showNotification("Ligue antes.");return;} if(this.voando){showNotification("Já voando.");return;} if(this.velocidade<MIN_TAKEOFF_SPEED){showNotification(`Acelere > ${MIN_TAKEOFF_SPEED}.`);return;} if(!this.consumirCombustivel(TAKEOFF_FUEL_COST)){showNotification("Sem comb. p/ decolar!","warning");return;} playSound("decolar",this.volume);this.voando=true;this.altitude=1000;showNotification("Decolagem OK!",'info');this.updateDisplay();salvarGaragem();} aterrissar(){if(!this.voando){showNotification("Já em solo.");return;} if(this.velocidade>MAX_LANDING_SPEED){showNotification(`Vel alta (${this.velocidade}). Reduza < ${MAX_LANDING_SPEED}.`);return;} playSound("aterrissar",this.volume);this.voando=false;this.altitude=0;showNotification("Pouso OK!",'info');this.updateDisplay();salvarGaragem();} exibirInformacoes(){return `[Avião] ${super.exibirInformacoesBase()}, Env: ${this.envergadura}m, Alt: ${this.altitude}m, Voando: ${this.voando?'Sim':'Não'}`;}}
class Moto extends Veiculo {constructor(m,c,n,i,l,v,f,h){super(m,c,n,i,l,v,f,h);} exibirInformacoes(){return `[Moto] ${super.exibirInformacoesBase()}`;}}
class Bicicleta extends Veiculo {constructor(m,c,n,t,i,v,h){super(m,c,n,i,false,v,DEFAULT_FUEL,h);this.tipo=['montanha','estrada','urbana'].includes(t)?t:'urbana';} exibirInformacoes(){return `[Bicicleta] ${super.exibirInformacoesBase()}, Tipo: ${this.tipo}`;}}

// --- Variáveis Globais ---
let garagem = {}; let veiculoSelecionado = null; let modoEdicao = false;
// --- Sons ---
const sons = { ligar: new Audio('sounds/ligar.mp3'), desligar: new Audio('sounds/desligar.mp3'), acelerar: new Audio('sounds/aceleracao.mp3'), frear: new Audio('sounds/freio.mp3'), buzina: new Audio('sounds/buzina.mp3'), buzina_bike: new Audio('sounds/bike_bell.mp3'), turbo: new Audio('sounds/turbo.mp3'), decolar: new Audio('sounds/decolar.mp3'), aterrissar: new Audio('sounds/aterrissar.mp3') };
Object.values(sons).forEach(s => s.load());

// --- Funções Auxiliares ---

/**
 * Mostra uma notificação não-bloqueante na tela.
 * @param {string} message - Mensagem a exibir.
 * @param {'info'|'success'|'warning'|'error'} type - Tipo da notificação.
 * @param {number} duration - Duração em milissegundos.
 */
function showNotification(message, type = 'info', duration = NOTIFICATION_DURATION) {
    if (!Cache.notificationAreaDiv) { // Fallback if notification area not ready/found
        console.warn("Notification area not found, using alert as fallback.");
        showAlert(message, type); // Use original showAlert if needed
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`; // Add classes for styling
    notification.textContent = message;

    Cache.notificationAreaDiv.appendChild(notification);

    // Auto-remove notification after duration
    setTimeout(() => {
        notification.style.opacity = '0'; // Fade out effect
        setTimeout(() => {
            if (notification.parentNode === Cache.notificationAreaDiv) {
                Cache.notificationAreaDiv.removeChild(notification);
            }
        }, 500); // Remove after fade out transition (adjust timing based on CSS)
    }, duration);
}

// (showAlert remains as a fallback, but primary usage should be showNotification)
function showAlert(message, type = 'info') { const prefix = type === 'error' ? 'ERRO' : type === 'success' ? 'SUCESSO' : type === 'warning' ? 'AVISO' : 'INFO'; console.log(`[${type.toUpperCase()}] ${message}`); alert(`[${prefix}] ${message}`); }
function updateVelocidadeDisplay(velocidade) { if(!Cache.velocidadeValorSpan||!Cache.progressoVelocidadeDiv)return; const vel=Math.max(0,velocidade); Cache.velocidadeValorSpan.textContent=Math.round(vel); Cache.progressoVelocidadeDiv.style.width=`${Math.min(100,(vel/MAX_VISUAL_SPEED)*100)}%`; }
function updateStatusVeiculo(ligado) { if(!Cache.statusVeiculoDiv)return; const v=garagem[veiculoSelecionado]; if(v instanceof Bicicleta){Cache.statusVeiculoDiv.textContent="Pronta";Cache.statusVeiculoDiv.className="status-pronta";}else if(ligado){Cache.statusVeiculoDiv.textContent="Ligado";Cache.statusVeiculoDiv.className="status-ligado";}else{Cache.statusVeiculoDiv.textContent="Desligado";Cache.statusVeiculoDiv.className="status-desligado";}}
function playSound(nomeSom, volume) { const s=sons[nomeSom]; if(s instanceof Audio){try{s.volume=Math.max(0,Math.min(1,volume));s.currentTime=0;s.play().catch(e=>{if(e.name!=='NotAllowedError')console.warn(`Play fail ${nomeSom}: ${e.message}`)})}catch(err){console.error(`Sound error ${nomeSom}`,err);}}else{console.warn(`Som "${nomeSom}" N/A`);}}
function updateVolume() { if(!Cache.volumeGeralInput)return; const vol=parseFloat(Cache.volumeGeralInput.value); for(const k in sons){const s=sons[k];if(s instanceof Audio)s.volume=vol;} let v=garagem[veiculoSelecionado]; if(v instanceof Veiculo){v.volume=vol;if(v.musica instanceof Audio&&v.musicaTocando)v.musica.volume=vol;}}

// --- Funções de Persistência ---
function salvarGaragem() { try{const d={};for(const t in garagem){if(garagem.hasOwnProperty(t))d[t]=garagem[t]instanceof Veiculo?garagem[t].toPlainObject():null;}localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch(e){console.error("Erro save:",e);showNotification("Erro crítico ao salvar!",'error', 5000);}}
function carregarGaragem() { const gI={carro:null,esportivo:null,caminhao:null,aviao:null,moto:null,bicicleta:null}; garagem={...gI}; try{const s=localStorage.getItem(STORAGE_KEY); if(!s){console.log("Nenhum dado salvo.");return;} const gS=JSON.parse(s); for(const t in gI){if(gS.hasOwnProperty(t)){const vD=gS[t]; if(vD&&typeof vD==='object'&&vD.tipoVeiculo){let vR=null;const h=(Array.isArray(vD.historicoManutencao)?vD.historicoManutencao:[]).map(m=>Manutencao.fromPlainObject(m)).filter(Boolean);const n=vD.nickname||null;const f=typeof vD.fuelLevel==='number'?vD.fuelLevel:DEFAULT_FUEL;try{switch(vD.tipoVeiculo){case'Carro':vR=new Carro(vD.modelo,vD.cor,n,vD.imagem,vD.ligado,vD.velocidade,f,h);break;case'CarroEsportivo':vR=new CarroEsportivo(vD.modelo,vD.cor,n,vD.imagem,vD.ligado,vD.velocidade,f,h,vD.turboAtivado);break;case'Caminhao':vR=new Caminhao(vD.modelo,vD.cor,n,vD.capacidadeCarga,vD.imagem,vD.ligado,vD.velocidade,f,h,vD.cargaAtual);break;case'Aviao':vR=new Aviao(vD.modelo,vD.cor,n,vD.envergadura,vD.imagem,vD.ligado,vD.velocidade,f,h,vD.altitude,vD.voando);break;case'Moto':vR=new Moto(vD.modelo,vD.cor,n,vD.imagem,vD.ligado,vD.velocidade,f,h);break;case'Bicicleta':vR=new Bicicleta(vD.modelo,vD.cor,n,vD.tipo,vD.imagem,vD.velocidade,h);break;default:console.warn(`Tipo ${t}: ${vD.tipoVeiculo}`);}if(vR){vR.volume=typeof vD.volume==='number'?vD.volume:DEFAULT_VOLUME;vR.musicaNome=vD.musicaNome||"Nenhuma música";garagem[t]=vR;}}catch(err){console.error(`Erro ${t}:`,err,vD);showNotification(`Erro carregando ${t}.`,'error');garagem[t]=null;}}else if(vD!==null){console.warn(`Dados ${t} inválidos.`);garagem[t]=null;}else{garagem[t]=null;}}else{garagem[t]=null;}}}catch(e){console.error("Erro fatal load:",e);showNotification("Erro crítico load. Resetando.",'error',5000);try{localStorage.removeItem(STORAGE_KEY);}catch(ign){}garagem={...gI};}updateUIForSelectedVehicle();}

// --- Funções de Atualização da UI ---
function updateManutencaoDisplay() {
    const veiculo = garagem[veiculoSelecionado];
    if (!Cache.historicoManutencaoListaDiv || !Cache.agendamentosFuturosListaDiv) return;
    if (veiculo instanceof Veiculo) {
        Cache.historicoManutencaoListaDiv.innerHTML = veiculo.getHistoricoFormatado();
        Cache.agendamentosFuturosListaDiv.innerHTML = veiculo.getAgendamentosFormatados();
        verificarLembretesManutencao(veiculo);
    } else { Cache.historicoManutencaoListaDiv.innerHTML=""; Cache.agendamentosFuturosListaDiv.innerHTML=""; }
}
function verificarLembretesManutencao(veiculo) {
    if(!(veiculo instanceof Veiculo))return; const hoje=new Date(); hoje.setUTCHours(0,0,0,0); const am=new Date(hoje); am.setUTCDate(hoje.getUTCDate()+1); const ag=veiculo.historicoManutencao.filter(m=>m.isAgendamento()); ag.forEach(m=>{const d=m.getDataObj(); if(d.getTime()===hoje.getTime()){showNotification(`HOJE: ${m.tipo} (${veiculo.modelo})`,'info');}else if(d.getTime()===am.getTime()){showNotification(`AMANHÃ: ${m.tipo} (${veiculo.modelo})`,'info');}});
}

// --- Refactored UI Update Logic ---
function showElement(element, displayType = 'block') { if (element) element.style.display = displayType; }
function hideElement(element) { if (element) element.style.display = 'none'; }

function showVehicleCreationView() {
    const tipoSelecionadoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if(Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoSelecionadoTexto} (Novo)`;

    showElement(Cache.criarVeiculoSection);
    hideElement(Cache.informacoesVeiculoSection);
    hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection);
    hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm);
    hideElement(Cache.btnCancelarModificar);
    modoEdicao = false;

    if(Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Criar Novo ${tipoSelecionadoTexto}`;
    if(Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Criar Veículo";

    resetCreateForm();
    configureCreateFormFields(veiculoSelecionado);

    updateVelocidadeDisplay(0);
    updateStatusVeiculo(false);
    if(Cache.imagemExibidaImg) Cache.imagemExibidaImg.style.display = 'none';
}

function showVehicleDetailsView(veiculo) {
    const tipoSelecionadoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if(Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoSelecionadoTexto} (${veiculo.modelo})`;

    hideElement(Cache.criarVeiculoSection);
    showElement(Cache.informacoesVeiculoSection);
    showElement(Cache.acoesVeiculoSection);
    showElement(Cache.manutencaoVeiculoSection);
    showElement(Cache.btnMostrarModificarForm, 'inline-block');
    hideElement(Cache.btnCancelarModificar);

    // Show music section only if not a bike
    Cache.musicaVeiculoSection.style.display = (veiculo instanceof Bicicleta) ? 'none' : 'block';
    modoEdicao = false;

    // Populate details
    veiculo.updateDisplay();
    updateManutencaoDisplay();

    // Set hidden form state for potential modification
    if(Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoSelecionadoTexto}`;
    if(Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Salvar Modificações";
}

function showVehicleModificationView(veiculo) {
    const tipoSelecionadoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    modoEdicao = true;

    hideElement(Cache.informacoesVeiculoSection);
    hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection);
    hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm);

    showElement(Cache.criarVeiculoSection);
    showElement(Cache.btnCancelarModificar, 'inline-block');

    prefillModifyForm();

    if(Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoSelecionadoTexto} (${veiculo.modelo})`;
    if(Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Salvar Modificações";
    const imageHelpText = document.createElement('small'); // Add help text for image
    imageHelpText.id = 'image-help-text';
    imageHelpText.textContent = ' Deixe vazio para manter a imagem atual.';
    imageHelpText.style.display = 'block';
    Cache.imagemInput?.parentNode?.insertBefore(imageHelpText, Cache.imagemInput.nextSibling);

}

/** Função central que direciona a atualização da UI. */
function updateUIForSelectedVehicle() {
    if (!Cache.detalhesVeiculoContainer || !Cache.tipoSelecionadoInfoDiv) { console.error("UI container/tipoInfo missing."); return; }
    configureCreateFormFields(null); // Reset specific fields visibility

    if (!veiculoSelecionado) {
        hideElement(Cache.detalhesVeiculoContainer);
        Cache.tipoSelecionadoInfoDiv.textContent = 'Nenhum tipo selecionado.';
        modoEdicao = false;
        // Clear residual displays if needed
        if (Cache.informacoesVeiculoDiv) Cache.informacoesVeiculoDiv.textContent = 'Selecione um tipo.';
        updateVelocidadeDisplay(0); updateStatusVeiculo(false);
        if(Cache.imagemExibidaImg) Cache.imagemExibidaImg.style.display = 'none';
        if(Cache.historicoManutencaoListaDiv) Cache.historicoManutencaoListaDiv.innerHTML = "";
        if(Cache.agendamentosFuturosListaDiv) Cache.agendamentosFuturosListaDiv.innerHTML = "";
        return;
    }

    showElement(Cache.detalhesVeiculoContainer);
    const veiculo = garagem[veiculoSelecionado];

    if (veiculo instanceof Veiculo) {
        showVehicleDetailsView(veiculo);
    } else {
        showVehicleCreationView();
    }
}

function configureCreateFormFields(tipo) {
    const dC=(tipo==='caminhao')?'block':'none'; const dA=(tipo==='aviao')?'block':'none'; const dB=(tipo==='bicicleta')?'block':'none';
    Cache.labelCapacidadeCarga?.style.setProperty('display',dC); Cache.capacidadeCargaInput?.style.setProperty('display',dC);
    Cache.labelEnvergadura?.style.setProperty('display',dA); Cache.envergaduraInput?.style.setProperty('display',dA);
    Cache.labelTipoBicicleta?.style.setProperty('display',dB); Cache.tipoBicicletaSelect?.style.setProperty('display',dB);
}
function resetCreateForm() {
    if(Cache.modeloInput) Cache.modeloInput.value=''; if(Cache.corInput) Cache.corInput.value=''; if(Cache.nicknameInput) Cache.nicknameInput.value=''; if(Cache.imagemInput) Cache.imagemInput.value=''; if(Cache.capacidadeCargaInput) Cache.capacidadeCargaInput.value=''; if(Cache.envergaduraInput) Cache.envergaduraInput.value=''; if(Cache.tipoBicicletaSelect) Cache.tipoBicicletaSelect.value='urbana';
    // Remove image help text if present
    document.getElementById('image-help-text')?.remove();
}
function prefillModifyForm() {
     const veiculo = garagem[veiculoSelecionado]; if (!veiculo) return;
     if(Cache.modeloInput) Cache.modeloInput.value=veiculo.modelo; if(Cache.corInput) Cache.corInput.value=veiculo.cor; if(Cache.nicknameInput) Cache.nicknameInput.value=veiculo.nickname||''; if(Cache.imagemInput) Cache.imagemInput.value='';
     configureCreateFormFields(veiculoSelecionado);
     if(veiculo instanceof Caminhao && Cache.capacidadeCargaInput) Cache.capacidadeCargaInput.value=veiculo.capacidadeCarga; if(veiculo instanceof Aviao && Cache.envergaduraInput) Cache.envergaduraInput.value=veiculo.envergadura; if(veiculo instanceof Bicicleta && Cache.tipoBicicletaSelect) Cache.tipoBicicletaSelect.value=veiculo.tipo;
}

// --- Event Listeners ---
function setupEventListeners() {
    // Seleção de Tipo
    Cache.selecaoVeiculoSection?.querySelectorAll("button[data-tipo]").forEach(button => {
        button.addEventListener("click", function(){
            const tipo = this.dataset.tipo; if (tipo !== veiculoSelecionado) { veiculoSelecionado = tipo; updateUIForSelectedVehicle(); }
        });
    });

    // Botão Mostrar Formulário de Modificação
    Cache.btnMostrarModificarForm?.addEventListener("click", function() {
        const veiculo = garagem[veiculoSelecionado]; if (!veiculo) return;
        showVehicleModificationView(veiculo);
    });

    // Botão Cancelar Modificação
    Cache.btnCancelarModificar?.addEventListener("click", function() {
        if (!modoEdicao) return;
        modoEdicao = false; updateUIForSelectedVehicle();
        // Remove image help text
        document.getElementById('image-help-text')?.remove();
    });

    // Botão Criar/Salvar
    Cache.btnCriarVeiculo?.addEventListener("click", handleCreateModifyVehicle);

    // Ações do Veículo (Event Delegation)
    Cache.acoesVeiculoSection?.addEventListener("click", handleVehicleAction);

    // Controles de Música
    Cache.btnTocarMusica?.addEventListener("click", handlePlayMusic);
    Cache.btnPararMusica?.addEventListener("click", handleStopMusic);
    Cache.musicaInputElement?.addEventListener("change", handleMusicFileSelect);

    // Formulário de Manutenção
    Cache.formAgendarManutencao?.addEventListener('submit', handleMaintenanceSubmit);

    // Volume Geral
    Cache.volumeGeralInput?.addEventListener("input", updateVolume);
}

// --- Event Handler Functions ---
function handleCreateModifyVehicle() {
    if (!veiculoSelecionado) { showNotification("Selecione um tipo!", 'warning'); return; }
    const modelo = Cache.modeloInput?.value.trim(); const cor = Cache.corInput?.value.trim(); const nickname = Cache.nicknameInput?.value.trim() || null;
    if (!modelo || !cor) { showNotification("Modelo e Cor obrigatórios!", 'error'); Cache.modeloInput?.focus(); return; }

    const capacidadeCargaValue = Cache.capacidadeCargaInput?.value; const envergaduraValue = Cache.envergaduraInput?.value; const tipoBicicleta = Cache.tipoBicicletaSelect?.value;

    if (veiculoSelecionado==='caminhao' && (capacidadeCargaValue==='' || isNaN(parseInt(capacidadeCargaValue)) || parseInt(capacidadeCargaValue) <= 0)) { showNotification("Capacidade inválida.", 'error'); Cache.capacidadeCargaInput?.focus(); return; }
    if (veiculoSelecionado==='aviao' && (envergaduraValue==='' || isNaN(parseFloat(envergaduraValue)) || parseFloat(envergaduraValue) <= 0)) { showNotification("Envergadura inválida.", 'error'); Cache.envergaduraInput?.focus(); return; }

    const veiculoExistente = garagem[veiculoSelecionado]; const isModifying = veiculoExistente instanceof Veiculo;

    const assignVehicle = (imagemURL = null) => {
        let vNovoMod;
        const hist = isModifying ? veiculoExistente.historicoManutencao : []; const lig = isModifying ? veiculoExistente.ligado : false; const vel = isModifying ? veiculoExistente.velocidade : 0; const vol = isModifying ? veiculoExistente.volume : parseFloat(Cache.volumeGeralInput?.value||DEFAULT_VOLUME); const mNome = isModifying ? veiculoExistente.musicaNome : "Nenhuma música"; const fuel = isModifying ? veiculoExistente.fuelLevel : DEFAULT_FUEL;
        const trb = (isModifying&&veiculoExistente instanceof CarroEsportivo)?veiculoExistente.turboAtivado:false; const car = (isModifying&&veiculoExistente instanceof Caminhao)?veiculoExistente.cargaAtual:0; const alt = (isModifying&&veiculoExistente instanceof Aviao)?veiculoExistente.altitude:0; const voa = (isModifying&&veiculoExistente instanceof Aviao)?veiculoExistente.voando:false;

        try {
            const finalImg = imagemURL ? imagemURL : (isModifying ? veiculoExistente.imagem : null);
            switch (veiculoSelecionado) {
                case 'carro': vNovoMod = new Carro(modelo, cor, nickname, finalImg, lig, vel, fuel, hist); break;
                case 'esportivo': vNovoMod = new CarroEsportivo(modelo, cor, nickname, finalImg, lig, vel, fuel, hist, trb); break;
                case 'caminhao': vNovoMod = new Caminhao(modelo, cor, nickname, capacidadeCargaValue, finalImg, lig, vel, fuel, hist, car); break;
                case 'aviao': vNovoMod = new Aviao(modelo, cor, nickname, envergaduraValue, finalImg, lig, vel, fuel, hist, alt, voa); break;
                case 'moto': vNovoMod = new Moto(modelo, cor, nickname, finalImg, lig, vel, fuel, hist); break;
                case 'bicicleta': vNovoMod = new Bicicleta(modelo, cor, nickname, tipoBicicleta, finalImg, vel, hist); break;
                default: throw new Error("Tipo inválido.");
            }
            vNovoMod.volume = vol; vNovoMod.musicaNome = mNome;
            garagem[veiculoSelecionado] = vNovoMod; salvarGaragem(); showNotification(`Veículo ${isModifying?'modificado':'criado'}!`, 'success');
            modoEdicao = false; updateUIForSelectedVehicle();
        } catch (error) { console.error("Erro assignVehicle:", error); showNotification(`Erro: ${error.message}`, 'error'); }
        finally { document.getElementById('image-help-text')?.remove(); } // Clean up help text regardless of outcome
    };

    const imagemFile = Cache.imagemInput?.files?.[0];
    if (imagemFile) { const r = new FileReader(); r.onload = (e) => assignVehicle(e.target.result); r.onerror = () => {showNotification("Erro lendo imagem.", 'error'); assignVehicle();}; r.readAsDataURL(imagemFile); } else { assignVehicle(); }
}

function handleVehicleAction(event) {
    const button = event.target.closest('button[data-acao]'); // Find the button even if icon is clicked
    if (!button) return; // Click was not on an action button or its child

    const acao = button.dataset.acao;
    const veiculo = garagem[veiculoSelecionado];
    if (!veiculo) { showNotification("Selecione veículo!", 'warning'); return; }

    console.log(`Ação (delegated): ${acao} para ${veiculo.modelo}`);
    try {
        switch (acao) {
            case 'ligar':       veiculo.ligar(); break;
            case 'desligar':    veiculo.desligar(); break;
            case 'acelerar':    veiculo.acelerar(10); break;
            case 'frear':       veiculo.frear(10); break;
            case 'buzinar':     veiculo.buzinar(); break;
            case 'reabastecer': veiculo.reabastecer(); break;
            case 'turbo':       if(veiculo instanceof CarroEsportivo) veiculo.ativarTurbo(); else showNotification("Só esportivos.", "warning"); break;
            case 'carregar':    if(veiculo instanceof Caminhao){ const q=prompt(`Carregar ${veiculo.modelo}? (Max: ${veiculo.capacidadeCarga-veiculo.cargaAtual})`); if(q!==null)veiculo.carregar(q); } else showNotification("Só caminhões.", "warning"); break;
            case 'descarregar': if(veiculo instanceof Caminhao){ const q=prompt(`Descarregar ${veiculo.modelo}? (Atual: ${veiculo.cargaAtual})`); if(q!==null)veiculo.descarregar(q); } else showNotification("Só caminhões.", "warning"); break;
            case 'decolar':     if(veiculo instanceof Aviao) veiculo.decolar(); else showNotification("Só aviões.", "warning"); break;
            case 'aterrissar':  if(veiculo instanceof Aviao) veiculo.aterrissar(); else showNotification("Só aviões.", "warning"); break;
            default: showNotification(`Ação "${acao}" N/A.`, "warning");
        }
    } catch (error) { console.error(`Erro ${acao}:`, error); showNotification(`Erro ${acao}: ${error.message}`, 'error'); }
}

function handlePlayMusic(){ let v=garagem[veiculoSelecionado]; if(v instanceof Veiculo&&!(v instanceof Bicicleta))v.tocarMusica(); else if(!v)showNotification("Selecione.",'warning'); else showNotification("Bikes não.",'info'); }
function handleStopMusic(){ let v=garagem[veiculoSelecionado]; if(v instanceof Veiculo)v.pararMusica(); else showNotification("Selecione.",'warning'); }
function handleMusicFileSelect(event){ let v=garagem[veiculoSelecionado]; const i=event.target; if(!v||v instanceof Bicicleta){showNotification("Selecione veículo.",'warning'); i.value=""; return;} const f=i.files?.[0]; if(f&&f.type.startsWith('audio/')){const r=new FileReader(); r.onload=(e)=>{try{const nA=new Audio(e.target.result); v.setMusica(nA, f.name); salvarGaragem();}catch(err){showNotification(`Erro áudio: ${err.message}`,'error'); i.value="";}}; r.onerror=()=>{showNotification("Erro lendo música.",'error'); i.value="";}; r.readAsDataURL(f);}else if(f){showNotification("Áudio inválido.",'warning'); i.value="";}}

function handleMaintenanceSubmit(event){
    event.preventDefault(); const v=garagem[veiculoSelecionado]; if(!v){showNotification("Selecione veículo.",'warning'); return;}
    const d=Cache.manutencaoDataInput?.value, t=Cache.manutencaoTipoInput?.value.trim(), c=Cache.manutencaoCustoInput?.value, ds=Cache.manutencaoDescricaoTextarea?.value.trim();
    if(!d||!t||c===''){showNotification("Data, Tipo, Custo obrigatórios.",'error'); return;}
    try{ const nM=new Manutencao(d,t,c,ds); v.adicionarManutencao(nM); if(Cache.manutencaoTipoInput)Cache.manutencaoTipoInput.value=''; if(Cache.manutencaoCustoInput)Cache.manutencaoCustoInput.value=''; if(Cache.manutencaoDescricaoTextarea)Cache.manutencaoDescricaoTextarea.value=''; /* Clear date? */ }
    catch(error){showNotification(`Erro agendar: ${error.message}`,'error');}
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Inicializando...");

    // --- Cache DOM Elements ---
    Cache.selecaoVeiculoSection = document.getElementById('selecao-veiculo');
    Cache.detalhesVeiculoContainer = document.getElementById('detalhes-veiculo-container');
    Cache.criarVeiculoSection = document.getElementById('criar-veiculo');
    Cache.informacoesVeiculoSection = document.getElementById('informacoes-veiculo');
    Cache.acoesVeiculoSection = document.getElementById('acoes-veiculo');
    Cache.musicaVeiculoSection = document.getElementById('musica-veiculo');
    Cache.manutencaoVeiculoSection = document.getElementById('manutencao-veiculo');
    Cache.configuracaoSomSection = document.getElementById('configuracao-som');
    Cache.tipoSelecionadoInfoDiv = document.getElementById('tipoSelecionadoInfo');
    Cache.criarModificarTituloH2 = document.getElementById('criarModificarTitulo');
    Cache.modeloInput = document.getElementById('modelo');
    Cache.corInput = document.getElementById('cor');
    Cache.nicknameInput = document.getElementById('nickname');
    Cache.imagemInput = document.getElementById('imagem');
    Cache.labelCapacidadeCarga = document.getElementById('labelCapacidadeCarga');
    Cache.capacidadeCargaInput = document.getElementById('capacidadeCarga');
    Cache.labelEnvergadura = document.getElementById('labelEnvergadura');
    Cache.envergaduraInput = document.getElementById('envergadura');
    Cache.labelTipoBicicleta = document.getElementById('labelTipoBicicleta');
    Cache.tipoBicicletaSelect = document.getElementById('tipoBicicleta');
    Cache.btnCriarVeiculo = document.getElementById('btnCriarVeiculo');
    Cache.btnCancelarModificar = document.getElementById('btnCancelarModificar');
    Cache.informacoesVeiculoDiv = document.getElementById('informacoesVeiculo');
    Cache.nicknameDisplaySpan = document.getElementById('nicknameDisplay');
    Cache.imagemExibidaImg = document.getElementById('imagemExibida');
    Cache.statusVeiculoDiv = document.getElementById('statusVeiculo');
    Cache.velocidadeValorSpan = document.getElementById('velocidadeValor');
    Cache.progressoVelocidadeDiv = document.getElementById('progressoVelocidade');
    Cache.fuelDisplayContainerDiv = document.getElementById('fuelDisplayContainer');
    Cache.fuelLevelValorSpan = document.getElementById('fuelLevelValor');
    Cache.fuelLevelBarDiv = document.getElementById('fuelLevelBar');
    Cache.cargaAtualDisplayDiv = document.getElementById('cargaAtualDisplay');
    Cache.cargaAtualValorSpan = document.getElementById('cargaAtualValor');
    Cache.altitudeDisplayDiv = document.getElementById('altitudeDisplay');
    Cache.altitudeValorSpan = document.getElementById('altitudeValor');
    Cache.btnMostrarModificarForm = document.getElementById('btnMostrarModificarForm');
    Cache.musicaInputElement = document.getElementById('musicaInput');
    Cache.btnTocarMusica = document.getElementById('btnTocarMusica');
    Cache.btnPararMusica = document.getElementById('btnPararMusica');
    Cache.nomeMusicaDiv = document.getElementById('nomeMusica');
    Cache.historicoManutencaoListaDiv = document.getElementById('historicoManutencaoLista');
    Cache.agendamentosFuturosListaDiv = document.getElementById('agendamentosFuturosLista');
    Cache.formAgendarManutencao = document.getElementById('formAgendarManutencao');
    Cache.manutencaoDataInput = document.getElementById('manutencaoData');
    Cache.manutencaoTipoInput = document.getElementById('manutencaoTipo');
    Cache.manutencaoCustoInput = document.getElementById('manutencaoCusto');
    Cache.manutencaoDescricaoTextarea = document.getElementById('manutencaoDescricao');
    Cache.volumeGeralInput = document.getElementById('volumeGeral');

    // Create Notification Area dynamically
    Cache.notificationAreaDiv = document.createElement('div');
    Cache.notificationAreaDiv.id = 'notification-area';
    // Add some basic inline styles or use CSS file
    Cache.notificationAreaDiv.style.position = 'fixed';
    Cache.notificationAreaDiv.style.bottom = '10px';
    Cache.notificationAreaDiv.style.right = '10px';
    Cache.notificationAreaDiv.style.zIndex = '1000';
    document.body.appendChild(Cache.notificationAreaDiv);
    // Remember to add CSS for .notification, .notification-info, .notification-success etc.

    // Load data
    carregarGaragem();
    // Set initial volume
    updateVolume();
    // Setup Date Picker
    try { if(typeof flatpickr === "function") { flatpickr(Cache.manutencaoDataInput, { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", allowInput: true }); console.log("Flatpickr OK."); } else { console.log("Flatpickr N/A."); } } catch (e) { console.error("Erro Flatpickr:", e); }
    // Setup Event Listeners
    setupEventListeners();

    console.log("App Pronto.");
});