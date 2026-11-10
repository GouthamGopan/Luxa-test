'use strict';

/**
 * LUXA Homes / The Grove
 * All imagery is extracted from the supplied LUXA brochure.
 * Contact email intentionally left blank until the studio provides an official address.
 */
const CONTACT_EMAIL = 'alenkurunthodath@gmail.com'; // TODO: Add an official recipient, e.g. 'studio@your-domain.com'.
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const villas = {
  courtyard: {
    id: 'courtyard',
    label: 'TYPOLOGY 01',
    titleHTML: 'Courtyard <em>Houses</em>',
    name: 'COURTYARD HOUSES',
    exterior: 'assets/courtyard-exterior-clean.webp',
    exteriorAlt: 'Exterior render of a Courtyard House surrounded by tropical planting',
    description: 'A private courtyard, open from the living area. Light, air and greenery within the walls.',
    plans: {
      ground: 'assets/plan-courtyard-ground.webp',
      first: 'assets/plan-courtyard-first.webp',
    },
    rooms: [
      { image: 'assets/living-interior.webp', title: 'The <em>living space.</em>', text: 'A calm, generous room where natural light meets the garden.' },
      { image: 'assets/dining-interior.webp', title: 'Moments <em>together.</em>', text: 'An everyday ritual, beautifully framed by warm materials and greenery.' },
      { image: 'assets/courtyard-clean.webp', title: 'Your private <em>courtyard.</em>', text: 'A place to step outside, without leaving home.' },
    ],
  },
  garden: {
    id: 'garden',
    label: 'TYPOLOGY 03',
    titleHTML: 'Garden-Wrap <em>Houses</em>',
    name: 'GARDEN-WRAP HOUSES',
    exterior: 'assets/garden-exterior.webp',
    exteriorAlt: 'Exterior render of a Garden-Wrap villa with a curved balcony and garden',
    description: 'A home that wraps around its garden. Sit-out, dining and balcony frame the green on two sides.',
    plans: {
      ground: 'assets/plan-garden-ground.webp',
      first: 'assets/plan-garden-first.webp',
    },
    // The brochure doesn't map interior photographs to individual villa units.
    // Lifestyle images below are illustrative project imagery, not definitive unit interiors.
    rooms: [
      { image: 'assets/living-interior.webp', title: 'Life in <em>the green.</em>', text: 'Warm interiors and generous openings bring the landscape closer.' },
      { image: 'assets/dining-interior.webp', title: 'A slower <em>everyday.</em>', text: 'Space for conversations, family meals and unhurried mornings.' },
      { image: 'assets/garden-lifestyle.webp', title: 'The garden, <em>all around.</em>', text: 'A generous outdoor setting for fresh air and togetherness.' },
    ],
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const home = $('#home-view');
const grove = $('#grove-view');
const header = $('#site-header');
const tour = $('#interior-tour');
const lightbox = $('#image-lightbox');
let activeVillaId = null;
let activeFloor = 'ground';
let activeRoom = 0;
let activeTourImage = 0;
let prevFocused = null;
let toastTimer;
let closingTourTimer;

function notice(message, ms = 4200) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function scrollToElement(el) { if (el) el.scrollIntoView({ behavior: REDUCED_MOTION ? 'instant' : 'smooth', block: 'start' }); }
function isProjectHash(hash = location.hash) { return ['#grove','#residences','#villa-explorer'].includes(hash); }
function syncHeader() { header.classList.toggle('scrolled', window.scrollY > 30); header.classList.toggle('project-header', !grove.hidden); }
function setMenu(open) {
  $('#mobile-menu').hidden = !open;
  header.classList.toggle('menu-open', open);
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

function openGrove(pushHash = true) {
  setMenu(false);
  if (pushHash && location.hash !== '#grove') { location.hash = 'grove'; return; }
  if (grove.hidden) {
    home.hidden = true; grove.hidden = false;
    window.scrollTo({top: 0, behavior: 'instant'});
    document.title = 'The Grove — Explore Villas | LUXA Homes';
    revealVisible();
  }
  syncHeader();
}
function openHome(target = 'home', pushHash = true) {
  setMenu(false);
  if (pushHash && location.hash !== `#${target}`) { location.hash = target; return; }
  if (!grove.hidden) { grove.hidden = true; home.hidden = false; document.title = 'LUXA Homes — Luxury Rooted in Nature'; }
  syncHeader();
  if (target !== 'home') requestAnimationFrame(() => scrollToElement(document.getElementById(target)));
  else if (location.hash === '#home') window.scrollTo({top:0,behavior: REDUCED_MOTION ? 'instant' : 'smooth'});
  revealVisible();
}
function handleRoute() {
  const target = location.hash.replace('#','');
  if (isProjectHash()) {
    openGrove(false);
    if (target !== 'grove') requestAnimationFrame(() => scrollToElement(document.getElementById(target)));
  } else openHome(target || 'home', false);
}
$$('[data-open-project]').forEach(button => button.addEventListener('click', () => openGrove()));
$$('[data-close-project]').forEach(button => button.addEventListener('click', () => openHome('projects')));
$$('[data-home-link]').forEach(link => link.addEventListener('click', (event) => {
  if (!grove.hidden) { event.preventDefault(); openHome('home'); }
}));
$$('[data-nav]').forEach(link => link.addEventListener('click', (event) => {
  setMenu(false);
  if (!grove.hidden) { event.preventDefault(); openHome(link.dataset.nav); }
}));
$$('[data-to-contact]').forEach(button => button.addEventListener('click', () => openHome('contact')));
$$('[data-project-scroll]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); scrollToElement($('#residences'));
}));
$('#menu-toggle').addEventListener('click', () => setMenu($('#mobile-menu').hidden));
window.addEventListener('hashchange', handleRoute);
window.addEventListener('scroll', syncHeader, {passive: true});

// Select a residence. The app waits for the user's explicit choice and never auto-enters the villa.
function selectVilla(id) {
  const v = villas[id];
  if (!v) return;
  activeVillaId = id;
  activeFloor = 'ground';
  $$('[data-select-villa]').forEach(button => {
    const selected = button.dataset.selectVilla === id;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('#explorer-empty').hidden = true;
  $('#explorer-selected').hidden = false;
  $('#explorer-type').textContent = v.label;
  $('#explorer-name').innerHTML = v.titleHTML;
  $('#exterior-image').src = v.exterior;
  $('#exterior-image').alt = v.exteriorAlt;
  $('#plan-description').textContent = v.description;
  $('#plan-typology').textContent = v.name;
  setFloor('ground', false);
  $('#villa-explorer').scrollIntoView({behavior: REDUCED_MOTION ? 'instant' : 'smooth', block:'start'});
}
$$('[data-select-villa]').forEach(button => button.addEventListener('click', () => selectVilla(button.dataset.selectVilla)));
$('#change-villa').addEventListener('click', () => scrollToElement($('#residences')));
function setFloor(floor, animate = true) {
  if (!activeVillaId || !['ground','first'].includes(floor)) return;
  activeFloor = floor;
  const v = villas[activeVillaId];
  const image = $('#plan-image');
  $$('[data-floor]').forEach(button => {
    const active = button.dataset.floor === floor;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#floor-label').textContent = floor === 'ground' ? 'GROUND FLOOR' : 'FIRST FLOOR';
  const next = v.plans[floor];
  if (animate && !REDUCED_MOTION) {
    image.classList.add('is-switching');
    setTimeout(() => { image.src = next; image.alt = `${v.name} ${floor} floor plan`; image.classList.remove('is-switching'); }, 180);
  } else { image.src = next; image.alt = `${v.name} ${floor} floor plan`; }
}
$$('[data-floor]').forEach(button => button.addEventListener('click', () => setFloor(button.dataset.floor)));

// Cinematic tour overlay: the selected building is the entry point to the project imagery.
function enterTour(event) {
  if (!activeVillaId) { notice('Select a villa first to explore inside.'); return; }
  clearTimeout(closingTourTimer);
  prevFocused = document.activeElement;
  const x = event?.clientX ? `${(event.clientX/window.innerWidth)*100}%` : '50%';
  const y = event?.clientY ? `${(event.clientY/window.innerHeight)*100}%` : '50%';
  tour.style.setProperty('--portal-x', x);
  tour.style.setProperty('--portal-y', y);
  activeRoom = 0; activeTourImage = 0;
  $('#tour-image-a').src = villas[activeVillaId].rooms[0].image;
  $('#tour-image-a').classList.add('active');
  $('#tour-image-b').classList.remove('active');
  $('#tour-villa-name').textContent = villas[activeVillaId].name;
  renderRoomText();
  tour.hidden = false;
  document.body.classList.add('lock-scroll');
  requestAnimationFrame(() => requestAnimationFrame(() => tour.classList.add('open')));
  setTimeout(() => $('#tour-close').focus({preventScroll:true}), REDUCED_MOTION ? 0 : 400);
}
function renderRoomText() {
  const scene = villas[activeVillaId].rooms[activeRoom];
  $('#tour-room-title').innerHTML = scene.title;
  $('#tour-room-text').textContent = scene.text;
  $$('[data-room]').forEach((button, i) => {
    const active = Number(button.dataset.room) === activeRoom;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
function switchRoom(room) {
  if (!activeVillaId) return;
  const next = ((room % 3) + 3) % 3;
  if (next === activeRoom) return;
  activeRoom = next;
  activeTourImage = 1 - activeTourImage;
  const incoming = $(`#tour-image-${activeTourImage === 0 ? 'a' : 'b'}`);
  const outgoing = $(`#tour-image-${activeTourImage === 0 ? 'b' : 'a'}`);
  incoming.src = villas[activeVillaId].rooms[activeRoom].image;
  incoming.alt = `Brochure illustration of ${['living space','dining space','outdoor space'][activeRoom]}`;
  incoming.classList.add('active');
  outgoing.classList.remove('active');
  renderRoomText();
}
function closeTour() {
  if (tour.hidden) return;
  tour.classList.remove('open');
  document.body.classList.remove('lock-scroll');
  closingTourTimer = setTimeout(() => { tour.hidden = true; tour.querySelectorAll('.tour-image').forEach(img => img.classList.remove('active')); prevFocused?.focus?.({preventScroll:true}); }, REDUCED_MOTION ? 0 : 1080);
}
$('#enter-villa').addEventListener('click', enterTour);
$('#plan-enter').addEventListener('click', enterTour);
$('#tour-close').addEventListener('click', closeTour);
$('#tour-prev').addEventListener('click', () => switchRoom(activeRoom - 1));
$('#tour-next').addEventListener('click', () => switchRoom(activeRoom + 1));
$$('[data-room]').forEach(btn => btn.addEventListener('click', () => switchRoom(Number(btn.dataset.room))));

function openLightbox(src, alt) {
  prevFocused = document.activeElement;
  $('#lightbox-image').src = src;
  $('#lightbox-image').alt = alt;
  $('#lightbox-caption').textContent = alt.toUpperCase() + ' · LUXA HOMES BROCHURE';
  lightbox.hidden = false;
  document.body.classList.add('lock-scroll');
  $('#lightbox-close').focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  if (tour.hidden) document.body.classList.remove('lock-scroll');
  prevFocused?.focus?.({preventScroll:true});
}
$('#open-masterplan').addEventListener('click', () => openLightbox('assets/masterplan.webp','The Grove overall site master plan'));
$('#enlarge-plan').addEventListener('click', () => {
  if (!activeVillaId) return;
  openLightbox(villas[activeVillaId].plans[activeFloor], `${villas[activeVillaId].name} ${activeFloor} floor plan`);
});
$('#lightbox-close').addEventListener('click',closeLightbox);
lightbox.addEventListener('click',event => { if (event.target === lightbox) closeLightbox(); });

// Keyboard controls and simple focus trapping for the immersive overlays.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!lightbox.hidden) closeLightbox();
    else if (!tour.hidden) closeTour();
    else if (!$('#mobile-menu').hidden) setMenu(false);
  }
  if (!tour.hidden && lightbox.hidden) {
    if (event.key === 'ArrowRight') switchRoom(activeRoom+1);
    if (event.key === 'ArrowLeft') switchRoom(activeRoom-1);
  }
  const modal = !lightbox.hidden ? lightbox : !tour.hidden ? tour : null;
  if (modal && event.key === 'Tab') {
    const tabbable = [...modal.querySelectorAll('button:not([disabled])')];
    if (!tabbable.length) return;
    const first=tabbable[0],last=tabbable[tabbable.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

const form = $('#enquiry-form');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const subject = `LUXA Homes enquiry — ${data.interest}`;
  const body = `Name: ${data.name}\nEmail: ${data.email}\nInterested in: ${data.interest}\n\nMessage:\n${data.message || 'Please contact me with more details.'}`;
  if (CONTACT_EMAIL.trim()) {
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#form-feedback').textContent = 'Your email application should open with the enquiry prepared. Please send it from there.';
    notice('Your email draft is ready. Please review and send it in your email app.');
  } else {
    let copied = false;
    try { await navigator.clipboard.writeText(`${subject}\n\n${body}`); copied = true; } catch (e) {
      // Fallback for direct file:// previews or browsers without Clipboard API access.
      const helper = document.createElement('textarea');
      helper.value = `${subject}\n\n${body}`;
      helper.style.position='fixed';helper.style.opacity='0';document.body.appendChild(helper);helper.select();
      try { copied = document.execCommand('copy'); } catch (_) { /* noop */ }
      helper.remove();
    }
    
  }
});

// Progressive scroll reveal; keep content visible for older browsers.
let observer;
if ('IntersectionObserver' in window && !REDUCED_MOTION) {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting){entry.target.classList.add('visible'); observer.unobserve(entry.target);} });
  }, { threshold: .09, rootMargin: '0px 0px -20px 0px' });
  $$('.reveal').forEach(el => observer.observe(el));
} else $$('.reveal').forEach(el => el.classList.add('visible'));
function revealVisible() {
  if (!observer) return;
  $$('.reveal:not(.visible)').forEach(el=>observer.observe(el));
  // Some sections were initially display:none and need the observer to re-check.
}
$('#year').textContent = new Date().getFullYear();
window.addEventListener('load', () => $('#page-loader').classList.add('done'));
// Fallback for loading via a local file or offline browser with a slow image request.
setTimeout(()=>$('#page-loader').classList.add('done'), 1800);
handleRoute();
syncHeader();
