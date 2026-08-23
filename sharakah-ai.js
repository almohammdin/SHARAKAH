import {GoogleGenAI,Modality} from 'https://cdn.jsdelivr.net/npm/@google/genai@2.14.0/+esm';
import './sharakah-ai-appcheck.js?v=1.0.14';

const MODEL='gemini-3.1-flash-live-preview';
const INPUT_RATE=16000;
const OUTPUT_RATE=24000;
const TOKEN_TIMEOUT=10000;
const SESSION_IDLE=5*60*1000;

let session=null;
let connecting=null;
let voiceActive=false;
let micStream=null;
let micContext=null;
let outputContext=null;
let micSource=null;
let micProcessor=null;
let silentGain=null;
let outputGain=null;
let outputQueuedUntil=0;
let micSuppressed=false;
let assistantBubble=null;
let assistantText='';
let voiceUserBubble=null;
let voiceUserText='';
let idleTimer=null;

const $=selector=>document.querySelector(selector);
const endpoint=()=>String(window.SHARAKAH_AI_TOKEN_ENDPOINT||'').trim();
const normalize=text=>String(text||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'')
  .replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u064A0-9\s]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();

function resetIdle(){
  clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>disconnect('idle'),SESSION_IDLE);
}

function setState(text,state=''){
  const status=$('#assistantStatus');
  if(status){status.textContent=text;status.dataset.state=state;}
  const voice=$('#assistantVoice');
  voice?.classList.toggle('assistant-speaking',voiceActive);
  voice?.setAttribute('aria-pressed',String(voiceActive));
  $('#assistantStopVoice')?.classList.toggle('hide',!voiceActive);
  const label=document.querySelector('.assistant-mic-label');
  if(label)label.textContent=voiceActive?'المحادثة الصوتية تعمل الآن':'اضغط وابدأ الحديث';
}

function addMessage(text,role,sources=[]){
  const wrap=$('#assistantMessages');
  if(!wrap)return null;
  const msg=document.createElement('div');
  msg.className=`assistant-msg ${role}`;
  const body=document.createElement('span');
  body.className='assistant-msg-body';
  body.textContent=String(text||'');
  msg.appendChild(body);
  if(sources.length){
    const cite=document.createElement('span');
    cite.className='assistant-source';
    cite.textContent=sources.map(source=>`${source.source} — صفحة ${source.page}`).join(' | ');
    msg.appendChild(cite);
  }
  if(role==='bot'){
    const speak=document.createElement('button');
    speak.type='button';
    speak.className='assistant-listen';
    speak.textContent='🔊 استماع';
    speak.onclick=()=>speakText(body.textContent);
    msg.appendChild(speak);
  }
  wrap.appendChild(msg);
  wrap.scrollTop=wrap.scrollHeight;
  return msg;
}

function updateBubble(bubble,text){
  if(!bubble)return;
  const body=bubble.querySelector('.assistant-msg-body');
  if(body)body.textContent=text;
  const wrap=$('#assistantMessages');
  if(wrap)wrap.scrollTop=wrap.scrollHeight;
}

function specialistFor(query){
  const q=normalize(query);
  if(/زكاه|زكوي|ضريب/.test(q))return 'مستشار زكوي وضريبي';
  if(/تقييم|تقويم|قيمه عادله|حصه عينيه|اصل عيني/.test(q))return 'مقيّم معتمد';
  if(/محاسب|قوايم ماليه|مراجعه ماليه|تدقيق|ميزانيه/.test(q))return 'محاسب قانوني';
  if(/علامه|براءه|ملكيه فكريه|حقوق مولف|سر تجاري/.test(q))return 'مختص بالملكية الفكرية';
  if(/شرعي|شريعه|حلال|ربا|مضارب|مضاربه/.test(q))return 'مختص شرعي';
  return 'مختص شركات';
}

