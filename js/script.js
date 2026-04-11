
(function () {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    const closeBtn = document.getElementById('closeMobileMenu');
    const hamburger = toggleBtn ? toggleBtn.querySelector('.hamburger') : null;

    function openMenu() {
        mobileMenu.classList.add('active');
        overlay.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', openMenu);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    const mobileLinks = document.querySelectorAll('.nav-mobile-links a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            closeMenu();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
})();
function processImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const apply = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        canvas.style.objectFit = "contain";

        canvas.className = img.className;

        for (let i = 0; i < img.attributes.length; i++) {
            const attr = img.attributes[i];
            if (attr.name.startsWith('data-')) {
                canvas.setAttribute(attr.name, attr.value);
            }
        }

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            const luminance = (max + min) / 2;

            const isGreenDominant = g > r * 1.3 && g > b * 1.3 && g > 80;

            const isLightColor = luminance > 180 && saturation < 0.3;

            const isBrightColor = luminance > 180 && saturation > 0.5;

            if (isLightColor) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            } else if (isBrightColor && !isGreenDominant) {
                const darkenFactor = 0.3;
                data[i] = Math.floor(r * darkenFactor);
                data[i + 1] = Math.floor(g * darkenFactor);
                data[i + 2] = Math.floor(b * darkenFactor);
            }
        }

        ctx.putImageData(imageData, 0, 0);

        img.parentNode.replaceChild(canvas, img);
    };

    if (img.complete && img.naturalWidth > 0) {
        apply();
    } else {
        img.onload = apply;
    }
}

function applyImageProcessing() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const logoContainers = document.querySelectorAll('.project-card.invert-on-light .project-img');

    if (currentTheme === 'light') {
        logoContainers.forEach(container => {
            const img = container.querySelector('img');
            if (img && !img.dataset.processed) {
                img.dataset.originalSrc = img.src;
                processImage(img);
                img.dataset.processed = 'true';
            }
        });
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    const slider = document.querySelector('.theme-toggle-slider');
    slider.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
    updateCanvasTheme(newTheme);

    location.reload();
}

function updateCanvasTheme(theme) {
    if (window.heroUniforms) {
        const isDark = theme === 'dark';
        const bgColor = isDark ? [0.0, 0.0, 0.0] : [1.0, 1.0, 1.0];
        const lineColor = isDark ? [1.0, 1.0, 1.0] : [0.3, 0.8, 1.0];
        window.heroUniforms.setBg(bgColor);
        window.heroUniforms.setLine(lineColor);
    }
}

function initHeroCanvas(initialTheme) {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const vsSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
    `;

    const fsSource = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor;

    float sineNoise(vec2 p) {
        return sin(p.x) * cos(p.y);
    }

    float multiFlow(vec2 p) {
        float t = time * 0.1;
        float flow = 0.0;
        flow += 0.5 * sineNoise(p + vec2(t, 0.0));
        flow += 0.25 * sineNoise(p * 1.8 - vec2(0.0, t * 1.2));
        flow += 0.15 * sineNoise(p * 3.5 + vec2(t * 0.7, t * 0.4));
        flow += 0.10 * sineNoise(p * 6.0 - vec2(t * 0.9, t * 1.5));
        return flow;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= resolution.x / resolution.y;
        vec2 p = uv * 2.5;
        float flow = multiFlow(p);
        p.y += flow * 0.20;
        float curve = sin(p.x * 2.2 + time * 0.5) * 0.17;
        float dist = abs(p.y - curve);
        float core = exp(-dist * 32.0);
        float glow = exp(-dist * 9.0) * 0.6;
        float intensity = core + glow;
        float edgeFade = smoothstep(1.3, 0.1, abs(uv.x));
        intensity *= edgeFade;
        float vFade = smoothstep(1.0, 0.7, abs(uv.y));
        intensity *= vFade;

        vec3 color = mix(u_bgColor, u_lineColor, intensity);
        gl_FragColor = vec4(color, 1.0);
    }
    `;

    function createShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(prog, 'time');
    const resLoc = gl.getUniformLocation(prog, 'resolution');
    const bgLoc = gl.getUniformLocation(prog, 'u_bgColor');
    const lineLoc = gl.getUniformLocation(prog, 'u_lineColor');

    const isDark = initialTheme === 'dark';
    const bgVal = isDark ? [0.0, 0.0, 0.0] : [1.0, 1.0, 1.0];
    const lineVal = isDark ? [1.0, 1.0, 1.0] : [0.3, 0.8, 1.0];

    gl.uniform3fv(bgLoc, bgVal);
    gl.uniform3fv(lineLoc, lineVal);

    window.heroUniforms = {
        setBg: (v) => gl.uniform3fv(bgLoc, v),
        setLine: (v) => gl.uniform3fv(lineLoc, v)
    };

    function render(t) {
        gl.uniform1f(timeLoc, t * 0.001);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    const slider = document.querySelector('.theme-toggle-slider');
    slider.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    initHeroCanvas(savedTheme);

    if (savedTheme === 'light') {
        setTimeout(() => {
            applyImageProcessing();
        }, 100);
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, observerOptions);
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

document.querySelectorAll('[data-comparison]').forEach(container => {
    const handle = container.querySelector('.ba-slider-handle');
    const beforeDiv = container.querySelector('.ba-preview-before');
    let isDragging = false;
    const updateSlider = (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        handle.style.left = percentage + '%';
        beforeDiv.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    };
    const startDrag = (e) => { isDragging = true; updateSlider(e); };
    const stopDrag = () => { isDragging = false; };
    const drag = (e) => { if (!isDragging) return; e.preventDefault(); updateSlider(e); };
    container.addEventListener('mousedown', startDrag);
    container.addEventListener('touchstart', startDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
});


const skillBarsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-bar-fill').forEach(fill => {
                const pct = fill.style.getPropertyValue('--percentage');
                fill.style.width = pct;
            });
            skillBarsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.skill-bar-group').forEach(group => {
    group.querySelectorAll('.skill-bar-fill').forEach(fill => fill.style.width = '0%');
    skillBarsObserver.observe(group);
});

function loadComponent(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

document.getElementById('year').textContent = new Date().getFullYear();