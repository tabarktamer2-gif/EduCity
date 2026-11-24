const $ = (id) => document.getElementById(id);
const buildings = window.EDUCITY_DATA || [];
let student = '', points = 0, completed = new Set(), currentBuilding = null;
let roundQuestions = [], questionIndex = 0, hearts = 3, roundPoints = 0, answered = false;
let finalQuestions = [], finalIndex = 0, finalCorrect = 0, finalHearts = 3;

function showScreen(id) {
  ['welcomeScreen','cityScreen','buildingScreen','finalScreen','victoryScreen'].forEach(s => $(s).classList.toggle('hidden', s !== id));
  window.scrollTo({top:0, behavior:'smooth'});
}
function usedKey(buildingId) { return `educity-used-${student}-${buildingId}`; }
function readUsed(buildingId) {
  try { const data = JSON.parse(localStorage.getItem(usedKey(buildingId)) || '[]'); return Array.isArray(data) ? data : []; }
  catch (_) { return []; }
}
function save() {
  localStorage.setItem('educity-progress', JSON.stringify({student, points, completed:[...completed]}));
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('educity-progress') || 'null');
    if (d) { student = d.student || ''; points = Number(d.points) || 0; completed = new Set(d.completed || []); }
  } catch (_) { /* start with a clean in-memory state */ }
}
function getBuildingProgress(building) {
  if (!building) return {done:0,total:0,pct:0};
  const total = (building.questions || []).length;
  const done = Math.min(readUsed(building.id).length, total);
  return {done,total,pct:total ? Math.round(done/total*100) : 0};
}
function updateBuildingProgress() {
  if (!currentBuilding) return;
  const p = getBuildingProgress(currentBuilding);
  $('buildingProgressLabel').textContent = `إنجاز المبنى: ${p.done} من ${p.total} سؤال (${p.pct}%)`;
  $('buildingProgressBar').style.width = p.pct + '%';
  $('buildingBadge').textContent = completed.has(currentBuilding.id) ? '✨ منطقة مضيئة' : `${p.done}/${p.total} سؤال`;
}
function updateStats() {
  $('totalPoints').textContent = points;
  $('keyCount').textContent = completed.size;
  const pct = Math.round(completed.size / Math.max(buildings.length,1) * 100);
  $('cityProgress').textContent = pct + '%';
  $('cityProgressBar').style.width = pct + '%';
  $('missionCount').textContent = `${completed.size} / ${buildings.length}`;
  $('keysTray').innerHTML = buildings.map(b => `<span class="key-slot ${completed.has(b.id)?'filled':''}" title="${b.title}">${completed.has(b.id)?'🔑':'?'}</span>`).join('');
  $('cityScene').dataset.level = completed.size >= 6 ? 'bright' : completed.size >= 3 ? 'growing' : 'dark';
  const next = buildings.find((b,i) => !completed.has(b.id) && (i===0 || completed.has(buildings[i-1].id)));
  $('missionText').textContent = completed.size === buildings.length ? 'كل المباني أضاءت! البوابة النهائية أصبحت جاهزة.' : next ? `توجه إلى «${next.title}» واجتز تحدياته لتحصل على مفتاح النور.` : 'أكمل المبنى المتاح لفتح المنطقة التالية.';
  $('guideMessage').textContent = completed.size === buildings.length ? 'يا لها من رحلة رائعة! البوابة تنتظرك. اضغط عليها لنخوض التحدي الأخير.' : 'كل إجابة صحيحة بتضيف نور للمدينة. ولو أخطأت، مفيش مشكلة… حاول مرة تانية!';
  $('gateLocked').classList.toggle('hidden', completed.size === buildings.length);
  $('openGateBtn').classList.toggle('hidden', completed.size !== buildings.length);
}
function renderCity() {
  $('helloStudent').textContent = `مرحبًا يا ${student}، المدينة مستنياك تكمل المهمة!`;
  $('buildingGrid').innerHTML = buildings.map((b,i) => {
    const done = completed.has(b.id), unlocked = i===0 || completed.has(buildings[i-1].id), p = getBuildingProgress(b);
    const state = done ? 'completed' : unlocked ? 'available' : 'locked';
    return `<button class="building-card ${state}" ${unlocked?'':'disabled'} data-building="${b.id}" aria-label="${b.title}">
      <span class="building-status">${done?'✅':unlocked?'✨':'🔒'}</span><span class="building-icon">${b.icon}</span>
      <strong>${b.title}</strong><small>${done?'اكتمل وأضاء':unlocked?`تقدم ${p.pct}% · ${p.done}/${p.total}`:'أكمل المنطقة السابقة'}</small>
      <span class="mini-progress"><i style="width:${p.pct}%"></i></span><span class="building-enter">${done?'إعادة الاستكشاف':unlocked?'ادخل المنطقة':'مغلق'}</span></button>`;
  }).join('');
  document.querySelectorAll('[data-building]').forEach(btn => btn.addEventListener('click', () => openBuilding(Number(btn.dataset.building))));
  updateStats(); showScreen('cityScreen');
}
function openBuilding(id) {
  currentBuilding = buildings.find(b => Number(b.id) === Number(id));
  if (!currentBuilding) return;
  roundQuestions=[]; questionIndex=0; hearts=3; roundPoints=0; answered=false;
  $('buildingEmoji').textContent = currentBuilding.icon;
  $('buildingTitle').textContent = currentBuilding.title;
  $('buildingSubtitle').textContent = currentBuilding.short;
  $('summaryContent').textContent = currentBuilding.summary;
  $('buildingGuide').textContent = completed.has(currentBuilding.id) ? 'هذه المنطقة أضاءت بالفعل! يمكنك مراجعة الملخص وإعادة حل الأسئلة للتدريب.' : 'اقرأ الملخص بهدوء، وبعدها ادخل غرفة التحدي. كل سؤال تحله صح يقرّبك من مفتاح المنطقة.';
  updateBuildingProgress();
  $('summaryPanel').classList.remove('hidden'); $('challengePanel').classList.add('hidden');
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active',t.dataset.tab==='summary'));
  showScreen('buildingScreen');
}
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  const challenge = tab.dataset.tab === 'challenge';
  $('summaryPanel').classList.toggle('hidden',challenge); $('challengePanel').classList.toggle('hidden',!challenge);
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active',t===tab));
  if (challenge && !roundQuestions.length) startRound();
}));
$('goChallenge').addEventListener('click', () => document.querySelector('[data-tab="challenge"]').click());
$('backToCity').addEventListener('click', renderCity);
function shuffle(arr) { return [...arr].sort(() => Math.random()-.5); }
function startRound() {
  const bank = currentBuilding.questions || [];
  if (!bank.length) {
    $('questionArea').innerHTML = '<div class="question-text">لا توجد أسئلة مضافة لهذه المنطقة.</div>';
    $('questionCounter').textContent = 'بانتظار الأسئلة'; return;
  }
  const used = readUsed(currentBuilding.id);
  const available = bank.filter(q => !used.includes(q.id));
  if (!available.length) { completeBuilding(); return; }
  roundQuestions = shuffle(available).slice(0,5); questionIndex=0; hearts=3; roundPoints=0; answered=false;
  $('roundScore').textContent = '0 نقطة'; renderQuestion();
}
function renderQuestion() {
  const q = roundQuestions[questionIndex]; if (!q) return;
  answered=false; $('feedback').classList.add('hidden'); $('nextQuestion').classList.add('hidden');
  $('questionCounter').textContent = `السؤال ${questionIndex+1} من ${roundQuestions.length}`;
  $('roundScore').textContent = `${roundPoints} نقطة`;
  $('roundProgress').style.width = `${questionIndex/roundQuestions.length*100}%`;
  $('hearts').textContent = '❤️ '.repeat(hearts)+'🖤 '.repeat(3-hearts);
  $('questionArea').innerHTML = `<div class="question-card-pop"><div class="question-number">التحدي ${questionIndex+1}</div><div class="question-text">${q.question}</div><div class="answers">${q.options.map((o,i)=>`<button class="answer-btn" data-answer="${i}">${o}</button>`).join('')}</div></div>`;
  document.querySelectorAll('[data-answer]').forEach(btn => btn.addEventListener('click', () => answerQuestion(Number(btn.dataset.answer),q)));
}
function answerQuestion(index,q) {
  if (answered) return; answered=true;
  const chosen=q.options[index], correct=chosen===q.answer;
  document.querySelectorAll('[data-answer]').forEach((btn,i) => {
    btn.disabled=true; if (q.options[i]===q.answer) btn.classList.add('correct');
    if (i===index && !correct) btn.classList.add('wrong');
  });
  if (correct) {
    const used=readUsed(currentBuilding.id);
    if (!used.includes(q.id)) { used.push(q.id); localStorage.setItem(usedKey(currentBuilding.id),JSON.stringify(used)); }
    roundPoints+=10; points+=10;
    $('feedback').textContent='إجابة صحيحة! شعاع نور جديد وصل للمدينة ✨ '+(q.explanation||'');
    $('feedback').className='feedback success';
  } else {
    hearts--;
    $('feedback').textContent='مش مشكلة يا بطل! الإجابة الصحيحة: '+q.answer+'. '+(q.explanation||'حاول تركز في المرة الجاية.');
    $('feedback').className='feedback bad';
  }
  updateBuildingProgress(); $('feedback').classList.remove('hidden');
  $('hearts').textContent='❤️ '.repeat(hearts)+'🖤 '.repeat(3-hearts);
  $('roundScore').textContent=`${roundPoints} نقطة`;
  if (hearts<=0) {
    $('nextQuestion').textContent='استعد وحاول من جديد ↻';
    $('nextQuestion').onclick=()=>{roundQuestions=[];startRound();};
  } else {
    $('nextQuestion').textContent=questionIndex===roundQuestions.length-1?'إنهاء الجولة':'السؤال التالي ←';
    $('nextQuestion').onclick=advanceQuestion;
  }
  $('nextQuestion').classList.remove('hidden'); save();
}
function advanceQuestion() {
  questionIndex++;
  if (questionIndex<roundQuestions.length) { renderQuestion(); return; }
  const bank=currentBuilding.questions||[], done=readUsed(currentBuilding.id).length;
  updateBuildingProgress();
  if (done>=bank.length) { completeBuilding(); return; }
  $('questionArea').innerHTML=`<div class="round-complete"><div>🌟</div><h3>جولة رائعة يا ${student}!</h3><p>أنجزت <b>${done}</b> من <b>${bank.length}</b> سؤالًا في هذه المنطقة.</p><p>باقي الأسئلة مستنياك في الجولة التالية. مش لازم تحلهم كلهم صح من أول مرة!</p></div>`;
  $('nextQuestion').textContent='ابدأ الجولة التالية ←'; $('nextQuestion').onclick=()=>{roundQuestions=[];startRound();};
  $('nextQuestion').classList.remove('hidden'); $('roundProgress').style.width='100%';
}
function completeBuilding() {
  if (!completed.has(currentBuilding.id)) { completed.add(currentBuilding.id); points+=20; }
  save(); updateStats();
  $('questionArea').innerHTML=`<div class="building-complete"><div class="unlock-burst">🔑</div><h3>المبنى أضاء من جديد!</h3><p>أحسنت! أكملت كل أسئلة «${currentBuilding.title}» وحصلت على مفتاح المعرفة.</p></div>`;
  $('feedback').classList.add('hidden'); $('nextQuestion').textContent=completed.size===buildings.length?'افتح بوابة النور ✨':'العودة إلى المدينة';
  $('nextQuestion').classList.remove('hidden'); $('nextQuestion').onclick=()=>{roundQuestions=[];if(completed.size===buildings.length)openFinal();else renderCity();};
  $('hearts').textContent='🔑'; $('questionCounter').textContent='منطقة مكتملة'; $('roundProgress').style.width='100%';
}
function openFinal() {
  const supplied=window.EDUCITY_FINAL_QUESTIONS||[];
  if (supplied.length!==10) { alert('تعذر بدء الاختبار النهائي: بنك الأسئلة غير مكتمل.');renderCity();return; }
  finalQuestions=shuffle(supplied); finalIndex=0; finalCorrect=0; finalHearts=3;
  renderFinalQuestion(); showScreen('finalScreen');
}
function renderFinalQuestion() {
  const q=finalQuestions[finalIndex]; $('finalFeedback').classList.add('hidden'); $('nextFinal').classList.add('hidden');
  $('finalQuestionArea').innerHTML=`<div class="question-progress"><span>السؤال ${finalIndex+1} من 10</span><span>❤️ ${finalHearts}</span></div><div class="progress-track"><i style="width:${finalIndex*10}%"></i></div><h3 class="question-text">${q.question}</h3><div class="answers">${q.options.map((o,i)=>`<button class="answer-btn" data-final="${i}">${o}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-final]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-final]').forEach(b=>b.disabled=true);
    const ok=q.options[Number(btn.dataset.final)]===q.answer;
    if(ok){finalCorrect++;points+=10;btn.classList.add('correct');$('finalFeedback').textContent='إجابة صحيحة! البوابة تزداد نورًا ✨';}
    else{finalHearts--;btn.classList.add('wrong');$('finalFeedback').textContent='الإجابة الصحيحة: '+q.answer;}
    $('finalFeedback').className='feedback '+(ok?'success':'bad');$('finalFeedback').classList.remove('hidden');
    $('nextFinal').classList.remove('hidden');$('nextFinal').textContent=finalIndex===9?'إظهار نتيجة المهمة':'السؤال التالي ←';save();
  }));
}
$('nextFinal').addEventListener('click',()=>{
  finalIndex++;
  if(finalIndex<10) renderFinalQuestion();
  else {
    showScreen('victoryScreen');$('finalPoints').textContent=points;$('finalCorrectStat').textContent=`${finalCorrect}/10`;
    $('victoryMessage').textContent=`أحسنت يا ${student}! أنهيت الرحلة وأجبت عن ${finalCorrect} من 10 أسئلة في الاختبار النهائي.`;
  }
});
$('openGateBtn').addEventListener('click',openFinal);
$('startBtn').addEventListener('click',()=>{
  const name=$('studentName').value.trim();
  if(!name){$('studentName').focus();$('studentName').classList.add('input-error');$('studentName').placeholder='اكتب اسمك عشان نبدأ المغامرة';return;}
  $('studentName').classList.remove('input-error');
  if(student && student!==name) { student=name; points=0; completed=new Set(); }
  else student=name;
  save();renderCity();
});
$('studentName').addEventListener('input',()=> $('studentName').classList.remove('input-error'));
$('restartBtn').addEventListener('click',()=>{
  const prefix=`educity-used-${student}-`;
  Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));
  localStorage.removeItem('educity-progress');location.reload();
});
load();
if(student) $('studentName').value=student;