function searchKnowledge(args={}){
  const query=String(args.query||'').trim();
  const q=normalize(query);
  const knowledge=Array.isArray(window.SHARAKAH_KNOWLEDGE)?window.SHARAKAH_KNOWLEDGE:[];
  const stop=new Set(['ما','ماذا','هل','كيف','متي','على','علي','في','من','الى','عن','هذا','هذه','مع','او','اذا','التي','الذي']);
  const tokens=[...new Set(q.split(' ').filter(token=>token.length>2&&!stop.has(token)))];
  const requested=String(args.source||'all');
  const limit=Math.min(6,Math.max(2,Number(args.max_results)||4));
  const results=knowledge.map(item=>{
    const text=normalize(item.text);
    let score=tokens.reduce((sum,token)=>sum+(text.includes(token)?(token.length>5?5:3):0),0);
    if(/مضارب|عقد الشركه|ربح|خسار|حصه عينيه/.test(q)&&/المعاملات المدنية/.test(item.source))score+=10;
    if(/شركه|شركات|مساهم|مدير|حوكم|تاسيس|اندماج|تحول/.test(q)&&/نظام الشركات/.test(item.source))score+=7;
    if(requested==='companies'&&!/نظام الشركات/.test(item.source))score=-1;
    if(requested==='civil'&&!/المعاملات المدنية/.test(item.source))score=-1;
    return {...item,score};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,limit)
    .map(item=>({source:item.source,page:item.page,text:String(item.text||'').replace(/\s+/g,' ').trim().slice(0,1800)}));
  return {ok:true,query,count:results.length,results,specialist:specialistFor(query)};
}

function currentContext(){
  const app=window.SHARAKAH_APP;
  const value=id=>document.getElementById(id)?.value||'';
  if(!app)return {ok:true,stage:'unavailable'};
  return {ok:true,context:{
    partnership_type:app.type||'',
    project_name:value('projName'),
    legal_structure:value('legalStruct'),
    phase:app.phase,
    parties:(app.parties||[]).map(p=>({name:p.name,capacity:p.cap,cash:p.cash,assets:p.assets,ip:p.ip,measurable_commitment:p.net,work:p.work,current_ownership:p.currentPct,profit_share:p.profit})),
    calculated_results:(app.results||[]).map(r=>({name:r.name,ownership:r.pct,profit:r.profit,capital_share:r.capitalPct})),
    calculation_note:app.calculationError||'',
    dispute_direction:value('disputeMethod')
  }};
}

const BUILT_IN_EXAMPLES=[
  {id:'fnb',name:'مقهى الفجر',summary:'ممول مع مدير تشغيل في مشروع تشغيلي'},
  {id:'deal',name:'صفقة النخيل',summary:'ممول مع منفذ لصفقة تجارية محددة'},
  {id:'existing',name:'مطاعم الأصالة',summary:'دخول شريك جديد في شركة قائمة'},
  {id:'mudaraba',name:'مضاربة فندقية',summary:'رب مال يقدم التمويل ومضارب يقدم الإدارة'}
];

const STATIC_FIELDS=new Set([
  'projName','legalStruct','newInv','targetPct','preMoney','postMoney','entryMode','cashInAmt','cashOutAmt','sellerPartyId','coVal','entryAmt','entryPct',
  'mudScope','mudFee','managerName','decisionRule','fundingRule','agreementTerm','exitRule','keyNotes','amicableOn','amicableDays','disputeMethod','disputeNote'
]);

const PARTY_FIELDS=new Set(['name','cap','cash','assets','ip','net','work','fmv','paid','dur','role','vesting','vestYrs','cliffMo','vestNote','profit','currentPct','note']);
const NUMERIC_PARTY_FIELDS=new Set(['cash','assets','ip','net','fmv','paid','dur','vestYrs','cliffMo','profit','currentPct']);

function visibleElement(element){
  if(!element||element.closest('.hide'))return false;
  const style=getComputedStyle(element);
  return style.display!=='none'&&style.visibility!=='hidden';
}

function fieldLabel(element){
  const group=element.closest('.fg');
  const label=group?.querySelector('label');
  return String(label?.childNodes?.[0]?.textContent||label?.textContent||element.getAttribute('aria-label')||element.id).replace(/\s+/g,' ').trim();
}

function controlSnapshot(element){
  const result={target:element.id,label:fieldLabel(element),kind:element.tagName.toLowerCase(),value:String(element.value||'')};
  if(element.tagName==='SELECT'){
    result.selected=element.selectedOptions?.[0]?.textContent?.trim()||'';
    result.options=[...element.options].map(option=>({value:option.value,label:option.textContent.trim()}));
  }else{
    result.placeholder=element.placeholder||'';
  }
  return result;
}

function visibleScreen(){
  const app=window.SHARAKAH_APP;
  const phase=Number(app?.phase)||1;
  const active=document.querySelector('.phase.active')||document.getElementById(`ph${phase}`);
  const heading=active?.querySelector('h1')?.textContent?.trim()||'';
  const visibleText=[...(active?.querySelectorAll('h1,h2,h3,.ph-sub,.card-head,.section-head,.notice,.help,.example-help,.example-content,.agr-box,.agr-meta')||[])]
    .filter(visibleElement).map(node=>node.innerText?.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n').slice(0,10000);
  const controls=[...(active?.querySelectorAll('input[id],select[id],textarea[id]')||[])]
    .filter(element=>STATIC_FIELDS.has(element.id)&&visibleElement(element)).map(controlSnapshot);
  const parties=(app?.parties||[]).map((party,index)=>({
    party_id:party.id,position:index+1,name:party.name,capacity:party.cap,
    fields:[...PARTY_FIELDS].map(field=>({target:`party:${party.id}:${field}`,field,value:party[field]??''}))
  }));
  return {ok:true,screen:{phase,step_title:heading,visible_text:visibleText,partnership_type:app?.type||'',controls,parties,calculated_results:(app?.results||[]).map(r=>({name:r.name,ownership:r.pct,profit:r.profit,capital_share:r.capitalPct})),built_in_examples:BUILT_IN_EXAMPLES}};
}

function normalizedChoice(value){return normalize(String(value||'')).replace(/\s+/g,' ');}
function numericValue(value){
  const latin=String(value??'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,،\s%]/g,'');
  const number=Number(latin);
  return Number.isFinite(number)?number:0;
}

function selectValue(select,requested){
  const wanted=normalizedChoice(requested);
  const option=[...select.options].find(item=>normalizedChoice(item.value)===wanted||normalizedChoice(item.textContent)===wanted);
  return option?option.value:null;
}

async function updateForm(args={}){
  const app=window.SHARAKAH_APP;
  if(!app)return {ok:false,error:'platform-not-ready'};
  const updates=Array.isArray(args.updates)?args.updates.slice(0,30):[];
  const applied=[],rejected=[];
  let rerenderParties=false;
  let navigateTo=null;
  for(const update of updates){
    const target=String(update?.target||'').trim(),value=String(update?.value??'').trim();
    try{
      if(target==='partnership_type'){
        const wanted=normalizedChoice(value);
        const type=(app.TYPES||[]).find(item=>normalizedChoice(item.id)===wanted||normalizedChoice(item.name)===wanted);
        if(!type)throw new Error('قيمة نوع الشراكة غير معروفة');
        app.selType(type.id);applied.push({target,value:type.name});continue;
      }
      if(target==='load_example'){
        const wanted=normalizedChoice(value);
        const example=BUILT_IN_EXAMPLES.find(item=>normalizedChoice(item.id)===wanted||normalizedChoice(item.name)===wanted);
        if(!example)throw new Error('المثال غير معروف');
        app.loadExample(example.id);
        await new Promise(resolve=>setTimeout(resolve,180));
        applied.push({target,value:example.name});continue;
      }
      if(target==='add_party'){
        app.addParty(value?{name:value}:{});applied.push({target,value:value||'طرف جديد'});continue;
      }
      if(target==='navigate_step'){
        const step=Math.max(1,Math.min(5,Math.round(numericValue(value))));
        navigateTo=step;applied.push({target,value:step});continue;
      }
      const partyMatch=target.match(/^party:(\d+):([A-Za-z]+)$/);
      if(partyMatch){
        const id=Number(partyMatch[1]),field=partyMatch[2],party=app.parties.find(item=>item.id===id);
        if(!party||!PARTY_FIELDS.has(field))throw new Error('حقل الطرف غير معروف');
        let next=NUMERIC_PARTY_FIELDS.has(field)?numericValue(value):value;
        if(field==='work'){
          const workMap={لا:'no','دوام كامل':'full','نعم دوام كامل':'full','دوام جزئي':'part','نعم دوام جزئي':'part','لمدة محددة':'period','نعم لمدة محددة':'period'};
          next=workMap[normalizedChoice(value)]||value;
        }
        app.sp(id,field,next);rerenderParties=true;applied.push({target,value:next});continue;
      }
      if(STATIC_FIELDS.has(target)){
        const element=document.getElementById(target);
        if(!element)throw new Error('الحقل غير موجود في الصفحة');
        const next=element.tagName==='SELECT'?selectValue(element,value):value;
        if(next===null)throw new Error('الخيار غير متاح');
        element.value=next;
        element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));
        if(element.tagName!=='SELECT')element.dispatchEvent(new Event('change',{bubbles:true}));
        applied.push({target,value:element.tagName==='SELECT'?(element.selectedOptions?.[0]?.textContent?.trim()||next):value});continue;
      }
      throw new Error('الهدف غير مسموح');
    }catch(error){rejected.push({target,value,error:String(error?.message||error)});}
  }
  if(rerenderParties){app.renderParties();app.renderExistingSellerOptions();app.normalizeNumberInputs();}
  if(navigateTo!==null)app.go(navigateTo);
  return {ok:rejected.length===0,applied,rejected,current_screen:visibleScreen().screen};
}

const TOOL_DECLARATIONS=[
  {name:'search_legal_knowledge',description:'Search the supplied Saudi Companies Law and its Executive Regulations, or only the partnership and mudaraba chapters supplied from the Civil Transactions Law. Always use this before stating a legal rule, article or regulatory requirement.',parametersJsonSchema:{type:'object',properties:{query:{type:'string'},source:{type:'string',enum:['all','companies','civil']},max_results:{type:'number'}},required:['query'],additionalProperties:false}},
  {name:'get_partnership_context',description:'Read the user current partnership type, parties, contributions, calculated ownership/profit percentages and dispute direction from the platform before commenting on their case.',parametersJsonSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'get_visible_screen',description:'Read the exact currently open platform step, all visible explanatory text, visible field labels, their current values and choices, party field targets, results, and built-in examples. You MUST call this before answering any question about what is on screen, explaining a platform example or current step, or deciding which fields to fill.',parametersJsonSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'update_partnership_form',description:'Fill the platform on behalf of the user using only values the user explicitly provided. First call get_visible_screen, then submit updates using its exact targets. Targets include partnership_type, load_example, add_party, navigate_step, visible control ids such as projName or legalStruct, and party targets such as party:1:name, party:1:cash, party:2:work. Values must be strings. Never guess missing values.',parametersJsonSchema:{type:'object',properties:{updates:{type:'array',items:{type:'object',properties:{target:{type:'string'},value:{type:'string'}},required:['target','value'],additionalProperties:false}}},required:['updates'],additionalProperties:false}},
  {name:'identify_specialist',description:'Choose the appropriate specialist type for a complex question instead of referring every case only to a lawyer.',parametersJsonSchema:{type:'object',properties:{question:{type:'string'}},required:['question'],additionalProperties:false}}
];

function instruction(){
  return `أنت "مساعد بناء الشراكة" داخل منصة الشراكة. أنت مساعد ذكاء اصطناعي حواري حقيقي، ولست محرك بحث أو قائمة إجابات ثابتة.

اختصاصك محصور في:
1) بناء الشراكات واتفاق الشركاء وتأسيس الشركات وحوكمتها وفق نظام الشركات السعودي ولوائحه التنفيذية المرفقة.
2) أحكام عقد الشركة وعقد المضاربة فقط من نظام المعاملات المدنية المرفق. لا تتوسع في بقية أبواب النظام.
3) تحليل مدخلات المستخدم الحالية في حاسبة الشراكة وشرح أثر المساهمات والحصص والأرباح والخسائر والقرارات.

طريقة الحوار:
- تحدث بالعربية السعودية المهنية السهلة، وافهم سياق الرسائل السابقة داخل الجلسة ولا تطلب من المستخدم إعادة ما قاله.
- اسأل سؤالا واحدا واضحا في كل مرة عندما تحتاج معلومة ناقصة، وساعد المستخدم تدريجيا في بناء شراكته.
- لا تكتف بعرض مقتطفات. افهم النص، اربطه بحالة المستخدم، ثم اشرح النتيجة بوضوح واختصار.
- أنت داخل المنصة ولديك أداة تقرأ الشاشة الحالية وأداة تعبئ الحقول. قبل أن تشرح الصفحة المفتوحة أو أي مثال أو نتائج ظاهرة، استخدم get_visible_screen واقرأ النص والقيم الفعلية؛ لا تقل إنك لا تستطيع رؤية الشاشة.
- عندما يطلب المستخدم تعبئة البيانات، استخدم get_visible_screen أولا ثم update_partnership_form. عبئ فقط المعلومات التي ذكرها صراحة، ولا تخمّن قيمة ناقصة. بعد التنفيذ اذكر باختصار ما عبأته واسأل عن أول معلومة ناقصة.
- عند شرح مثال من أمثلة المنصة، حمّل المثال إذا طلب المستخدم ذلك، ثم اشرحه صفحة صفحة: اشرح الصفحة المفتوحة فقط اعتمادا على قيمها الظاهرة، وبعدها اسأل هل ينتقل للصفحة التالية. لا تعط شرحا عاما منفصلا عن بيانات المثال.
- قبل أي تقرير نظامي أو رقم مادة استخدم أداة search_legal_knowledge. اذكر اسم النظام ورقم المادة إن ظهر بوضوح في النتائج، ولا تخترع مادة أو حكما.
- استخدم get_partnership_context إذا كان السؤال عن بيانات المستخدم أو النسب التي حسبتها المنصة.
- نتائج المنصة ونقاشك نقاط أولية وليست عقدا نهائيا. التحكيم في المنصة توجه مبدئي وليس شرط تحكيم نهائيا.
- في المشاركة: ميّز بين نسبة الملكية ونسبة الربح، وبيّن أن الخسائر تخضع لحصة الشريك وفق النص المتاح. في المضاربة: لا تجعل الربح مبلغا ثابتا، وميّز خسارة رأس المال عن تعدي أو تقصير المضارب.
- لا تقدم إجابة قاطعة عند تعقّد الوقائع أو غياب نص واضح. قل: الأفضل مراجعة مختص مناسب، وحدد أحد هؤلاء بحسب المسألة: مختص شركات، محاسب قانوني، مستشار زكوي وضريبي، مقيّم معتمد، مختص شرعي، أو مختص بالملكية الفكرية.
- لا تحصر الإحالة في المحامي، ولا تنشئ ملخصا للمختص، ولا تتحدث عن الخصوصية أو البنية التقنية من تلقاء نفسك.
- إذا خرج السؤال عن نطاق الشراكات والشركات والمضاربة، اعتذر باختصار وأعد المستخدم إلى نطاق المنصة.
- إذا نفذت update_partnership_form فاذكر التغييرات التي أعادتها الأداة فقط، ولا تدّع تنفيذ شيء لم يظهر في نتيجة الأداة.`;
}

async function appCheckToken(force=false){
  if(typeof window.SharakahAIGetAppCheckToken!=='function')throw new Error('app-check-not-ready');
  const result=await window.SharakahAIGetAppCheckToken({forceRefresh:force});
  if(!result)throw new Error('app-check-token-missing');
  return result;
}

async function fetchToken(){
  const url=endpoint();
  if(!url)throw new Error('token-endpoint-missing');
  let last;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),TOKEN_TIMEOUT);
      const token=await appCheckToken(attempt>0);
      const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':token},body:'{}',signal:controller.signal});
      clearTimeout(timer);
      const data=await response.json().catch(()=>({}));
      if(response.ok&&data.token)return data.token;
      last=new Error(`token-${response.status}`);
    }catch(error){last=error;}
  }
  throw last||new Error('token-failed');
}

