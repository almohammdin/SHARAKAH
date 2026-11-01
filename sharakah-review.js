/* SHARAKAH 1.2.6 — explicit contribution, ownership and profit decisions. */
(()=>{
'use strict';
const g=window.SHARAKAH_APP,$=id=>document.getElementById(id),h=s=>g.escapeHtml(String(s??''));
const companyForms=new Set(['llc','simplified','jsc','solidarity','commandite']);
const workKinds={pending:'يحدد مقابل العمل لاحقًا',profit:'نصيب أرباح مقابل العمل',equity:'ملكية مقترحة مقابل العمل',fee:'أجر محدد مقابل العمل'};
const transferKinds={pending:'يحدد الحق المقدم لاحقًا',ownership:'نقل ملكية الأصل أو الحق',license:'حق استخدام أو ترخيص محدد'};
const timingKinds={pending:'تحدد حالة العمل لاحقًا',past:'عمل منجز',future:'عمل مستقبلي',mixed:'عمل منجز ومستقبلي يحتاج فصلًا'};
const fields=['profitBasis','distributionSchedule','reportsSchedule','borrowingDecision','assetSaleDecision','capitalDecision'];
const defaults=()=>Object.fromEntries(fields.map(k=>[k,'']));
g.reviewFields=defaults();
const format=n=>n===null||n===undefined||n===''?'لم تُحدد':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n));
g.percentText=n=>n===null||n===undefined||n===''?'لم تُحدد':format(n)+'%';
g.percentHtml=n=>'<bdi dir="ltr">'+h(g.percentText(n))+'</bdi>';
const number=v=>g.numberOrNull(v);
const val=id=>$(id)?.value.trim()||'';
const money=v=>v===null||v===undefined||v===''?'لم تُحدد':g.moneyText(v);
const workValue=p=>p.work&&p.work!=='no'?Math.max(0,(Number(p.fmv)||0)-(Number(p.paid)||0))*(Number(p.dur)||0):0;
const capitalValue=p=>(Number(p.cash)||0)+(p.assetTransfer==='ownership'?Number(p.assets)||0:0)+(p.ipTransfer==='ownership'?Number(p.ip)||0:0);
const normal=()=>['fnb','deal'].includes(g.type);
const explicitProfit=p=>number(p.profit);
const sum=a=>a.reduce((s,n)=>s+n,0);
const select=(p,key,label,choices)=>'<div class="fg"><label for="review-'+key+'-'+p.id+'">'+label+'</label><select id="review-'+key+'-'+p.id+'" data-review-party="'+p.id+'" data-review-key="'+key+'">'+Object.entries(choices).map(([v,t])=>'<option value="'+v+'" '+((p[key]||'pending')===v?'selected':'')+'>'+t+'</option>').join('')+'</select></div>';
const input=(p,key,label,numeric=false)=>'<div class="fg"><label for="review-'+key+'-'+p.id+'">'+label+'</label><input id="review-'+key+'-'+p.id+'" '+(numeric?'class="num" data-unit="percent" inputmode="decimal"':'type="text"')+' data-review-party="'+p.id+'" data-review-key="'+key+'" value="'+h(p[key]??'')+'" placeholder="لم تُحدد"></div>';
const oldAdd=g.addParty;
g.addParty=function(d={}){const before=g.parties.length;oldAdd(d);if(g.parties.length===before)return;const p=g.parties.at(-1);for(const k of ['workKind','workTiming','workTerms','workStop','assetTransfer','assetDescription','ipTransfer','ipDescription','otherDescription','proposedPct'])p[k]=d[k]??(k==='proposedPct'?'':'');g.renderParties()};
const oldParties=g.renderParties;
g.renderParties=function(){oldParties();if(g.type==='reorg')return;for(const p of g.parties){const body=$('lbl_'+p.id)?.closest('.party-card')?.querySelector('.party-body');if(!body)continue;
 if(g.type==='mudaraba'){for(const el of body.querySelectorAll('input'))if(/'fmv'|'paid'|'dur'/.test(el.getAttribute('oninput')||''))el.closest('.fg')?.classList.add('hide');}
 if(normal()){const box=document.createElement('div');box.className='review-party card-sm';let content='';
 if(Number(p.assets)>0)content+=select(p,'assetTransfer','ما الحق المقدم في الأصل؟',transferKinds)+input(p,'assetDescription','وصف الأصل وأساس تقييمه ومدة استخدامه إن وجدت');
 if(Number(p.ip)>0)content+=select(p,'ipTransfer','ما الحق المقدم في العلامة أو الملكية الفكرية؟',transferKinds)+input(p,'ipDescription','وصف الحق وملكيته وأساس تقييمه ونطاق الترخيص');
 if(Number(p.net)>0)content+=input(p,'otherDescription','وصف الالتزام الآخر ومخرجه وموعده وأساس قيمته');
 if(p.work&&p.work!=='no')content+='<h4>مقابل العمل واستحقاقه</h4>'+select(p,'workKind','ما مقابل العمل المتفق أو المقترح؟',workKinds)+select(p,'workTiming','هل أُنجز العمل؟',timingKinds)+input(p,'workTerms','المهام والمقابل ومراحل الاستحقاق ومن ينقل الحصة عند اختيار الملكية')+input(p,'workStop','تسوية الحقوق عند التوقف أو الإخلال')+'<p class="help">فرق الأجر قيمة تفاوضية. وضّح إن كان مستحقًا مؤجلًا أو مقابلًا للحقوق المقترحة، وافصل العمل المدفوع عن العمل المحتسب.</p>';
 content+='<h4>قرار الملكية</h4>'+input(p,'proposedPct','نسبة الملكية المقترحة بإدخال الأطراف، إن حُددت',true)+'<p class="help">تُدخل بصورة مستقلة عن مقارنة المساهمات. يستكمل نقل الحصص أو إصدارها وفق الإطار النظامي.</p>';
 box.innerHTML=content;body.append(box);
 }
}g.normalizeNumberInputs($('partyList'))};
function frameworkText(){if(g.type==='mudaraba')return 'المضاربة: يقدم رب المال المال ويقدم المضارب الإدارة، ويُدخل نصيب كل طرف من الربح بالاتفاق. خسارة رأس المال على رب المال؛ ويعوض المضارب الضرر الناتج عن تعديه أو تقصيره (المواد 550، 557، 559). يدعم هذا المسار المضاربة النقدية البسيطة؛ رأس المال العيني وخلط الأموال يحتاجان ترتيبًا متخصصًا.';
 if(companyForms.has(val('legalStruct')))return 'نظام الشركات: النقد والحصص العينية وحدهما يكوّنان رأس المال. حصة العمل مقابل الأرباح متاحة للأشكال التي تجيزها المادة 13؛ شركتا المساهمة والمساهمة المبسطة مستثناتان من حصة العمل المباشرة. ويمكن تقديم حصص أو أسهم مقابل خدمات وفق الإجراءات. يجوز تفاوت الأرباح والخسائر وفق عقد التأسيس، مع استثناء شريك العمل وحده بشروط المادة 23.';
 if(val('legalStruct')==='civil')return 'عقد الشركة المدني: تتحدد الحصص بالاتفاق؛ يمكن الاتفاق على نسب أرباح مختلفة، وتوزع الخسائر بحسب الحصص (المواد 529–536). ينظم نقل الأصول والحقوق ومقابل العمل صراحة.';
 return 'الإطار النظامي يحتاج تحديدًا. المقارنة المالية تساعد التفاوض؛ يتحدد أثرها في الملكية والأرباح والخسائر بعد اختيار العلاقة المناسبة.';}
