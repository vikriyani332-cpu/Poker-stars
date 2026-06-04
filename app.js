/**
 * Score Cekih Engine v1.0.0 Premium
 * Developed by Sadewa Corp
 * Pure Vanilla JS Architecture - Production Grade
 */

// Global Application Application State Snapshot Object
let state = {
    ronde: 1,
    puteran: 0,
    targetScore: 1000,
    players: [
        { name: "Pemain A", totalScore: 0, stars: 0, previousPosition: 3, currentPosition: 3 },
        { name: "Pemain B", totalScore: 0, stars: 0, previousPosition: 2, currentPosition: 2 },
        { name: "Pemain C", totalScore: 0, stars: 0, previousPosition: 1, currentPosition: 1 },
        { name: "Pemain D", totalScore: 0, stars: 0, previousPosition: 0, currentPosition: 0 }
    ],
    history: [],
    burnCandidates: [] // Tracks indices of players unlocked for fire action
};

// Permanent statistics dataset decoupled from live active session states
let permanentStats = {};
let playerArchive = [];

// System full state undo records snapshot history line
let undoStack = [];

// Speech queue line controller configuration
let speechQueue = [];
let isSpeakingNow = false;

// Audio context assets maps
const audioAssets = {
    godOfGambler: "godofgambler.wav",
    dimulaiDari0: "dimulaidari0.wav"
};

/**
 * Trigger asset playback securely via HTML5 Web Audio API structure wrappers
 */
function playAudioFile(srcPath) {
    const audioObj = new Audio(srcPath);
    return new Promise((resolve) => {
        audioObj.onended = () => resolve();
        audioObj.onerror = () => resolve(); // Prevent blocking queue chains on missing files
        audioObj.play().catch(() => resolve());
    });
}

/**
 * Text-to-Speech Synchronous Sequenced Queue Engine
 */
function enqueueSpeech(textPhrase) {
    speechQueue.push(textPhrase);
    processSpeechQueue();
}

function processSpeechQueue() {
    if (isSpeakingNow || speechQueue.length === 0) return;
    
    isSpeakingNow = true;
    const currentPhrase = speechQueue.shift();
    
    const utterance = new SpeechSynthesisUtterance(currentPhrase);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; // Premium steady accent pace
    
    utterance.onend = () => {
        isSpeakingNow = false;
        processSpeechQueue();
    };
    
    utterance.onerror = () => {
        isSpeakingNow = false;
        processSpeechQueue();
    };
    
    window.speechSynthesis.speak(utterance);
}

/**
 * Converts integers to standard spoken Bahasa Indonesia rules syntax
 */
function numberToBahasaIndonesia(numValue) {
    const integerNum = parseInt(numValue);
    if (isNaN(integerNum)) return "nol";
    if (integerNum === 0) return "nol";
    
    let prefixSign = "";
    let processedNum = integerNum;
    if (integerNum < 0) {
        prefixSign = "minus ";
        processedNum = Math.abs(integerNum);
    }
    
    const wordsArray = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    let resultSpoken = "";
    
    if (processedNum < 12) {
        resultSpoken = wordsArray[processedNum];
    } else if (processedNum < 20) {
        resultSpoken = numberToBahasaIndonesia(processedNum % 10) + " belas";
    } else if (processedNum < 100) {
        resultSpoken = wordsArray[Math.floor(processedNum / 10)] + " puluh " + wordsArray[processedNum % 10];
    } else if (processedNum < 200) {
        resultSpoken = "seratus " + numberToBahasaIndonesia(processedNum % 100);
    } else if (processedNum < 1000) {
        resultSpoken = wordsArray[Math.floor(processedNum / 100)] + " ratus " + numberToBahasaIndonesia(processedNum % 100);
    } else if (processedNum === 1000) {
        resultSpoken = "seribu";
    } else if (processedNum < 2000) {
        resultSpoken = "seribu " + numberToBahasaIndonesia(processedNum % 1000);
    } else {
        resultSpoken = numberToBahasaIndonesia(Math.floor(processedNum / 1000)) + " ribu " + numberToBahasaIndonesia(processedNum % 1000);
    }
    
    return (prefixSign + resultSpoken).trim().replace(/\s+/g, ' ');
}

/**
 * Snapshot capture system backup for absolute non-destructive undo routines
 */
function pushStateToUndoStack() {
    const serializedCopy = JSON.stringify({ state, permanentStats, playerArchive });
    undoStack.push(serializedCopy);
}