async function handleTools(calls=[]){
  if(!session||!calls.length)return;
  setState('أقرأ الصفحة وأنفذ طلبك…','working');
  const responses=[];
  for(const call of calls){
    let result;
    try{
      if(call.name==='search_legal_knowledge')result=searchKnowledge(call.args||{});
      else if(call.name==='get_partnership_context')result=currentContext();
      else if(call.name==='get_visible_screen')result=visibleScreen();
      else if(call.name==='update_partnership_form')result=await updateForm(call.args||{});
      else if(call.name==='identify_specialist')result={ok:true,specialist:specialistFor(call.args?.question||'')};
      else result={ok:false,error:'unknown-tool'};
    }catch(error){result={ok:false,error:String(error?.message||error)};}
    responses.push({name:call.name,id:call.id,response:{result}});
  }
  session.sendToolResponse({functionResponses:responses});
}

function beginAssistantBubble(){
  assistantText='';
  assistantBubble=addMessage('أفكر…','bot');
  assistantBubble?.classList.add('is-streaming');
}

function handleMessage(message){
  resetIdle();
  if(message?.toolCall?.functionCalls?.length)handleTools(message.toolCall.functionCalls).catch(console.error);
  const content=message?.serverContent;
  if(!content)return;
  if(content.interrupted){
    clearPlayback();
    assistantBubble=null;
    assistantText='';
    micSuppressed=false;
    setState(voiceActive?'أسمعك الآن':'جاهز لسؤالك','listening');
  }
  if(content.inputTranscription?.text&&voiceActive){
    if(!voiceUserBubble){voiceUserText='';voiceUserBubble=addMessage('','user');}
    voiceUserText+=content.inputTranscription.text;
    updateBubble(voiceUserBubble,voiceUserText.trim());
  }
  if(content.outputTranscription?.text){
    if(!assistantBubble)beginAssistantBubble();
    assistantText+=content.outputTranscription.text;
    updateBubble(assistantBubble,assistantText.trim());
    setState(voiceActive?'المساعد يتحدث':'يكتب الإجابة…','speaking');
  }
  for(const part of content.modelTurn?.parts||[]){
    if(part.inlineData?.data&&voiceActive)playPcm(part.inlineData.data);
  }
  if(content.turnComplete){
    assistantBubble?.classList.remove('is-streaming');
    assistantBubble=null;
    assistantText='';
    voiceUserBubble=null;
    voiceUserText='';
    if(voiceActive)resumeMicAfterPlayback();
    else setState('جاهز لسؤالك','ready');
  }
}