function syncFramework(){const el=$('reviewFramework');if(el)el.textContent=frameworkText();const legal=$('legalStruct');if(legal){legal.disabled=g.type==='mudaraba';if(g.type==='mudaraba')legal.value='mudaraba';}const n=$('nonStartupWeightNotice');if(n&&normal())n.textContent='تقارن الأداة القيم المدخلة للمال والأصول والعمل. الملكية المقترحة ونسب الأرباح قرارات مستقلة تدخل في بطاقات الأطراف.';}
const panels=g.updPanels;g.updPanels=function(){panels();syncFramework();lesson()};
const calc=g.calc;g.calc=function(){calc();if(normal()){for(const r of g.results){const p=g.parties.find(p=>p.id===r.id);r.profit=explicitProfit(p);r.proposedPct=number(p.proposedPct);r.capitalValue=capitalValue(p);}g.renderResults()}};
const validate=g.validateOutputs;g.validateOutputs=function(){const errors=validate();if(g.type==='reorg')return errors;const legal=val('legalStruct');if(normal()&&legal==='mudaraba')errors.push('لعقد المضاربة اختر مسار «عقد مضاربة» لتطبيق حساب الربح المناسب.');
 if(g.type==='existing'&&['civil','mudaraba'].includes(legal))errors.push('دخول شريك في شركة قائمة يحتاج اختيار شكل الشركة؛ للعلاقات المدنية اختر المسار المناسب.');
 if(normal()){const proposed=g.parties.map(p=>number(p.proposedPct));if(proposed.some(n=>n!==null)&&(proposed.some(n=>n===null||n<0||n>100)||Math.abs(sum(proposed.map(n=>n||0))-100)>1e-6))errors.push('أكمل نسب الملكية المقترحة لكل الأطراف بمجموع 100% أو اتركها جميعًا لتحديدها لاحقًا.');}
 return [...new Set(errors)]};
