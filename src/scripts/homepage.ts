const menuToggle = document.querySelector<HTMLButtonElement>('.mobile-menu-toggle');
const navigation = document.getElementById('home-navigation');
menuToggle?.addEventListener('click', () => {
	const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
	menuToggle.setAttribute('aria-expanded', String(expanded));
	menuToggle.setAttribute('aria-label', expanded ? 'メニューを閉じる' : 'メニューを開く');
	navigation?.classList.toggle('is-open', expanded);
});
document.addEventListener('keydown', (event) => {
	if (event.key !== 'Escape' || menuToggle?.getAttribute('aria-expanded') !== 'true') return;
	menuToggle.setAttribute('aria-expanded', 'false');
	menuToggle.setAttribute('aria-label', 'メニューを開く');
	navigation?.classList.remove('is-open');
	menuToggle.focus();
});

const carousel = document.querySelector<HTMLElement>('.pickup');
const track = document.querySelector<HTMLElement>('.pickup-track');
const items = [...document.querySelectorAll<HTMLElement>('.pickup-item')];
const dots = [...document.querySelectorAll<HTMLButtonElement>('.pickup-dot')];
const playback = document.querySelector<HTMLButtonElement>('.pickup-playback');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentSlide = 0;
let paused = motionPreference.matches;
let pointerInside = false;
let focusInside = false;
const visiblePositions = () => window.matchMedia('(max-width: 767px)').matches ? items.length : Math.max(1, items.length - 4);

const updatePlayback = () => {
	if (!playback) return;
	playback.textContent = paused ? '▶' : 'Ⅱ';
	playback.setAttribute('aria-label', paused ? 'ピックアップの自動送りを開始' : 'ピックアップの自動送りを停止');
	playback.setAttribute('aria-pressed', String(paused));
};
const selectSlide = (slide: number) => {
	if (!track || !items.length) return;
	const positions = visiblePositions();
	currentSlide = (slide + positions) % positions;
	const target = items[currentSlide];
	const mobile = window.matchMedia('(max-width: 767px)').matches;
	const offset = mobile
		? target.offsetLeft - track.offsetLeft - (track.clientWidth - target.clientWidth) / 2
		: target.offsetLeft - items[0].offsetLeft;
	track.scrollTo({ left: offset, behavior: motionPreference.matches ? 'instant' : 'smooth' });
	dots.forEach((dot, index) => {
		dot.hidden = index >= positions;
		dot.classList.toggle('active', index === currentSlide);
		dot.setAttribute('aria-pressed', String(index === currentSlide));
	});
};
dots.forEach((dot) => dot.addEventListener('click', () => selectSlide(Number(dot.dataset.slide))));
document.querySelector('.pickup-arrow.previous')?.addEventListener('click', () => selectSlide(currentSlide - 1));
document.querySelector('.pickup-arrow.next')?.addEventListener('click', () => selectSlide(currentSlide + 1));
playback?.addEventListener('click', () => { paused = !paused; updatePlayback(); });
carousel?.addEventListener('pointerenter', () => { pointerInside = true; });
carousel?.addEventListener('pointerleave', () => { pointerInside = false; });
carousel?.addEventListener('focusin', () => { focusInside = true; });
carousel?.addEventListener('focusout', (event) => { focusInside = carousel.contains(event.relatedTarget as Node | null); });
motionPreference.addEventListener('change', () => { if (motionPreference.matches) paused = true; updatePlayback(); });
window.addEventListener('resize', () => selectSlide(currentSlide));
window.setInterval(() => { if (!paused && !pointerInside && !focusInside && !document.hidden) selectSlide(currentSlide + 1); }, 6000);
updatePlayback();
// On narrow screens start with neighbours on both sides, like the reference strip.
selectSlide(window.matchMedia('(max-width: 767px)').matches ? 1 : 0);