async function ensureSession(){
  if(session)return session;
  if(connecting)return connecting;
  connecting=(async()=>{
    setState('أتصل بالمساعد الذكي…','connecting');
    const token=await fetchToken();
    const ai=new GoogleGenAI({apiKey:token,httpOptions:{apiVersion:'v1alpha'}});
    session=await ai.live.connect({
      model:MODEL,
      config:{
        responseModalities:[Modality.AUDIO],
        systemInstruction:instruction(),
        inputAudioTranscription:{},
        outputAudioTranscription:{},
        speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}},
        tools:[{functionDeclarations:TOOL_DECLARATIONS}]
      },
      callbacks:{
        onopen:()=>setState('المساعد الذكي متصل','ready'),
        onmessage:handleMessage,
        onerror:error=>{console.error('Sharakah AI:',error);setState('تعذر استمرار الاتصال','error');},
        onclose:()=>{session=null;if($('#assistantPanel'))setState('انقطع الاتصال. حاول مرة أخرى.','error');}
      }
    });
    resetIdle();
    return session;
  })().finally(()=>{connecting=null;});
  return connecting;
}

function bytesToBase64(bytes){
  let output='';
  for(let i=0;i<bytes.length;i+=0x8000)output+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(output);
}

function base64ToFloat32(value){
  const raw=atob(value),length=raw.length-(raw.length%2),buffer=new ArrayBuffer(length),bytes=new Uint8Array(buffer);
  for(let i=0;i<length;i++)bytes[i]=raw.charCodeAt(i);
  const pcm=new Int16Array(buffer),output=new Float32Array(pcm.length);
  for(let i=0;i<pcm.length;i++)output[i]=pcm[i]/32768;
  return output;
}