const alerts=g.renderAlerts;g.renderAlerts=function(){alerts();if(g.type==='reorg')return;
 for(const el of $('smartAlerts').children){if(el.classList.contains('release-review'))el.textContent='الأرقام للمراجعة الأولية. مقارنة المساهمات مستقلة عن قرار الملكية ونسب الأرباح.';}
 const add=t=>{const el=document.createElement('div');el.className='notice notice-info';el.textContent=t;$('smartAlerts').append(el)};
 add(frameworkText());
 if(normal()){
 if(g.parties.some(p=>explicitProfit(p)===null))add('نسب الأرباح: لم تُحدد بالكامل. أدخل الاتفاق في بطاقات الأطراف؛ تظل مقارنة المساهمات منفصلة عنها.');
 for(const p of g.parties){if(workValue(p)>0)add(p.name+': قيمة العمل '+money(workValue(p))+'؛ '+(workKinds[p.workKind]||workKinds.pending)+'، '+(timingKinds[p.workTiming]||timingKinds.pending)+'. '+(p.workStop?'تسوية التوقف: '+p.workStop:'تحتاج تسوية الحقوق عند توقف العمل إلى قرار.'));
 if((p.assets>0&&!['ownership','license'].includes(p.assetTransfer))||(p.ip>0&&!['ownership','license'].includes(p.ipTransfer)))add(p.name+': حدد هل الأصل أو الحق يُنقل للمشروع أو يُستخدم بترخيص. أساس رأس المال المقترح أدناه يحتسب الحقوق المحددة للنقل فقط.');
 if(p.net>0&&workValue(p)>0)add(p.name+': راجع اختلاف الالتزام الآخر عن العمل المحتسب لتجنب تكرار قيمة الخدمة نفسها.');}
 }
 if(g.type==='existing')add('الحساب يفترض قيمة حقوق الملكية بعد مراعاة الديون والنقد، وسعرًا موحدًا للحصص في الصفقة المختلطة. راجع حقوق الأولوية والاسترداد والإجراءات بحسب شكل الشركة.');
};
const cards=g.renderPartyCards;g.renderPartyCards=function(){cards();if(!normal())return;const total=sum(g.parties.map(capitalValue));[...$('partyResults').children].forEach((card,i)=>{const p=g.parties[i];if(!p)return;const el=document.createElement('div');el.className='notice notice-info';el.innerHTML='<div>أساس رأس المال المقترح: '+h(money(capitalValue(p)))+(total?' ('+g.percentHtml(capitalValue(p)/total*100)+')':'')+'</div><div>الملكية المقترحة المدخلة: '+g.percentHtml(number(p.proposedPct))+'</div><div>نصيب الأرباح المدخل: '+g.percentHtml(explicitProfit(p))+'</div><small>أساس رأس المال يجمع النقد والأصول والحقوق المحددة للنقل، ويخضع للتحقق والتقييم والإجراءات.</small>';card.append(el)})};
const oldDraft=g.buildAgr;
g.buildAgr=function(){if(g.type==='reorg')return oldDraft();g.calc();const errors=g.validateOutputs();if(errors.length){$('agrBox').textContent='لم تُجهز الورقة: '+errors.join(' ');g.notice(errors.join(' '));return false;}
 const text=id=>{const el=$(id);return !el||!val(id)||val(id)==='later'?'لم تُحدد':el.tagName==='SELECT'?el.selectedOptions[0].textContent:val(id)};
 const rows=['نقاط اتفاق الشركاء — ورقة مراجعة','المشروع: '+(val('projName')||'لم يُحدد'),'تاريخ إعداد الورقة: '+g.formatDate(new Date()).label,'','1) الإطار النظامي',text('legalStruct'),frameworkText(),'','2) الأطراف والمساهمات والحقوق'];
 for(const p of g.parties){const r=g.results.find(r=>r.id===p.id);rows.push(p.name+' | '+p.cap);
 if(g.type==='existing')rows.push(p.cap==='مستثمر جديد'?'الملكية المقترحة بعد الدخول: '+g.percentText(r.pct):'الملكية الحالية: '+g.percentText(p.currentPct)+' | المقترحة بعد الدخول: '+g.percentText(r.pct));
 else {rows.push('النقد المتفق أو المقترح: '+money(p.cash)+' | المدفوع نقدًا فعليًا: '+money(p.cashPaid));
 if(p.assets>0)rows.push('الأصول: '+money(p.assets)+' | '+(transferKinds[p.assetTransfer]||transferKinds.pending)+' | '+(p.assetDescription||'الوصف وأساس التقييم: لم يُحددا'));
 if(p.ip>0)rows.push('الملكية الفكرية: '+money(p.ip)+' | '+(transferKinds[p.ipTransfer]||transferKinds.pending)+' | '+(p.ipDescription||'الوصف والنطاق وأساس التقييم: لم تُحدد'));
 if(p.net>0)rows.push('التزام آخر: '+money(p.net)+' | '+(p.otherDescription||'المخرج والموعد وأساس القيمة: لم تُحدد'));
 if(p.work&&p.work!=='no'){rows.push('العمل: '+(p.note||'تحتاج المهام إلى وصف'));
 if(g.type!=='mudaraba')rows.push('الأجر الشهري التقديري: '+money(p.fmv)+' | المستلم شهريًا: '+money(p.paid)+' | مدة العمل: '+(p.dur||'لم تُحدد')+' شهر','قيمة فرق الأجر التقديرية: '+money(workValue(p))+' | '+(timingKinds[p.workTiming]||timingKinds.pending),'مقابل العمل: '+(workKinds[p.workKind]||workKinds.pending),'المهام وآلية الاستحقاق: '+(p.workTerms||'لم تُحدد'),'التسوية عند التوقف: '+(p.workStop||'لم تُحدد'));}
 if(normal())rows.push('أساس رأس المال المقترح من النقد والحقوق المحددة للنقل: '+money(capitalValue(p)),'نسبة مقارنة قيم المساهمات: '+g.percentText(r.pct),'الملكية المقترحة المدخلة: '+g.percentText(number(p.proposedPct)));
 rows.push('نصيب الأرباح المدخل: '+g.percentText(explicitProfit(p)));
 }if(p.note)rows.push('ملاحظة الطرف: '+p.note);rows.push('');}
 if(g.type==='existing')rows.push('3) الصفقة والدفعات',g.entryFundingText(),'قيمة حقوق الملكية قبل الدخول: '+money(g.numVal('coVal')),'تاريخ التقييم: '+(g.transaction.date||'لم يُحدد'),'أساس التقييم: '+(g.transaction.origin==='derived'?'مستنتج من مبلغ الصفقة ونسبتها؛ يراجع كتسعير تفاوضي':'مدخل من المستخدم؛ يراجع المصدر والديون والنقد'),'الصفقة المختلطة تفترض تسعير التمويل وشراء الحصص على الأساس نفسه. أصول الشركة السابقة داخلة في تقييمها.');
 if(g.type==='mudaraba')rows.push('3) رأس المال والربح والخسارة','نسب رأس المال بين أرباب المال: '+g.results.filter(r=>r.cap==='رب المال (ممول)').map(r=>r.name+' '+g.percentText(r.capitalPct)).join('، '),'يتحمل رب المال نقص رأس المال. يعوض المضارب الضرر الناتج عن تعديه أو تقصيره؛ وفي الخسارة المعتادة يتحمل رب المال نقص المال والمضارب ضياع جهده.','نصيب الربح نسبة من الربح المتحقق. يمكن الاتفاق على أجر معلوم مقابل عمل معين وفق المادة 559؛ ويحدد العمل والأجر كتابة.');
 rows.push('','4) الإدارة والبنود وحالة القرار');
 const terms={managerName:'الإدارة اليومية',decisionRule:'القاعدة العامة للقرارات',fundingRule:'التمويل الإضافي',agreementTerm:'المدة',exitRule:'التخارج',keyNotes:'ملاحظات الاتفاق',amicableOn:'الحل الودي',amicableDays:'مدته بالأيام',disputeMethod:'المسار عند تعذره',disputeNote:'تفاصيل الفصل'};
 if(g.type==='mudaraba')Object.assign(terms,{mudScope:'نطاق تصرف المضارب',mudFee:'أجر معلوم لعمل معين: يحدد العمل والمبلغ'});
 for(const [id,label]of Object.entries(terms))rows.push(label+': ['+(window.SHARAKAH_DECISION_STATES[g.termStates[id]||'pending'])+'] '+text(id));
 const labels={profitBasis:'تعريف الربح والمصاريف والاحتياطيات',distributionSchedule:'مواعيد التوزيع وشروط استحقاقه',reportsSchedule:'التقارير والاطلاع',borrowingDecision:'الاقتراض والضمانات: صاحب القرار والنصاب والحد',assetSaleDecision:'بيع أصل رئيسي: صاحب القرار والنصاب والحد',capitalDecision:'تعديل رأس المال ودخول شريك: النصاب والإجراءات'};
 for(const [id,label]of Object.entries(labels))rows.push(label+': [للمراجعة] '+(g.reviewFields[id]||'لم يُحدد'));
 rows.push('','5) مسائل تستكمل قبل التنفيذ','توثيق المساهمات وتقييم الحصص العينية ونقل الحقوق، استحقاق العمل وتوقفه، حقوق الأولوية والاسترداد، تعارض المصالح، وأحكام الخسائر والقرارات بحسب الإطار المختار.','مرجع نظام الشركات: https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/a8376aea-1bc3-49d4-9027-aed900b555af/1','مرجع نظام المعاملات المدنية: https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/655fdb42-8c96-422b-b8c4-b04f0095c94c/1','','صفة الورقة: بيانات ونقاط نقاش للمراجعة؛ يقصد الأطراف استكمال الصياغة والإجراءات قبل التعاقد ونقل الحقوق. عبارة «معتمد» تسجل ما أدخله المستخدم عن قرار الأطراف، وتحتاج إثباتًا ووثائق. يراجع المختص أثر القبول والتوقيع والتعامل اللاحق. اختيار التحكيم هنا توجه للصياغة؛ يستكمل اتفاق التحكيم وشروطه مع المختص.');
 $('agrBox').textContent=g.displayText(rows.join('\n'));$('agrTitle').textContent='المساهمات والحقوق ونقاط الاتفاق';$('contractGuidance').textContent='راجعوا القيم والقرارات والمسائل المتبقية مع المختص قبل التنفيذ.';return true;};
