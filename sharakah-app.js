const G = {
  type: null,
  phase: 1,
  cnt: 0,
  parties: [],
  W: { Cash:4, Asset:3, Effort:3, IP:3, Net:2 },
  activeProfile: 'balanced',
  results: [],
  mudarabaCheck: null,
  calculationError: null,
  MAX_PARTIES: 8,

  TYPES: [
    { id:'fnb', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19h16M6 16V8l6-4 6 4v8M9 16v-5h6v5"/></svg>', name:'مشروع تشغيلي', desc:'إدارة وتشغيل يومي: متجر، مطعم، فندق، مقاولات' },
    { id:'deal', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20h18M5 17l5-5 4 3 5-8M16 7h3v3"/></svg>', name:'صفقة تجارية محددة', desc:'فرصة مؤقتة تنتهي بانتهاء الصفقة' },
    { id:'existing',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20h16M6 20V5h8v15M14 10h4v10M9 8h2M9 12h2M9 16h2"/></svg>', name:'دخول شريك في شركة قائمة', desc:'شراء حصة قائمة أو ضخ تمويل جديد' },
    { id:'mudaraba',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 8l4-3 4 3 4-3 4 3M4 8v8l4 3 4-3 4 3 4-3V8M8 5v8M16 5v8"/></svg>', name:'عقد مضاربة', desc:'رب مال يقدم المال ومضارب يقدم العمل' },
  ],


  COLORS: ['#0B1F33','#2F6F73','#56758F','#8B671E','#66856F','#7D4753','#667684','#6E5F80'],

  HINTS: {
    startup: 'مشروع جديد يستهدف النمو والتوسع، ويدخل فيه مستثمر مقابل نسبة ملكية. مناسب للمشروع القابل للنمو الذي يحتاج تمويلا أو شريكا استثماريا.',
    fnb: '⚙️ مشروع يعتمد على التشغيل اليومي مثل متجر، مطعم، فندق، بقالة، محل خضار أو مؤسسة مقاولات. مناسب عندما تختلف المساهمات بين تمويل، إدارة، تشغيل، أصول أو موقع.',
    deal: 'شراكة مؤقتة لتنفيذ فرصة محددة مثل شراء وبيع أو توريد أو تطوير عقار. وتنتهي العلاقة بانتهاء الصفقة وتوزيع العوائد.',
    existing: 'إدخال شريك جديد في شركة تعمل فعليا، مقابل مبلغ أو قيمة مضافة. تقدر حصته بناء على قيمة الشركة قبل دخوله وبعده.',
    mudaraba: 'مضاربة نقدية بسيطة: رب المال يقدم المال والمضارب يقدم العمل، والربح بنسبة متفق عليها. رأس المال غير النقدي أو مساهمة المضارب بماله يحتاجان مراجعة متخصصة؛ لا تحذف الأداة أي مساهمة عند تغيير المسار.'
  },

  PROFILES: [
    { id:'balanced', name:'توازن عادل', desc:'مناسب لمعظم الشراكات: المال والجهد والأصول تُحتسب بتوازن.', W:{ Cash:4, Asset:3, Effort:3, IP:3, Net:2 } },
    { id:'capital', name:'المال هو الأساس', desc:'للمشاريع التي تعتمد على السيولة ورأس المال أكثر من التشغيل.', W:{ Cash:6, Asset:3, Effort:1.5, IP:2, Net:1.5 } },
    { id:'ops', name:'شراكة تشغيلية', desc:'للمتاجر والمطاعم والفنادق والمقاولات حيث الإدارة اليومية عامل حاسم.', W:{ Cash:3, Asset:3, Effort:5, IP:2, Net:2 } },
    { id:'innovation', name:'الابتكار والفكرة', desc:'للمنتجات التقنية أو العلامات أو الملكية الفكرية المؤثرة في القيمة.', W:{ Cash:3, Asset:2, Effort:3, IP:6, Net:2 } },
    { id:'deal_profile', name:'صفقة مباشرة', desc:'لصفقة محددة يغلب عليها التمويل والأصل محل الصفقة.', W:{ Cash:5, Asset:4, Effort:2, IP:1.5, Net:2 } }
  ],

  /* ─── INIT ─── */
  init() {
    this.updSteps();
    this.renderTypes();
    this.renderProfiles();
    this.initWeights();
    // default parties: لا نفترض مساهمات أو ملاحظات مسبقة
    this.addParty({ name:'الطرف الأول' });
    this.addParty({ name:'الطرف الثاني' });
    document.getElementById('btnAddParty').addEventListener('click', () => this.addParty());
    this.normalizeNumberInputs();
    this.applyFieldEnhancements();
    this.updDisputeFields();
    this.updExistingMode();
  },

  /* ─── SPLASH → TOOL ─── */
  startTool() {
    const splash = document.getElementById('splashScreen');
    const tool = document.getElementById('toolWrapper');
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.classList.add('gone');
      tool.style.display = 'block';
      tool.style.animation = 'fadeUp .4s ease';
      // ضبط top للـ toolbar (fixed) وstep-bar بناءً على الارتفاعات الفعلية
      requestAnimationFrame(() => {
        const hdr = document.querySelector('header');
        const hdrH = hdr ? hdr.getBoundingClientRect().height : 58;
        const toolbar = document.querySelector('.tool-toolbar');
        const spacer  = document.getElementById('toolbarSpacer');
        const stepbar = document.querySelector('.step-bar');
        // toolbar fixed just below sticky header
        if (toolbar) toolbar.style.top = hdrH + 'px';
        // give toolbar time to render then measure its height
        setTimeout(() => {
          const tbH = toolbar ? toolbar.getBoundingClientRect().height : 42;
          // spacer fills the height of fixed toolbar so content isn't hidden
          if (spacer) spacer.style.height = tbH + 'px';
          // step-bar sticks below header + toolbar
          if (stepbar) stepbar.style.top = (hdrH + tbH) + 'px';
        }, 50);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 350);
  },

  /* ─── TOOLBAR: GO HOME ─── */
  goHome() {
    const splash = document.getElementById('splashScreen');
    const tool = document.getElementById('toolWrapper');
    tool.style.opacity = '0';
    tool.style.transition = 'opacity .3s ease';
    setTimeout(() => {
      tool.style.display = 'none';
      tool.style.opacity = '';
      tool.style.transition = '';
      splash.classList.remove('gone');
      splash.style.opacity = '0';
      requestAnimationFrame(() => {
        splash.style.opacity = '1';
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  },

  /* ─── TOOLBAR: RESET ─── */
  confirmReset() {
    document.getElementById('resetModal').classList.add('open');
  },
  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },
  doReset(fromModal = true) {
    if (fromModal) this.closeModal('resetModal');
    this.type = null;
    this.phase = 1;
    this.parties = [];
    this.results = [];
    this.activeProfile = 'balanced';
    this.W = { Cash:4, Asset:3, Effort:3, IP:3, Net:2 };
    localStorage.removeItem('sharakah_save');
    ['projName','legalStruct','preMoney','newInv','targetPct','postMoney','coVal','entryAmt','entryPct','cashInAmt','cashOutAmt','managerName','agreementTerm','keyNotes','mudFee','amicableDays','disputeNote'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const defaults = { entryMode:'cashin', decisionRule:'unanimous', fundingRule:'proportional', exitRule:'firstrefusal', mudScope:'restricted', amicableOn:'yes', disputeMethod:'' };
    Object.entries(defaults).forEach(([id,value]) => { const el = document.getElementById(id); if (el) el.value = value; });
    this.updExistingMode();
    this.updDisputeFields();
    document.getElementById('restoreBanner')?.classList.add('hide');
    // Re-init
    this.renderTypes();
    this.renderProfiles();
    this.initWeights();
    document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
    document.getElementById('ph1').classList.add('active');
    document.getElementById('partyList').innerHTML = '';
    this.addParty({ name:'الطرف الأول' });
    this.addParty({ name:'الطرف الثاني' });
    this.go(1);
    this.normalizeNumberInputs();
    this.applyFieldEnhancements(document.getElementById('partyList'));
  },

  /* ─── TOOLBAR: SAVE / LOAD ─── */
  saveProgress() {
    const parties = this.parties.map(p => ({ ...p }));
    const val = id => document.getElementById(id)?.value || '';
    const data = {
      type: this.type, phase: this.phase, activeProfile: this.activeProfile, W: this.W,
      projName: val('projName'), legalStruct: val('legalStruct'),
      preMoney: val('preMoney'), newInv: val('newInv'), targetPct: val('targetPct'), postMoney: val('postMoney'),
      coVal: val('coVal'), entryAmt: val('entryAmt'), entryPct: val('entryPct'), entryMode: val('entryMode'), cashInAmt: val('cashInAmt'), cashOutAmt: val('cashOutAmt'), sellerPartyId: val('sellerPartyId'),
      managerName: val('managerName'), decisionRule: val('decisionRule'), fundingRule: val('fundingRule'), agreementTerm: val('agreementTerm'), exitRule: val('exitRule'), keyNotes: val('keyNotes'), mudScope: val('mudScope'), mudFee: val('mudFee'),
      amicableOn: val('amicableOn'), amicableDays: val('amicableDays'), disputeMethod: val('disputeMethod'), disputeNote: val('disputeNote'),
      parties, ts: Date.now()
    };
    try {
      localStorage.setItem('sharakah_save', JSON.stringify(data));
      const badge = document.getElementById('savedBadge');
      badge?.classList.add('show');
      setTimeout(() => badge?.classList.remove('show'), 3000);
    } catch(e) { alert('تعذّر الحفظ في المتصفح. يرجى التحقق من أذونات التخزين.'); }
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem('sharakah_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.type) return;
      const allowedTypes = ['startup','fnb','deal','existing','mudaraba'];
      if (!allowedTypes.includes(data.type)) {
        localStorage.removeItem('sharakah_save');
        return;
      }
      // Restore type
      this.selType(data.type);
      // Restore project fields
      if (data.projName) { const el = document.getElementById('projName'); if(el) el.value = data.projName; }
      if (data.legalStruct) { const el = document.getElementById('legalStruct'); if(el) el.value = data.legalStruct; }
      ['preMoney','newInv','targetPct','postMoney','coVal','entryAmt','entryPct','entryMode','cashInAmt','cashOutAmt','managerName','decisionRule','fundingRule','agreementTerm','exitRule','keyNotes','mudScope','mudFee','amicableOn','amicableDays','disputeMethod','disputeNote'].forEach(id => {
        if (data[id] !== undefined) { const el = document.getElementById(id); if (el) el.value = data[id]; }
      });
      this.updDisputeFields();
      this.updExistingMode();
      // Restore weights & profile
      if (data.W) this.W = data.W;
      if (data.activeProfile) {
        this.activeProfile = data.activeProfile;
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.remove('sel'));
        const pb = document.getElementById('prof_' + data.activeProfile);
        if (pb) pb.classList.add('sel');
      }
      // Restore parties
      if (data.parties && data.parties.length) {
        document.getElementById('partyList').innerHTML = '';
        this.parties = [];
        this.cnt = 0;
        data.parties.forEach(p => this.addParty(p));
      }
      if (data.sellerPartyId) {
        const sellerSelect = document.getElementById('sellerPartyId');
        if (sellerSelect) sellerSelect.value = data.sellerPartyId;
      }
      // Navigate to saved phase
      if (data.phase && data.phase > 1) this.go(data.phase);
      document.getElementById('restoreBanner')?.classList.add('hide');
    } catch(e) { /* ignore corrupt data */ }
  },

  checkSaved() {
    let valid = false;
    try { const d = JSON.parse(localStorage.getItem('sharakah_save') || 'null'); valid = !!(d && d.type); } catch(e) {}
    document.getElementById('restoreBanner')?.classList.toggle('hide', !valid);
  },

  restoreSaved() { this.loadProgress(); },

  dismissSaved() {
    localStorage.removeItem('sharakah_save');
    document.getElementById('restoreBanner')?.classList.add('hide');
    this.doReset(false);
  },

  toggleExamples(btn) {
    const content = document.getElementById('quickExamplesContent');
    const opening = content?.classList.contains('hide');
    content?.classList.toggle('hide', !opening);
    btn?.setAttribute('aria-expanded', opening ? 'true' : 'false');
  },

  clearExample() {
    this.doReset(false);
    document.getElementById('quickExamplesContent')?.classList.add('hide');
    const btn = document.querySelector('.example-toggle');
    btn?.setAttribute('aria-expanded','false');
  },

  /* ─── NAVIGATION ─── */
  go(n) {
    if (n === 3 && !this.validateStep2()) return;
    if (n === 4) this.calc();
    if (n === 5) { this.buildAgr(); }
    document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
    document.getElementById('ph' + n).classList.add('active');
    this.phase = n;
    this.updSteps();
    document.getElementById('progBar').style.width = (n < 5 ? (10 + (n - 1) * 20) : 90) + '%';
    const activePhase = document.getElementById('ph' + n);
    (activePhase || document.getElementById('tool-container'))?.scrollIntoView({ behavior:'smooth', block:'start' });
  },

  validateStep2() {
    const warn = document.getElementById('step2Warn');
    let valid = true;
    let message = 'أدخل مساهمة قابلة للحساب لطرف واحد على الأقل.';

    if (this.type === 'existing') {
      const investors = this.parties.filter(p => p.cap === 'مستثمر جديد');
      const owners = this.parties.filter(p => p.cap !== 'مستثمر جديد');
      const ownership = owners.map(p => Number(p.currentPct));
      const total = ownership.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
      valid = investors.length === 1 && owners.length > 0 && ownership.every(value => Number.isFinite(value) && value > 0 && value <= 100) && Math.abs(total - 100) < 0.05;
      message = investors.length !== 1
        ? 'حدد مستثمرا جديدا واحدا فقط.'
        : `أدخل نسبة الملكية الحالية لكل شريك، ويجب أن يكون مجموعها % 100. المجموع الحالي: ${this.percentText(total)}.`;
    } else if (this.type === 'mudaraba') {
      const check = this.validateMudaraba();
      valid = check.valid;
      message = check.problems.join(' | ') || message;
    } else {
      valid = this.parties.some(p => {
        const effort = p.work !== 'no' ? Math.max(0, (Number(p.fmv)||0) - (Number(p.paid)||0)) * (Number(p.dur)||0) : 0;
        return (Number(p.cash)||0) > 0 || (Number(p.assets)||0) > 0 || (Number(p.ip)||0) > 0 || (Number(p.net)||0) > 0 || effort > 0;
      });
    }

    if (warn) {
      warn.textContent = message;
      warn.classList.toggle('hide', valid);
    }
    if (!valid) warn?.scrollIntoView({ behavior:'smooth', block:'center' });
    return valid;
  },

  updSteps() {
    const list = document.getElementById('stepList');
    const counter = document.getElementById('stepCounter');
    const steps = ['طبيعة الشراكة', 'الأطراف والمساهمات', 'القرارات الأساسية', 'مراجعة التوزيع', 'نقاط الاتفاق'];
    if (counter) counter.textContent = `الخطوة ${this.phase} من ${steps.length}`;
    list.innerHTML = steps.map((s, i) => {
      const n = i + 1;
      const state = n < this.phase ? 'done' : n === this.phase ? 'active' : '';
      const dot = state === 'done' ? '✓' : n;
      return `
        <div class="step-item ${state}">
          <div class="step-dot">${dot}</div>
          <div class="step-name">${s}</div>
        </div>
        ${i < 4 ? '<div class="step-line"></div>' : ''}
      `;
    }).join('');
  },

  /* ─── TYPE ─── */
  renderTypes() {
    document.getElementById('typeGrid').innerHTML = this.TYPES.map(t => `
      <button type="button" class="type-btn" id="tp_${t.id}" onclick="G.selType('${t.id}')">
        <span class="type-icon">${t.icon}</span>
        <div class="type-name">${t.name}</div>
        <div class="type-desc">${t.desc}</div>
      </button>`).join('');
  },

  selType(id) {
    this.type = id;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('sel'));
    document.getElementById('tp_' + id)?.classList.add('sel');
    document.getElementById('btnPh1Next').disabled = false;
    const h = document.getElementById('typeHint');
    h.textContent = this.HINTS[id] || '';
    h.classList.remove('hide');
    this.applyDefaultProfileForType(id);
    this.updPanels();
  },

  updPanels() {
    const t = this.type;

    // Keep party roles aligned with the selected model so the calculation reads the same values shown in the UI.
    if (t === 'mudaraba') {
      this.parties.forEach((p, i) => {
        if (!['رب المال (ممول)', 'مضارب (عامل)'].includes(p.cap)) {
          p.cap = i === 0 ? 'رب المال (ممول)' : 'مضارب (عامل)';
        }
        if (p.cap === 'رب المال (ممول)') {
          // Retain work and let validation explain unsupported combinations.
        } else {
          // Retain the cash contribution when changing partnership type.
          if (p.work === 'no') p.work = 'full';
        }
      });
    } else if (t === 'existing') {
      let investorAssigned = false;
      this.parties.forEach((p, i) => {
        if (p.cap === 'مستثمر جديد' && !investorAssigned) {
          investorAssigned = true;
        } else {
          p.cap = 'شريك حالي';
        }
      });
      if (!investorAssigned && this.parties.length) {
        this.parties[this.parties.length - 1].cap = 'مستثمر جديد';
      }
    } else {
      this.parties.forEach((p, i) => {
        if (p.cap === 'رب المال (ممول)') p.cap = i === 0 ? 'شريك ممول' : 'شريك';
        if (p.cap === 'مضارب (عامل)') p.cap = 'شريك مدير';
        if (p.cap === 'شريك حالي') p.cap = 'شريك';
      });
    }

    const show = (id, s) => document.getElementById(id)?.classList.toggle('hide', !s);
    show('mudarabaHint', t === 'mudaraba');
    show('wCard',        t === 'startup');
    show('calcSectionHead', t === 'startup');
    show('nonStartupWeightNotice', !!t && t !== 'startup');
    show('startupCard',  t === 'startup');
    show('existCard',    t === 'existing');
    show('mudCard',      t === 'mudaraba');

    // عناوين المرحلة الثالثة الديناميكية
    const ph3Title = document.getElementById('ph3Title');
    const ph3Sub   = document.getElementById('ph3Sub');
    if (ph3Title && ph3Sub) {
      if (t === 'startup') {
        ph3Title.textContent = 'طريقة تقدير الحصص';
        ph3Sub.textContent   = 'اختر نمط الشراكة لضبط الأوزان تلقائيا، أو عدلها من الإعدادات المتقدمة.';
      } else {
        ph3Title.textContent = 'القرارات الأساسية';
        ph3Sub.textContent   = 'حدد أهم ما يلزم للتفاهم: الإدارة، القرارات، التمويل، التقارير، الخروج، وحل الخلافات.';
      }
    }

    // اسم الخطوة الثالثة في الشريط
    this.updSteps();

    this.renderParties();
    this.renderExistingSellerOptions();
    this.normalizeNumberInputs();
  },

  /* ─── PARTIES ─── */
  addParty(d = {}) {
    if (this.parties.length >= this.MAX_PARTIES) {
      alert('الحد الأعلى للأطراف هو ' + this.MAX_PARTIES + ' أطراف حتى تبقى النتائج والألوان واضحة.');
      return;
    }
    this.cnt++;
    this.parties.push({
      id: this.cnt,
      name: d.name || ('الطرف ' + this.cnt),
      cap:  d.cap  || (this.type === 'existing'
        ? (this.parties.some(p => p.cap === 'مستثمر جديد') ? 'شريك حالي' : 'مستثمر جديد')
        : 'شريك'),
      cash: d.cash  || 0,
      assets: d.assets || 0,
      ip:   d.ip   || 0,
      net:  d.net  || 0,
      work: d.work || 'no',
      fmv:  d.fmv  || 0,
      dur: d.dur !== undefined ? d.dur : '',
      role: d.role || 'silent',
      vesting: d.vesting || 'no',
      vestYrs: d.vestYrs || '',
      cliffMo: d.cliffMo || '',
      vestNote: d.vestNote || '',
      paid: d.paid || 0,
      profit: d.profit !== undefined ? d.profit : '',
      currentPct: d.currentPct !== undefined ? d.currentPct : '',
      note: d.note || ''
    });
    this.renderParties();
  },

  removeParty(id) {
    this.parties = this.parties.filter(p => p.id !== id);
    this.renderParties();
  },
  inputVal(v) {
    return (v === undefined || v === null || Number(v) === 0 || v === '') ? '' : v;
  },

  partyOrdinal(i) {
    const ord = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر'];
    return 'الطرف ' + (ord[i] || String(i + 1));
  },

  partyRef(p, i) {
    const name = (p?.name || '').trim();
    return `${this.partyOrdinal(i)}${name ? ' (' + name + ')' : ''}`;
  },

  updDisputeFields() {
    const amicableOn = document.getElementById('amicableOn')?.value || 'yes';
    const daysWrap = document.getElementById('amicableDaysWrap');
    if (daysWrap) daysWrap.classList.toggle('hide', amicableOn !== 'yes');
  },

  renderExistingSellerOptions() {
    const select = document.getElementById('sellerPartyId');
    if (!select) return;
    const current = this.parties.filter(p => p.cap !== 'مستثمر جديد');
    const previous = select.value;
    select.innerHTML = current.map(p => `<option value="${p.id}">${this.escapeHtml(p.name || 'شريك حالي')}</option>`).join('');
    if (current.some(p => String(p.id) === previous)) select.value = previous;
  },


  renderParties() {
    const isMud = this.type === 'mudaraba';
    const capOpts = isMud
      ? ['رب المال (ممول)', 'مضارب (عامل)']
      : this.type === 'existing'
        ? ['شريك حالي', 'مستثمر جديد']
        : ['شريك ممول', 'شريك مدير', 'شريك تشغيلي', 'شريك صامت', 'مستثمر جديد', 'صاحب امتياز', 'صاحب موقع / أصل', 'شريك تقني'];

    const roleOpts = [
      ['manager','مدير عام / CEO'], ['ops','تشغيلي / COO'],
      ['tech','تقني / CTO'], ['sales','مبيعات / CMO'],
      ['silent','مستثمر بدور تمويلي']
    ];

    const list = document.getElementById('partyList');
    list.innerHTML = this.parties.map((p, i) => {
      const color = this.COLORS[i % this.COLORS.length];
      const canRm = this.parties.length > 2;
      const showFmv = p.work !== 'no';
      const isMudRab = isMud && p.cap === 'رب المال (ممول)';

      const capHtml = capOpts.map(c => `<option value="${c}" ${p.cap === c ? 'selected' : ''}>${c}</option>`).join('');
      const roleHtml = roleOpts.map(([v, l]) => `<option value="${v}" ${p.role === v ? 'selected' : ''}>${l}</option>`).join('');

      return `
      <div class="party-card">
        <div class="party-top">
          <div class="party-id">
            <div class="party-pip" style="background:${color}"></div>
            <div class="party-lbl" id="lbl_${p.id}">${this.escapeHtml(p.name)}</div>
          </div>
          ${canRm ? `<button class="btn-rm" onclick="G.removeParty(${p.id})">حذف</button>` : `<button class="btn-rm" disabled title="الحد الأدنى طرفان">حذف</button>`}
        </div>
        <div class="party-body">
          <div class="grid2">
            <div class="fg">
              <label>الاسم</label>
              <input type="text" value="${this.escapeHtml(p.name)}"
                oninput="G.sp(${p.id},'name',this.value); document.getElementById('lbl_${p.id}').textContent=this.value||'طرف'">
            </div>
            <div class="fg">
              <label>الصفة</label>
              <select onchange="G.sp(${p.id},'cap',this.value); G.renderParties(); G.renderExistingSellerOptions(); G.normalizeNumberInputs();">${capHtml}</select>
            </div>
          </div>

          ${this.type === 'existing' && p.cap !== 'مستثمر جديد' ? `
          <div class="fg" style="margin-top:10px">
            <label>نسبة الملكية الحالية قبل دخول المستثمر</label>
            <input type="text" inputmode="decimal" class="num" lang="en" min="0" max="100" value="${this.inputVal(p.currentPct)}" placeholder="مثال: 60" oninput="G.sp(${p.id},'currentPct',G.pNum(this.value)); G.updExistingDeal('ownership')">
            <div class="help">أدخل النسبة الحالية كما هي في عقد التأسيس أو سجل المساهمين. يجب أن يكون مجموع نسب الشركاء الحاليين % 100.</div>
          </div>` : ''}

          ${isMud ? `
          <div class="grid2" style="margin-top:10px">
            ${isMudRab ? `
            <div class="fg">
              <label data-help="أدخل رأس المال الذي يقدمه رب المال للمضاربة.">رأس المال</label>
              <input type="text" inputmode="decimal" class="num" min="0" value="${this.inputVal(p.cash)}" placeholder="0" oninput="G.sp(${p.id},'cash',G.pNum(this.value))">
            </div>` : `
            <div class="fg">
              <label>الراتب العادل في السوق</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="0" value="${this.inputVal(p.fmv)}" placeholder="" oninput="G.sp(${p.id},'fmv',G.pNum(this.value))">
              <div class="help">القيمة الشهرية للعمل الفعلي المتفق عليه؛ للدوام الجزئي أدخل قيمة الدوام الجزئي نفسه.</div>
            </div>
            <div class="fg">
              <label>المبلغ الشهري المستلم فعليا</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="0" value="${this.inputVal(p.paid)}" placeholder="0" oninput="G.sp(${p.id},'paid',G.pNum(this.value))">
              <div class="help">مثال: الراتب العادل 10,000 والمستلم 5,000، فيحسب الفرق الشهري ضمن قيمة الجهد.</div>
            </div>
            <div class="fg">
              <label>مدة المساهمة بالجهد (بالأشهر)</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="1" value="${this.inputVal(p.dur)}" placeholder="مثال: 12" oninput="G.sp(${p.id},'dur',G.pNum(this.value))">
              <div class="help">مدة تقديرية لاحتساب قيمة الجهد. مدة الاستحقاق تسجل في مسارها المخصص.</div>
            </div>
            `}
          </div>
          ` : `
          <div class="grid2" style="margin-top:10px">
            <div class="fg">
              <label data-help="المبلغ النقدي الذي يقدمه هذا الطرف للمشروع.">التمويل النقدي</label>
              <input type="text" inputmode="decimal" class="num" min="0" value="${this.inputVal(p.cash)}" placeholder="0" oninput="G.sp(${p.id},'cash',G.pNum(this.value))">
            </div>
            <div class="fg">
              <label data-help="مثال: معدات أو مركبات أو أجهزة، وتكتب طريقة تقويمها.">قيمة الأصول العينية</label>
              <input type="text" inputmode="decimal" class="num" min="0" value="${this.inputVal(p.assets)}" placeholder="0" oninput="G.sp(${p.id},'assets',G.pNum(this.value))">
            </div>
          </div>
          <div class="grid2" style="margin-top:10px">
            <div class="fg">
              <label data-help="قيمة متفق عليها لحق فكري أو علامة أو برنامج يقدمه الطرف.">ملكية فكرية أو علامة تجارية</label>
              <input type="text" inputmode="decimal" class="num" min="0" value="${this.inputVal(p.ip)}" placeholder="0" oninput="G.sp(${p.id},'ip',G.pNum(this.value))">
            </div>
            <div class="fg">
              <label data-help="التزام له مخرج وموعد وقيمة متفق عليها، مثل تنفيذ دراسة أو تجهيز محدد.">التزام آخر قابل للقياس</label>
              <input type="text" inputmode="decimal" class="num" min="0" value="${this.inputVal(p.net)}" placeholder="0" oninput="G.sp(${p.id},'net',G.pNum(this.value))">
              <div class="help">الحصص تبنى على مال أو عمل أو أصل قابل للتقويم. يخصص هذا الحقل لالتزام محدد له مخرج وموعد وقيمة متفق عليها.</div>
            </div>
          </div>
          <div class="grid2" style="margin-top:10px">
            <div class="fg">
              <label>هل سيعمل في المشروع؟</label>
              <select id="wkSel_${p.id}" onchange="G.sp(${p.id},'work',this.value); G.toggleFmv(${p.id},this.value); G.renderParties();">
                <option value="no"    ${p.work==='no'    ?'selected':''}>لا</option>
                <option value="full"  ${p.work==='full'  ?'selected':''}>نعم، دوام كامل</option>
                <option value="part"  ${p.work==='part'  ?'selected':''}>نعم، دوام جزئي</option>
                <option value="period"${p.work==='period'?'selected':''}>نعم، لمدة محددة</option>
              </select>
            </div>
            <div class="fg">
              <label>الدور</label>
              <select onchange="G.sp(${p.id},'role',this.value)">${roleHtml}</select>
            </div>
          </div>
          <div id="fmvBlock_${p.id}" style="${showFmv?'':'display:none'}" class="grid2" style="margin-top:10px">
            <div class="fg" style="margin-top:10px">
              <label>الراتب العادل في السوق</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="0" value="${this.inputVal(p.fmv)}" placeholder="" oninput="G.sp(${p.id},'fmv',G.pNum(this.value))">
              <div class="help">القيمة الشهرية للعمل الفعلي المتفق عليه؛ للدوام الجزئي أدخل قيمة الدوام الجزئي نفسه.</div>
            </div>
            <div class="fg" style="margin-top:10px">
              <label>المبلغ الشهري المستلم فعليا</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="0" value="${this.inputVal(p.paid)}" placeholder="0" oninput="G.sp(${p.id},'paid',G.pNum(this.value))">
              <div class="help">مثال: الراتب العادل 10,000 والمستلم 5,000، فيحسب الفرق الشهري ضمن مساهمة العمل.</div>
            </div>
            <div class="fg" style="margin-top:10px">
              <label>مدة المساهمة بالجهد (بالأشهر)</label>
              <input type="text" inputmode="decimal" class="num" lang="en" min="1" value="${this.inputVal(p.dur)}" placeholder="مثال: 12" oninput="G.sp(${p.id},'dur',G.pNum(this.value))">
              <div class="help">مدة تقديرية للعمل. اتفقوا على مراحل الاستحقاق وما يحدث عند توقف العمل.</div>
            </div>
          </div>
          ${this.type === 'startup' && p.work !== 'no' ? `
          <div class="card-sm" id="vestingBlock_${p.id}" style="margin-top:12px">
            <div class="card-head" style="font-size:12px;margin-bottom:10px;padding-bottom:8px">الاستحقاق التدريجي لهذا الطرف</div>
            <div class="notice notice-info" style="margin-bottom:10px">يستخدم عندما ترتبط حصة الطرف باستمراره في العمل، فتستحق الحصة تدريجيا خلال المدة المتفق عليها.</div>
            <div class="grid2">
              <div class="fg">
                <label>تفعيل الاستحقاق التدريجي؟</label>
                <select onchange="G.sp(${p.id},'vesting',this.value); G.togglePartyVesting(${p.id},this.value)">
                  <option value="no" ${p.vesting !== 'yes' ? 'selected' : ''}>لا</option>
                  <option value="yes" ${p.vesting === 'yes' ? 'selected' : ''}>نعم</option>
                </select>
              </div>
              <div class="fg party-vesting-${p.id}" style="${p.vesting === 'yes' ? '' : 'display:none'}">
                <label>مدة الاستحقاق الكاملة بالسنوات</label>
                <input type="text" inputmode="decimal" class="num" lang="en" min="1" max="10" value="${this.inputVal(p.vestYrs)}" placeholder="مثال: 4" onchange="G.sp(${p.id},'vestYrs',G.pNum(this.value))">
              </div>
              <div class="fg party-vesting-${p.id}" style="${p.vesting === 'yes' ? '' : 'display:none'}">
                <label>مدة الاختبار قبل استحقاق أي حصة بالأشهر</label>
                <input type="text" inputmode="decimal" class="num" lang="en" min="0" max="24" value="${this.inputVal(p.cliffMo)}" placeholder="مثال: 12" onchange="G.sp(${p.id},'cliffMo',G.pNum(this.value))">
              </div>
              <div class="fg party-vesting-${p.id}" style="${p.vesting === 'yes' ? '' : 'display:none'}">
                <label>ملاحظة إضافية</label>
                <input type="text" value="${this.escapeHtml(p.vestNote || '')}" placeholder="اختياري" onchange="G.sp(${p.id},'vestNote',this.value)">
              </div>
            </div>
          </div>` : ''}
          `}

          ${this.profitShareEnabled() ? `
          <div class="card-sm" style="margin-top:12px">
            <div class="card-head" style="font-size:12px;margin-bottom:10px;padding-bottom:8px">توزيع الأرباح</div>
            <div class="fg">
              <label>نصيب الأرباح لهذا الطرف</label>
              <input id="profit_${p.id}" type="text" inputmode="decimal" class="num" lang="en" min="0" max="100" value="${this.inputVal(p.profit)}" oninput="G.sp(${p.id},'profit',this.value === '' ? '' : +G.pNum(this.value))">
              ${this.type === 'mudaraba' ? '<div class="help">مثال تعليمي: % 40 لرب المال و% 60 للمضارب. أدخل النسب المتفق عليها ليصبح مجموعها % 100.</div>' : ''}
            </div>
          </div>` : ''}

          <div class="fg" style="margin-top:10px">
            <label>ملاحظة مختصرة (اختياري)</label>
            <input type="text" value="${this.escapeHtml(p.note)}" placeholder="مثال: يوفّر الموقع، يدير العمليات..." onchange="G.sp(${p.id},'note',this.value)">
          </div>
        </div>
      </div>`;
    }).join('');
    const addBtn = document.getElementById('btnAddParty');
    if (addBtn) {
      const atMax = this.parties.length >= this.MAX_PARTIES;
      addBtn.style.display = atMax ? 'none' : '';
      if (!document.getElementById('maxPartyNote')) addBtn.insertAdjacentHTML('afterend', '<div id=\"maxPartyNote\" class=\"notice notice-info hide\" style=\"margin-top:8px\">تم الوصول للحد الأعلى للأطراف حتى تبقى قراءة النتائج واضحة.</div>');
      document.getElementById('maxPartyNote')?.classList.toggle('hide', !atMax);
    }
    this.renderExistingSellerOptions();
    this.normalizeNumberInputs();
  },

  sp(id, k, v) {
    const p = this.parties.find(x => x.id === id);
    if (p) p[k] = v;
  },

  toggleFmv(id, val) {
    const el = document.getElementById('fmvBlock_' + id);
    if (el) el.style.display = val !== 'no' ? '' : 'none';
  },

  togglePartyVesting(id, val) {
    document.querySelectorAll('.party-vesting-' + id).forEach(el => {
      el.style.display = val === 'yes' ? '' : 'none';
    });
  },

  newProject() {
    this.doReset(false);
  },


  /* ─── WEIGHTS ─── */
  renderProfiles() {
    const el = document.getElementById('profileGrid');
    if (!el) return;
    el.innerHTML = this.PROFILES.map(p => `
      <div class="profile-btn ${this.activeProfile === p.id ? 'sel' : ''}" id="prof_${p.id}" onclick="G.applyProfile('${p.id}')">
        <div class="profile-name">${p.name}</div>
        <div class="profile-desc">${p.desc}</div>
      </div>`).join('');
  },

  applyDefaultProfileForType(type) {
    const map = { startup:'innovation', fnb:'ops', deal:'deal_profile', existing:'balanced' };
    if (map[type]) this.applyProfile(map[type], false);
  },

  applyProfile(id, rerender = true) {
    const profile = this.PROFILES.find(p => p.id === id);
    if (!profile) return;
    this.activeProfile = id;
    this.W = { ...profile.W };
    this.renderProfiles();
    this.initWeights();
    if (rerender && this.phase >= 4) this.calc();
  },

  toggleAdvancedWeights() {
    document.getElementById('advancedWeights')?.classList.toggle('hide');
  },

  initWeights() {
    const items = [
      { k:'Cash',   icon:'💵', name:'التمويل النقدي',            desc:'النقد المُدفوع × الوزن = نقاط التمويل' },
      { k:'Asset',  icon:'🏗️', name:'الأصول والعينيات',          desc:'تجهيزات، موقع، عقارات، بالقيمة السوقية' },
      { k:'Effort', icon:'⚙️', name:'الجهد والعمل',              desc:'الراتب العادل في السوق × الأشهر × الوزن، أو تقدير معياري' },
      { k:'IP',     icon:'💡', name:'ملكية فكرية / علامة تجارية', desc:'تقنية مُطوَّرة، براءة اختراع، فرنشايز مرخَّص' },
      { k:'Net',    icon:'◇', name:'التزام آخر قابل للقياس',       desc:'مخرج محدد وموعد وقيمة متفق عليها' },
    ];
    const el = document.getElementById('wtItems');
    if (!el) return;
    el.innerHTML = items.map(w => {
      const val = this.W[w.k] ?? 0;
      return `
      <div class="card-sm">
        <div class="wt-row">
          <span class="wt-icon">${w.icon}</span>
          <span class="wt-name">${w.name}</span>
          <span class="wt-val" id="wv_${w.k}">${val}</span>
        </div>
        <input type="range" min="0" max="8" step=".5" value="${val}"
          oninput="G.W['${w.k}']=+this.value; G.activeProfile='custom'; G.renderProfiles(); document.getElementById('wv_${w.k}').textContent=this.value" style="margin-top:6px">
        <div class="wt-desc">${w.desc}</div>
      </div>`;
    }).join('');
    this.normalizeNumberInputs();
  },


  numVal(id) {
    const raw = (document.getElementById(id)?.value || '').toString().replace(/,/g,'').trim();
    return raw === '' ? 0 : Number(raw);
  },

  setNumVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value ? String(Math.round(value * 100) / 100) : '';
  },

  updPostMoney(source = '') {
    const preEl = document.getElementById('preMoney');
    const postEl = document.getElementById('postMoney');
    const invEl = document.getElementById('newInv');
    const pctEl = document.getElementById('targetPct');
    const box = document.getElementById('postMoneyBox');
    const inv = this.numVal('newInv');
    let pct = this.numVal('targetPct');
    let pre = this.numVal('preMoney');
    let post = this.numVal('postMoney');

    if ((source === 'inv' || source === 'pct') && inv > 0 && pct > 0 && pct < 100) {
      post = inv / (pct / 100);
      pre = post - inv;
      preEl.value = Math.round(pre);
      postEl.value = Math.round(post);
    } else if (source === 'pre' && pre > 0 && inv > 0) {
      post = pre + inv;
      pct = inv / post * 100;
      postEl.value = Math.round(post);
      pctEl.value = pct.toFixed(1);
    } else if (source === 'post' && post > inv && inv > 0) {
      pre = post - inv;
      pct = inv / post * 100;
      preEl.value = Math.round(pre);
      pctEl.value = pct.toFixed(1);
    } else if (pre > 0 && inv > 0) {
      post = pre + inv;
      pct = inv / post * 100;
    }

    if (pre > 0 && inv > 0 && post > 0) {
      box.innerHTML = `القيمة قبل الاستثمار: ${this.moneyHtml(pre)}، بعد الاستثمار: ${this.moneyHtml(post)}، حصة المستثمر: ${this.percentHtml((+pct).toFixed(1))}`;
      box.classList.remove('hide');
    } else {
      box.classList.add('hide');
    }
  },

  hasEffort(p) {
    return p.work !== 'no' || (p.fmv || 0) > 0;
  },

  validateMudaraba() {
    let hasRab = false, hasMud = false;
    const problems = [];

    this.parties.forEach(p => {
      const hasCash = (p.cash || 0) > 0;
      const hasEffort = this.hasEffort(p);

      if (p.cap === 'رب المال (ممول)') {
        hasRab = true;
        if (!hasCash) problems.push(`${p.name}: رب المال يقدم مالا.`);
        if (hasEffort) problems.push(`${p.name}: صفة رب المال في هذا المسار تقتصر على تقديم المال.`);
      } else if (p.cap === 'مضارب (عامل)') {
        hasMud = true;
        if (hasCash) problems.push(`${p.name}: صفة المضارب في هذا المسار تقتصر على العمل والإدارة.`);
        if (!hasEffort) problems.push(`${p.name}: المضارب يقدم عملا أو جهدا.`);
      } else {
        problems.push(`${p.name}: يجب تحديد صفته كرب مال أو مضارب.`);
      }
    });

    if (!hasRab) problems.push('يجب وجود طرف واحد على الأقل بصفة رب المال.');
    if (!hasMud) problems.push('يجب وجود طرف واحد على الأقل بصفة مضارب.');

    return { valid: problems.length === 0, problems };
  },

  detectModel() {
    const mud = this.validateMudaraba();
    if (mud.valid) return 'mudaraba';
    const hasMixed = this.parties.some(p => (p.cash || 0) > 0 && this.hasEffort(p));
    if (hasMixed) return 'partnership';
    return 'general';
  },

  profitShareEnabled() {
    return ['mudaraba', 'fnb'].includes(this.type);
  },

  normalizePercentField(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  },

  allocatePercentages(values, target = 100) {
    const clean = values.map(value => Math.max(0, Number(value) || 0));
    const total = clean.reduce((sum, value) => sum + value, 0);
    if (!(total > 0) || !(target >= 0)) return clean.map(() => 0);
    const exactUnits = clean.map(value => value / total * target * 10);
    const units = exactUnits.map(value => Math.floor(value + 1e-9));
    let remainder = Math.round(target * 10 - units.reduce((sum, value) => sum + value, 0));
    const order = exactUnits.map((value, index) => ({ index, fraction:value - Math.floor(value + 1e-9) }))
      .sort((a, b) => b.fraction - a.fraction || clean[b.index] - clean[a.index]);
    for (let i = 0; i < remainder; i++) units[order[i % order.length].index] += 1;
    return units.map(value => +(value / 10).toFixed(1));
  },

  applyProfitShares() {
    const manual = this.results.map(r => this.normalizePercentField(r.profit));
    const hasManual = manual.some(v => v !== null);

    if (this.profitShareEnabled() && hasManual) {
      this.results.forEach((r, i) => { r.profit = manual[i] === null ? null : +manual[i].toFixed(1); });
    } else {
      this.results.forEach(r => {
        const rawProfit = this.normalizePercentField(r.profit);
        const base = (rawProfit !== null) ? rawProfit : Number(r.pct || 0);
        r.profit = +(Number.isFinite(base) ? base : 0).toFixed(1);
      });
    }
  },

  profitSharesComplete() {
    if (!this.results.length || !this.results.every(r => this.normalizePercentField(r.profit) !== null)) return false;
    const total = this.results.reduce((sum, r) => sum + Number(r.profit), 0);
    return Math.abs(total - 100) < 0.05 && this.results.every(r => Number(r.profit) > 0);
  },

  profitDiffers() {
    if (!this.profitSharesComplete()) return false;
    if (this.type === 'mudaraba') return true;
    return this.results.some(r => Math.abs((Number(r.profit) || 0) - (Number(r.pct) || 0)) >= 0.1);
  },

  calcExisting() {
    this.updExistingDeal('calc');
    const owners = this.parties.filter(p => p.cap !== 'مستثمر جديد');
    const investors = this.parties.filter(p => p.cap === 'مستثمر جديد');
    const investor = investors[0];
    const mode = document.getElementById('entryMode')?.value || 'cashin';
    const valuation = this.numVal('coVal');
    const cashIn = mode === 'cashin' ? this.numVal('entryAmt') : mode === 'mixed' ? this.numVal('cashInAmt') : 0;
    const cashOut = mode === 'cashout' ? this.numVal('entryAmt') : mode === 'mixed' ? this.numVal('cashOutAmt') : 0;
    const sellerId = Number(document.getElementById('sellerPartyId')?.value);
    const ownershipTotal = owners.reduce((sum, p) => sum + (Number(p.currentPct) || 0), 0);
    const seller = owners.find(p => p.id === sellerId);
    const problems = [];

    if (investors.length !== 1) problems.push('يجب تحديد مستثمر جديد واحد فقط.');
    if (!owners.length) problems.push('يجب وجود شريك حالي واحد على الأقل.');
    if (owners.some(p => !(Number(p.currentPct) > 0 && Number(p.currentPct) <= 100)) || Math.abs(ownershipTotal - 100) > 1e-8)
      problems.push(`مجموع نسب الملكية الحالية يجب أن يساوي % 100، والمجموع المدخل ${this.percentText(ownershipTotal)}.`);
    if (!(valuation > 0)) problems.push('أدخل قيمة الشركة قبل الدخول.');
    if (!((cashIn + cashOut) > 0)) problems.push('أدخل مبلغ الدخول.');
    if (['cashout','mixed'].includes(mode) && !seller) problems.push('حدد الشريك الحالي البائع.');
    if (seller && cashOut > valuation * (Number(seller.currentPct) || 0) / 100 + 0.01)
      problems.push(`المبلغ المدفوع للبائع يتجاوز قيمة حصته الحالية البالغة ${this.moneyText(valuation * Number(seller.currentPct) / 100)}.`);

    this.calculationError = problems.length ? problems.join(' ') : null;
    if (problems.length) {
      this.results = this.parties.map((p, i) => ({ ...p, pct:0, profit:null, cashSc:0, assetSc:0, ipSc:0, netSc:0, effortSc:0, roleSc:0, total:0, color:this.COLORS[i % this.COLORS.length] }));
      this.renderResults();
      return;
    }

    const postMoney = valuation + cashIn;
    const dilution = valuation / postMoney;
    const transferredPct = cashOut / postMoney * 100;
    const raw = this.parties.map(p => {
      if (p.id === investor.id) return (cashIn + cashOut) / postMoney * 100;
      let pct = Number(p.currentPct) * dilution;
      if (p.id === sellerId) pct -= transferredPct;
      return Math.max(0, pct);
    });
    const allocated = this.allocatePercentages(raw);
    this.results = this.parties.map((p, i) => ({ ...p,
      pct: allocated[i], profit:p.profit ?? null,
      cashSc:p.id === investor.id ? cashIn + cashOut : 0,
      assetSc:0, ipSc:0, netSc:0, effortSc:0, roleSc:0,
      total:raw[i], color:this.COLORS[i % this.COLORS.length]
    }));
    this.applyProfitShares();
    this.renderResults();
  },

  /* ─── CALCULATE ─── */
  calc() {
    const W = this.W;
    const isMud = this.type === 'mudaraba';
    this.mudarabaCheck = null;
    this.calculationError = null;

    if (this.type === 'existing') {
      this.calcExisting();
      return;
    }

    if (isMud) {
      const check = this.validateMudaraba();
      this.mudarabaCheck = check;
      if (check.valid) {
        const rabParties = this.parties.filter(p => p.cap === 'رب المال (ممول)');
        const mudParties = this.parties.filter(p => p.cap === 'مضارب (عامل)');
        const manualProfit = this.parties.map(p => this.normalizePercentField(p.profit));
        const hasManualProfit = manualProfit.some(v => v !== null);
        const totalCash = rabParties.reduce((sum, p) => sum + (Number(p.cash) || 0), 0);
        const capitalPcts = this.allocatePercentages(this.parties.map(p => p.cap === 'رب المال (ممول)' ? Number(p.cash) || 0 : 0));
        const effortValue = p => Math.max(0, (Number(p.fmv) || 0) - (Number(p.paid) || 0)) * (Number(p.dur) || 0);
        const totalEffort = mudParties.reduce((sum, p) => sum + effortValue(p), 0);
        this.results = this.parties.map((p, i) => {
          const isRab = p.cap === 'رب المال (ممول)';
          const effortVal = effortValue(p);
          const equityPct = 0; // المضاربة توزيع ربح لا توزيع ملكية.
          const profitPct = hasManualProfit ? manualProfit[i] : null;
          return { ...p,
            pct: equityPct,
            capitalPct: capitalPcts[i],
            profit: profitPct === null ? null : +profitPct.toFixed(1),
            cashSc: isRab ? (p.cash || 0) : 0,
            assetSc:0, ipSc:0, netSc:0,
            effortSc: isRab ? 0 : effortVal,
            roleSc:0,
            total: isRab ? (p.cash || 0) : effortVal,
            color: this.COLORS[i % this.COLORS.length]
          };
        });
        this.renderResults();
        return;
      }
      this.mudarabaCheck.fallback = true;
      // If the inputs do not qualify as mudaraba, continue through the regular weighted partnership calculation.
    }

    // roleBonus محذوف المسمى الوظيفي وصف في العقد لا وزن في الحصص
    // قيمة الجهد = (الراتب العادل - المستلم) × المدة × الوزن (Startup فقط)
    const isStartup = this.type === 'startup';
    this.results = this.parties.map((p, i) => {
      const cashSc   = (p.cash   || 0) * (isStartup ? W.Cash  : 1);
      const assetSc  = (p.assets || 0) * (isStartup ? W.Asset : 1);
      const ipSc     = (p.ip     || 0) * (isStartup ? W.IP    : 1);
      const netSc    = (p.net    || 0) * (isStartup ? W.Net   : 1);
      const mult     = 1; // The entered monthly value already represents the agreed actual workload.
      const dur      = p.dur || 0;
      const effortSc = p.work !== 'no' ? Math.max(0, (p.fmv||0) - (p.paid||0)) * dur * (isStartup ? W.Effort : 1) * mult : 0;
      const roleSc   = 0;
      const total    = cashSc + assetSc + ipSc + netSc + effortSc;
      return { ...p, cashSc, assetSc, ipSc, netSc, effortSc, roleSc, total, color: this.COLORS[i % this.COLORS.length] };
    });

    const grand = this.results.reduce((s, r) => s + r.total, 0);
    if (!(grand > 0)) {
      this.calculationError = 'لا توجد مساهمات موجبة قابلة للحساب. أدخل قيمة مالية أو جهدا له راتب عادل ومدة محددة.';
      this.results.forEach(r => r.pct = 0);
      this.applyProfitShares();
      this.renderResults();
      return;
    }
    const basePcts = this.allocatePercentages(this.results.map(x => x.total));
    this.results.forEach((r, i) => { r.pct = basePcts[i]; });

    // Startup investment dilution
    const pre = this.numVal('preMoney');
    const inv = this.numVal('newInv');
    if (this.type === 'startup' && pre > 0 && inv > 0) {
      const factor = pre / (pre + inv);
      const rawPcts = this.results.map(r => r.total / grand * 100 * factor);
      rawPcts.push(inv / (pre + inv) * 100);
      const balanced = this.allocatePercentages(rawPcts);
      this.results.forEach((r, i) => { r.pct = balanced[i]; });
      this.results.push({ id:-1, name:'المستثمر الجديد', cap:'مستثمر جديد', pct: balanced[balanced.length - 1],
        cash:inv, assets:0, ip:0, net:0, work:'no', role:'silent', note:'استثمار جديد',
        cashSc:inv, assetSc:0, ipSc:0, netSc:0, effortSc:0, roleSc:0, total:inv,
        color:'#6B7A8D' });
    }
    this.results.forEach((r, i) => { if (!r.color) r.color = this.COLORS[i % this.COLORS.length]; });
    this.applyProfitShares();

    this.renderResults();
  },

  /* ─── RENDER RESULTS ─── */
  renderResults() {
    this.renderKPIs();
    this.renderDonut();
    this.renderBars();
    this.renderPartyCards();
    this.renderAlerts();
  },

  renderKPIs() {
    const r = this.results;
    const cash  = this.parties.reduce((s,p) => s+(p.cash||0), 0);
    const asset = this.parties.reduce((s,p) => s+(p.assets||0)+(p.ip||0)+(p.net||0), 0);
    const working = this.parties.filter(p => p.work !== 'no').length;
    const pre = this.numVal('preMoney');
    const inv = this.numVal('newInv');

    let kpis = this.type === 'mudaraba' ? [
      { lbl:'رأس مال المضاربة', val: this.moneyHtml(cash), sub:'مقدم من رب المال' },
      { lbl:'الأطراف', val: String(this.parties.length), sub:'رب مال ومضارب' },
      { lbl:'نسب الربح', val: this.results.every(x => x.profit !== null) ? 'محددة' : 'تحدد لاحقا', sub:'تعتمد النسب التي يدخلها المستخدم' }
    ] : [
      { lbl:'إجمالي التمويل النقدي', val: this.moneyHtml(cash), sub: this.parties.length + ' أطراف' },
      { lbl:'الأصول والحقوق المقومة', val: this.moneyHtml(asset), sub:'أصول + ملكية فكرية + التزامات قابلة للقياس' },
      { lbl:'أطراف عاملون في المشروع', val: working + ' / ' + this.parties.length, sub:'من مجموع الأطراف' },
    ];
    if (pre > 0 && inv > 0)
      kpis.push({ lbl:'التقييم بعد الاستثمار', val: this.moneyHtml(pre+inv), sub:'Post-Money Valuation' });

    document.getElementById('kpiGrid').innerHTML = kpis.map(k =>
      `<div class="kpi"><div class="kpi-lbl">${k.lbl}</div><div class="kpi-val">${k.val}</div><div class="kpi-sub">${k.sub}</div></div>`
    ).join('');
  },

  polar(cx,cy,r,deg){ const a=(deg-90)*Math.PI/180; return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}; },

  makeDonutSvg(data, valueKey = 'pct', label = 'إجمالي') {
    const cx=100, cy=100, r=72, sw=28;
    let start = -90;
    const arcs = data.map(d => {
      const val = Number(d[valueKey]) || 0;
      if (!val) return '';
      const angle = val / 100 * 360;
      if (angle >= 360) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"/>`;
      const p1 = this.polar(cx,cy,r,start), p2 = this.polar(cx,cy,r,start+angle);
      const lg = angle > 180 ? 1 : 0;
      const path = `M${p1.x},${p1.y} A${r},${r} 0 ${lg} 1 ${p2.x},${p2.y}`;
      start += angle;
      return `<path d="${path}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }).join('');
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EAE5D8" stroke-width="${sw}"/>
      ${arcs}
      <circle cx="${cx}" cy="${cy}" r="${r-sw/2-8}" fill="var(--surface)"/>
      <text x="${cx}" y="${cy-7}" text-anchor="middle" font-size="11" fill="#405466" font-family="IBM Plex Sans Arabic">${label}</text>
      <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="14" fill="#0B1F33" font-weight="700" font-family="IBM Plex Sans Arabic">${data.length} أطراف</text>`;
  },

  renderDonut() {
    const svg = document.getElementById('donutSvg');
    const leg = document.getElementById('donutLegend');
    const title = svg?.closest('.chart-box')?.querySelector('.chart-title');
    if (this.type === 'mudaraba') {
      if (title) title.textContent = 'رأس المال والأدوار';
      svg.style.display = 'none';
      leg.innerHTML = this.results.map(d => `<div class="leg-row"><div class="leg-name"><div class="leg-pip" style="background:${d.color}"></div>${this.escapeHtml(d.name)}</div><div class="leg-pct">${this.escapeHtml(d.cap)}</div></div>`).join('');
      return;
    }
    svg.style.display = 'block';
    if (title) title.textContent = 'توزيع الملكية';
    svg.innerHTML = this.makeDonutSvg(this.results, 'pct', 'ملكية');

    leg.innerHTML = this.results.map(d => `
      <div class="leg-row">
        <div class="leg-name"><div class="leg-pip" style="background:${d.color}"></div>${this.escapeHtml(d.name)}</div>
        <div class="leg-pct">${this.percentHtml(d.pct)}</div>
      </div>`).join('');
  },

  renderBars() {
    const box = document.getElementById('barChart');
    const title = box?.closest('.chart-box')?.querySelector('.chart-title');
    if (this.type === 'mudaraba') {
      if (title) title.textContent = 'نسب الربح المتفق عليها';
      const complete = this.results.every(r => r.profit !== null);
      box.innerHTML = complete ? `
        <svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:0 auto 10px">${this.makeDonutSvg(this.results, 'profit', 'الربح')}</svg>
        <div class="legend">${this.results.map(r => `<div class="leg-row"><div class="leg-name"><div class="leg-pip" style="background:${r.color}"></div>${this.escapeHtml(r.name)}</div><div class="leg-pct">${this.percentHtml(r.profit)}</div></div>`).join('')}</div>`
        : '<div class="notice notice-warn">أدخل نسب الربح المتفق عليها. المثال الإرشادي % 40 لرب المال و% 60 للمضارب، ويصبح مجموع النسب % 100.</div>';
      return;
    }
    if (this.profitDiffers()) {
      if (title) title.textContent = 'توزيع الأرباح';
      box.innerHTML = `
        <svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:0 auto 10px">${this.makeDonutSvg(this.results, 'profit', 'أرباح')}</svg>
        <div class="legend">
          ${this.results.map(r => `
            <div class="leg-row">
              <div class="leg-name"><div class="leg-pip" style="background:${r.color}"></div>${this.escapeHtml(r.name)}</div>
              <div class="leg-pct">${this.percentHtml(r.profit)}</div>
            </div>`).join('')}
        </div>`;
      return;
    }
    if (title) title.textContent = 'نسب المساهمة';
    box.innerHTML = this.results.map(r => `
      <div class="bar-item">
        <div class="bar-meta">
          <span class="bar-name">${this.escapeHtml(r.name)}</span>
          <span class="bar-pct">${this.percentHtml(r.pct)}</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${r.pct}%;background:${r.color}"></div></div>
      </div>`).join('');
  },

  renderPartyCards() {
    const roleNames = { manager:'مدير عام', ops:'تشغيلي', tech:'تقني', sales:'مبيعات', silent:'' };
    document.getElementById('partyResults').innerHTML = this.results.map(r => {
      const contribs = [
        r.cash    ? `نقدي: ${this.moneyHtml(r.cash)}` : null,
        r.assets  ? `أصول: ${this.moneyHtml(r.assets)}` : null,
        r.ip      ? `ملكية فكرية: ${this.moneyHtml(r.ip)}` : null,
        r.net     ? `التزام قابل للقياس: ${this.moneyHtml(r.net)}` : null,
        r.effortSc? `جهد مقدم (${r.dur || 0} أشهر): ${this.moneyHtml(r.effortSc)}` : null,
      ].filter(Boolean);

      return `
      <div class="res-party">
        <div class="res-top">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:12px;height:12px;border-radius:50%;background:${r.color};flex-shrink:0"></div>
            <div>
              <div class="res-name">${this.escapeHtml(r.name)}</div>
              <div class="res-cap">${this.escapeHtml(r.cap || '')}${r.role && r.role!=='silent' ? ' · ' + (roleNames[r.role]||'') : ''}${r.note ? '، ' + this.escapeHtml(r.note) : ''}</div>
            </div>
          </div>
          <div class="res-pct">${this.type === 'mudaraba' ? (r.profit === null ? 'تحدد لاحقا' : this.percentHtml(r.profit)) : this.percentHtml(r.pct)}</div>
        </div>
        ${this.type === 'mudaraba' ? '' : `<div class="res-bar-bg"><div class="res-bar-fill" style="width:${r.pct}%;background:${r.color}"></div></div>`}
        <div class="res-contrib">${contribs.map(c => {
          const [lbl,...rest] = c.split(':');
          return `<div class="rc-row"><span class="rc-lbl">${lbl}</span><span class="rc-val">${rest.join(':')}</span></div>`;
        }).join('')}</div>
        <div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:5px">
          ${this.type === 'mudaraba' && r.cap === 'رب المال (ممول)' ? `<div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--muted);font-weight:600">نسبة رأس المال وتحمل خسارته</span>
            <span style="font-size:13px;font-weight:700;color:var(--gold)">${this.percentHtml(r.capitalPct || 0)}</span>
          </div>` : ''}
          ${this.type === 'mudaraba' ? '' : `<div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--muted);font-weight:600">حصة الملكية</span>
            <span style="font-size:13px;font-weight:700;color:var(--gold)">${this.percentHtml(r.pct)}</span>
          </div>`}
          ${this.profitDiffers() ? `
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--muted);font-weight:600">نصيب الأرباح</span>
            <span style="font-size:13px;font-weight:700;color:${r.color}">${r.profit === null ? 'تحدد لاحقا' : this.percentHtml(r.profit)}</span>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');
  },

  /* Check for silent zero-profit anomaly */
  zeroProfit_checkResults() {
    if (this.type === 'mudaraba') return [];
    const alerts = [];
    this.results.forEach(r => {
      const equity = Number(r.pct) || 0;
      const profitEntered = this.normalizePercentField(r.profit) !== null;
      const profit = Number(r.profit) || 0;
      const cashContrib = Number(r.cash || 0) + Number(r.assets || 0) + Number(r.ip || 0) + Number(r.net || 0);
      if (profitEntered && equity > 1 && profit < 0.1 && cashContrib > 0) {
        alerts.push({
          name: r.name,
          equity: equity.toFixed(1),
          contrib: cashContrib
        });
      }
    });
    return alerts;
  },

  renderAlerts() {
    const alerts = [];
    if (this.calculationError)
      alerts.push({ t:'warn', m:this.escapeHtml(this.calculationError) });
    const max = Math.max(...this.results.map(r => r.pct));
    const dom = this.results.find(r => r.pct === max);
    if (dom && max > 65)
      alerts.push({ t:'warn', m:`${this.escapeHtml(dom.name)} يملك ${this.percentHtml(max)} من الحصص. راجع أثر هذه النسبة على القرارات واكتب الصلاحيات المتفق عليها.` });
    if (this.parties.filter(p => p.work === 'no').length === this.parties.length)
      alerts.push({ t:'warn', m:'تحتاج إدارة المشروع إلى مسؤول يومي. حدد اسمه أو صفته في الاتفاق.' });
    const workingWithoutVesting = this.parties.filter(p => p.work !== 'no' && p.vesting !== 'yes');
    if (this.type === 'startup' && workingWithoutVesting.length)
      alerts.push({ t:'warn', m:'راجع الاستحقاق التدريجي للشريك العامل وحدد المدة المناسبة له.' });

    // تنبيه مدة الجهد الطويلة
    this.parties.forEach(p => {
      if ((p.dur || 0) > 36)
        alerts.push({ t:'warn', m:`💡 تنبيه: كلما زادت المدة، ارتفعت قيمة الجهد في الحساب. يرجى موازنة مجهودك مع رأس مال الشريك لضمان التوزيع العادل للحصص بين الأطراف. (${this.escapeHtml(p.name)}: ${p.dur} شهر)` });
    });

    // تنبيه فخ الـ 50%
    const has50 = this.results.some(r => Math.abs(r.pct - 50) < 0.5);
    const existPct = this.type === 'existing' ? (this.numVal('entryPct') || 0) : 0;
    if (has50 || Math.abs(existPct - 50) < 0.5)
      alerts.push({ t:'warn', m:'نسبة % 50 تجعل القرار المشترك مرتبطا باتفاق الطرفين. حددوا آلية ترجيح القرار واكتبوا صلاحيات الإدارة.' });
    const existingBox = document.getElementById('existingCalcBox');
    if (this.type === 'existing' && existingBox && !existingBox.classList.contains('hide') && existingBox.classList.contains('notice-warn'))
      alerts.push({ t:'warn', m: existingBox.textContent });

    if (this.type === 'mudaraba') {
      if (this.mudarabaCheck?.valid) {
        alerts.push({ t:'ok', m:'هذا النموذج يفصل بين رب المال الذي يقدم المال والمضارب الذي يقدم العمل.' });
        const vals = this.parties.map(p => this.normalizePercentField(p.profit));
        const complete = vals.every(v => v !== null);
        const total = vals.reduce((s,v) => s + (v || 0), 0);
        if (!complete) alerts.push({ t:'warn', m:'أكمل نسب الربح المتفق عليها. المثال % 40 و% 60 للتوضيح.' });
        else if (vals.some(v => !(v > 0))) alerts.push({ t:'warn', m:'يجب أن تكون لكل طرف حصة شائعة موجبة من الربح، ولا يصح جعل نصيب أحد الأطراف صفرا.' });
        else if (Math.abs(total - 100) > 0.01) alerts.push({ t:'warn', m:`مجموع نسب الربح المدخلة ${this.percentHtml(total)}. اضبطها ليصبح المجموع % 100.` });
        else alerts.push({ t:'ok', m:'مجموع نسب الربح % 100. راجع بقية شروط المضاربة واكتبها.' });
      } else {
        alerts.push({ t:'warn', m:'البيانات المدخلة تصف طرفا يجمع بين التمويل والعمل، أو تحتاج استكمال أدوار المال والعمل. عرضت الأداة الحالة كمشاركة عامة.' });
        if (this.mudarabaCheck?.problems?.length) alerts.push({ t:'warn', m:'تفاصيل الملاحظة: ' + this.mudarabaCheck.problems.map(p=>this.escapeHtml(p)).join(' | ') });
      }
    } else if (this.type === 'fnb') {
      const vals = this.parties.map(p => this.normalizePercentField(p.profit));
      const entered = vals.some(v => v !== null);
      const total = vals.reduce((sum, value) => sum + (value || 0), 0);
      if (entered && (!vals.every(v => v !== null) || vals.some(v => !(v > 0)) || Math.abs(total - 100) >= 0.05))
        alerts.push({ t:'warn', m:`أكمل نسب الأرباح لكل الأطراف بنسب موجبة مجموعها % 100. المجموع الحالي: ${this.percentHtml(total)}.` });
      else if (entered) alerts.push({ t:'ok', m:'مجموع نسب الأرباح المدخلة % 100.' });
    } else if (this.parties.some(p => (p.cash || 0) > 0 && this.hasEffort(p))) {
      alerts.push({ t:'ok', m:'يوجد طرف يجمع بين المال والعمل. وضح العلاقة ضمن المشاركة العامة واكتب أثر كل مساهمة.' });
    }

    document.getElementById('smartAlerts').innerHTML = alerts.map(a =>
      `<div class="notice notice-${a.t === 'warn' ? 'warn' : 'ok'}" style="margin-bottom:8px">${a.m}</div>`
    ).join('');

    // Zero-profit anomaly warning
    const zpAlerts = this.zeroProfit_checkResults();
    if (zpAlerts.length) {
      const zpHtml = zpAlerts.map(a => `
        <div class="notice" style="background:#FEF2F2;border:1px solid #FCA5A5;color:#7A1D1D;padding:14px 16px;border-radius:10px;margin-top:10px;line-height:1.75;font-size:13px">
          <strong>تنبيه حسابي مهم:</strong> ${this.escapeHtml(a.name)} يساهم بقيمة ${this.moneyHtml(a.contrib)} ويمتلك ${this.percentHtml(a.equity)} من الشركة، ونصيبه المدخل من الأرباح <strong>% 0</strong>.
          <br>راجع سبب ذلك:<br>
          &nbsp;&nbsp;① هل يعني هذا أن ربحه يأتي من راتب ثابت فقط؟<br>
          &nbsp;&nbsp;② أم أن توزيع الأرباح يسير بشكل مختلف عن الملكية؟<br>
          &nbsp;&nbsp;③ لتعديل النسبة، عد إلى الخطوة 2 وأدخل نصيب الأرباح لكل طرف.
        </div>`).join('');
      const smartEl = document.getElementById('smartAlerts');
      if (smartEl) smartEl.innerHTML += zpHtml;
    }
  },


  buildDisputeClause(){
    const amicableOn = document.getElementById('amicableOn')?.value || 'yes';
    const rawDays = (document.getElementById('amicableDays')?.value || '').trim();
    const method = document.getElementById('disputeMethod')?.value || '';
    const note = (document.getElementById('disputeNote')?.value || '').trim();
    const parts = [];

    if (amicableOn === 'yes') {
      parts.push(rawDays
        ? `يبدأ الأطراف بمحاولة الحل الودي لمدة (${rawDays}) يوم.`
        : `يبدأ الأطراف بمحاولة الحل الودي.`);
    }

    const prefix = (amicableOn === 'yes') ? 'وعند تعذر الحل الودي، ' : '';
    if (method === 'arbitration') {
      parts.push(`${prefix}اتجه الأطراف مبدئيا إلى مناقشة إدراج شرط تحكيم في العقد النهائي، على أن تستكمل صياغته وتفاصيله مع مختص، ولا يعد هذا النص شرط تحكيم نهائيا.`);
    } else if (method === 'court') {
      parts.push(`${prefix}اتجه الأطراف مبدئيا إلى اعتماد القضاء المختص في العقد النهائي.`);
    } else if (method === 'custom') {
      parts.push(`${prefix}تحدد آلية أخرى وتستكمل تفاصيلها في العقد النهائي.`);
    } else {
      parts.push(`${prefix}تحدد آلية حل الخلافات في العقد النهائي.`);
    }

    if (note) parts.push(`كما يُتفق على ما يلي: ${note}.`);

    return parts.join(' ');
  },
  copyAgr() {
    const t = document.getElementById('agrBox')?.textContent || '';
    if (!t.trim()) return;
    const done = () => {
      document.getElementById('progBar').style.width = '100%';
      this.showCopyStatus('✅ تم نسخ النص إلى الحافظة');
    };
    const fail = () => {
      this.showCopyStatus('تعذر النسخ التلقائي، ويمكنك تحديد النص ونسخه يدويا.', true);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(done).catch(() => {
        try { this.fallbackCopy(t); done(); } catch { fail(); }
      });
    } else {
      try { this.fallbackCopy(t); done(); } catch { fail(); }
    }
  },


  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
    document.body.appendChild(ta);
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ta.setSelectionRange(0, 999999);
    } else {
      ta.focus();
      ta.select();
    }
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('copy failed');
  },


  showCopyStatus(msg, isErr = false) {
    const el = document.getElementById('copyStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = isErr ? 'copy-status err' : 'copy-status show';
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => {
      el.className = 'copy-status';
      el.textContent = '';
    }, 2600);
  },


  /* ─── EXPORT LAYOUT BUILDER ─── */
  buildExportLayout() {
  const W = 1080, H = 1350, PAD = 24;
  const bg     = '#F5F3ED';
  const surf   = '#FFFDF8';
  const card   = '#EAE5D8';
  const txt    = '#102538';
  const mid    = '#405466';
  const muted  = '#5F7180';
  const border = '#D2D8DC';
  const navy   = '#0B1F33';
  const gold   = '#8B671E';
  const font   = "'IBM Plex Sans Arabic', sans-serif";

  const xIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${gold}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63z"/></svg>`;
  const linkedInIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${gold}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
  const snapchatIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${gold}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0"><path d="M12 3c-3.1 0-5 2.3-5 5.4v2.2c-.2.8-.9 1.4-2 1.7-.6.2-.7.9-.2 1.3.7.7 1.6 1.2 2.6 1.5-.2.8-.6 1.5-1.1 2.1 1.4.4 2.6.2 3.6 1.4.6.7 1.3 1.1 2.1 1.1s1.5-.4 2.1-1.1c1-1.2 2.2-1 3.6-1.4-.5-.6-.9-1.3-1.1-2.1 1-.3 1.9-.8 2.6-1.5.5-.4.4-1.1-.2-1.3-1.1-.3-1.8-.9-2-1.7V8.4C17 5.3 15.1 3 12 3z"/></svg>`;
  const linktreeIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${gold}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0"><path d="M13.4 9.15 16.8 5.7l1.95 1.98-3.42 3.38h4.86v2.8h-4.88l3.45 3.43-1.97 1.95-3.39-3.42V21h-2.8v-5.16l-3.4 3.42-1.97-1.97 3.45-3.43H3.8v-2.8h4.87L5.25 7.68 7.2 5.7l3.4 3.45V3h2.8v6.15z"/></svg>`;

  const projName = this.escapeHtml((document.getElementById('projName')?.value || '').trim());
  const dates    = this.formatDate(new Date());
  const res      = this.results;
  const isMudExport = this.type === 'mudaraba' && this.mudarabaCheck?.valid;
  const hasProfitSplit = !isMudExport && this.profitDiffers();
  const mudProfitComplete = isMudExport && res.every(r => r.profit !== null);
  const roleNames = { manager:'مدير عام', ops:'تشغيلي', tech:'تقني', sales:'مبيعات', silent:'' };
  const px = v => `${v}px`;

  const makeDonutSVG = (metric, title, size) => {
    const cx = size / 2, cy = size / 2, r = size * 0.35, sw = size * 0.12;
    let startAngle = -90;
    const arcs = res.map(d => {
      const value = +(d[metric] ?? d.pct) || 0;
      if (!value) return '';
      const angle = value / 100 * 360;
      if (angle >= 359.9) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}"/>`;
      const a1 = startAngle * Math.PI / 180;
      const a2 = (startAngle + angle) * Math.PI / 180;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const lg = angle > 180 ? 1 : 0;
      startAngle += angle;
      return `<path d="M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }).join('');

    return `
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${card}" stroke-width="${sw}"/>
          ${arcs}
          <circle cx="${cx}" cy="${cy}" r="${r - sw/2 - size*0.035}" fill="${surf}"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
          <div style="font-size:${hasProfitSplit ? 18 : 20}px;color:${muted};font-family:${font}">${title}</div>
          <div style="font-size:${hasProfitSplit ? 30 : 36}px;color:${navy};font-weight:700;font-family:${font};margin-top:6px">${res.length} أطراف</div>
        </div>
      </div>`;
  };

  const chartBlock = isMudExport
    ? (mudProfitComplete ? makeDonutSVG('profit', 'نسب الربح', 460) : `<div style="width:460px;height:300px;border:2px dashed ${border};border-radius:24px;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;color:${mid};font-size:24px;font-family:${font}">أدخل نسب الربح المتفق عليها<br><span style="font-size:18px;color:${muted}">مثال إرشادي: % 40 | % 60</span></div>`)
    : hasProfitSplit ? `<div style="display:flex;align-items:center;justify-content:center;gap:28px;width:100%">
         ${makeDonutSVG('pct', 'توزيع الملكية', 350)}
         ${makeDonutSVG('profit', 'توزيع الأرباح', 350)}
       </div>`
    : makeDonutSVG('pct', 'توزيع الملكية', 460);

  const legend = res.map(d => `
    <div style="display:flex;align-items:center;gap:10px;background:${surf};border:1px solid ${border};border-radius:10px;padding:10px 16px">
      <div style="width:16px;height:16px;border-radius:50%;background:${d.color};flex-shrink:0"></div>
      <span style="color:${mid};font-size:15px;font-family:${font}">${this.escapeHtml(d.name)}</span>
    </div>`).join('');

  const cash  = this.parties.reduce((s,p) => s+(p.cash||0), 0);
  const asset = this.parties.reduce((s,p) => s+(p.assets||0)+(p.ip||0)+(p.net||0), 0);
  const knownWorkers = this.parties.filter(p => ['no','full','part','period'].includes(p.work));
  const working = knownWorkers.filter(p => p.work !== 'no').length;
  const pre = this.numVal('preMoney');
  const inv = this.numVal('newInv');
  const kpis = isMudExport ? [
    { lbl:'رأس مال المضاربة', val: this.moneyHtml(cash), sub:'مقدم من رب المال' },
    { lbl:'الأطراف', val:String(this.parties.length), sub:'رب مال ومضارب' },
    { lbl:'نسب الربح', val:mudProfitComplete ? 'محددة' : 'تحدد لاحقا', sub:'يعرض هذا المسار نسب الربح' }
  ] : [
    { lbl:this.type==='existing'?'مبلغ الصفقة للشركة والبائع':'إجمالي المساهمات النقدية المدخلة', val: this.moneyHtml(cash), sub:'مبلغ متفق أو مقترح؛ المدفوع الفعلي مستقل' },
    { lbl:this.type==='existing'?'أصول الشركة السابقة':'الأصول والحقوق المضافة', val:this.type==='existing'?'ضمن التقييم':this.moneyHtml(asset), sub:this.type==='existing'?'لا تُحسب مساهمة جديدة':'أصول + ملكية فكرية + التزامات مقومة' },
    { lbl:'الشركاء العاملون', val:knownWorkers.length===this.parties.length?working + ' / ' + this.parties.length:'لم تُحدد بالكامل', sub:working+' عاملون مؤكدون؛ '+(this.parties.length-knownWorkers.length)+' حالات لم تُحدد' },
  ];
  if (pre > 0 && inv > 0) kpis.push({ lbl:'التقييم بعد الاستثمار', val: this.moneyHtml(pre+inv), sub:'Post-Money Valuation' });

  if(this.type==='existing'&&this.entryFundingText){kpis.splice(0,kpis.length,{lbl:'تفاصيل الصفقة والدفعات',val:'',sub:this.escapeHtml(this.entryFundingText()).replaceAll('\n','<br>')});}

  const kpiBoxes = kpis.map(k => `
    <div style="background:${surf};border:1px solid ${border};border-radius:14px;padding:20px 24px;display:flex;flex-direction:column;justify-content:center">
      <div style="font-size:15px;color:${muted};font-family:${font};margin-bottom:7px">${k.lbl}</div>
      <div style="font-size:28px;font-weight:700;color:${navy};font-family:${font};margin-bottom:5px;direction:ltr;unicode-bidi:plaintext">${k.val}</div>
      <div style="font-size:14px;color:${muted};font-family:${font}">${k.sub}</div>
    </div>`).join('');

  const partyCards = res.map(r => {
    const contribRows = [
      r.cash     ? { lbl:'نقدي', val:this.moneyHtml(r.cash) } : null,
      r.assets && this.type!=='existing' ? { lbl:'أصول', val:this.moneyHtml(r.assets) } : null,
      r.ip && this.type!=='existing' ? { lbl:'ملكية فكرية', val:this.moneyHtml(r.ip) } : null,
      r.net && this.type!=='existing' ? { lbl:'التزام قابل للقياس', val:this.moneyHtml(r.net) } : null,
      r.effortSc ? { lbl:`جهد (${r.dur || 0} أشهر)`, val:this.moneyHtml(r.effortSc) } : null,
    ].filter(Boolean);

    const contribsHtml = contribRows.length > 0
      ? contribRows.map((c, i) => `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:${i === contribRows.length - 1 ? 'none' : '1px solid ' + border}">
          <span style="color:${muted};font-size:15px;font-family:${font}">${c.lbl}</span>
          <span style="color:${txt};font-size:15px;font-weight:700;font-family:${font};direction:ltr;unicode-bidi:plaintext">${c.val}</span>
        </div>`).join('')
      : `<div style="padding:6px 0;color:${muted};font-size:15px;font-family:${font}">تضاف المساهمات من بطاقات الأطراف</div>`;

    const capLine = `${this.escapeHtml(r.cap||'')}${r.role && r.role!=='silent' ? ' '+(roleNames[r.role]||'') : ''}`;
    const headlineShare = isMudExport
      ? `<div style="margin-bottom:12px;background:${card};border-radius:10px;padding:14px 16px;text-align:center"><span style="font-size:14px;color:${muted};font-family:${font}">نصيب الربح</span><div style="font-size:30px;font-weight:700;color:${navy};font-family:${font}">${r.profit === null ? 'يحدد لاحقا' : this.percentHtml(r.profit)}</div></div>`
      : hasProfitSplit
      ? `<div style="display:flex;gap:14px;margin-bottom:12px;background:${card};border-radius:10px;padding:12px 16px">
           <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid ${border}">
             <span style="font-size:14px;color:${muted};font-family:${font};margin-bottom:2px">الملكية</span>
             <span style="font-size:28px;font-weight:700;color:${txt};font-family:${font};line-height:1">${this.percentHtml(r.pct)}</span>
           </div>
           <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
             <span style="font-size:14px;color:${muted};font-family:${font};margin-bottom:2px">الأرباح</span>
             <span style="font-size:28px;font-weight:700;color:${navy};font-family:${font};line-height:1">${this.percentHtml(r.profit)}</span>
           </div>
         </div>`
      : `<div style="display:flex;align-items:baseline;justify-content:flex-start;gap:12px;margin-bottom:12px;background:${card};border-radius:10px;padding:12px 16px;direction:rtl">
           <span style="font-size:16px;color:${muted};font-family:${font};white-space:nowrap">الملكية:</span>
           <span style="font-size:32px;font-weight:700;color:${navy};font-family:${font};line-height:1">${this.percentHtml(r.pct)}</span>
         </div>`;

    return `
      <div style="flex:1;min-width:300px;background:${surf};border:1px solid ${border};border-radius:14px;padding:22px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="display:flex;align-items:flex-start;justify-content:flex-start;margin-bottom:12px;gap:16px">
            <div style="display:flex;align-items:center;gap:12px;min-width:0">
              <div style="width:18px;height:18px;border-radius:50%;background:${r.color};flex-shrink:0"></div>
              <div style="font-size:22px;font-weight:700;color:${txt};font-family:${font};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this.escapeHtml(r.name)}</div>
            </div>
          </div>
          ${headlineShare}
          <div style="font-size:15px;color:${mid};font-family:${font};margin-bottom:14px">${capLine}</div>
          <div style="font-size:15px;font-family:${font};max-height:140px;overflow:hidden">
            ${contribsHtml}
          </div>
        </div>
        <div style="margin-top:20px;height:10px;background:${card};border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${isMudExport ? (r.profit || 0) : hasProfitSplit ? r.profit : r.pct}%;background:${r.color};border-radius:5px"></div>
        </div>
      </div>`;
  }).join('');

  const html = `
    <div style="width:${px(W)};height:${px(H)};padding:${px(PAD)};background:${bg};box-sizing:border-box;font-family:${font};direction:rtl;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:28px;border-bottom:1px solid ${border};flex-shrink:0">
        <div style="display:flex;flex-direction:column;gap:10px">
          <img src="sharakah-logo.svg" alt="حاسبة الشراكات | Partnership Share Calculator" style="width:430px;height:138px;object-fit:contain;border-radius:10px">
          ${projName ? `<div style="font-size:20px;color:${mid};font-family:${font}">المشروع: ${projName}</div>` : ''}
        </div>
        <div style="font-size:18px;color:${muted};text-align:left;direction:ltr;font-family:${font};line-height:1.4">
          <div>${dates.label}</div>
          <div style="font-size:15px;opacity:0.8">الإصدار 1.2.0</div>
        </div>
      </div>

      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${hasProfitSplit ? '28px 0 20px' : '38px 0'}">
        <div style="display:flex;gap:${hasProfitSplit ? '22px' : '48px'};align-items:center;justify-content:center">
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0">
            ${chartBlock}
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:${hasProfitSplit ? '22px' : '36px'};width:100%">
              ${legend}
            </div>
          </div>
          <div style="width:${hasProfitSplit ? '330px' : '460px'};display:flex;flex-direction:column;gap:14px;flex-shrink:0">
            ${kpiBoxes}
          </div>
        </div>
      </div>

      <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:30px;flex-shrink:0">
        ${partyCards}
      </div>

      <div style="padding-top:18px;border-top:2px solid ${border};display:flex;align-items:center;justify-content:space-between;gap:18px;font-family:${font};flex-shrink:0">
        <div style="display:flex;align-items:center;gap:14px">
          <img src="naif-logo-gold.png" alt="شعار نايف المحمدي" style="width:126px;height:56px;object-fit:contain">
          <div style="font-size:15px;color:${mid};font-family:${font}">مستشار الحوكمة وتطوير الأعمال</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;color:${gold}">
          <div style="display:flex;align-items:center;gap:9px;direction:ltr">${xIcon}${linkedInIcon}${snapchatIcon}${linktreeIcon}</div>
          <div style="font-size:16px;font-weight:700;direction:ltr">@almohammdin</div>
        </div>
        <div style="max-width:330px;text-align:right;font-size:14px;color:${muted};font-family:${font};line-height:1.55">نتائج تقديرية تمهد لمناقشة الشركاء ومراجعة المختص.<br><span style="font-size:12px">الإصدار 1.2.0</span></div>
      </div>
    </div>`;

  const container = document.getElementById('exportResultsLayout');
  container.innerHTML = html;
  container.style.visibility = 'visible';
  container.style.width = px(W);
  container.style.height = px(H);
  return container;
},

/* ─── IMAGE CAPTURE FUNCTION (Configured for 1080x1350) ─── */
captureResultsImage() {
  if (!this.results || !this.results.length) {
    alert('أكمل الحسبة أولا لتجهيز صورة النتائج.');
    return;
  }
  if (typeof html2canvas === 'undefined') {
    alert('مكتبة التقاط الصورة قيد التحميل. انتظر لحظة ثم حاول مجددا.');
    return;
  }

  const btn = document.querySelector('[onclick="G.captureResultsImage()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'جار التصدير...'; }

  const container = this.buildExportLayout();
  const projName  = (document.getElementById('projName')?.value || '').trim();

  requestAnimationFrame(() => {
    setTimeout(() => {
      document.fonts.ready.then(() => {
        html2canvas(container.firstElementChild, {
          backgroundColor: '#F5F3ED',
          scale: 3,
          useCORS: true,
          logging: false,
          width: 1080,
          height: 1350,
          windowWidth: 1080,
          windowHeight: 1350
        }).then(canvas => {
          container.style.visibility = 'hidden';
          container.innerHTML = '';

          const link = document.createElement('a');
          link.download = `sharakah-results${projName ? '-' + projName.replace(/\s+/g, '-') : ''}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (btn) { btn.disabled = false; btn.textContent = '📸 التقاط صورة للنتائج'; }
        }).catch(err => {
          container.style.visibility = 'hidden';
          container.innerHTML = '';
          if (btn) { btn.disabled = false; btn.textContent = '📸 التقاط صورة للنتائج'; }
          alert('تعذر التقاط الصورة: ' + (err?.message || 'تعذر تحديد سبب الخطأ'));
        });
      });
    }, 150);
  });
},





  loadExample(type) {
    const EXAMPLES = {
      fnb: { projName: '\u0645\u0642\u0647\u0649 \u0627\u0644\u0641\u062c\u0631', legalStruct: 'llc', parties: [
        { name: 'محمد العلي', cap: '\u0634\u0631\u064a\u0643 \u0645\u0645\u0648\u0644', cash: 300000, assets: 150000, ip: 0, net: 0, work: 'no', role: 'silent', fmv: 0, paid: 0, dur: '', note: '\u064a\u0642\u062f\u0645 \u0627\u0644\u062a\u0645\u0648\u064a\u0644 \u0627\u0644\u0646\u0642\u062f\u064a \u0648\u062a\u062c\u0647\u064a\u0632\u0627\u062a \u0627\u0644\u0645\u0642\u0647\u0649' },
        { name: 'نورة', cap: '\u0634\u0631\u064a\u0643 \u0645\u062f\u064a\u0631', cash: 50000, assets: 0, ip: 0, net: 0, work: 'full', fmv: 12000, paid: 4000, dur: 12, role: 'ops', note: '\u0645\u062f\u064a\u0631 \u0627\u0644\u062a\u0634\u063a\u064a\u0644' }
      ]},
      deal: { projName: '\u0635\u0641\u0642\u0629 \u0623\u0631\u0627\u0636\u064a \u0627\u0644\u0646\u062e\u064a\u0644', legalStruct: '', parties: [
        { name: 'ناصر عطية', cap: '\u0634\u0631\u064a\u0643 \u0645\u0645\u0648\u0644', cash: 500000, assets: 0, ip: 0, net: 0, work: 'no', role: 'silent', fmv: 0, paid: 0, dur: '', note: '\u0627\u0644\u0645\u0645\u0648\u0644 \u0627\u0644\u0631\u0626\u064a\u0633\u064a \u0644\u0644\u0635\u0641\u0642\u0629' },
        { name: 'نوف', cap: '\u0634\u0631\u064a\u0643 \u0639\u0627\u0645\u0644', cash: 200000, assets: 0, ip: 0, net: 0, work: 'part', fmv: 15000, paid: 0, dur: 6, role: 'manager', note: '\u064a\u062a\u0648\u0644\u0649 \u0627\u0644\u062a\u0641\u0627\u0648\u0636 \u0648\u0625\u0646\u062c\u0627\u0632 \u0627\u0644\u0635\u0641\u0642\u0629 \u062e\u0644\u0627\u0644 \u0633\u062a\u0629 \u0623\u0634\u0647\u0631' }
      ]},
      existing: { projName: '\u0645\u0637\u0627\u0639\u0645 \u0627\u0644\u0623\u0635\u0627\u0644\u0629 | \u062f\u062e\u0648\u0644 \u0634\u0631\u064a\u0643 \u062c\u062f\u064a\u062f', legalStruct: 'llc', coVal: '2000000', entryAmt: '500000', parties: [
        { name: 'علي محمد', cap: '\u0634\u0631\u064a\u0643 \u062d\u0627\u0644\u064a', currentPct: 100, cash: 0, assets: 0, ip: 200000, net: 0, work: 'full', fmv: 18000, paid: 15000, dur: 24, role: 'manager', note: '\u064a\u0645\u062b\u0644\u0648\u0646 \u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629 \u0628\u0643\u0627\u0645\u0644 \u0623\u0635\u0648\u0644\u0647\u0627' },
        { name: 'جنى عابد', cap: '\u0645\u0633\u062a\u062b\u0645\u0631 \u062c\u062f\u064a\u062f', cash: 500000, assets: 0, ip: 0, net: 0, work: 'no', role: 'silent', fmv: 0, paid: 0, dur: '', note: '\u064a\u062f\u062e\u0644 \u0645\u0642\u0627\u0628\u0644 \u062d\u0635\u0629 \u0645\u0646 \u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0642\u0627\u0626\u0645\u0629' }
      ]},
      mudaraba: { projName: 'مضاربة تشغيل فندق', legalStruct: '', parties: [
        { name: 'نورة', cap: '\u0631\u0628 \u0627\u0644\u0645\u0627\u0644 (\u0645\u0645\u0648\u0644)', cash: 1000000, assets: 0, ip: 0, net: 0, work: 'no', role: 'silent', fmv: 0, paid: 0, dur: '', profit: 40, note: '\u064a\u0642\u062f\u0645 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0643\u0627\u0645\u0644\u0627 \u0648\u064a\u062a\u0627\u0628\u0639 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0645\u0627\u0644\u064a\u0629' },
        { name: 'نوف', cap: '\u0645\u0636\u0627\u0631\u0628 (\u0639\u0627\u0645\u0644)', cash: 0, assets: 0, ip: 0, net: 0, work: 'full', fmv: 20000, paid: 0, dur: 18, role: 'manager', profit: 60, note: '\u064a\u0642\u062f\u0645 \u0627\u0644\u062e\u0628\u0631\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0648\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629' }
      ]}
    };
    const ex = EXAMPLES[type];
    if (!ex) return;
    this.type = null; this.parties = []; this.results = [];
    this.activeProfile = 'balanced'; this.W = { Cash:4, Asset:3, Effort:3, IP:3, Net:2 };
    localStorage.removeItem('sharakah_save');
    this.renderTypes(); this.renderProfiles(); this.initWeights();
    document.getElementById('partyList').innerHTML = ''; this.cnt = 0;
    this.selType(type);
    setTimeout(() => {
      const sv = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined && v !== null) el.value = v; };
      sv('projName', ex.projName); sv('legalStruct', ex.legalStruct);
      if (ex.coVal)    { sv('coVal', ex.coVal); }
      if (ex.entryAmt) { sv('entryAmt', ex.entryAmt); }
      if (ex.coVal && ex.entryAmt) this.updExistingDeal('valuation');
      document.getElementById('partyList').innerHTML = ''; this.parties = []; this.cnt = 0;
      ex.parties.forEach(p => this.addParty(p));
      this.normalizeNumberInputs(); this.go(2);
      const badge = document.getElementById('savedBadge');
      if (badge) { const orig = badge.textContent; badge.textContent = '\u2713 \u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u062b\u0627\u0644'; badge.classList.add('show'); setTimeout(() => { badge.textContent = orig; badge.classList.remove('show'); }, 2500); }
    }, 100);
  },

  /* معادلات دخول الشريك: ضخ للشركة، شراء حصة قائمة، أو مزيج بينهما. */
  updExistingMode() {
    const mode = document.getElementById('entryMode')?.value || 'cashin';
    document.getElementById('mixedSplit')?.classList.toggle('hide', mode !== 'mixed');
    document.getElementById('sellerPartyWrap')?.classList.toggle('hide', !['cashout','mixed'].includes(mode));
    this.renderExistingSellerOptions();
    const entryGroup = document.getElementById('entryAmt')?.closest('.fg');
    if (entryGroup) entryGroup.classList.toggle('hide', mode === 'mixed');
    const entryLabel = entryGroup?.querySelector('label');
    if (entryLabel) entryLabel.textContent = mode === 'cashout' ? 'سعر شراء الحصة من الشريك الحالي' : 'مبلغ التمويل الداخل للشركة';
    this.updExistingDeal('mode');
    this.normalizeNumberInputs();
    this.applyFieldEnhancements(document.getElementById('existCard'));
  },

  updExistingDeal(source = '') {
    const mode = document.getElementById('entryMode')?.value || 'cashin';
    const val = this.numVal('coVal');
    let cashIn = mode === 'cashin' ? this.numVal('entryAmt') : mode === 'mixed' ? this.numVal('cashInAmt') : 0;
    let cashOut = mode === 'cashout' ? this.numVal('entryAmt') : mode === 'mixed' ? this.numVal('cashOutAmt') : 0;
    let inv = cashIn + cashOut;
    let pct = this.numVal('entryPct');

    if (mode !== 'mixed' && source === 'percent' && val > 0 && pct > 0 && pct < 100) {
      inv = mode === 'cashout' ? val * pct / 100 : val * pct / (100 - pct);
      this.setNumVal('entryAmt', inv);
      cashIn = mode === 'cashin' ? inv : 0;
      cashOut = mode === 'cashout' ? inv : 0;
    } else if (val > 0 && inv > 0) {
      pct = mode === 'cashout' ? (cashOut / val * 100) : ((cashIn + cashOut) / (val + cashIn) * 100);
      this.setNumVal('entryPct', pct);
    }
    if (mode === 'mixed') this.setNumVal('entryAmt', inv);

    const post = val + cashIn;
    const sellerId = Number(document.getElementById('sellerPartyId')?.value);
    const seller = this.parties.find(p => p.id === sellerId && p.cap !== 'مستثمر جديد');
    const sellerLimit = seller ? val * (Number(seller.currentPct) || 0) / 100 : 0;
    const invalidSeller = ['cashout','mixed'].includes(mode) && (!seller || cashOut > sellerLimit + 0.01);
    const invalid = pct >= 100 || (mode === 'cashout' && cashOut > val) || invalidSeller;
    const box = document.getElementById('existingCalcBox');
    const panel = document.getElementById('existLivePanel');
    const modeNames = { cashin:'ضخ تمويل جديد في الشركة', cashout:'شراء حصة من شريك حالي', mixed:'دخول مختلط: تمويل وشراء حصة' };

    if (panel && val > 0 && inv > 0 && pct > 0 && !invalid) {
      panel.classList.remove('hide');
      document.getElementById('lp_pre').innerHTML = this.moneyHtml(val);
      document.getElementById('lp_inv').innerHTML = this.moneyHtml(inv);
      document.getElementById('lp_post').innerHTML = this.moneyHtml(post);
      document.getElementById('lp_oldPct').innerHTML = this.percentHtml((100 - pct).toFixed(1));
      document.getElementById('lp_newPct').innerHTML = this.percentHtml(pct.toFixed(1));
      document.getElementById('lp_oldBar').style.width = (100 - pct) + '%';
      document.getElementById('lp_newBar').style.width = pct + '%';
    } else panel?.classList.add('hide');

    if (box) {
      if (invalid) {
        box.textContent = invalidSeller && seller
          ? `راجع مبلغ الشراء؛ قيمة حصة البائع الحالية لا تتجاوز ${this.moneyText(sellerLimit)} بحسب النسبة المدخلة.`
          : 'راجع المبلغ والنسبة وبيانات البائع. يعمل هذا التقدير بحصة أقل من % 100.';
        box.className = 'notice notice-error';
      } else if (val > 0 && inv > 0 && pct > 0) {
        box.innerHTML = `${modeNames[mode]} | الحصة التقديرية للشريك الجديد: ${this.percentHtml(pct.toFixed(1))}، والقيمة بعد التمويل الداخل للشركة: ${this.moneyHtml(post)}.`;
        box.className = 'notice notice-ok';
      } else box.className = 'notice notice-ok hide';
    }
  },

  /* مخرجات موجزة لأهم نقاط الاتفاق. */
  buildAgr() {
    this.calc();
    const selectedType = this.type || 'fnb';
    const t = this.mudarabaCheck?.fallback ? 'partnership' : selectedType;
    const val = id => (document.getElementById(id)?.value || '').trim();
    const project = val('projName') || 'المشروع، يحدد اسمه لاحقا';
    const dates = this.formatDate(new Date());
    const dateLabel = dates.label || `${dates.hijri} هـ | ${dates.greg} م`;
    const typeNames = { startup:'مشروع ناشئ، مسار مخفي قيد التطوير', fnb:'مشروع تشغيلي', deal:'صفقة تجارية محددة', existing:'دخول شريك في شركة قائمة', mudaraba:'مضاربة', partnership:'مشاركة عامة' };
    const legalMap = { llc:'شركة ذات مسؤولية محدودة', simplified:'شركة مساهمة مبسطة', jsc:'شركة مساهمة', solidarity:'شركة تضامن', commandite:'شركة توصية بسيطة', '':'يحدد لاحقا' };
    const legal = legalMap[val('legalStruct')] || 'يحدد لاحقا';
    const resultById = id => this.results.find(r => r.id === id);
    const contribText = p => {
      const items = [];
      if (+p.cash) items.push(`نقد ${this.moneyText(p.cash)}`);
      if (+p.assets) items.push(`أصول عينية ${this.moneyText(p.assets)}`);
      if (+p.ip) items.push(`ملكية فكرية مقومة ${this.moneyText(p.ip)}`);
      if (+p.net) items.push(`التزام قابل للقياس ${this.moneyText(p.net)}${p.note ? ` (${p.note})` : ''}`);
      if (p.work !== 'no') items.push(`عمل ${p.dur ? `لمدة ${p.dur} شهر` : 'تحدد مدته لاحقا'}`);
      return items.length ? items.join('، ') : 'تحدد مساهمته كتابة';
    };
    const parties = this.parties.map((p,i) => {
      const r = resultById(p.id);
      if (t === 'existing') return p.cap === 'مستثمر جديد'
        ? `${i+1}. ${p.name || this.partyOrdinal(i)} | مستثمر جديد | إجمالي مبلغ الصفقة ${this.moneyText(p.cash)} | الملكية بعد الدخول ${this.percentText(r?.pct ?? 0)}.`
        : `${i+1}. ${p.name || this.partyOrdinal(i)} | شريك حالي | الملكية قبل الدخول ${this.percentText(p.currentPct || 0)} | الملكية بعد الدخول ${this.percentText(r?.pct ?? 0)}. أصول الشركة وأعمالها القائمة مشمولة في تقييم الشركة، ولا تحسب مساهمة جديدة في هذه الصفقة.`;
      if (t === 'mudaraba') return `${i+1}. ${p.name || this.partyOrdinal(i)} | ${p.cap} | ${contribText(p)} | الربح: ${r?.profit === null || r?.profit === undefined ? 'يحدد لاحقا' : this.percentText(r.profit)}.`;
      const profit = r && this.profitDiffers() ? `، ونصيب الربح ${this.percentText(r.profit)}` : '';
      return `${i+1}. ${p.name || this.partyOrdinal(i)} | ${p.cap || 'شريك'} | ${contribText(p)} | الحصة التقديرية ${this.percentText(r?.pct ?? 0)}${profit}.`;
    }).join('\n');

    const decisionLabels = {
      unanimous:'بموافقة جميع الأطراف', majority:'بالأغلبية', weighted:'بحسب نسب الحصص', later:'تحدد لاحقا',
      proportional:'يمول الأطراف بنسبة حصصهم', approval:'يتطلب موافقة الأطراف', loan:'يبحث تمويل مستقل',
      firstrefusal:'تعرض الحصة على الشركاء أولا', valuation:'تقيم الحصة بواسطة مقيم مستقل', agreement:'يتم الخروج بموافقة الأطراف'
    };
    const decision = id => decisionLabels[val(id)] || 'يحدد لاحقا';
    const manager = val('managerName') || 'يحدد لاحقا';
    const term = val('agreementTerm') || (t === 'deal' ? 'حتى انتهاء الصفقة وتسوية حساباتها' : 'تحدد لاحقا');
    const dispute = this.buildDisputeClause() || 'تحدد جهة الفصل في النزاع كتابة.';

    const sections = [];
    sections.push(`1) موضوع التفاهم\nالمشروع: ${project}.\nالحالة: ${typeNames[t] || 'شراكة'}.\nالشكل القانوني المقترح: ${legal}.`);
    sections.push(`2) الأطراف ومساهماتهم\n${parties}\nملاحظة: الحصص تبنى على مال أو عمل أو أصل قابل للتقويم. وتوصف كل مساهمة عينية وتقوم بأساس يتفق عليه الشركاء.`);

    if (t === 'mudaraba') {
      const profits = this.profitSharesComplete() ? `النسب المدخلة: ${this.results.map(r => `${r.name} ${this.percentText(r.profit)}`).join('، ')}.` : 'نسب الربح لم تكتمل بعد؛ تحدد لكل طرف بنسبة شائعة موجبة ويكون مجموعها % 100.';
      const scope = { restricted:'مقيد بالنشاط والصلاحيات المتفق عليها', unrestricted:'مفتوح ضمن المعتاد في النشاط', later:'يحدد لاحقا' }[val('mudScope')] || 'يحدد لاحقا';
      const capitalProviders = this.results.filter(r => r.cap === 'رب المال (ممول)').map(r => `${r.name} ${this.percentText(r.capitalPct || 0)}`).join('، ');
      sections.push(`3) رأس المال والعمل والربح\nرأس المال: ${this.moneyText(this.parties.reduce((s,p)=>s+(+p.cash||0),0))}، ويسلم وفق آلية وموعد يحددان كتابة. نسب رأس المال بين مقدميه: ${capitalProviders || 'تحدد بحسب مساهمة كل رب مال'}. المضارب يقدم العمل والإدارة. ${profits}\nتكون خسارة رأس المال على أرباب المال بحسب مساهمة كل منهم، ولا يضمنها المضارب إلا بسبب تعديه أو تقصيره، ويخسر المضارب جهده في غير ذلك.`);
      sections.push(`4) نطاق المضارب\nنطاق التصرف: ${scope}.${val('mudFee') ? ` أجر مستقل لعمل معلوم: ${val('mudFee')}.` : ''}`);
    } else {
      if (t === 'existing') {
        const mode = val('entryMode') || 'cashin';
        const modeText = { cashin:'ضخ تمويل في الشركة', cashout:'شراء حصة من شريك حالي', mixed:'دخول مختلط: جزء للشركة وجزء للبائع' }[mode];
        sections.push(`3) دخول الشريك الجديد\nالطريقة: ${modeText}. قيمة الشركة قبل الدخول: ${this.moneyText(this.numVal('coVal'))}. إجمالي مبلغ الدخول: ${this.moneyText(this.numVal('entryAmt'))}. الحصة التقديرية: ${this.percentText(this.numVal('entryPct').toFixed(1))}.${mode === 'mixed' ? ` منها ${this.moneyText(this.numVal('cashInAmt'))} للشركة و${this.moneyText(this.numVal('cashOutAmt'))} للبائع.` : ''}\nتحدد الالتزامات السابقة التي يتحملها الشريك الجديد، عند وجودها.`);
      } else if (t === 'deal') {
        sections.push(`3) نطاق الصفقة\nتحدد الصفقة ومصاريفها وموعد انتهائها بوضوح، وتنتهي المشاركة بعد الإنجاز والتحصيل وتسوية التكاليف وتوزيع صافي العائد.`);
      } else {
        sections.push(`3) التوزيع المالي\nنسب الحصص الواردة في نتيجة الحاسبة تقدير أولي مبني على القيم المدخلة. يجوز الاتفاق على توزيع الأرباح بالنسب المدخلة الصحيحة، أما الخسائر فتوزع بحسب حصة كل شريك، ولا يعفى شريك من الخسارة. وتثبت الصياغة النهائية في الاتفاق.`);
      }
    }

    sections.push(`${sections.length + 1}) الإدارة والقرارات\nالإدارة اليومية: ${manager}. القرارات المهمة: ${decision('decisionRule')}. التمويل الإضافي: ${decision('fundingRule')}.`);
    sections.push(`${sections.length + 1}) المدة والخروج والاستمرار\nالمدة: ${term}. عند خروج شريك: ${decision('exitRule')}. ويحدد الاتفاق أثر الوفاة أو العجز أو الإفلاس، وطريقة تقييم الحصة وتسوية الحقوق.`);
    sections.push(`${sections.length + 1}) التوجه المبدئي لحل الخلافات\n${dispute}`);
    if (val('keyNotes')) sections.push(`${sections.length + 1}) نقطة إضافية\n${val('keyNotes')}`);
    sections.push(`${sections.length + 1}) الكتابة والمراجعة\nيكتب اتفاق الشركاء وأي تعديل عليه. وتستخدم ورقة التفاهم كمرجع لإعداد الاتفاق ومراجعته مع المختص.`);

    const text = `مسودة نقاط اتفاق الشركاء\n${dateLabel}\n\n${sections.join('\n\n')}`;
    document.getElementById('agrBox').innerHTML = this.escapeHtml(text).replaceAll('⃁', '<span class="riyal-symbol" aria-label="ريال سعودي"><span class="sr-only">⃁</span></span>');
    document.getElementById('agrTitle').textContent = `مسودة نقاط اتفاق الشركاء | ${project}`;
    document.getElementById('agrMeta').textContent = `${typeNames[t] || ''} · ${this.parties.length} أطراف · ${dateLabel}`;
    document.getElementById('agrBadge').textContent = 'مسودة استرشادية';
    document.getElementById('contractGuidance').innerHTML = '<div class="notice notice-info">راجعوا الأرقام والأسماء والصلاحيات أولا، ثم سلموا النقاط للمختص لصياغة الاتفاق المناسب بصورة مبسطة.</div>';
  },

  downloadWord() {
    const text = document.getElementById('agrBox')?.textContent || '';
    const body = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    const html = `<!doctype html><html dir="rtl"><meta charset="utf-8"><style>body{font-family:Arial;line-height:1.9;margin:36px;color:#102538}h1{color:#0B1F33}</style><body><h1>مسودة نقاط اتفاق الشركاء</h1>${body}</body></html>`;
    const blob = new Blob(['\ufeff', html], {type:'application/msword'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'نقاط-اتفاق-الشركاء.doc'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },

  printDraft() { window.print(); },

  applyFieldEnhancements(root = document) {
    const fields = root.querySelectorAll ? root.querySelectorAll('.fg') : [];
    fields.forEach(fg => {
      const label = Array.from(fg.children).find(el => el.tagName === 'LABEL');
      if (!label) return;
      const inlineHelp = Array.from(fg.children).find(el => el.classList?.contains('help'));
      const tip = (label.dataset.help || inlineHelp?.textContent || '').trim();
      if (tip && !label.querySelector('.help-q')) {
        const q = document.createElement('button');
        q.type = 'button';
        q.className = 'help-q';
        q.textContent = '؟';
        q.setAttribute('aria-label', 'شرح الحقل');
        q.setAttribute('data-tip', tip);
        q.setAttribute('aria-expanded', 'false');
        q.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          document.querySelectorAll('.help-q.open').forEach(item => {
            if (item !== q) { item.classList.remove('open'); item.setAttribute('aria-expanded', 'false'); }
          });
          const open = q.classList.toggle('open');
          q.setAttribute('aria-expanded', String(open));
        });
        label.appendChild(q);
        inlineHelp?.classList.add('help-source-hidden');
      }

      const labelText = label.childNodes[0]?.textContent?.trim() || label.textContent.trim();
      const input = Array.from(fg.children).find(el => el.tagName === 'INPUT' && (el.classList.contains('num') || el.inputMode === 'numeric' || el.inputMode === 'decimal'));
      if (!input || input.parentElement?.classList.contains('money-field-wrap') || input.parentElement?.classList.contains('percent-field-wrap')) return;
      const isPercent = /نسبة|%/.test(labelText);
      const isMoney = !isPercent && /مال|تمويل|نقد|قيمة|أصول|استثمار|راتب|مبلغ|تقييم|أجر/.test(labelText);
      if (!isPercent && !isMoney) return;
      const wrap = document.createElement('div');
      wrap.className = isPercent ? 'percent-field-wrap' : 'money-field-wrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const unit = document.createElement('span');
      unit.className = 'field-unit';
      if (isPercent) {
        unit.textContent = '%';
        unit.setAttribute('aria-hidden', 'true');
      } else {
        unit.classList.add('riyal-symbol');
        unit.setAttribute('aria-label', 'ريال سعودي');
      }
      wrap.appendChild(unit);
    });
  },

  normalizeNumberInputs() {
    document.querySelectorAll('input[type="text" inputmode="decimal" class="num"], input.num').forEach(el => {
      el.setAttribute('type','text');
      el.setAttribute('inputmode','numeric');
      el.setAttribute('lang','en');
      el.classList.add('num');
      el.dir = 'ltr';
      if (!el.dataset.fmtLive) {
        el.dataset.fmtLive = '1';
        el.addEventListener('input', function() {
          let cursor = this.selectionStart;
          let oldLength = this.value.length;
          let raw = this.value.replace(/[^\d.]/g, '');
          if (raw) {
            let parts = raw.split('.');
            parts[0] = new Intl.NumberFormat('en-US').format(parts[0]);
            this.value = parts.join('.');
          } else {
            this.value = '';
          }
          this.selectionStart = this.selectionEnd = cursor + (this.value.length - oldLength);
        });
      }
    });
  },


  formatDate(d) {
    const get = calendar => {
      const parts = new Intl.DateTimeFormat(`ar-SA-u-ca-${calendar}-nu-latn`, {day:'numeric',month:'long',year:'numeric'}).formatToParts(d);
      const part = type => parts.find(p => p.type === type)?.value || '';
      return `${part('day')} ${part('month')} ${part('year')}`.trim();
    };
    const weekday = new Intl.DateTimeFormat('ar-SA', {weekday:'long'}).format(d);
    const hijri = get('islamic-umalqura');
    const greg = get('gregory');
    return { hijri, greg, label:`${weekday} | ${hijri} هـ | ${greg} م` };
  },

  pNum(val) {
    if (!val) return 0;
    return Number(val.toString().replace(/,/g, '')) || 0;
  },

  fmt(v) { return new Intl.NumberFormat('en-US').format(Math.round(Number(v)||0)); },
  moneyHtml(v) {
    return `<span class="value-with-unit"><span class="riyal-symbol" aria-label="ريال سعودي"><span class="sr-only">⃁</span></span><bdi>${this.fmt(v)}</bdi></span>`;
  },
  percentHtml(v) {
    return `<span class="value-with-unit"><span class="unit">%</span><bdi>${v}</bdi></span>`;
  },
  moneyText(v) { return `⃁ ${this.fmt(v)}`; },
  percentText(v) { return `% ${v}`; },
  displayText(value) {
    return String(value ?? '').replace(/[ \t]*[\u2010-\u2015][ \t]*/g,' ').replace(/(?<=[\u0600-\u06ffA-Za-z])[ \t]+-[ \t]+(?=[\u0600-\u06ffA-Za-z])/g,' ').replace(/(^|\n)[ \t]*-[ \t]+(?=[\u0600-\u06ffA-Za-z])/g,'$1');
  },
  escapeHtml(value) {
    return this.displayText(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
};

window.SHARAKAH_APP=G;
document.addEventListener('DOMContentLoaded', () => G.init());