function resampleToInt16(input,rate){
  const ratio=rate/INPUT_RATE,output=new Int16Array(Math.max(1,Math.round(input.length/ratio)));
  for(let i=0;i<output.length;i++){
    const position=i*ratio,left=Math.floor(position),right=Math.min(left+1,input.length-1),mix=position-left;
    const value=(input[left]||0)*(1-mix)+(input[right]||0)*mix,clamped=Math.max(-1,Math.min(1,value));
    output[i]=clamped<0?clamped*32768:clamped*32767;
  }
  return output;
}

async function prepareAudio(){
  if(micContext&&micStream)return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio||!navigator.mediaDevices?.getUserMedia)throw new Error('microphone-not-supported');
  micContext=new Audio();
  outputContext=new Audio();
  await Promise.all([micContext.resume(),outputContext.resume()]);
  outputGain=outputContext.createGain();
  outputGain.gain.value=1;
  outputGain.connect(outputContext.destination);
  outputQueuedUntil=outputContext.currentTime;
  micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
}

function startMic(){
  if(!voiceActive||!session||!micContext||!micStream||micProcessor)return;
  micSource=micContext.createMediaStreamSource(micStream);
  micProcessor=micContext.createScriptProcessor(2048,1,1);
  silentGain=micContext.createGain();
  silentGain.gain.value=0;
  micProcessor.onaudioprocess=event=>{
    if(!voiceActive||!session||micSuppressed)return;
    const pcm=resampleToInt16(event.inputBuffer.getChannelData(0),micContext.sampleRate);
    const bytes=new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength);
    try{session.sendRealtimeInput({audio:{data:bytesToBase64(bytes),mimeType:`audio/pcm;rate=${INPUT_RATE}`}});}catch{}
  };
  micSource.connect(micProcessor);
  micProcessor.connect(silentGain);
  silentGain.connect(micContext.destination);
}