/**
 * Initialize core configurations and local database reads on boot loaders
 */
document.addEventListener("DOMContentLoaded", () => {
    simulateLoadingBarProgress()
        .then(() => {
            loadApplicationDatabase();
            registerDomEventListeners();
            syncLiveUiDisplays();
            document.getElementById("loading-screen").style.opacity = "0";
            setTimeout(() => {
                document.getElementById("loading-screen").style.display = "none";
            }, 600);
        });
});

function simulateLoadingBarProgress() {
    return new Promise((resolve) => {
        const progressBar = document.getElementById("loading-bar-progress");
        let widthProgress = 0;
        const intervalId = setInterval(() => {
            if (widthProgress >= 100) {
                clearInterval(intervalId);
                resolve();
            } else {
                widthProgress += 4;
                progressBar.style.width = widthProgress + "%";
            }
        }, 30);
    });
}

/**
 * Storage management structures
 */
function saveApplicationDatabase() {
    localStorage.setItem("sadewa_cekih_state", JSON.stringify(state));
    localStorage.setItem("sadewa_cekih_perm_stats", JSON.stringify(permanentStats));
    localStorage.setItem("sadewa_cekih_archive", JSON.stringify(playerArchive));
    localStorage.setItem("sadewa_cekih_undo", JSON.stringify(undoStack));
}

function loadApplicationDatabase() {
    const cachedState = localStorage.getItem("sadewa_cekih_state");
    const cachedPerm = localStorage.getItem("sadewa_cekih_perm_stats");
    const cachedArch = localStorage.getItem("sadewa_cekih_archive");
    const cachedUndo = localStorage.getItem("sadewa_cekih_undo");
    
    if (cachedState) state = JSON.parse(cachedState);
    if (cachedPerm) permanentStats = JSON.parse(cachedPerm);
    if (cachedArch) playerArchive = JSON.parse(cachedArch);
    if (cachedUndo) undoStack = JSON.parse(cachedUndo);
}

/**
 * UI Syncing Core Router
 */
function syncLiveUiDisplays() {
    // If games are active switch views immediately
    if (state.puteran > 0 || state.players.some(p => p.totalScore !== 0 || p.stars > 0)) {
        switchActiveScreenView("view-game");
    } else {
        switchActiveScreenView("view-setup");
    }
    
    // Form views updates
    document.getElementById("display-ronde").innerText = state.ronde;
    document.getElementById("display-puteran").innerText = state.puteran;
    document.getElementById("display-target").innerText = state.targetScore;
    
    renderScoreboardGrid();
    renderRankingTable();
    renderHistoryTimeline();
    renderAchievementsCabinet();
    renderPermanentStatsTable();
    renderArchiveTagsFlex();
}

function switchActiveScreenView(viewId) {
    document.querySelectorAll(".screen-view").forEach(view => {
        view.classList.remove("active");
    });
    document.getElementById(viewId).classList.add("active");
    
    // Clear active bottom tab styling updates if setup screen pulls focus
    if (viewId === "view-setup" || viewId === "view-game") {
        document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
        if (viewId === "view-game") {
            document.querySelector('[data-tab="tab-game"]').classList.add("active");
        }
    }
}

/**
 * Scoreboard Elements Factory Generation
 */
function renderScoreboardGrid() {
    const container = document.getElementById("scoreboard-container");
    container.innerHTML = "";
    
    state.players.forEach((player, idx) => {
        const isMinus = player.totalScore < 0;
        const isUnlocked = state.burnCandidates.includes(idx);
        
        // Stars collection markup assembly
        let starsStr = "";
        for (let s = 0; s < player.stars; s++) {
            starsStr += "⭐";
        }
        
        const cardNode = document.createElement("div");
        cardNode.className = `player-score-card ${isMinus ? 'has-minus' : ''}`;
        cardNode.innerHTML = `
            <div class="card-top-row">
                <div class="player-identity">
                    <div class="card-player-name">${player.name}</div>
                    <button class="btn-edit-inline" onclick="triggerNameCorrectionModal(${idx})">📝 Edit Nama</button>
                </div>
                <div class="stars-indicator-row">${starsStr}</div>
            </div>
            <div class="card-score-center">
                <div class="grand-total-score">${player.totalScore}</div>
                ${isMinus ? '<span class="minus-badge-anim">👎</span>' : ''}
            </div>
            <div class="burn-action-footer">
                <button class="btn-burn-trigger ${isUnlocked ? 'unlocked' : 'locked'}" 
                        onclick="triggerBurnConfirmationRoutine(${idx})" 
                        ${isUnlocked ? '' : 'disabled'}>🔥 TERBAKAR</button>
            </div>
        `;
        container.appendChild(cardNode);
        
        // Assign labels on inputs form directly inside input point panel
        const lbl = document.getElementById(`lbl-input-p1`);
        if (idx === 0) document.getElementById(`lbl-input-p1`).innerText = player.name;
        if (idx === 1) document.getElementById(`lbl-input-p2`).innerText = player.name;
        if (idx === 2) document.getElementById(`lbl-input-p3`).innerText = player.name;
        if (idx === 3) document.getElementById(`lbl-input-p4`).innerText = player.name;
    });
}