function readFields(){for(const id of fields)if($(id))g.reviewFields[id]=$(id).value;}
function syncFields(){for(const id of fields)if($(id))$(id).value=g.reviewFields[id]||'';syncFramework();}
const snap=g.snapshot;g.snapshot=()=>({...snap(),reviewFields:{...g.reviewFields}});
const restore=g.restoreSnapshot;g.restoreSnapshot=function(s){g.reviewFields={...defaults(),...s.reviewFields};restore(s);syncFields()};
const save=g.saveProgress;g.saveProgress=function(){readFields();save();try{const data=JSON.parse(localStorage.getItem('sharakah_save')||'null');if(data){data.reviewFields=g.reviewFields;data.schema=5;localStorage.setItem('sharakah_save',JSON.stringify(data))}}catch{}};
const load=g.loadProgress;g.loadProgress=function(){let data;try{data=JSON.parse(localStorage.getItem('sharakah_save')||'null')}catch{}load();g.reviewFields={...defaults(),...data?.reviewFields};syncFields()};
const reset=g.doReset;g.doReset=async function(...args){g.reviewFields=defaults();await reset(...args);syncFields()};
function lesson(){const box=$('reviewLesson');if(!box)return;const lessons={existing:'ابدأ هنا: قيمة حقوق الملكية 2,000,000. مبلغ 500,000 يدخل الشركة يعطي 20%؛ وشراء حصة من المالك بالمبلغ نفسه يعطي 25%. افترض تسعيرًا موحدًا وراجع أثر الديون والنقد.',mudaraba:'الممول يقدم 1,000,000 والمضارب يدير النشاط. الربح بالاتفاق 40% و60%. ربح قابل للتوزيع قدره 200,000 يعطي 80,000 و120,000. النسب اتفاق تعليمي؛ قيمة العمل لا تحددها حسابيًا.',fnb:'محمد يقدم نقدًا وتجهيزات بقيمة 450,000، ونورة 50,000؛ أساس رأس المال 90% و10%. فرق أجر نورة 96,000 ينتج مقارنة مساهمات 75.50% و24.50%. الملكية المقترحة تبدأ من 90% و10%، والأرباح التعليمية 60% و40% مقابل المال والعمل. ناقش تغيير الاتفاق وآلية استحقاقه.',deal:'صفقة معدات: ناصر يقدم 500,000 ونوف 200,000 وتنفذ الصفقة. أساس المال 71.43% و28.57%؛ قيمة عمل تقديرية 90,000 تجعل مقارنة المساهمات 63.29% و36.71%. الأرباح المقترحة في المثال 60% و40%. حدد الحصص وآثار الخسارة كتابة وفق الإطار المختار.'};box.textContent=lessons[g.type]||'';box.hidden=!box.textContent;}
const example=g.loadExample;g.loadExample=function(type){g.reviewFields=defaults();example(type);setTimeout(()=>{if(g.type!==type)return;if(type==='fnb'){const [a,b]=g.parties;a.assetTransfer='ownership';a.assetDescription='تجهيزات مقهى مستعملة، قيمة تعليمية 150,000 تخضع للتحقق والتقييم';a.proposedPct=90;a.profit=60;b.proposedPct=10;b.profit=40;b.workKind='profit';b.workTiming='future';b.workTerms='إدارة يومية لمدة 12 شهرًا. 4,000 شهريًا مقابل عمل محدد، ونصيب الربح 40% يشمل المال والعمل وفق الصياغة المتفق عليها؛ فرق الأجر قيمة تفاوضية.';b.workStop='تراجع استحقاقات العمل حتى تاريخ التوقف؛ وتبقى حقوق الحصة النقدية خاضعة لاتفاق الشركاء.';}
 if(type==='deal'){$('projName').value='صفقة معدات النخيل';$('legalStruct').value='civil';const[a,b]=g.parties;a.profit=60;b.profit=40;b.workKind='profit';b.workTiming='future';b.workTerms='التفاوض وشراء المعدات وإعادة بيعها خلال 6 أشهر؛ نسبة الربح المقترحة تشمل المال والعمل.';b.workStop='تسوية الأعمال المنجزة والمصاريف والحقوق وفق الاتفاق قبل إنهاء المهمة.';}
 if(type==='mudaraba'){$('legalStruct').value='mudaraba';g.parties.forEach(p=>{p.fmv=0;p.paid=0;p.dur='';});}
 g.reviewFields.profitBasis='الربح بعد المصاريف المتفق عليها والتسويات والاحتياطيات اللازمة؛ تستكمل التفاصيل قبل التوزيع.';
 g.reviewFields.reportsSchedule='تقرير مالي وتشغيلي شهري مع إتاحة المستندات للأطراف.';
 g.renderParties();syncFields();lesson();g.scheduleSave();},240)};