function playPcm(base64){
  if(!voiceActive||!outputContext||!base64)return;
  const samples=base64ToFloat32(base64);
  if(!samples.length)return;
  micSuppressed=true;
  const buffer=outputContext.createBuffer(1,samples.length,OUTPUT_RATE);
  buffer.copyToChannel(samples,0);
  const source=outputContext.createBufferSource();
  source.buffer=buffer;
  source.connect(outputGain);
  const at=Math.max(outputContext.currentTime+.02,outputQueuedUntil);
  source.start(at);
  outputQueuedUntil=at+buffer.duration;
}

function clearPlayback(){
  if(outputContext)outputQueuedUntil=outputContext.currentTime;
}

function resumeMicAfterPlayback(){
  const delay=Math.max(0,(outputQueuedUntil-(outputContext?.currentTime||0))*1000)+120;
  setTimeout(()=>{if(voiceActive){micSuppressed=false;setState('أسمعك الآن','listening');}},delay);
}

async function stopVoice(){
  voiceActive=false;
  micSuppressed=false;
  if(micProcessor)micProcessor.onaudioprocess=null;
  try{micProcessor?.disconnect();micSource?.disconnect();silentGain?.disconnect();outputGain?.disconnect();}catch{}
  micStream?.getTracks?.().forEach(track=>track.stop());
  micStream=null;micProcessor=null;micSource=null;silentGain=null;outputGain=null;
  try{await micContext?.close();await outputContext?.close();}catch{}
  micContext=null;outputContext=null;
  setState('جاهز للكتابة أو الصوت','ready');
}