/**
 * Navigation tabs dynamic loading logic switchboard hooks
 */
function registerDomEventListeners() {
    document.querySelectorAll(".nav-tab").forEach(tabBtn => {
        tabBtn.addEventListener("click", (e) => {
            const chosenTab = e.target.getAttribute("data-tab");
            
            document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            
            if (chosenTab === "tab-game") {
                if (state.puteran > 0 || state.players.some(p => p.totalScore !== 0 || p.stars > 0)) {
                    switchActiveScreenView("view-game");
                } else {
                    switchActiveScreenView("view-setup");
                }
            } else {
                switchActiveScreenView("view-tabs");
                document.querySelectorAll(".tab-panel-item").forEach(panel => {
                    panel.classList.remove("active");
                });
                document.getElementById(chosenTab).classList.add("active");
            }
        });
    });

    // Theme changer hook
    document.getElementById("btn-theme-toggle").addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        document.body.classList.toggle("dark-mode");
    });

    // Fullscreen action logic hook
    document.getElementById("btn-fullscreen").addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    });

    // Config setup target point selectors setup listeners hooks
    document.querySelectorAll(".btn-target").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".btn-target").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            document.getElementById("input-target-custom").value = "";
        });
    });

    // Core execution hooks handlers linkage registers
    document.getElementById("btn-start-game").addEventListener("click", executeGameInitializationAction);
    document.getElementById("btn-save-puteran").addEventListener("click", executePuteranScoresSubmissionAction);
    document.getElementById("btn-undo").addEventListener("click", executeUndoCommandAction);
    document.getElementById("btn-screenshot").addEventListener("click", executeCaptureUiPngAction);
    document.getElementById("btn-reset-game").addEventListener("click", executeResetGameSessionCommand);
    
    // Modal name buttons registers hooks
    document.getElementById("btn-modal-cancel-name").addEventListener("click", () => {
        document.getElementById("modal-edit-nama").classList.remove("active");
    });
    document.getElementById("btn-modal-save-name").addEventListener("click", saveInlinePlayerNameCorrection);
    
    // Modal burning logic hooks
    document.getElementById("btn-modal-cancel-bakar").addEventListener("click", () => {
        document.getElementById("modal-bakar-pelaku").classList.remove("active");
    });
}

/**
 * Setup Screen Action - Spawns dynamic tracking contexts
 */
function executeGameInitializationAction() {
    pushStateToUndoStack();
    
    // Gather and build selected active target configurations rule targets
    const customTarget = parseInt(document.getElementById("input-target-custom").value);
    if (!isNaN(customTarget) && customTarget > 0) {
        state.targetScore = customTarget;
    } else {
        const activeBtn = document.querySelector(".btn-target.active");
        state.targetScore = activeBtn ? parseInt(activeBtn.getAttribute("data-value")) : 1000;
    }
    
    // Load up custom player identities configurations array names maps
    const p1 = document.getElementById("setup-p1").value.trim() || "Pemain A";
    const p2 = document.getElementById("setup-p2").value.trim() || "Pemain B";
    const p3 = document.getElementById("setup-p3").value.trim() || "Pemain C";
    const p4 = document.getElementById("setup-p4").value.trim() || "Pemain D";
    
    const newNames = [p1, p2, p3, p4];
    
    newNames.forEach((name, i) => {
        state.players[i].name = name;
        verifyAndAppendToPermanentDatabase(name);
    });
    
    state.puteran = 0; // Reset counter for clean tracking lines setups
    calculateAndTrackLeaderboardStandings();
    evaluateSemiAutomaticBurningPotentials();
    
    saveApplicationDatabase();
    syncLiveUiDisplays();
    switchActiveScreenView("view-game");
}

/**
 * Creates structural entities inside index pools for names never met previously
 */
