const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const uiOverlay = document.getElementById('ui-overlay');
const uiTitle = document.getElementById('ui-title');
const uiDesc = document.getElementById('ui-desc');
const startBtn = document.getElementById('start-btn');

let score = 0;
let lives = 3;
let isPlaying = false;
let animationId;
let spawnTimer;

// Ukuran Canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Objek Pemain (Keranjang)
const player = {
    x: 0,
    y: 0,
    width: 80,
    height: 18,
    speed: 7,
    dx: 0
};

// Array Item Jatuh & Partikel Visual
let items = [];
let particles = [];

// Input Kontrol
const keys = {};
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

// Kontrol Sentuh / Mouse Drag
let isDragging = false;
function handleMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    player.x = touchX - player.width / 2;
}

canvas.addEventListener('mousedown', (e) => { isDragging = true; handleMove(e.clientX); });
window.addEventListener('mousemove', (e) => { if (isDragging) handleMove(e.clientX); });
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleMove(e.touches[0].clientX);
}, { passive: true });
window.addEventListener('touchmove', (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
}, { passive: true });
window.addEventListener('touchend', () => { isDragging = false; });

// Tipe Item yang Jatuh
const ITEM_TYPES = [
    { type: 'star', symbol: '⭐', points: 10, speed: 3, weight: 60 },
    { type: 'gold', symbol: '🌟', points: 50, speed: 4.5, weight: 15 },
    { type: 'heart', symbol: '❤️', points: 0, speed: 3.5, weight: 5 },
    { type: 'bomb', symbol: '💣', points: 0, speed: 4, weight: 20 }
];

function getRandomItemType() {
    const totalWeight = ITEM_TYPES.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let item of ITEM_TYPES) {
        if (rand < item.weight) return item;
        rand -= item.weight;
    }
    return ITEM_TYPES[0];
}

function spawnItem() {
    if (!isPlaying) return;
    const itemData = getRandomItemType();
    items.push({
        ...itemData,
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        radius: 16
    });

    const nextSpawn = Math.max(400, 1000 - Math.floor(score / 50) * 50);
    spawnTimer = setTimeout(spawnItem, nextSpawn);
}

// Visual Partikel Efek Kena Item
function addParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            color: color,
            alpha: 1
        });
    }
}

function startGame() {
    score = 0;
    lives = 3;
    items = [];
    particles = [];
    isPlaying = true;

    scoreEl.textContent = score;
    livesEl.textContent = '❤️'.repeat(lives);
    uiOverlay.style.display = 'none';

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 40;

    clearTimeout(spawnTimer);
    spawnItem();
    cancelAnimationFrame(animationId);
    gameLoop();
}

function gameOver() {
    isPlaying = false;
    clearTimeout(spawnTimer);
    uiTitle.textContent = "GAME OVER";
    uiDesc.textContent = `Skor akhir kamu: ${score}`;
    startBtn.textContent = "Main Lagi";
    uiOverlay.style.display = 'flex';
}

function update() {
    // Gerakan Keranjang via Keyboard
    if (keys.left) player.dx = -player.speed;
    else if (keys.right) player.dx = player.speed;
    else player.dx = 0;

    player.x += player.dx;

    // Batas Layar untuk Keranjang
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Update Posisi Item
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;

        // Deteksi Tabrakan dengan Keranjang
        if (
            item.y + item.radius >= player.y &&
            item.y - item.radius <= player.y + player.height &&
            item.x >= player.x &&
            item.x <= player.x + player.width
        ) {
            if (item.type === 'star') {
                score += item.points;
                addParticles(item.x, item.y, '#fde047');
            } else if (item.type === 'gold') {
                score += item.points;
                addParticles(item.x, item.y, '#fbbf24');
            } else if (item.type === 'heart') {
                if (lives < 5) lives++;
                addParticles(item.x, item.y, '#ef4444');
            } else if (item.type === 'bomb') {
                lives--;
                addParticles(item.x, item.y, '#334155');
            }

            scoreEl.textContent = score;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
            items.splice(i, 1);

            if (lives <= 0) {
                gameOver();
                return;
            }
            continue;
        }

        // Jika Item Jatuh Melewati Batas Bawah
        if (item.y - item.radius > canvas.height) {
            if (item.type === 'star' || item.type === 'gold') {
                lives--;
                livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
                if (lives <= 0) {
                    gameOver();
                    return;
                }
            }
            items.splice(i, 1);
        }
    }

    // Update Partikel Animasi
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar Keranjang Pemain
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();

    // Line Aksen Keranjang
    ctx.fillStyle = '#a5b4fc';
    ctx.fillRect(player.x + 5, player.y + 3, player.width - 10, 3);

    // Gambar Item
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let item of items) {
        ctx.fillText(item.symbol, item.x, item.y);
    }

    // Gambar Partikel
    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function gameLoop() {
    if (!isPlaying) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