async function startVoice(){
  if(voiceActive){await stopVoice();return;}
  try{
    setState('أجهز الميكروفون…','connecting');
    await prepareAudio();
    await ensureSession();
    voiceActive=true;
    startMic();
    setState('أسمعك الآن','listening');
    resetIdle();
  }catch(error){
    console.error('Sharakah voice:',error);
    await stopVoice();
    const message=/permission|notallowed|microphone/i.test(String(error?.message||error))?'يحتاج المساعد إلى إذن الميكروفون.':'تعذر تشغيل المحادثة الصوتية الآن. حاول مرة أخرى.';
    addMessage(message,'bot');
    setState('تعذر تشغيل الصوت','error');
  }
}

function speakText(text){
  if(!('speechSynthesis'in window))return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='ar-SA';utterance.rate=.95;
  speechSynthesis.speak(utterance);
}

async function send(){
  const input=$('#assistantInput');
  const question=String(input?.value||'').trim();
  if(!question)return;
  input.value='';
  addMessage(question,'user');
  beginAssistantBubble();
  try{
    await ensureSession();
    setState('يفهم سؤالك…','working');
    session.sendRealtimeInput({text:question});
    resetIdle();
  }catch(error){
    console.error('Sharakah text AI:',error);
    updateBubble(assistantBubble,'تعذر الاتصال بالمساعد الذكي الآن. حاول مرة أخرى.');
    assistantBubble?.classList.remove('is-streaming');
    assistantBubble=null;assistantText='';
    setState('تعذر الاتصال','error');
  }
}

function toggle(force){
  const conversation=$('#assistantConversation'),trigger=$('#assistantTextToggle');
  if(!conversation)return;
  const open=force===undefined?conversation.classList.contains('hide'):Boolean(force);
  conversation.classList.toggle('hide',!open);
  trigger?.setAttribute('aria-expanded',String(open));
  if(open){$('#assistantInput')?.focus();setState(session?'المساعد الذكي متصل':'جاهز للكتابة أو الصوت','ready');}
}

function keydown(event){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send();}}
function askQuick(question){toggle(true);const input=$('#assistantInput');if(input)input.value=question;send();}

async function disconnect(reason='manual'){
  clearTimeout(idleTimer);
  await stopVoice();
  try{session?.close?.();}catch{}
  session=null;
  if(reason==='idle')setState('انتهى الاتصال لعدم وجود تفاعل','idle');
}

window.PartnershipAssistant={toggle,keydown,askQuick,send,listen:startVoice,stopVoice,disconnect,getVisibleScreen:visibleScreen,updateForm,get active(){return Boolean(session);},get voiceActive(){return voiceActive;}};
setState('جاهز للكتابة أو الصوت','ready');