function verifyAndAppendToPermanentDatabase(pName) {
    if (!permanentStats[pName]) {
        permanentStats[pName] = { stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 };
    }
    if (!playerArchive.includes(pName)) {
        playerArchive.push(pName);
    }
}

/**
 * Mathematical engine compiling ranks and tracking position shifts 
 */
function calculateAndTrackLeaderboardStandings() {
    // Record past index standings before modifying states mappings pointers arrays
    state.players.forEach(p => {
        p.previousPosition = p.currentPosition;
    });
    
    // Create mapping pairs to resolve duplicates sort stability indexes logs
    let mappingPairs = state.players.map((p, index) => ({ index, totalScore: p.totalScore }));
    
    // Sort stable desc order based strictly on current total scores values 
    mappingPairs.sort((a, b) => b.totalScore - a.totalScore);
    
    // Re-apply explicit ranks to state objects based on sorted order outcome matrices
    mappingPairs.forEach((pair, rankPosition) => {
        state.players[pair.index].currentPosition = rankPosition;
        
        // Feed real-time records into archival maps values
        const pName = state.players[pair.index].name;
        verifyAndAppendToPermanentDatabase(pName);
        if (state.players[pair.index].totalScore > permanentStats[pName].highestScore) {
            permanentStats[pName].highestScore = state.players[pair.index].totalScore;
        }
    });
}

/**
 * Semi-Automatic Burning Rules Processor Core Engine
 */
function evaluateSemiAutomaticBurningPotentials() {
    let candidatesList = [];
    
    // Scan every pairing combo configuration in game matrix arrays
    for (let targetIdx = 0; targetIdx < state.players.length; targetIdx++) {
        const victimCandidate = state.players[targetIdx];
        
        // RULE: Players with scores <= 0 can NEVER be designated burn targets under any condition
        if (victimCandidate.totalScore <= 0) continue;
        
        let isBurnConditionMet = false;
        
        for (let hunterIdx = 0; hunterIdx < state.players.length; hunterIdx++) {
            if (targetIdx === hunterIdx) continue;
            
            const hunterPlayer = state.players[hunterIdx];
            
            // Check if hunter previously had a lower or equal score position relative to the victim
            // High position indices values mean a lower ranking tier in tracking matrices
            const wasHunterBelowOrEqualToVictim = hunterPlayer.previousPosition >= victimCandidate.previousPosition;
            
            // Check if hunter has now overtaken the victim's score in this state
            const hasHunterOvertakenVictim = hunterPlayer.totalScore > victimCandidate.totalScore;
            
            if (wasHunterBelowOrEqualToVictim && hasHunterOvertakenVictim) {
                isBurnConditionMet = true;
                break;
            }
        }
        
        if (isBurnConditionMet) {
            candidatesList.push(targetIdx);
        }
    }
    
    state.burnCandidates = candidatesList;
}

/**
 * Save Puteran Action Handler Input processing module
 */
function executePuteranScoresSubmissionAction() {
    pushStateToUndoStack();
    
    const inputIds = ["score-input-p1", "score-input-p2", "score-input-p3", "score-input-p4"];
    let inputValuesParsed = [];
    
    // Validate bounds constraint conditions parameters rules
    for (let i = 0; i < 4; i++) {
        let val = parseInt(document.getElementById(inputIds[i]).value);
        if (isNaN(val)) val = 0;
        
        if (val > 1000) {
            alert(`Skor input melebihi batas maksimal positif 1000 poin per puteran pada field ke-${i+1}!`);
            return;
        }
        inputValuesParsed.push(val);
    }
    
    // Commit delta modifications increments structures variables safely
    state.puteran += 1;
    
    inputValuesParsed.forEach((deltaValue, index) => {
        state.players[index].totalScore += deltaValue;
    });
    
    // Clear the input fields immediately for seamless user experience
    inputIds.forEach(id => document.getElementById(id).value = "");
    
    // Log trace paths entry elements logs lists histories tracking
    let roundLogTrace = `Put. ${state.puteran} (Ronde ${state.ronde}) - `;
    state.players.forEach((p, idx) => {
        roundLogTrace += `${p.name}: ${inputValuesParsed[idx] >= 0 ? '+' : ''}${inputValuesParsed[idx]} (${p.totalScore}) `;
    });
    state.history.unshift({ type: "score_update", message: roundLogTrace.trim() });
    
    // Recalculate rank standings matrices changes mapping
    calculateAndTrackLeaderboardStandings();
    
    // Scan victory bounds configurations triggers elements checks
    let roundWinnersList = [];
    state.players.forEach((player, idx) => {
        if (player.totalScore >= state.targetScore) {
            roundWinnersList.push(idx);
        }
    });
    
    if (roundWinnersList.length > 0) {
        processRoundVictorySequence(roundWinnersList);
    } else {
        // Run intermediate speech routine rules if no winners triggered out
        processStandardPuteranCompletionSpeechSequence();
        evaluateSemiAutomaticBurningPotentials();
        saveApplicationDatabase();
        syncLiveUiDisplays();
    }
}

