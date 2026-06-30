const orbitReads = {
  restraint: ['Emotion through restraint.', 'You respond most strongly when a film trusts silence, gesture, and implication instead of announcing what to feel.'],
  intimacy: ['Close enough to notice.', 'Small choices, private rituals, and lived-in relationships matter more to you than scale or narrative machinery.'],
  ambiguity: ['Questions can outlive answers.', 'You increasingly reward films that leave moral or emotional interpretation open—when the uncertainty feels earned.'],
  warmth: ['Tender, never naïve.', 'You welcome warmth when it coexists with complexity, imperfection, and the knowledge that care does not solve everything.'],
  patience: ['You let films breathe.', 'Slow pacing is not a virtue by itself, but you give patient films unusual room when observation keeps revealing something new.'],
  discovery: ['Familiar feelings, unfamiliar cinema.', 'You travel widely across countries and eras, especially when a new cinematic language leads back to intimate human questions.']
};

const traitReads = {
  restraint: { title: 'Why “restrained intensity”?', copy: 'Across favourites, quiet or observational films are rated 0.8 stars higher than Maya’s average—and are rewatched nearly twice as often.', bars: [['Quiet tension', 92], ['Understated dialogue', 87], ['Slow emotional reveal', 81]] },
  tenderness: { title: 'Why “tenderness without innocence”?', copy: 'Maya rates emotionally warm films highest when they preserve conflict, consequence, or ambivalence rather than smoothing them away.', bars: [['Warmth with complexity', 91], ['Earned sentiment', 85], ['Moral friction', 76]] },
  space: { title: 'Why “rooms remember”?', copy: 'Reviews and saves repeatedly mention homes, streets, hotels, trains, weather, and architecture as emotional evidence—not visual decoration.', bars: [['Place carries memory', 89], ['Urban solitude', 84], ['Domestic detail', 78]] },
  patience: { title: 'Why “patience for the afterimage”?', copy: 'Open-ended films are more likely to be revisited, discussed, or upgraded later—even when the first rating is cautious.', bars: [['Rewatch lift', 88], ['Delayed rating growth', 79], ['Open endings', 74]] }
};

const emotionReads = {
  longing: ['Longing, held quietly.', 'The centre of Maya’s emotional map: desire shaped by timing, distance, duty, and the lives people almost choose.', ['Romantic restraint', 'Missed timing', 'Memory']],
  repair: ['Repair without erasure.', 'Maya responds to people rebuilding connection while the past remains present—not stories where one speech fixes everything.', ['Family', 'Forgiveness', 'Everyday ritual']],
  solitude: ['Solitude with texture.', 'Quiet aloneness lands when it feels observed rather than aestheticized: work, walking, rooms, trains, and repeated routines.', ['Observation', 'Routine', 'City life']],
  wonder: ['Wonder grounded in care.', 'Maya’s love of animation and magical realism is strongest when imagination expands empathy rather than escaping consequence.', ['Animation', 'Nature', 'Childhood']],
  uncertainty: ['Uncertainty that earns attention.', 'Ambiguous motives and unreliable perspectives have become a rising part of Maya’s taste over the last two years.', ['Mystery', 'Perspective', 'Open endings']],
  dread: ['Dread without spectacle.', 'Psychological pressure works better than gore or volume—especially when fear grows from social roles and ordinary spaces.', ['Social tension', 'Containment', 'Moral risk']],
  belonging: ['Belonging as a practice.', 'Community matters most in films where care is built through work, repetition, food, and small acts rather than grand declarations.', ['Food', 'Neighbourhood', 'Chosen family']]
};

const nodeReads = {
  core: ['Taste core', 'A cinema of distance and attention.', 'The strongest connections join emotional restraint, memory embedded in places, patient observation, and characters whose choices remain ethically complicated.'],
  wong: ['Director · 12 films', 'Wong Kar-wai', 'The most complete expression of Maya’s core: time, longing, colour, repetition, and rooms that seem to remember the people inside them.'],
  sciamma: ['Director · 7 films', 'Céline Sciamma', 'A trusted voice for emotional precision, mutual attention, and intimacy that never reduces its characters to plot functions.'],
  farhadi: ['Director · 6 films', 'Asghar Farhadi', 'The bridge between Maya’s humanism and her growing appetite for moral uncertainty, competing truths, and social consequence.'],
  miyazaki: ['Director · 10 films', 'Hayao Miyazaki', 'An unexpected but durable connection: wonder, labour, domestic detail, environmental attention, and tenderness without passivity.'],
  song: ['Actor · 11 films', 'Song Kang-ho', 'Maya repeatedly responds to performances that can hold humour, ordinariness, shame, and moral compromise at the same time.'],
  space: ['Theme · 44 films', 'Memory in spaces', 'Hotels, apartments, streets, vehicles, and workplaces recur as emotional containers—often carrying what characters cannot articulate.'],
  ambiguity: ['Theme · rising', 'Moral ambiguity', 'One of the profile’s fastest-growing signals. Maya increasingly trusts films that refuse to identify a single clean villain or truth.'],
  observation: ['Style · 52 films', 'Patient observation', 'Long takes and quiet routines work when they produce accumulation: a character becomes legible through what they repeatedly do.']
};

