/* ==============================
   ATELIÊ BELLA — APP.JS
   Antes de publicar: preencha firebaseConfig e altere ADMIN_PIN.
   ============================== */
const ADMIN_PIN = '1234';
const WHATSAPP_SALAO = '5585994081708'; // WhatsApp do salão: +55 (85) 99408-1708.
const firebaseConfig = {
  apiKey: 'AIzaSyCNZ48xUqIYUpG75AVeO89bOAyo0Kwo-6Q',
  authDomain: 'atelie-bella.firebaseapp.com',
  projectId: 'atelie-bella',
  storageBucket: 'atelie-bella.firebasestorage.app',
  messagingSenderId: '21463689372',
  appId: '1:21463689372:web:86d8c60a4e3c0e6d80a559',
  measurementId: 'G-WESNKNRGNY'
};

const DEMO_SERVICES = [
  {id:'s1',name:'Manicure clássica',description:'Cuidado completo para mãos e unhas.',price:35,duration:45,icon:'♡'},
  {id:'s2',name:'Pedicure clássica',description:'Relaxamento e acabamento impecável.',price:40,duration:50,icon:'✦'},
  {id:'s3',name:'Combo Pé + Mão',description:'Os dois cuidados com preço especial.',price:68,duration:90,icon:'✧'},
  {id:'s4',name:'Alongamento em gel',description:'Unhas longas, resistentes e lindas.',price:150,duration:150,icon:'◇'},
  {id:'s5',name:'Nail art',description:'Detalhes personalizados para seu estilo.',price:25,duration:30,icon:'✿'},
  {id:'s6',name:'Spa dos pés',description:'Esfoliação, hidratação e massagem.',price:55,duration:60,icon:'❋'}
];
const DEMO_PRODUCTS = [
  {id:'p1',name:'Óleo de cutículas',description:'Hidratação diária com aroma suave.',price:24.9,image:'imagens/oleo-cuticulas.jpg'},
  {id:'p2',name:'Creme para mãos',description:'Toque macio sem oleosidade.',price:29.9,image:'imagens/creme-maos.jpg'},
  {id:'p3',name:'Esmalte premium',description:'Cores selecionadas do Ateliê.',price:18.9,image:'imagens/esmalte-premium.jpg'},
  {id:'p4',name:'Kit autocuidado',description:'Creme + óleo em um kit especial.',price:45,image:'imagens/kit-autocuidado.jpg'}
];
const state={services:[],products:[],appointments:[],selectedProducts:[],pendingBooking:null,firestore:null};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dateBR=d=>d?new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR'):'';
function saveLocal(){localStorage.setItem('bella_data',JSON.stringify({services:state.services,products:state.products}));}
function loadLocal(){try{const x=JSON.parse(localStorage.getItem('bella_data'));if(x){state.services=x.services||[];state.products=x.products||[]}}catch(e){console.warn(e)}state.appointments=[];if(!state.services.length)state.services=[...DEMO_SERVICES];if(!state.products.length)state.products=[...DEMO_PRODUCTS];state.products=state.products.map(p=>{const demo=DEMO_PRODUCTS.find(d=>d.id===p.id);return {...p,image:p.image||demo?.image}});saveLocal();}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3500)}
function whatsapp(text){return `https://wa.me/${WHATSAPP_SALAO}?text=${encodeURIComponent(text)}`}
function renderServices(){
  const activeServices=state.services.filter(s=>s.active!==false);
  $('#service-cards').innerHTML=activeServices.map(s=>`<article class="service-card"><div class="service-icon">${s.image?`<img src="${s.image}" alt="${s.name}">`:(s.icon||'✦')}</div><h3>${s.name}</h3><p>${s.description||'Atendimento personalizado.'}</p><div class="card-bottom"><span class="price">${brl(s.price)}</span><span class="duration">${s.duration} min</span><button class="select-service" data-service="${s.id}">Escolher →</button></div></article>`).join('');
  $('#service-select').innerHTML='<option value="">Selecione uma opção</option>'+activeServices.map(s=>`<option value="${s.id}">${s.name} — ${brl(s.price)}</option>`).join('');
  $$('.select-service').forEach(b=>b.onclick=()=>{$('#service-select').value=b.dataset.service;updateBooking();$('#agendamento').scrollIntoView({behavior:'smooth'})});
}
function renderProducts(){ $('#product-cards').innerHTML=state.products.map(p=>`<article class="product-card"><div class="product-image">${p.image?`<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.parentElement.classList.add('image-missing')">`:`<span>${p.icon||'◌'}</span>`}</div><div><h3>${p.name}</h3><p>${p.description||''}</p><div class="card-bottom"><span class="price">${brl(p.price)}</span><button class="add-product" data-product="${p.id}">Adicionar +</button></div></div></article>`).join('');$$('.add-product').forEach(b=>b.onclick=()=>{const p=state.products.find(x=>x.id===b.dataset.product);const i=state.selectedProducts.findIndex(x=>x.id===p.id);if(i>=0){state.selectedProducts.splice(i,1);b.textContent='Adicionar +'}else{state.selectedProducts.push(p);b.textContent='Adicionado ✓'}updateBooking()}) }
function openServiceModal(id){const s=id?state.services.find(x=>x.id===id):null;$('#service-modal-title').textContent=s?'Editar serviço':'Novo serviço';$('#edit-service-id').value=s?.id||'';$('#service-name-input').value=s?.name||'';$('#service-description-input').value=s?.description||'';$('#service-price-input').value=s?.price??'';$('#service-duration-input').value=s?.duration??'';$('#service-active-input').checked=s?.active!==false;$('#service-image-input').value=s?.image||'';const preview=$('#service-image-preview');if(s?.image){preview.src=s.image;preview.classList.remove('hidden')}else{preview.removeAttribute('src');preview.classList.add('hidden')}openModal('service-modal')}
function readImageFile(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const image=new Image();image.onerror=reject;image.onload=()=>{const max=900,scale=Math.min(1,max/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);let quality=.72,data=canvas.toDataURL('image/jpeg',quality);while(data.length>700000&&quality>.35){quality-=.08;data=canvas.toDataURL('image/jpeg',quality)}resolve(data)};image.src=reader.result};reader.readAsDataURL(file)})}
function normalizarDriveUrl(url){if(!url)return '';const match=url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);return match?`https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`:url}
function selectedService(){return state.services.find(s=>s.id===$('#service-select').value)}
function updateSummary(){const s=selectedService(), date=$('#date-select').value,time=$('#time-select').value;let total=(s?.price||0)+state.selectedProducts.reduce((a,p)=>a+Number(p.price),0);if(!s){$('#summary-content').innerHTML='<div class="empty-state">Selecione um serviço para<br>ver o resumo aqui.</div>'}else{$('#summary-content').innerHTML=`<div class="summary-line"><span>${s.name}<br><small>${s.duration} min</small></span><span>${brl(s.price)}</span></div>${state.selectedProducts.map(p=>`<div class="summary-line"><span>${p.name}</span><span>${brl(p.price)}</span></div>`).join('')}<div class="summary-line"><span>Data e horário</span><span>${date?dateBR(date):'A escolher'}${time?`<br>${time}`:''}</span></div>`}$('#summary-total').textContent=brl(total);$('#service-info').textContent=s?`${s.duration} minutos de atendimento · ${brl(s.price)}`:''}
function getTimes(date){const all=['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00'];const used=state.appointments.filter(a=>a.date===date&&a.status!=='Cancelado').map(a=>a.time);return all.filter(t=>!used.includes(t))}
function updateTimes(){const d=$('#date-select').value;const times=getTimes(d);$('#time-select').innerHTML='<option value="">Selecione</option>'+times.map(t=>`<option>${t}</option>`).join('');if(!times.length)$('#time-select').innerHTML='<option value="">Sem horários disponíveis</option>';updateSummary()}
function updateBooking(){updateSummary();updateTimes()}
function bookingData(){const s=selectedService();return {id:crypto.randomUUID?.()||Date.now().toString(),serviceId:s.id,service:s.name,price:Number(s.price),products:state.selectedProducts.map(p=>({name:p.name,price:p.price})),professional:$('#professional-select').value,date:$('#date-select').value,time:$('#time-select').value,name:$('#client-name').value.trim(),phone:$('#client-phone').value.trim(),notes:$('#client-notes').value.trim(),status:'Pendente',createdAt:new Date().toISOString()}}
async function saveAppointment(a){state.appointments.push(a);saveLocal();if(state.firestore){try{const {collection,addDoc}=window.FirebaseSDK;await addDoc(collection(state.firestore,'appointments'),a)}catch(e){console.warn('Firestore indisponível, salvo localmente.',e)}}}
function openModal(id){$(`#${id}`).classList.remove('hidden')}function closeModal(id){$(`#${id}`).classList.add('hidden')}
function showConfirm(a){state.pendingBooking=a;$('#confirm-content').innerHTML=`<div class="confirm-detail"><p><span>Serviço</span><strong>${a.service}</strong></p><p><span>Data</span><strong>${dateBR(a.date)} às ${a.time}</strong></p><p><span>Profissional</span><strong>${a.professional}</strong></p><p><span>Total estimado</span><strong>${brl(a.price+a.products.reduce((x,p)=>x+Number(p.price),0))}</strong></p></div>`;openModal('confirm-modal')}
function renderAdmin(){const today=new Date().toISOString().slice(0,10);const month=today.slice(0,7);const valid=state.appointments.filter(a=>a.status!=='Cancelado');const day=valid.filter(a=>a.date===today).reduce((t,a)=>t+a.price+a.products.reduce((x,p)=>x+Number(p.price),0),0);const monthTotal=valid.filter(a=>a.date?.startsWith(month)).reduce((t,a)=>t+a.price+a.products.reduce((x,p)=>x+Number(p.price),0),0);$('#admin-metrics').innerHTML=`<div class="metric"><small>FATURAMENTO DO DIA</small><strong>${brl(day)}</strong></div><div class="metric"><small>FATURAMENTO DO MÊS</small><strong>${brl(monthTotal)}</strong></div><div class="metric"><small>TOTAL DE ATENDIMENTOS</small><strong>${state.appointments.length}</strong></div>`;const filter=$('#admin-date-filter').value;let list=state.appointments.filter(a=>!filter||a.date===filter).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));$('#appointments-list').innerHTML=list.length?list.map(a=>`<div class="appointment"><div class="appointment-time">${a.time}</div><div class="appointment-info"><strong>${a.name}</strong><small>${a.service} · ${dateBR(a.date)} · ${a.phone}</small></div><span class="status ${a.status.toLowerCase()}">${a.status}</span><div class="appointment-actions"><button class="icon-button" data-wa="${a.id}">WhatsApp</button><button class="icon-button" data-done="${a.id}">Concluir</button></div></div>`).join(''):'<div class="empty-state">Nenhum agendamento encontrado.</div>';$$('[data-wa]').forEach(b=>b.onclick=()=>{const a=state.appointments.find(x=>x.id===b.dataset.wa);window.open(whatsapp(`Olá, ${a.name}! Lembrete do Ateliê Bella: seu atendimento de ${a.service} está marcado para ${dateBR(a.date)} às ${a.time}. Até lá!`),'_blank')});$$('[data-done]').forEach(b=>b.onclick=()=>{const a=state.appointments.find(x=>x.id===b.dataset.done);a.status='Concluído';saveLocal();syncStatusFirebase(a).catch(e=>console.warn('Status não sincronizado.',e));renderAdmin();toast('Atendimento marcado como concluído.')})}
function enterAdmin(){sessionStorage.setItem('bella_admin','1');$('#public-view').classList.add('hidden');$('.footer').classList.add('hidden');$('#admin-view').classList.remove('hidden');renderAdmin();window.scrollTo(0,0)}
function exitAdmin(){sessionStorage.removeItem('bella_admin');$('#admin-view').classList.add('hidden');$('.footer').classList.remove('hidden');$('#public-view').classList.remove('hidden')}
function initFirebase(){if(!window.FirebaseSDK||firebaseConfig.apiKey.startsWith('COLE_'))return;try{const app=window.FirebaseSDK.initializeApp(firebaseConfig);state.firestore=window.FirebaseSDK.getFirestore(app);const {collection,onSnapshot,query,orderBy}=window.FirebaseSDK;onSnapshot(query(collection(state.firestore,'appointments'),orderBy('createdAt','desc')),snap=>{state.appointments=snap.docs.map(d=>({id:d.id,...d.data()}));saveLocal();if(!$('#admin-view').classList.contains('hidden'))renderAdmin()})}catch(e){console.warn('Firebase não configurado:',e)}}
function setup(){loadLocal();renderServices();renderProducts();const min=new Date();min.setDate(min.getDate()+1);$('#date-select').min=min.toISOString().slice(0,10);$('#date-select').value=min.toISOString().slice(0,10);updateBooking();$$('[data-scroll]').forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));$('#service-select').onchange=updateBooking;$('#date-select').onchange=updateTimes;$('#time-select').onchange=updateSummary;$('#booking-form').onsubmit=e=>{e.preventDefault();if(!$('#time-select').value){toast('Escolha um horário disponível.');return}showConfirm(bookingData())};$('#confirm-booking').onclick=async()=>{const a=state.pendingBooking;const salvo=await saveAppointment(a);if(!salvo)return;const total=a.price+a.products.reduce((x,p)=>x+Number(p.price),0);const text=`Olá! Gostaria de confirmar um agendamento no Ateliê Bella.%0A%0ACódigo: ${a.id.slice(0,8).toUpperCase()}%0ACliente: ${a.name}%0AWhatsApp: ${a.phone}%0AServiço: ${a.service}%0AProfissional: ${a.professional}%0AData: ${dateBR(a.date)} às ${a.time}%0AProdutos: ${a.products.map(p=>p.name).join(', ')||'Nenhum'}%0ATotal estimado: ${brl(total)}%0AObservações: ${a.notes||'Nenhuma'}`;closeModal('confirm-modal');toast('Agendamento salvo! Abrindo WhatsApp...');setTimeout(()=>window.open(`https://wa.me/${WHATSAPP_SALAO}?text=${text}`,'_blank'),500);renderAdmin()};$('#admin-access').onclick=()=>openModal('pin-modal');$('#pin-submit').onclick=()=>{if($('#admin-pin').value===ADMIN_PIN){closeModal('pin-modal');enterAdmin()}else $('#pin-error').textContent='PIN incorreto. Tente novamente.'};$('#logout-button').onclick=exitAdmin;$('#admin-date-filter').onchange=renderAdmin;$('#load-demo-button').onclick=()=>{state.services=[...DEMO_SERVICES];state.products=[...DEMO_PRODUCTS];saveLocal();renderServices();renderProducts();toast('Dados demonstrativos restaurados.')};$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));if(location.hash==='#admin' || sessionStorage.getItem('bella_admin')){if(sessionStorage.getItem('bella_admin'))enterAdmin();else openModal('pin-modal')}initFirebase()}
window.addEventListener('firebase-sdk-ready',initFirebase);document.addEventListener('DOMContentLoaded',()=>{setup();setTimeout(initFirebase,800);setTimeout(()=>{if(!firebasePronto())toast('Firebase não conectou. O painel não será salvo até a conexão voltar.')},3500)});

