/* SHARAKAH | دليل اختيار الشراكة v1.3.0
   Client-side, deterministic and advisory. No external data transfer.
   Each legal rule is separated from the original financial calculator. */
(function(){
'use strict';
const CIVIL='https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/655fdb42-8c96-422b-b8c4-b04f0095c94c/1';
const COMPANIES='https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/a8376aea-1bc3-49d4-9027-aed900b555af/1';
const TRADE='https://www.uqn.gov.sa/decisions-and-regulations/4002380';
const STORAGE='sharakah_guide_v1';
const QUESTIONS=[
 {id:'existing',title:'هل الشراكة في شركة مسجلة حاليا؟',hint:'مثال: الدخول كمستثمر جديد في شركة لها سجل تجاري وحصص مسجلة، أو تأسيس مشروع من البداية.',items:[['yes','نعم، شركة قائمة'],['no','نبدأ علاقة أو مشروعا جديدا']]},
 {id:'activity',title:'ما نوع العمل الأقرب لمشروعكم؟',hint:'اختر النشاط الأساسي. طبيعة النشاط مسألة منفصلة عن شكل الشركة أو عقد الشراكة.',items:[['resale','شراء منتجات أو معدات وإعادة بيعها'],['restaurant','مطعم أو متجر أو فندق أو تشغيل يومي'],['professional','مهنة حرة تعتمد على الخبرة والتأهيل'],['technology','تقنية أو تطبيقات أو خدمات رقمية'],['services','خدمات أو مقاولات أو توريد'],['other','نشاط آخر أو لم نحسمه']]},
 {id:'duration',title:'هل تنتهي الشراكة بإنجاز عمل محدد؟',hint:'مثال: شراء معدات وبيعها خلال أشهر، مقارنة بتشغيل متجر يستمر سنوات.',items:[['one','صفقة واحدة أو مدة محددة'],['ongoing','عمل مستمر أو قابل للتوسع'],['unclear','المدة لم تتحدد']]},
 {id:'roles',title:'كيف يشارك الأطراف في المال والعمل؟',hint:'المضاربة لها أحكام مختلفة عن عقد المشاركة؛ لا يحدد الاسم وحده طبيعة العلاقة.',items:[['mudaraba','طرف يقدم المال، وآخر يقدم العمل'],['shared','أكثر من طرف يساهم بالمال أو الأصول أو العمل'],['loan','المبلغ قرض يُسترد، وليس مساهمة تحتمل الربح والخسارة'],['unclear','لم نتفق بعد']]},
 {id:'liability',title:'ما مستوى حاجتكم إلى فصل ديون المشروع عن الأموال الشخصية؟',hint:'في عقد الشركة المدني قد تمتد ديون المشروع إلى أموال الشركاء وفق المادة 543. الشركة ذات المسؤولية المحدودة لها قاعدة مختلفة.',items:[['essential','هذه أولوية أساسية'],['review','أحتاج معرفة المسؤولية قبل الاختيار']]},
 {id:'debt',title:'هل يتوقع اقتراض أو شراء آجل أو عقود والتزامات مالية على المشروع؟',hint:'المهم هو حقيقة الالتزامات ومن يمثل الشركاء أمام الغير، وليس مجرد منع المدير من الاقتراض في العقد.',items:[['yes','نعم، توجد أو نتوقع التزامات'],['no','لا نتوقع ذلك حاليا'],['unclear','غير معروف بعد']]},
 {id:'regulated',title:'هل يرتبط المشروع بترخيص مهني أو نشاط منظم؟',hint:'مثل الأعمال المهنية المرخصة أو الخدمات المالية أو الأنشطة التي تحتاج موافقات خاصة.',items:[['yes','نعم'],['no','بحسب علمي لا'],['unclear','أحتاج إلى التحقق']]},
 {id:'investors',title:'هل ستجمعون أموال مستثمرين من خارج أطراف المشروع أو تديرون أموالهم؟',hint:'هذه الحالات قد تخضع لتنظيم خاص، ولا يكفي عقد الشراكة وحده لتحديد مشروعية النشاط.',items:[['yes','نعم'],['no','لا، الشراكة بين الأطراف المعروفة'],['unclear','ممكن مستقبلا']]}
];
const $=id=>document.getElementById(id);
const state={step:0,answers:{},page:'intro',current:null};
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ref=(url,label)=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+'</a>';
function display(node,html){node.innerHTML=html}
function makeShell(){
 const splash=$('splashScreen'); if(!splash||$('sgWorkspace'))return;
 const feature=document.createElement('section');feature.className='sg-feature';feature.setAttribute('aria-labelledby','sgFeatureTitle');
 feature.innerHTML='<div class="sg-feature-kicker">جديد في حاسبة الشراكات</div><h2 id="sgFeatureTitle">قبل حساب النسب، اختر إطار شراكتك</h2><p>هل الأنسب عقد مشاركة أو مضاربة أو شركة مسجلة؟ تعرف على الفروق والمخاطر، وأجب عن أسئلة قصيرة ثم أكمل في الحاسبة المناسبة.</p><div class="sg-feature-actions"><button type="button" class="sg-btn sg-btn-primary" data-sg="open">ساعدني أختار شراكتي ←</button><button type="button" class="sg-btn sg-btn-outline" data-sg="learn">افهم الفرق أولا</button></div>';
 const paths=splash.querySelector('.splash-paths');if(paths)paths.before(feature);else splash.querySelector('.splash-inner')?.append(feature);
 const workspace=document.createElement('div');workspace.id='sgWorkspace';workspace.className='sg-workspace';workspace.setAttribute('aria-live','polite');workspace.innerHTML='<div class="sg-shell" id="sgContent"></div>';
 splash.after(workspace);
 const initial=$('sgReady');if(!initial){const note=document.createElement('div');note.className='sg-ready sg-hidden';note.id='sgReady';const legal=$('legalStruct');if(legal)legal.closest('.card')?.after(note);}
 document.addEventListener('click',function(ev){const btn=ev.target.closest('[data-sg]');if(!btn)return;const key=btn.dataset.sg;
 if(key==='open'){ev.preventDefault();state.step=0;state.answers={};open('intro')}
 else if(key==='learn'){ev.preventDefault();open('intro')}
 else if(key==='direct'){ev.preventDefault();state.current=null;state.answers={};try{localStorage.removeItem(STORAGE)}catch{}updateReady();close();window.SHARAKAH_APP?.startTool?.()}
 else if(key==='exit'){ev.preventDefault();close()}
 else if(key==='begin'){ev.preventDefault();state.step=0;state.current=null;state.answers={};try{localStorage.removeItem(STORAGE)}catch{}updateReady();open('wizard')}
 else if(key==='choose'){ev.preventDefault();state.answers[QUESTIONS[state.step].id]=btn.dataset.value;render();}
 else if(key==='next'){ev.preventDefault();next()}
 else if(key==='prev'){ev.preventDefault();if(state.step){state.step--;render()}else open('intro')}
 else if(key==='back-intro'){ev.preventDefault();open('intro')}
 else if(key==='reset'){ev.preventDefault();state.answers={};state.step=0;state.current=null;open('wizard')}
 else if(key==='calc'){ev.preventDefault();enterCalculator()}
 else if(key==='copy'){ev.preventDefault();copySummary(btn)}
 else if(key==='revise'){ev.preventDefault();returnToGuide()}
 });
 try{const x=JSON.parse(localStorage.getItem(STORAGE)||'null');if(x&&typeof x==='object'&&x.answers&&x.result){state.current=x.result;state.answers=x.answers;updateReady()}}catch{}
}
function open(page){
 if(!$('sgWorkspace'))return;state.page=page;const sp=$('splashScreen');
 sp.style.display='none';sp.classList.add('gone');$('sgWorkspace').classList.add('sg-active');render();window.scrollTo({top:0,behavior:'instant'});
}
function close(){
 $('sgWorkspace').classList.remove('sg-active');const sp=$('splashScreen');sp.classList.remove('gone');sp.style.display='';sp.style.opacity='1';window.scrollTo({top:0,behavior:'instant'})
}
function intro(){
 const title='<div class="sg-head"><div><div class="sg-eyebrow">دليل اختيار الشراكة</div><h1>افهم العلاقة قبل الاتفاق على نسبها</h1><p>لأن مسؤولية الشركاء وحقوق الغير قد تختلف باختلاف العقد والشكل النظامي وطبيعة العمل.</p></div><button class="sg-back" data-sg="exit">العودة للرئيسية</button></div>';
 const sections='<div class="sg-hero"><strong>3 أمور مختلفة، نفصل بينها من البداية</strong><p>طبيعة العمل: هل النشاط تجاري أو مهني؟ إطار العلاقة: هل هو عقد مشاركة أو مضاربة أو شركة مسجلة؟ المسؤولية: من يلتزم بالديون أمام الغير؟</p></div>'
 +'<div class="sg-grid"><article class="sg-info"><span class="sg-ico" aria-hidden="true">🤝</span><h3>عقد شركة مدني</h3><p>اتفاق مكتوب بين أطراف يقدمون مساهمات ويتشاركون النتائج. قد تمتد ديون أعمال الشركة إلى أموال الشركاء الخاصة وفق المادة 543.</p><small>نظام المعاملات المدنية، المواد 528 و543</small></article>'
 +'<article class="sg-info"><span class="sg-ico" aria-hidden="true">◈</span><h3>عقد مضاربة</h3><p>رب مال يقدم رأس المال، ومضارب يقدم العمل والإدارة. يتوزع الربح حسب الاتفاق، وللخسارة والضمان أحكام خاصة.</p><small>نظام المعاملات المدنية، المواد 550 إلى 559</small></article>'
 +'<article class="sg-info"><span class="sg-ico" aria-hidden="true">▣</span><h3>شركة مسجلة</h3><p>كيان يؤسس وفق نظام الشركات. تتحدد مسؤولية الشريك بحسب الشكل، وتكون محدودة في الأصل في الشركة ذات المسؤولية المحدودة.</p><small>نظام الشركات، المادة 156</small></article></div>';
 const comparison='<details class="sg-compare"><summary style="cursor:pointer;font-weight:750;color:#17405b;padding:7px 0">افتح المقارنة التفصيلية</summary><table><thead><tr><th>المسألة</th><th>عقد شركة مدني</th><th>شركة ذات مسؤولية محدودة</th></tr></thead><tbody><tr><td>الشخصية الاعتبارية</td><td>علاقة عقدية دون شخصية الشركة المسجلة بمجرد العقد</td><td>ذمة مستقلة وفق النظام</td></tr><tr><td>ديون النشاط</td><td>قد تمتد إلى الأموال الخاصة وفق المادة 543</td><td>على الشركة في الأصل، وتراعى الضمانات والاستثناءات</td></tr><tr><td>الإدارة</td><td>الصلاحيات بالاتفاق وأحكام النظام</td><td>وفقا لعقد التأسيس وأحكام الشركة</td></tr><tr><td>الإنهاء</td><td>قد ينتهي العقد بانتهاء الغرض أو المدة</td><td>إجراءات نظامية بحسب الشكل</td></tr></tbody></table></details>';
 const note='<div class="sg-alert">تنبيه مهم: تقييد المدير في عقد الشركاء أو الاتفاق على عدم الاقتراض لا يؤدي تلقائيا إلى إعفاء الجميع من حقوق الدائنين. أما نظام المعاملات التجارية المنشور في 13 نوفمبر 2026، فيبدأ نفاذه بعد مضي 180 يوما من النشر.</div>';
 return title+sections+comparison+note+'<div class="sg-nav"><button class="sg-btn sg-btn-primary" data-sg="begin">اكتشف المسار المناسب ←</button><button class="sg-btn sg-btn-light" data-sg="direct">أعرف الإطار المناسب، أريد الحاسبة</button></div><div class="sg-footnotes">المصادر: '+ref(CIVIL,'نظام المعاملات المدنية')+' | '+ref(COMPANIES,'نظام الشركات')+' | '+ref(TRADE,'نظام المعاملات التجارية المنشور في أم القرى')+'. هذه أداة استرشادية، وتحتاج الحالات المؤثرة إلى مراجعة مختص.</div>'
}
function wizard(){
 const q=QUESTIONS[state.step],chosen=state.answers[q.id],len=QUESTIONS.length,progress=Math.round((state.step+1)/len*100);
 let html='<div class="sg-head"><div><div class="sg-eyebrow">المسار المناسب لشراكتك</div><h1>حدثنا عن مشروعك</h1><p>أسئلة بلغة بسيطة، والنتيجة تشرح الأسباب والمخاطر مع المراجع.</p></div><button class="sg-back" data-sg="exit">العودة للرئيسية</button></div>';
 html+='<div class="sg-stage"><span>السؤال '+(state.step+1)+' من '+len+'</span><span>'+progress+'%</span></div><div class="sg-progress"><div style="width:'+progress+'%"></div></div>';
 html+='<h2 class="sg-question">'+esc(q.title)+'</h2><p class="sg-question-note">'+esc(q.hint)+'</p><div class="sg-options">';
 q.items.forEach(item=>{html+='<button type="button" class="sg-option" aria-pressed="'+(chosen===item[0]?'true':'false')+'" data-sg="choose" data-value="'+item[0]+'">'+esc(item[1])+'</button>'});
 html+='</div><div class="sg-nav"><button class="sg-btn sg-btn-light" data-sg="prev">السابق</button><button class="sg-btn sg-btn-primary" data-sg="next" '+(!chosen?'disabled':'')+'>'+(state.step===len-1?'عرض النتيجة':'التالي ←')+'</button></div>';
 return html;
}
function next(){
 const q=QUESTIONS[state.step];if(!state.answers[q.id])return;
 if(state.step<QUESTIONS.length-1){state.step++;render()}else{state.current=evaluate(state.answers);state.page='result';render();try{localStorage.setItem(STORAGE,JSON.stringify({answers:state.answers,result:state.current,ts:Date.now()}))}catch{}updateReady()}
}
function evaluate(a){
 const risks=[],reasons=[],checks=[];
 const activityMap={
 resale:['شراء منقولات بغرض إعادة بيعها بربح','الأعمال التجارية بحسب المادة 5/أ من النظام الجديد (عند نفاذه)'],
 restaurant:['مطعم أو متجر أو تشغيل يومي','تحدد الطبيعة بحسب تفاصيل العمل؛ المطاعم والفنادق بالمادة 5/و من النظام الجديد'],
 professional:['ممارسة مهنة حرة','المهن الحرة المعتمدة على المهارات الذهنية مستثناة وفق المادة 9/ج من النظام الجديد'],
 technology:['تقنية وخدمات رقمية','تقنية المعلومات عند الاحتراف بالمادة 6/ش من النظام الجديد'],
 services:['خدمات أو مقاولات أو توريد','تخضع الأعمال المذكورة في المادة 6 لاختبار الاحتراف بالنظام الجديد'],
 other:['نشاط يحتاج دراسة','لا يمكن تحديد الطبيعة من الوصف الحالي']
 };
 const kind=activityMap[a.activity]||activityMap.other;
 let calcType=a.existing==='yes'?'existing':a.roles==='mudaraba'?'mudaraba':a.duration==='one'?'deal':'fnb';
 let framework='',legal='',label='',critical=false;
 const shield=a.liability==='essential',debt=a.debt==='yes',ongoing=a.duration==='ongoing',special=a.regulated==='yes'||a.regulated==='unclear'||a.investors!=='no';
 if(a.existing==='yes'){
  calcType='existing';legal='';framework='فحص دخول شريك في شركة قائمة';label='البدء بمراجعة الشركة القائمة وإجراءات نقل أو إصدار الحصص';reasons.push('المسألة تتعلق بملكية كيان مسجل، فيلزم التحقق من شكله وعقد تأسيسه وحقوق الشركاء الحاليين.');
 }else if(a.roles==='loan'){
  calcType=a.duration==='one'?'deal':'fnb';legal='';framework='تحقق من طبيعة التمويل قبل وصفه بالشراكة';label='تحليل التمويل أولا قبل تحديد عقد المشاركة';critical=true;reasons.push('التمويل المسترد بصفة قرض يختلف عن المساهمة في رأس المال وعن المضاربة، لذا يتوقف تكييف العلاقة على شروطه الفعلية.');risks.push('المبلغ الموصوف بأنه قرض يسترد يحتاج فحصا مستقلا. لا يصح اعتباره تلقائيا حصة رأسمالية أو ربح مضاربة.');
 }else if(special){
  legal='';framework='اختيار متوقف على مراجعة تنظيمية متخصصة';label='ابدأ بفحص متطلبات النشاط والتراخيص والمستثمرين';critical=true;reasons.push('وجود نشاط منظم أو مستثمرين من خارج الأطراف أو عدم اليقين بشأن الترخيص يجعل الاختيار المباشر غير مناسب.');risks.push('توقف عن تلقي أموال المستثمرين أو مباشرة نشاط منظم إلى حين التحقق من متطلبات الجهة المختصة.');
 }else if(shield||debt||(ongoing&&a.roles!=='mudaraba')){
  calcType=a.duration==='one'?'deal':'fnb';legal='llc';framework='دراسة تأسيس شركة ذات مسؤولية محدودة';label='شركة مسجلة تستحق الدراسة للمسؤولية والتنظيم';reasons.push('الرغبة في الفصل بين الذمم أو وجود ديون تشغيلية أو استمرار النشاط يرجح فحص كيان مستقل قبل توقيع العقد.');
  if(a.roles==='mudaraba')reasons.push('توزيع المال والعمل يشبه المضاربة؛ تأسيس كيان مستقل مسألة أخرى تحتاج ضبط العلاقة بين الشركاء وشكل الشركة وعقدها.');
 }else if(a.roles==='mudaraba'){
  legal='mudaraba';calcType='mudaraba';framework='عقد مضاربة محتمل';label='علاقة مال من طرف وعمل من طرف آخر';reasons.push('وصف المساهمات يميل إلى المضاربة. يجب تحديد رأس المال ونسب الربح وصلاحيات المضارب وأحكام التعدي والتقصير.');
 }else if(a.duration==='one'&&a.roles==='shared'){
  legal='civil';calcType='deal';framework='عقد شركة مدني محتمل';label='صفقة محددة قد يناسبها اتفاق مشاركة مكتوب';reasons.push('المشروع مؤقت ومساهمات الأطراف متعددة. يجب فحص التزامات الغير والتراخيص قبل اعتماد هذا المسار.');
 }else{
  legal='';framework='المسار يحتاج استكمال عناصر العلاقة';label='ابدأ بتنظيم مساهمات الشركاء ودراسة الإطار';reasons.push('البيانات لا تكفي للترجيح بين المشاركة المدنية والشركة المسجلة بصورة معقولة.');
 }
 if(special){critical=true;if(!risks.some(x=>x.includes('أموال المستثمرين')))risks.push('وجود ترخيص خاص أو تعامل مع أموال المستثمرين يتطلب مراجعة متطلبات الجهة المنظمة قبل اعتماد العقد أو بدء النشاط.');}
 if(a.roles==='loan'){critical=true;if(!risks.some(x=>x.includes('قرض')))risks.push('تكييف القرض واسترداده يحتاج مراجعة منفصلة قبل اعتباره استثمارا أو مشاركة.');}
 if(a.activity==='professional'){critical=true;risks.push('المهن المرخصة تحتاج فحص قواعد الممارسة المهنية والشركات المهنية، حتى لو اتفق الشركاء على عقد مدني.');}
 if(a.liability==='essential'){risks.push('عقد الشركة المدني لا يمنح بذاته الفصل في المسؤولية المقرر للشركة ذات المسؤولية المحدودة. المادة 543 مهمة قبل اتخاذ القرار.');}
 if(a.debt==='yes'){risks.push('تحتاج الديون والضمانات وحدود سلطة المدير إلى تنظيم ومراجعة أثرها تجاه الأطراف والغير.');}
 if(a.debt==='unclear')checks.push('تقدير التزامات الموردين والعقود والاقتراض قبل اعتماد الإطار.');
 if(a.roles==='mudaraba'){risks.push('في المضاربة يتحمل رب المال خسارة رأس المال المعتادة، ويضمن المضارب الضرر الناتج عن التعدي أو التقصير، مع مراعاة أحكام التعامل مع الغير.');}
 if(a.activity==='professional')checks.push('التحقق من ضوابط المهنة المرخصة والشركة المهنية بحسب طبيعة الأطراف والعمل.');
 if(a.activity==='other')checks.push('تحديد النشاط فعليا قبل تطبيق اختبار الطبيعة التجارية.');
 if(a.regulated!=='no')checks.push('التحقق من الجهات المختصة وشروط الترخيص للنشاط.');
 if(a.investors!=='no')checks.push('فحص متطلبات جمع الأموال أو إدارة أموال الغير والجهة المنظمة قبل أي طرح أو استقبال أموال.');
 if(a.existing==='yes')checks.push('الحصول على عقد التأسيس أو النظام الأساس والقوائم المالية وحقوق الشركاء وقيود نقل الحصص.');
 checks.push('تحديد الطرف المخول بالتوقيع، وصلاحيات الاقتراض والضمانات، ونصاب الموافقات.');
 checks.push('فصل رأس المال وحصص الملكية عن نسب الأرباح والخسائر وحقيقة الدفعات.');
 checks.push('توثيق العقد ومساهمات الشركاء وآلية التقارير والانسحاب وحل الخلافات.');
 return {framework,label,calcType,legal,critical,reasons,risks,checks,activity:kind[0],activityLaw:kind[1],answers:Object.assign({},a)};
}
function summary(r){
 return ['دليل اختيار الشراكة | نتيجة استرشادية','الإطار الذي يستحق الدراسة: '+r.framework,'طبيعة العمل: '+r.activity,'تصنيف استرشادي للمستقبل: '+r.activityLaw,'', 'أسباب الترجيح:',...r.reasons.map(t=>'• '+t),'','المخاطر:',...r.risks.map(t=>'• '+t),'','خطوات قبل التنفيذ:',...r.checks.map(t=>'• '+t),'','المراجع:',CIVIL,COMPANIES,TRADE,'','تنبيه: الطبيعة التجارية بحسب نظام المعاملات التجارية المنشور 13 نوفمبر 2026 تعرض للاستعداد للمستقبل، ويبدأ نفاذه بعد مضي 180 يوما من النشر. لا تحل النتيجة محل مراجعة مختص.'].join('\n');
}
function result(){
 const r=state.current;if(!r)return intro();
 const bullet=arr=>'<ul>'+arr.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
 const alert=r.critical?'هذه الحالة تحتاج مراجعة متخصصة قبل اعتماد إطار نهائي. يمكنك استعمال الحاسبة لتقدير المساهمات وتجهيز نقاط النقاش فقط.':'النتيجة ترجيح مبدئي من وصفك، وقد يتغير بعد مراجعة طبيعة العقود والديون والتراخيص.';
 return '<div class="sg-head"><div><div class="sg-eyebrow">نتيجة دليل اختيار الشراكة</div><h1>هذه أبرز الخيارات أمامك</h1><p>نبدأ بالنشاط، ثم العلاقة بين الأطراف، ثم المسؤولية.</p></div><button class="sg-back" data-sg="exit">العودة للرئيسية</button></div>'
 +'<div class="sg-tag">ترجيح استرشادي</div><div class="sg-tag '+(r.critical?'sg-tag-warn':'')+'">'+(r.critical?'تحتاج مراجعة متخصصة':'جاهزة للنقاش الأولي')+'</div>'
 +'<h2 class="sg-result-heading">'+esc(r.framework)+'</h2><p class="sg-result-intro">'+esc(r.label)+'</p>'
 +'<div class="sg-alert '+(r.critical?'sg-alert-danger':'')+'">'+esc(alert)+'</div>'
 +'<div class="sg-result-grid"><section class="sg-result-card"><h3>طبيعة العمل</h3><p><strong>'+esc(r.activity)+'</strong></p><p>'+esc(r.activityLaw)+'</p><p>توصيف نظام المعاملات التجارية للاسترشاد بالمستقبل: نشِر 13 نوفمبر 2026 ويبدأ نفاذه بعد مضي 180 يوما.</p></section>'
 +'<section class="sg-result-card"><h3>لماذا هذا الاتجاه؟</h3>'+bullet(r.reasons)+'</section>'
 +'<section class="sg-result-card"><h3>المسؤولية والمخاطر</h3>'+(r.risks.length?bullet(r.risks):'<p>تحتاج حدود مسؤولية الشركاء إلى مراجعة بحسب الشكل المختار، بما فيها المادة 543 للعقد المدني والمادة 156 للشركة ذات المسؤولية المحدودة.</p>')+'</section>'
 +'<section class="sg-result-card"><h3>قبل توقيع أي اتفاق</h3>'+bullet(r.checks)+'</section></div>'
 +'<div class="sg-alert sg-alert-muted"><strong>فرق مهم:</strong> العقد المدني قد ينظم علاقة مشروع يمارس عملا تجاريا؛ وصف «مدني» للعقد لا يلغي الأنظمة والتراخيص والمتطلبات التجارية المنطبقة على النشاط. كما أن تقييد سلطة المدير بين الشركاء لا يسقط تلقائيا حقوق الدائنين.</div>'
 +'<div class="sg-result-actions"><button class="sg-btn sg-btn-primary" data-sg="calc">انتقل إلى الحاسبة المناسبة ←</button><button class="sg-btn sg-btn-light" data-sg="copy">نسخ التقرير</button><button class="sg-btn sg-btn-light" data-sg="reset">أعد التقييم</button></div>'
 +'<div class="sg-footnotes">المواد ذات الصلة: '+ref(CIVIL,'المعاملات المدنية: 528، 534، 535، 543، 557')+' | '+ref(COMPANIES,'نظام الشركات: 13، 23، 156')+' | '+ref(TRADE,'المعاملات التجارية: 5، 6، 9، 10، 271')+'. راجع تاريخ السريان والتعديلات عند التطبيق.</div>';
}
function render(){const node=$('sgContent');if(!node)return;display(node,state.page==='wizard'?wizard():state.page==='result'?result():intro());}
function enterCalculator(){
 const r=state.current;if(!r)return;
 $('sgWorkspace').classList.remove('sg-active');
 const splash=$('splashScreen');splash.classList.remove('gone');splash.style.opacity='1';splash.style.display='';
 if(window.SHARAKAH_APP&&typeof window.SHARAKAH_APP.startTool==='function'){
  window.SHARAKAH_APP.startTool();
  setTimeout(function(){
   if(typeof window.SHARAKAH_APP.selType==='function'&&window.SHARAKAH_APP.TYPES.some(t=>t.id===r.calcType))window.SHARAKAH_APP.selType(r.calcType);
   if(r.legal&&$('legalStruct')&&r.calcType!=='existing')$('legalStruct').value=r.legal;
   if(typeof window.SHARAKAH_APP.updPanels==='function')window.SHARAKAH_APP.updPanels();
   updateReady(); if(typeof window.SHARAKAH_APP.scheduleSave==='function')window.SHARAKAH_APP.scheduleSave();
  },420);
 }
}
function updateReady(){
 const note=$('sgReady'),r=state.current;if(!note)return;
 if(!r){note.classList.add('sg-hidden');return}
 note.classList.remove('sg-hidden');note.replaceChildren();
 const h=document.createElement('strong');h.textContent='نتيجة الدليل: '+r.framework;
 const p=document.createElement('div');p.textContent='تم حفظ الترجيح الاسترشادي. راجع الإطار النظامي قبل اعتماد ورقة الاتفاق، وخاصة المسؤولية تجاه الدائنين.';
 const b=document.createElement('button');b.type='button';b.className='sg-back';b.dataset.sg='revise';b.textContent='مراجعة نتيجة الدليل';b.style.marginTop='10px';
 note.append(h,p,b);
}
function returnToGuide(){
 if(!state.current)return;const g=window.SHARAKAH_APP;if(g&&$('toolWrapper')?.style.display==='block'){g.goHome();setTimeout(function(){open('result')},380);}else open('result');
}
function copySummary(button){const r=state.current;if(!r)return;const val=summary(r);
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(val).then(()=>{button.textContent='تم نسخ التقرير'}).catch(()=>fallbackCopy(val,button))}
 else fallbackCopy(val,button);
}
function fallbackCopy(str,button){const e=document.createElement('textarea');e.value=str;e.style.position='fixed';e.style.opacity='0';document.body.append(e);e.select();try{if(document.execCommand('copy'))button.textContent='تم نسخ التقرير';else button.textContent='تعذر النسخ'}catch{button.textContent='تعذر النسخ'}e.remove()}
function bindCalculator(){
 if(!window.SHARAKAH_APP||window.SHARAKAH_APP.__sgBound)return;
 const g=window.SHARAKAH_APP;g.__sgBound=true;
 const oldBuild=g.buildAgr.bind(g);
 g.buildAgr=function(){
  const success=oldBuild.apply(g,arguments);if(success===false)return false;
  const r=state.current,box=$('agrBox');
  if(r&&box&&g.type===r.calcType){
   const txt=box.textContent||'';
   if(!txt.includes('ملخص دليل اختيار الشراكة'))box.textContent=txt+'\n\nملخص دليل اختيار الشراكة\n'+summary(r)+'\nملاحظة: هذا الترجيح أُعد قبل احتساب الحصص، والشكل النظامي المعتمد هو ما يقرره الأطراف بعد استكمال مراجعتهم.';
  }
  return success;
 };
 const oldReset=g.doReset.bind(g);
 g.doReset=function(){state.current=null;state.answers={};try{localStorage.removeItem(STORAGE)}catch{}const res=oldReset.apply(g,arguments);updateReady();return res};
 const oldSel=g.selType.bind(g);
 g.selType=function(id){const ret=oldSel.apply(g,arguments);if(state.current&&id!==state.current.calcType){state.current=null;try{localStorage.removeItem(STORAGE)}catch{}updateReady()}return ret;};
 const oldExample=g.loadExample?.bind(g);
 if(oldExample)g.loadExample=function(){state.current=null;state.answers={};try{localStorage.removeItem(STORAGE)}catch{}updateReady();return oldExample.apply(g,arguments)};
 if($('legalStruct'))$('legalStruct').addEventListener('change',updateReady);
 updateReady();
}
window.SHARAKAH_GUIDE={open:function(){open('intro')},fromCalculator:function(){const g=window.SHARAKAH_APP;if(g&&$('toolWrapper')?.style.display==='block'){g.goHome();setTimeout(function(){open('intro')},380)}else open('intro')},getResult:function(){return state.current},evaluate:evaluate,questions:QUESTIONS};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){makeShell();bindCalculator()});else{makeShell();bindCalculator()}
})();