let players = [];
let currentRound = 1;
let currentPuteran = 1;
let targetScore = 1000;
let history = [];
let playerStats = {};
let playerArchive = [];
let lastActionSnapshot = null;

const audioGod = new Audio('godofgambler.wav');
const audioStart = new Audio('dimulaidari0.wav');

let ttsQueue = [];
let isSpeaking = false;

function numberToBahasaIndonesia(num) {
    const numbers = {
        0: 'nol', 1: 'satu', 2: 'dua', 3: 'tiga', 4: 'empat',
        5: 'lima', 6: 'enam', 7: 'tujuh', 8: 'delapan', 9: 'sembilan',
        10: 'sepuluh', 11: 'sebelas', 12: 'dua belas', 13: 'tiga belas',
        14: 'empat belas', 15: 'lima belas', 16: 'enam belas',
        17: 'tujuh belas', 18: 'delapan belas', 19: 'sembilan belas',
        20: 'dua puluh', 30: 'tiga puluh', 40: 'empat puluh',
        50: 'lima puluh', 60: 'enam puluh', 70: 'tujuh puluh',
        80: 'delapan puluh', 90: 'sembilan puluh', 100: 'seratus',
        1000: 'seribu'
    };

    if (num in numbers) return numbers[num];
    if (num < 0) return `minus ${numberToBahasaIndonesia(Math.abs(num))}`;
    if (num < 1000) {
        let result = '';
        if (num >= 100) {
            result += numbers[Math.floor(num / 100)] + ' ratus ';
            num %= 100;
        }
        if (num >= 20) {
            result += numbers[Math.floor(num / 10) * 10] + ' ';
            num %= 10;
        }
        if (num > 0) result += numbers[num];
        return result.trim();
    }
    return num.toString();
}

function speak(text) {
    ttsQueue.push(text);
    if (!isSpeaking) processTTSQueue();
}

function processTTSQueue() {
    if (ttsQueue.length === 0) {
        isSpeaking = false;
        return;
    }
    isSpeaking = true;
    const text = ttsQueue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    
    utterance.onend = () => {
        setTimeout(processTTSQueue, 300);
    };
    
    speechSynthesis.speak(utterance);
}

// Load from localStorage
function loadGame() {
    const savedData = localStorage.getItem('cekihGameData');
    if (savedData) {
        const data = JSON.parse(savedData);
        players = data.players || [];
        currentRound = data.currentRound || 1;
        currentPuteran = data.currentPuteran || 1;
        targetScore = data.targetScore || 1000;
        history = data.history || [];
        playerStats = data.playerStats || {};
        playerArchive = data.playerArchive || [];
    }
}

// Save to localStorage
function saveGame() {
    const gameData = {
        players,
        currentRound,
        currentPuteran,
        targetScore,
        history,
        playerStats,
        playerArchive
    };
    localStorage.setItem('cekihGameData', JSON.stringify(gameData));
}

// Create player snapshot for undo
function createSnapshot() {
    return JSON.parse(JSON.stringify({
        players: players,
        currentRound: currentRound,
        currentPuteran: currentPuteran,
        history: history
    }));
}

// Render players
function renderPlayers() {
    const grid = document.getElementById('playersGrid');
    grid.innerHTML = '';

    players.forEach((player, index) => {
        const isLeader = player.score >= targetScore;
        const isMinus = player.score < 0;
        
        const card = document.createElement('div');
        card.className = `player-card ${isLeader ? 'leader' : ''}`;
        card.innerHTML = `
            <div class="player-name">
                <span>${player.name}</span>
                <button class="burn-btn \( {player.canBurn ? 'unlocked' : 'locked'}" onclick="markBurn( \){index})">
                    🔥 TERBAKAR
                </button>
            </div>
            <div class="score">${player.score}</div>
            <div class="stars">${'★'.repeat(player.stars)}</div>
            ${isMinus ? '<div class="minus-icon">👎</div>' : ''}
        `;
        grid.appendChild(card);
    });
}