/* Não tenta abrir o WhatsApp enquanto o número de exemplo não for trocado. */
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{const btn=$('#confirm-booking');if(!btn)return;const original=btn.onclick;btn.onclick=async e=>{if(WHATSAPP_SALAO==='5500000000000'){toast('Configure primeiro o WhatsApp do salão no app.js.');return}return original(e)}},0)});

/* Exclusão individual pelo painel de gestão. */
const bellaRenderAdminOriginal = renderAdmin;
renderAdmin = function(){
  bellaRenderAdminOriginal();
  $$('.appointment-actions').forEach(actions=>{
    const done=actions.querySelector('[data-done]');
    if(!done || actions.querySelector('[data-delete]')) return;
    const del=document.createElement('button');
    del.className='icon-button delete-button';
    del.dataset.delete=done.dataset.done;
    del.textContent='Excluir';
    actions.appendChild(del);
    del.onclick=async()=>{
      const appointment=state.appointments.find(x=>x.id===del.dataset.delete);
      if(!appointment) return;
      if(!confirm(`Excluir o agendamento de ${appointment.name} em ${dateBR(appointment.date)} às ${appointment.time}?`)) return;
      state.appointments=state.appointments.filter(x=>x.id!==appointment.id);
      saveLocal();
      try{
        await excluirFirebase('appointments',appointment.id);
      }catch(error){
        console.warn('Não foi possível excluir no Firebase.',error);
        toast('Não foi possível excluir no Firebase. Tente novamente.');
        return;
      }
      renderAdmin();
      toast('Agendamento excluído.');
    };
  });
};