const people = {
  leila: { initial: 'L', name: 'Leila N.', archetype: 'The Luminous Humanist', score: '84%', summary: 'You both trust quiet, intimate films. Leila reaches for more hope; Maya tolerates more ambiguity.', axes: [['Emotional restraint', 'Very close', 92], ['Patience', 'Close', 84], ['Hopefulness', 'Different', 46], ['Genre overlap', 'Moderate', 68]], note: 'whether an unresolved ending feels more honest—or simply withholds emotional closure.' },
  jonah: { initial: 'J', name: 'Jonah R.', archetype: 'The Formalist Romantic', score: '79%', summary: 'You share visual precision and longing. Jonah is more style-led; Maya is more responsive to everyday human detail.', axes: [['Visual form', 'Very close', 90], ['Romantic longing', 'Close', 85], ['Domestic realism', 'Different', 49], ['Era overlap', 'High', 77]], note: 'when style deepens emotion—and when it begins to substitute for it.' },
  anika: { initial: 'A', name: 'Anika P.', archetype: 'The Gentle Observer', score: '76%', summary: 'You both love lived-in tenderness. Anika prefers emotional closure; Maya increasingly values unresolved moral tension.', axes: [['Tenderness', 'Very close', 94], ['Everyday ritual', 'High', 87], ['Ambiguity', 'Different', 42], ['Country overlap', 'Moderate', 63]], note: 'which quiet film felt comforting to one of you and devastating to the other.' },
  theo: { initial: 'T', name: 'Theo M.', archetype: 'The Restless Skeptic', score: '72%', summary: 'Your shared ground is ethical complexity. Theo wants sharper confrontation; Maya prefers tension held beneath the surface.', axes: [['Moral complexity', 'Close', 86], ['Emotional risk', 'High', 82], ['Restraint', 'Different', 51], ['Pacing', 'Different', 44]], note: 'whether confrontation clarifies a film—or flattens its uncertainty.' },
  mei: { initial: 'M', name: 'Mei K.', archetype: 'The Dream Architect', score: '68%', summary: 'You meet in atmosphere and memory. Mei embraces abstraction more readily; Maya needs a stronger human anchor.', axes: [['Atmosphere', 'High', 88], ['Memory', 'High', 81], ['Abstraction', 'Different', 39], ['Narrative clarity', 'Different', 45]], note: 'the point where mystery becomes abstraction—and whether that matters.' },
  omar: { initial: 'O', name: 'Omar S.', archetype: 'The Social Witness', score: '64%', summary: 'You share moral seriousness. Omar is drawn to systems and confrontation; Maya stays closer to private emotional consequence.', axes: [['Ethical stakes', 'High', 84], ['Humanism', 'Close', 79], ['Scale', 'Different', 38], ['Genre overlap', 'Low', 35]], note: 'whether cinema changes minds more through systems—or through one carefully observed life.' }
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const toast = $('#toast');
let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

$$('[data-scroll]').forEach((btn) => btn.addEventListener('click', () => $(btn.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));

$$('.orbit-point').forEach((point) => {
  const activate = () => {
    $$('.orbit-point').forEach((p) => p.classList.remove('is-active'));
    point.classList.add('is-active');
    const [title, copy] = orbitReads[point.dataset.orbit];
    $('#orbitTitle').textContent = title;
    $('#orbitCopy').textContent = copy;
  };
  point.addEventListener('click', activate);
  point.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
});

$$('.trait-row').forEach((row) => {
  const activate = () => {
    const item = traitReads[row.dataset.trait];
    $('#traitEvidenceTitle').textContent = item.title;
    $('#traitEvidenceCopy').textContent = item.copy;
    $('#traitBars').innerHTML = item.bars.map(([name, value]) => `<div><div class="mini-bar__top"><span>${name}</span><span>${value}%</span></div><div class="mini-bar__track"><i class="mini-bar__fill" style="--w:${value}%"></i></div></div>`).join('');
  };
  row.addEventListener('click', activate);
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
});

$$('.bubble').forEach((bubble) => bubble.addEventListener('click', () => {
  $$('.bubble').forEach((item) => item.classList.remove('is-active'));
  bubble.classList.add('is-active');
  const [title, copy, signals] = emotionReads[bubble.dataset.emotion];
  $('#emotionTitle').textContent = title;
  $('#emotionCopy').textContent = copy;
  $('#emotionSignals').innerHTML = signals.map((signal) => `<span class="signal-chip">${signal}</span>`).join('');
}));

$$('.chapter').forEach((chapter) => chapter.addEventListener('click', () => {
  $$('.chapter').forEach((item) => item.classList.remove('is-active'));
  chapter.classList.add('is-active');
}));

$$('.gravity-node').forEach((node) => {
  const activate = () => {
    const key = node.dataset.node;
    $$('.gravity-node').forEach((item) => {
      item.classList.toggle('is-active', item === node);
      item.classList.toggle('is-muted', item !== node && key !== 'core');
    });
    $$('.gravity-link').forEach((link) => link.classList.toggle('is-active', key === 'core' || link.dataset.link === key));
    const [type, title, copy] = nodeReads[key];
    $('#nodeType').textContent = type;
    $('#nodeTitle').textContent = title;
    $('#nodeCopy').textContent = copy;
  };
  node.addEventListener('click', activate);
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
});

function selectPerson(key) {
  const person = people[key];
  if (!person) return;
  $$('.person-dot[data-person]').forEach((dot) => dot.classList.toggle('is-active', dot.dataset.person === key));
  $$('[data-person-select]').forEach((button) => button.classList.toggle('is-active', button.dataset.personSelect === key));
  $('#compareAvatar').textContent = person.initial;
  $('#compareName').textContent = person.name;
  $('#compareArchetype').textContent = person.archetype;
  $('#compareScore').textContent = person.score;
  $('#compareSummary').textContent = person.summary;
  $('#compareAxes').innerHTML = person.axes.map(([label, description, value]) => `<div class="compare-axis"><div class="compare-axis__top"><span>${label}</span><span>${description}</span></div><div class="compare-axis__track"><i class="compare-axis__fill" style="--w:${value}%"></i></div></div>`).join('');
  $('#compareNote').innerHTML = `<strong>Your best conversation:</strong> ${person.note}`;
}

$$('[data-person]').forEach((dot) => dot.addEventListener('click', () => selectPerson(dot.dataset.person)));
$$('[data-person-select]').forEach((button) => button.addEventListener('click', () => selectPerson(button.dataset.personSelect)));

$$('.prompt-card').forEach((card) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.dataset.prompt);
      showToast('Conversation starter copied');
    } catch {
      showToast(card.dataset.prompt);
    }
  };
  card.addEventListener('click', copy);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      copy();
    }
  });
});