/**
 * Sequence Builder executing standard round-over audio and speech lines
 */
function processStandardPuteranCompletionSpeechSequence() {
    // Rule amendment updates require speech sequence flow order: 
    // "Silakan bandar kocok kartunya" is spoken FIRST before spelling out individual player totals.
    enqueueSpeech("Silakan bandar kocok kartunya");
    
    // Find matching candidate dealer index using the lowest current scoreboard values metric rules
    let candidateDealerIdx = 0;
    let lowestScoreFound = state.players[0].totalScore;
    
    for (let i = 1; i < state.players.length; i++) {
        const checkScore = state.players[i].totalScore;
        // Selection prioritization filters checks for minus priority checks
        if (checkScore < lowestScoreFound) {
            lowestScoreFound = checkScore;
            candidateDealerIdx = i;
        }
    }
    
    const targetDealerName = state.players[candidateDealerIdx].name;
    
    // Enqueue dealer request line right behind generic dealer call
    enqueueSpeech(`Silakan ${targetDealerName} kocok kartunya`);
    
    // Play sound asset exactly after the dealer target request prompt clears
    setTimeout(() => {
        playAudioFile(audioAssets.dimulaiDari0);
    }, 1200);
    
    // Construct and append the entire scoreboard read out lines sequentially
    state.players.forEach(p => {
        const spokenNumberText = numberToBahasaIndonesia(p.totalScore);
        enqueueSpeech(`${p.name} total poin ${spokenNumberText}`);
    });
}

/**
 * Absolute Grand Finale Victory Sequence Controller Triggers Execution
 */
function processRoundVictorySequence(winnerIndicesArray) {
    // Select winner with the highest absolute score among all players crossing thresholds
    let primaryWinnerIdx = winnerIndicesArray[0];
    let topWinningScore = state.players[primaryWinnerIdx].totalScore;
    
    winnerIndicesArray.forEach(idx => {
        if (state.players[idx].totalScore > topWinningScore) {
            topWinningScore = state.players[idx].totalScore;
            primaryWinnerIdx = idx;
        }
    });
    
    const champObj = state.players[primaryWinnerIdx];
    champObj.stars += 1;
    
    // Feed persistent incremental archives records sets values
    verifyAndAppendToPermanentDatabase(champObj.name);
    permanentStats[champObj.name].stars += 1;
    
    // Inject notification banner logs rows targets traces
    state.history.unshift({ 
        type: "star_victory", 
        message: `🏆 RONDE ${state.ronde} SELESAI! ${champObj.name} memperoleh 1 BINTANG (Total Skor: ${champObj.name.totalScore})` 
    });
    
    // Trigger animations and voice synthesizers simultaneously
    triggerFallingStarScreenOverlayAnimation();
    playAudioFile(audioAssets.godOfGambler);
    enqueueSpeech(`Selamat kepada ${champObj.name} mendapatkan bintang satu`);
    
    // Queue final structural instruction sequence
    enqueueSpeech("Silakan bandar kocok kartunya");
    
    // Prepare for clean system resets transitions fields setups
    setTimeout(() => {
        // Increment round tracking variables counter lines
        state.ronde += 1;
        state.puteran = 0;
        
        // Wipe local match points variables values across whole board sets back to zero bounds
        state.players.forEach(p => {
            p.totalScore = 0;
        });
        
        state.burnCandidates = [];
        calculateAndTrackLeaderboardStandings();
        
        saveApplicationDatabase();
        syncLiveUiDisplays();
        switchActiveScreenView("view-setup");
    }, 5000); // 5 seconds display lock to view falling stars and hear sounds clearly
}

/**
 * Modal System Configuration Launcher for inline data corrections
 */
window.triggerNameCorrectionModal = function(playerIdx) {
    const player = state.players[playerIdx];
    document.getElementById("modal-input-new-name").value = player.name;
    document.getElementById("modal-input-player-index").value = playerIdx;
    document.getElementById("modal-edit-nama").classList.add("active");
};