const init=g.init;g.init=function(){init();
 const framework=document.createElement('div');framework.id='reviewFramework';framework.className='notice notice-info';$('partyList').before(framework);
 const teaching=document.createElement('div');teaching.id='reviewLesson';teaching.className='notice notice-gold';teaching.hidden=true;framework.before(teaching);
 const guide=document.createElement('div');guide.className='notice notice-info';guide.innerHTML='<strong>اختر العلاقة أولًا</strong><p>ملكية ومقابل عمل: مشروع تشغيلي أو صفقة. مال من طرف وإدارة من طرف مع اقتسام الربح: مضاربة. تغيير ملكية شركة موجودة: دخول شريك. ترتيب علاقة قديمة وتسوياتها: إعادة تنظيم.</p>';$('typeGrid').before(guide);
 const extra=document.createElement('details');extra.className='card';extra.innerHTML='<summary style="cursor:pointer;font-weight:700">تفاصيل الأرباح والتقارير وصلاحيات القرارات</summary><div class="grid2" style="margin-top:16px">'+fields.map(id=>'<div class="fg"><label for="'+id+'">'+({profitBasis:'كيف يُعرّف الربح وما المصاريف والاحتياطيات؟',distributionSchedule:'متى توزع الأرباح وبأي شروط؟',reportsSchedule:'ما التقارير ومواعيدها وحق الاطلاع؟',borrowingDecision:'الاقتراض والضمانات: من يقرر وبأي نصاب وحد؟',assetSaleDecision:'بيع أصل رئيسي: من يقرر وبأي نصاب وحد؟',capitalDecision:'تعديل رأس المال ودخول شريك: النصاب والإجراءات'})[id]+'</label><textarea id="'+id+'" placeholder="لم يُحدد"></textarea></div>').join('')+'</div><p class="help">تُراجع الأنصبة وفق الشكل القانوني وعقد التأسيس؛ 65% مؤشر حسابي وليست عتبة نظامية عامة. هذه التفاصيل مسودات للمراجعة.</p>';$('ph3').querySelector('.nav-row').before(extra);
 document.addEventListener('input',e=>{const el=e.target;if(el.dataset?.reviewParty){const p=g.parties.find(p=>p.id===Number(el.dataset.reviewParty));if(p){p[el.dataset.reviewKey]=el.value;g.scheduleSave();}}if(fields.includes(el.id)){g.reviewFields[el.id]=el.value;g.scheduleSave();}});
 document.addEventListener('change',e=>{if(e.target.id==='legalStruct')syncFramework();if(e.target.matches('#partyList input')&&/'assets'|'ip'|'net'/.test(e.target.getAttribute('oninput')||''))g.renderParties();});
 // Advanced tools remain available, with the assistant collapsed on first opening.
 $('assistantPanel')?.classList.add('is-collapsed');
 window.PartnershipAssistant?.toggleCard?.(false);
 const hints={fnb:'ملكية ومقابل عمل في مشروع مستمر',deal:'مساهمات وربح صفقة لها نهاية محددة',existing:'تمويل للشركة أو شراء من مالك حالي',mudaraba:'مال من طرف وإدارة من طرف ونسب ربح متفق عليها',reorg:'متقدم: تسويات وأدوار وبدائل لعلاقة قائمة'};
 for(const t of g.TYPES)if(hints[t.id])t.desc=hints[t.id];g.renderTypes();
 const examples=$('quickExamplesCard');if(examples){const buttons=[...examples.querySelectorAll('[onclick*="loadExample"]')];if(buttons.length){const parent=buttons[0].parentElement;for(const type of ['existing','mudaraba','fnb','deal']){const b=buttons.find(b=>(b.getAttribute('onclick')||'').includes("'"+type+"'"));if(b)parent.append(b)}}}
 syncFields();
};
window.SHARAKAH_REVIEW={workValue,capitalValue,frameworkText};
})();
