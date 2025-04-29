/* Slider */
const slider = document.querySelector('.slider');
const slides = slider.querySelectorAll('img');
const arrowLeft = document.querySelector('.slider-arrow-left');
const arrowRight = document.querySelector('.slider-arrow-right');
const dots = document.querySelectorAll('.slider-dot');
let currentSlide = 0;
let interval;

function showSlide(index) {
	slides.forEach(slide => slide.style.transform = `translateX(-${index * 100}%)`);
	dots.forEach(dot => dot.classList.remove('active'));
	dots[index].classList.add('active');
	currentSlide = index;
}

function nextSlide() {
	currentSlide++;
	if (currentSlide >= slides.length) {
		currentSlide = 0;
	}
	showSlide(currentSlide);
}

function prevSlide() {
	currentSlide--;
	if (currentSlide < 0) {
		currentSlide = slides.length - 1;
	}
	showSlide(currentSlide);
}

function startInterval() {
	interval = setInterval(() => {
		nextSlide();
	}, 5000);
}

function stopInterval() {
	clearInterval(interval);
}

arrowLeft.addEventListener('click', () => {
	stopInterval();
	prevSlide();
	startInterval();
});

arrowRight.addEventListener('click', () => {
	stopInterval();
	nextSlide();
	startInterval();
});

dots.forEach((dot, index) => {
	dot.addEventListener('click', () => {
		stopInterval();
		showSlide(index);
		startInterval();
	});
});

slider.addEventListener('mouseenter', () => {
	arrowLeft.style.display = 'block';
	arrowRight.style.display = 'block';
});

slider.addEventListener('mouseleave', () => {
	arrowLeft.style.display = 'none';
	arrowRight.style.display = 'none';
});

startInterval();

/* Tabs */
const tabLinks = document.querySelectorAll('.tab-link');
const tabs = document.querySelectorAll('.tab');

function showTab(tab) {
	tabs.forEach(tab => tab.classList.remove('active'));
	tab.classList.add('active');
}

tabLinks.forEach(link => {
	link.addEventListener('click', () => {
		const tab = document.querySelector(`.tab.${link.dataset.tab}`);
		showTab(tab);
		tabLinks.forEach(link => link.classList.remove('active'));
		link.classList.add('active');
	});
});