const modal = $('#shareModal');
function openShare() {
  modal.classList.add('is-open');
  document.body.classList.add('modal-open');
  $('[data-close-share]').focus();
}
function closeShare() {
  modal.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}
$$('[data-open-share]').forEach((button) => button.addEventListener('click', openShare));
$('[data-close-share]').addEventListener('click', closeShare);
modal.addEventListener('click', (event) => { if (event.target === modal) closeShare(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeShare(); });
$('#copyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('https://feelflick.com/@maya');
    showToast('Public profile link copied');
  } catch {
    showToast('feelflick.com/@maya');
  }
});

$$('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));
$('#followButton')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const following = button.dataset.following === 'true';
  button.dataset.following = String(!following);
  button.textContent = following ? 'Follow Maya' : 'Following';
  showToast(following ? 'Unfollowed Maya' : 'Maya followed');
});
$('#editButton')?.addEventListener('click', () => showToast('Visibility controls opened'));

$$('.segmented button').forEach((button) => button.addEventListener('click', () => {
  $$('.segmented button').forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  document.body.classList.toggle('owner-mode', button.dataset.view === 'owner');
  showToast(button.dataset.view === 'owner' ? 'Owner preview enabled' : 'Visitor preview enabled');
}));

const sections = $$('.section');
const navLinks = $$('.nav-rail a');
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });
sections.forEach((section) => observer.observe(section));