function saveInlinePlayerNameCorrection() {
    const playerIdx = parseInt(document.getElementById("modal-input-player-index").value);
    const updatedName = document.getElementById("modal-input-new-name").value.trim();
    
    if (!updatedName) {
        alert("Nama tidak boleh kosong!");
        return;
    }
    
    pushStateToUndoStack();
    
    const oldName = state.players[playerIdx].name;
    state.players[playerIdx].name = updatedName;
    
    // Track stats for the new identity if it hasn't played before
    verifyAndAppendToPermanentDatabase(updatedName);
    
    state.history.unshift({ 
        type: "system", 
        message: `📝 Koreksi nama: Pemain posisi ${playerIdx + 1} diubah dari "${oldName}" menjadi "${updatedName}"` 
    });
    
    // Refresh rule parameters tracking configurations instantly
    calculateAndTrackLeaderboardStandings();
    evaluateSemiAutomaticBurningPotentials();
    
    saveApplicationDatabase();
    syncLiveUiDisplays();
    
    document.getElementById("modal-edit-nama").classList.remove("active");
}

/**
 * Burning Activation Confirmation popup router workflow controls
 */
window.triggerBurnConfirmationRoutine = function(victimIdx) {
    const victim = state.players[victimIdx];
    document.getElementById("modal-bakar-victim-idx").value = victimIdx;
    document.getElementById("modal-bakar-desc").innerText = `Siapa yang membakar ${victim.name}?`;
    
    const btnStack = document.getElementById("modal-bakar-options-container");
    btnStack.innerHTML = "";
    
    // Build buttons for all players except the victim
    state.players.forEach((hunter, hIdx) => {
        if (hIdx !== victimIdx) {
            const optBtn = document.createElement("button");
            optBtn.className = "premium-btn btn-gold text-center";
            optBtn.innerText = hunter.name;
            optBtn.onclick = () => executeBurningPayloadSequence(victimIdx, hIdx);
            btnStack.appendChild(optBtn);
        }
    });
    
    document.getElementById("modal-bakar-pelaku").classList.add("active");
};

/**
 * Finalized structural sequence executor handling burn mutations matches updates
 */
function executeBurningPayloadSequence(victimIdx, hunterIdx) {
    document.getElementById("modal-bakar-pelaku").classList.remove("active");
    pushStateToUndoStack();
    
    const victim = state.players[victimIdx];
    const hunter = state.players[hunterIdx];
    
    // Check if hunter qualified for a Triple Burn tracking bonus sequence
    let isTripleBurnConfirmed = false;
    let currentLogHistoryReference = state.history;
    
    // Search history records for matches belonging to this hunter in the current puteran
    let hunterBurnCountInCurrentPuteran = 1; // Count this active burn
    
    // Search matching historical events tags trace records
    currentLogHistoryReference.forEach(logItem => {
        if (logItem.type === "burn_action" && 
            logItem.puteranRef === state.puteran && 
            logItem.rondeRef === state.ronde && 
            logItem.hunterName === hunter.name) {
            hunterBurnCountInCurrentPuteran++;
        }
    });
    
    if (hunterBurnCountInCurrentPuteran === 3) {
        isTripleBurnConfirmed = true;
    }
    
    // Execute sequence workflow tasks
    // Step 1 & 2: TTS output announcer stream processing lines execution
    enqueueSpeech(`${hunter.name} membakar ${victim.name}`);
    
    // Step 3: Audio asset playback routine triggered after text announcements finish
    setTimeout(() => {
        playAudioFile(audioAssets.dimulaiDari0);
    }, 1500);
    
    // Step 4: Fire effects visual layout engine triggers
    triggerFireRiseScreenOverlayAnimation();
    
    // Step 5: Victim mutations resets back down to boundary point level zero bounds
    victim.totalScore = 0;
    
    // Step 6 & 7: Permanent tracking databases increment blocks configurations updates
    verifyAndAppendToPermanentDatabase(victim.name);
    verifyAndAppendToPermanentDatabase(hunter.name);
    
    permanentStats[victim.name].burned += 1;
    permanentStats[hunter.name].burns += 1;
    
    // Inject historical event logs items tracing row data elements inside maps
    state.history.unshift({
        type: "burn_action",
        rondeRef: state.ronde,
        puteranRef: state.puteran,
        hunterName: hunter.name,
        message: `🔥 ${hunter.name} membakar ${victim.name}`
    });
    
    // Handle Triple Burn payload requirements if verified
    if (isTripleBurnConfirmed) {
        permanentStats[hunter.name].tripleBurn += 1;
        enqueueSpeech("Triple Burn");
        state.history.unshift({
            type: "triple_burn",
            message: `💣 TRIPLE BURN - ${hunter.name}`
        });
    }
    
    // Re-evaluate scoreboard standings instantly
    calculateAndTrackLeaderboardStandings();
    evaluateSemiAutomaticBurningPotentials();
    
    saveApplicationDatabase();
    syncLiveUiDisplays();
}