function renderServiceManager(){
  const container=$('#service-manager');
  if(!container)return;
  container.innerHTML=state.services.map(s=>`<div class="managed-service"><div class="managed-service-photo">${s.image?`<img src="${s.image}" alt="${s.name}">`:'<span>✦</span>'}</div><div class="managed-service-info"><strong>${s.name}</strong><small>${s.description||''}</small><span>${brl(s.price)} · ${s.duration} min · ${s.active===false?'Desativado':'Ativo'}</span></div><div class="managed-service-actions"><button class="icon-button" data-edit-service="${s.id}">Editar</button><button class="icon-button" data-toggle-service="${s.id}">${s.active===false?'Ativar':'Desativar'}</button><button class="icon-button delete-button" data-remove-service="${s.id}">Excluir</button></div></div>`).join('')||'<div class="empty-state">Nenhum serviço cadastrado.</div>';
  $$('[data-edit-service]').forEach(b=>b.onclick=()=>openServiceModal(b.dataset.editService));
  $$('[data-toggle-service]').forEach(b=>b.onclick=()=>{const s=state.services.find(x=>x.id===b.dataset.toggleService);if(!s)return;s.active=s.active===false;saveLocal();renderServices();renderServiceManager();syncServicoFirebase(s).catch(console.warn);toast(s.active?'Serviço ativado.':'Serviço desativado.')});
  $$('[data-remove-service]').forEach(b=>b.onclick=()=>{const s=state.services.find(x=>x.id===b.dataset.removeService);if(!s||!confirm(`Excluir o serviço ${s.name}?`))return;state.services=state.services.filter(x=>x.id!==s.id);saveLocal();renderServices();renderServiceManager();excluirFirebase('services',s.id).catch(console.warn);toast('Serviço excluído.')});
}
const bellaRenderServicesOriginal=renderServices;
renderServices=function(){bellaRenderServicesOriginal();state.services.forEach(s=>{const card=[...$$('.service-card')].find(c=>c.querySelector(`[data-service="${s.id}"]`));const image=card?.querySelector('.service-icon img');if(image){image.style.width='100%';image.style.height='100%';image.style.objectFit='cover';image.style.borderRadius='12px'}})};
const bellaRenderAdminWithServices=renderAdmin;
renderAdmin=function(){bellaRenderAdminWithServices();renderServiceManager()};
document.addEventListener('DOMContentLoaded',()=>{
  $('#add-service-button')?.addEventListener('click',()=>openServiceModal());
  $('#add-service-button-bottom')?.addEventListener('click',()=>openServiceModal());
  $('#service-image-input')?.addEventListener('input',e=>{const url=normalizarDriveUrl(e.target.value.trim()),preview=$('#service-image-preview');if(url){preview.src=url;preview.classList.remove('hidden')}else{preview.removeAttribute('src');preview.classList.add('hidden')}});
  $('#service-form')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('#edit-service-id').value;const existing=state.services.find(s=>s.id===id);const driveImage=normalizarDriveUrl($('#service-image-input').value.trim());const service={id:id||`s${Date.now()}`,name:$('#service-name-input').value.trim(),description:$('#service-description-input').value.trim(),price:Number($('#service-price-input').value),duration:Number($('#service-duration-input').value),active:$('#service-active-input').checked,image:driveImage||existing?.image||'',icon:existing?.icon||'✦'};try{if(existing)Object.assign(existing,service);else state.services.push(service);saveLocal();renderServices();renderServiceManager();await syncServicoFirebase(service);toast('Serviço e link da foto salvos no Firebase.');closeModal('service-modal')}catch(error){console.error(error);toast('Não foi possível salvar o serviço no Firebase.')}});
});

