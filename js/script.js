
// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    const slider = document.querySelector('.theme-toggle-slider');
    slider.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
    updateCanvasTheme(newTheme);
}

// Update canvas colors based on theme
function updateCanvasTheme(theme) {
    if (window.heroUniforms) {
        const isDark = theme === 'dark';
        const bgColor = isDark ? [0.0, 0.0, 0.0] : [1.0, 1.0, 1.0]; // Black for dark, white for light
        const lineColor = isDark ? [1.0, 1.0, 1.0] : [0.3, 0.8, 1.0]; // White for dark, cyan for light
        window.heroUniforms.setBg(bgColor);
        window.heroUniforms.setLine(lineColor);
    }
}

// Initialize WebGL Canvas Background for Hero
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

// Load saved theme and init
// Load saved theme and init
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // 👈 default is now dark
    document.body.setAttribute('data-theme', savedTheme);

    const slider = document.querySelector('.theme-toggle-slider');
    slider.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    initHeroCanvas(savedTheme);
});
// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Scroll animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, observerOptions);
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// Before/After slider functionality
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

// Animate skill bars on scroll
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