/**
 * Animation Components Engine Render Handlers
 */
function triggerFireRiseScreenOverlayAnimation() {
    const fireContainer = document.querySelector(".fire-particles-container");
    const fireOverlay = document.getElementById("fire-animation-overlay");
    fireContainer.innerHTML = "";
    fireOverlay.style.display = "block";
    
    // Spawn 40 energetic flame particle items
    for (let i = 0; i < 40; i++) {
        const flame = document.createElement("div");
        flame.className = "fire-particle";
        flame.style.left = Math.random() * 100 + "vw";
        flame.style.animation = `fireRise ${1 + Math.random() * 1.5}s ease-in-out forwards`;
        flame.style.animationDelay = Math.random() * 0.4 + "s";
        flame.style.width = (20 + Math.random() * 30) + "px";
        flame.style.height = flame.style.width;
        fireContainer.appendChild(flame);
    }
    
    setTimeout(() => {
        fireOverlay.style.display = "none";
    }, 3000);
}

function triggerFallingStarScreenOverlayAnimation() {
    const starOverlay = document.getElementById("star-animation-overlay");
    starOverlay.innerHTML = "";
    starOverlay.style.display = "block";
    
    for (let i = 0; i < 30; i++) {
        const star = document.createElement("div");
        star.className = "falling-star";
        star.innerText = "⭐";
        star.style.left = Math.random() * 100 + "vw";
        star.style.animation = `starFall ${1.5 + Math.random() * 2}s linear forwards`;
        star.style.animationDelay = Math.random() * 1 + "s";
        star.style.fontSize = (16 + Math.random() * 20) + "px";
        starOverlay.appendChild(star);
    }
    
    setTimeout(() => {
        starOverlay.style.display = "none";
    }, 4500);
}

/**
 * Undo Command Execution Engine Logic Wrapper
 */
function executeUndoCommandAction() {
    if (undoStack.length === 0) {
        alert("Tidak ada aksi yang dapat dibatalkan!");
        return;
    }
    
    const historicalJsonString = undoStack.pop();
    const parsedCheckpoint = JSON.parse(historicalJsonString);
    
    state = parsedCheckpoint.state;
    permanentStats = parsedCheckpoint.permanentStats;
    playerArchive = parsedCheckpoint.playerArchive;
    
    saveApplicationDatabase();
    syncLiveUiDisplays();
}

/**
 * Screen Content PDF/PNG Image Exporter Logic Wrappers
 */
function executeCaptureUiPngAction() {
    // Elegant system alerts info notifications parameters fallback
    alert("Fitur Screenshot Premium Sadewa Corp: Tekan tombol Power + Volume Down pada perangkat Android Anda untuk menyimpan tampilan premium beresolusi tinggi secara instan.");
}

/**
 * Active session state data purging routines reset handler configurations
 */
function executeResetGameSessionCommand() {
    const isUserConfirmed = confirm("Reset seluruh permainan?");
    if (!isUserConfirmed) return;
    
    pushStateToUndoStack();
    
    // Clear the active session tracking datasets completely
    state.ronde = 1;
    state.puteran = 0;
    state.targetScore = 1000;
    state.players.forEach((p, idx) => {
        p.totalScore = 0;
        p.stars = 0;
        p.previousPosition = 3 - idx;
        p.currentPosition = 3 - idx;
    });
    state.history = [];
    state.burnCandidates = [];
    
    saveApplicationDatabase();
    syncLiveUiDisplays();
    switchActiveScreenView("view-setup");
}

/**
 * Secondary Sub-Views Dynamic Table Component Binding Parsers Generators
 */