/* ==============================
   FIREBASE — DADOS COMPARTILHADOS
   ============================== */
async function aguardarFirebase(){
  if(firebasePronto())return true;
  initFirebase();
  for(let tentativa=0;tentativa<25;tentativa++){
    if(firebasePronto())return true;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  return false;
}
function firebasePronto(){return !!(state.firestore&&window.FirebaseSDK)}
async function syncServicoFirebase(servico){
  if(!await aguardarFirebase())throw new Error('Firebase ainda não conectou.');
  const {doc,setDoc}=window.FirebaseSDK;
  await setDoc(doc(state.firestore,'services',String(servico.id)),servico,{merge:true});
}
async function syncStatusFirebase(agendamento){
  if(!await aguardarFirebase())throw new Error('Firebase ainda não conectou.');
  const {collection,query,where,getDocs,doc,updateDoc,setDoc}=window.FirebaseSDK;
  const encontrados=await getDocs(query(collection(state.firestore,'appointments'),where('id','==',String(agendamento.id))));
  if(!encontrados.empty){await updateDoc(doc(state.firestore,'appointments',encontrados.docs[0].id),{status:agendamento.status});return;}
  await setDoc(doc(state.firestore,'appointments',String(agendamento.id)),{...agendamento,status:agendamento.status},{merge:true});
}
async function excluirFirebase(colecao,id){
  if(!await aguardarFirebase())throw new Error('Firebase ainda não conectou.');
  const {collection,query,where,getDocs,doc,deleteDoc}=window.FirebaseSDK;
  const encontrados=await getDocs(query(collection(state.firestore,colecao),where('id','==',String(id))));
  if(!encontrados.empty){await deleteDoc(doc(state.firestore,colecao,encontrados.docs[0].id));return;}
  await deleteDoc(doc(state.firestore,colecao,String(id)));
}
const firebaseInitOriginal=initFirebase;
initFirebase=function(){
  if(!window.FirebaseSDK||firebaseConfig.apiKey.startsWith('COLE_'))return;
  try{
    if(!state.firestore){
      const app=window.FirebaseSDK.getApps().length?window.FirebaseSDK.getApp():window.FirebaseSDK.initializeApp(firebaseConfig);
      state.firestore=window.FirebaseSDK.getFirestore(app);
    }
    const {collection,onSnapshot}=window.FirebaseSDK;
    if(!state.appointmentsListenerAttached){
      state.appointmentsListenerAttached=true;
      onSnapshot(collection(state.firestore,'appointments'),snap=>{
        state.appointments=snap.docs.map(d=>({id:d.id,...d.data()}));
        if(!$('#admin-view').classList.contains('hidden'))renderAdmin();
      },error=>{state.appointmentsListenerAttached=false;console.warn('Erro ao ouvir agendamentos:',error)});
    }
    if(!state.servicesListenerAttached){
      state.servicesListenerAttached=true;
      onSnapshot(collection(state.firestore,'services'),snap=>{
        state.services=snap.docs.map(d=>({id:d.id,...d.data()}));
        if(!snap.empty){saveLocal();renderServices();renderProducts();if(!$('#admin-view').classList.contains('hidden'))renderAdmin();}
      },error=>{state.servicesListenerAttached=false;console.warn('Erro ao ouvir serviços:',error)});
    }
  }catch(error){console.warn('Firebase não configurado:',error)}
};
const salvarAppointmentFirebase=saveAppointment;
saveAppointment=async function(a){
  if(!await aguardarFirebase()){toast('Firebase não conectou. Verifique a internet e tente novamente.');return false;}
  try{
    const {doc,setDoc}=window.FirebaseSDK;
    await setDoc(doc(state.firestore,'appointments',String(a.id)),a);
    return true;
  }catch(error){console.error(error);toast('Não foi possível salvar no Firebase. Verifique as regras do Firestore.')}
  return false;
};
const firebaseRenderAdminOriginal=renderAdmin;
renderAdmin=function(){
  firebaseRenderAdminOriginal();
  $$('[data-done]').forEach(b=>b.onclick=async()=>{const a=state.appointments.find(x=>x.id===b.dataset.done);if(!a)return;a.status='Concluído';saveLocal();try{await syncStatusFirebase(a)}catch(e){console.warn(e)}renderAdmin();toast('Atendimento marcado como concluído.')});
};
document.addEventListener('DOMContentLoaded',()=>{
  $('#service-form')?.addEventListener('submit',async()=>{setTimeout(async()=>{const id=$('#edit-service-id').value;const s=state.services.find(x=>x.id===id);if(s)try{await syncServicoFirebase(s);toast('Serviço sincronizado entre os dispositivos.')}catch(e){console.warn(e);toast('Serviço salvo localmente, mas não sincronizado.')}},250)});
});