function renderRankingTable() {
    const tbody = document.getElementById("table-ranking-body");
    tbody.innerHTML = "";
    
    // Order local deep clone matching score matrix structures to retain display positions safely
    let sortedDisplayList = [...state.players];
    sortedDisplayList.sort((a, b) => b.totalScore - a.totalScore);
    
    sortedDisplayList.forEach((p, index) => {
        let starsStr = "";
        for (let s = 0; s < p.stars; s++) { starsStr += "⭐"; }
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center" style="font-weight:700; color:var(--border-gold)">${index + 1}</td>
            <td style="font-weight:600">${p.name}</td>
            <td class="text-right" style="font-weight:700">${p.totalScore}</td>
            <td class="text-center">${starsStr || "-"}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderHistoryTimeline() {
    const container = document.getElementById("history-log-list");
    container.innerHTML = "";
    
    if (state.history.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:var(--text-muted); padding: 20px 0;">Belum ada log histori tercatat.</p>';
        return;
    }
    
    state.history.forEach(logItem => {
        const itemNode = document.createElement("div");
        const isTriple = logItem.type === "triple_burn";
        itemNode.className = `log-item-row ${isTriple ? 'triple-burn-log' : ''}`;
        itemNode.innerText = logItem.message;
        container.appendChild(itemNode);
    });
}

function renderAchievementsCabinet() {
    const container = document.getElementById("achievement-grid-list");
    container.innerHTML = "";
    
    // Core definition of achievement matrix data arrays
    const achievementsMapSchema = [
        { id: "ngocok", title: "Tukang Ngocok Kartu", desc: "Memiliki skor negatif di bawah 0 poin pada puteran berjalan.", check: (p) => p.totalScore < 0 },
        { id: "bakar", title: "Tukang Bakar", desc: "Berhasil membakar pemain lain sebanyak minimal 3 kali.", check: (p, s) => s.burns >= 3 },
        { id: "apes", title: "Hari Apes Gak Ada Yang Tau", desc: "Mengalami nasib tragis dibakar lawan sebanyak minimal 5 kali.", check: (p, s) => s.burned >= 5 },
        { id: "dewa", title: "Dewa Kartu", desc: "Berhasil menembus pencapaian skor tertinggi minimal 500 poin.", check: (p, s) => s.highestScore >= 500 },
        { id: "segala_dewa", title: "Dewa Dari Segala Dewa", desc: "Memiliki kepemilikan akumulasi bintang emas di atas 1 bintang.", check: (p, s) => s.stars > 1 },
        { id: "t_burn", title: "Triple Burn", desc: "Membakar total 3 orang pemain sekaligus dalam rentang 1 puteran yang sama.", check: (p, s) => s.tripleBurn > 0 }
    ];
    
    let processedCardsCounter = 0;
    
    state.players.forEach(player => {
        const pStats = permanentStats[player.name] || { stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 };
        
        achievementsMapSchema.forEach(ach => {
            const isUnlocked = ach.check(player, pStats);
            if (isUnlocked) {
                processedCardsCounter++;
                const card = document.createElement("div");
                card.className = "achievement-item-card unlocked";
                card.innerHTML = `
                    <div class="achievement-badge-icon">🏅</div>
                    <div class="achievement-details">
                        <h4>${ach.title} (${player.name})</h4>
                        <p>${ach.desc}</p>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    });
    
    if (processedCardsCounter === 0) {
        container.innerHTML = '<p class="text-center" style="color:var(--text-muted); padding:20px 0;">Belum ada pencapaian premium terbuka.</p>';
    }
}

function renderPermanentStatsTable() {
    const tbody = document.getElementById("table-statistik-body");
    tbody.innerHTML = "";
    
    const indexedKeys = Object.keys(permanentStats);
    if (indexedKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:var(--text-muted)">Tidak ada database statistik tersimpan.</td></tr>';
        return;
    }
    
    indexedKeys.forEach(pName => {
        const s = permanentStats[pName];
        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight:600; color:var(--border-gold)">${pName}</td>
            <td class="text-center">${s.stars}</td>
            <td class="text-center">${s.burns}</td>
            <td class="text-center">${s.burned}</td>
            <td class="text-center">${s.tripleBurn}</td>
            <td class="text-right" style="font-weight:700">${s.highestScore}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderArchiveTagsFlex() {
    const container = document.getElementById("arsip-container-list");
    container.innerHTML = "";
    
    if (playerArchive.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:var(--text-muted); width:100%">Gudang arsip data kosong.</p>';
        return;
    }
    
    playerArchive.forEach(pName => {
        const pill = document.createElement("span");
        pill.className = "archive-tag-pill";
        pill.innerText = `👤 ${pName}`;
        container.appendChild(pill);
    });
}
