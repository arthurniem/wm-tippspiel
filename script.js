// Replace your old 'groups' object with this new 'schedule' structure
const schedule = {
    A: [
        ["Mexico", "South Africa"], 
        ["South Korea", "Czechia"],
        ["Czechia", "South Africa"],
        ["Mexico", "South Korea"],
        ["South Africa", "South Korea"],
        ["Czechia", "Mexico"]
    ],
    B: [
        ["Canada", "Bosnia and Herzegovina"], 
        ["Qatar", "Switzerland"],
        ["Switzerland", "Bosnia and Herzegovina"],
        ["Canada", "Qatar"],
        ["Bosnia and Herzegovina", "Qatar"],
        ["Switzerland", "Canada"]
    ],
    C: [
        ["Brazil", "Morocco"], 
        ["Haiti", "Scotland"],
        ["Scotland", "Morocco"],
        ["Brazil", "Haiti"],
        ["Morocco", "Haiti"],
        ["Scotland", "Brazil"]
    ],
    D: [
        ["United States", "Paraguay"], 
        ["Australia", "Türkiye"],
        ["Türkiye", "Paraguay"],
        ["United States", "Australia"],
        ["Paraguay", "Australia"],
        ["Türkiye", "United States"]
    ],
    E: [
        ["Germany", "Curaçao"], 
        ["Ivory Coast", "Ecuador"],
        ["Ecuador", "Curaçao"],
        ["Germany", "Ivory Coast"],
        ["Curaçao", "Ivory Coast"],
        ["Ecuador", "Germany"]
    ],
    F: [
        ["Netherlands", "Japan"], 
        ["Sweden", "Tunisia"],
        ["Tunisia", "Japan"],
        ["Netherlands", "Sweden"],
        ["Japan", "Sweden"],
        ["Tunisia", "Netherlands"]
    ],
    G: [
        ["Belgium", "Egypt"], 
        ["Iran", "New Zealand"],
        ["New Zealand", "Egypt"],
        ["Belgium", "Iran"],
        ["Egypt", "Iran"],
        ["New Zealand", "Belgium"]
    ],
    H: [
        ["Spain", "Cape Verde"], 
        ["Saudi Arabia", "Uruguay"],
        ["Uruguay", "Cape Verde"],
        ["Spain", "Saudi Arabia"],
        ["Cape Verde", "Saudi Arabia"],
        ["Uruguay", "Spain"]
    ],
    I: [
        ["France", "Senegal"], 
        ["Iraq", "Norway"],
        ["Norway", "Senegal"],
        ["France", "Iraq"],
        ["Senegal", "Iraq"],
        ["Norway", "France"]
    ],
    J: [
        ["Argentina", "Algeria"], 
        ["Austria", "Jordan"],
        ["Jordan", "Algeria"],
        ["Argentina", "Austria"],
        ["Algeria", "Austria"],
        ["Jordan", "Argentina"]
    ],
    K: [
        ["Portugal", "DR Congo"], 
        ["Uzbekistan", "Colombia"],
        ["Colombia", "DR Congo"],
        ["Portugal", "Uzbekistan"],
        ["DR Congo", "Uzbekistan"],
        ["Colombia", "Portugal"]
    ],
    L: [
        ["England", "Croatia"], 
        ["Ghana", "Panama"],
        ["Panama", "Croatia"],
        ["England", "Ghana"],
        ["Croatia", "Ghana"],
        ["Panama", "England"]
    ]
};

// Automatically extract unique teams from the schedule for the Knockout Stage
const groups = {};
for (const [groupName, matches] of Object.entries(schedule)) {
    let uniqueTeams = new Set();
    matches.forEach(match => {
        uniqueTeams.add(match[0]);
        uniqueTeams.add(match[1]);
    });
    // Sort them alphabetically so they look nice in the RO32 list
    groups[groupName] = Array.from(uniqueTeams).sort(); 
}

// Replace your old initGroupStage function with this one
function initGroupStage() {
    const wrapper = document.getElementById('groups-wrapper');
    
    for (const [groupName, matches] of Object.entries(schedule)) {
        let html = `<div class="group-box"><h4>Group ${groupName}</h4>`;
        matches.forEach((match, idx) => {
            html += `
                <div class="match">
                    <span>${match[0]}</span>
                    <div>
                        <input type="text" inputmode="numeric" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')" id="g${groupName}_m${idx}_t1" maxlength="2"> - 
                        <input type="text" inputmode="numeric" pattern="[0-9]*" oninput="this.value = this.value.replace(/[^0-9]/g, '')" id="g${groupName}_m${idx}_t2" maxlength="2">
                    </div>
                    <span>${match[1]}</span>
                </div>`;
        });
        html += `</div>`;
        wrapper.innerHTML += html;
    }
}

// State
let selectedTeams = {
    ro32: new Set(), ro16: new Set(), qf: new Set(), sf: new Set(),
    final: new Set(), third: new Set(), winner: null, thirdWinner: null
};

// Navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tabs button').forEach(el => el.classList.remove('active'));
    document.getElementById(`${tabId}-container`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
}

// Knockout Setup
function initRO32() {
    const container = document.getElementById('ro32-selection');
    for (const [groupName, teams] of Object.entries(groups)) {
        teams.forEach(team => {
            let btn = document.createElement('button');
            btn.className = 'team-btn';
            btn.innerText = `[${groupName}] ${team}`;
            btn.dataset.group = groupName;
            btn.dataset.team = team;
            btn.onclick = () => toggleRO32(btn);
            container.appendChild(btn);
        });
    }
}

function toggleRO32(btn) {
    const team = btn.dataset.team;
    
    if (selectedTeams.ro32.has(team)) {
        selectedTeams.ro32.delete(team);
        removeFromDownstream('ro32', team);
    } else {
        if (selectedTeams.ro32.size >= 32) return alert("You already selected 32 teams!");
        selectedTeams.ro32.add(team);
    }
    updateRO32UI();
    renderBucket('ro16', 'ro16-selection', selectedTeams.ro32, 16);
    saveProgress();
}

function updateRO32UI() {
    const groupCounts = {};
    for (const g in schedule) groupCounts[g] = 0;
    
    document.querySelectorAll('#ro32-selection .team-btn').forEach(btn => {
        if (selectedTeams.ro32.has(btn.dataset.team)) groupCounts[btn.dataset.group]++;
    });

    let groupsWithThree = Object.values(groupCounts).filter(c => c === 3).length;

    document.querySelectorAll('#ro32-selection .team-btn').forEach(btn => {
        const team = btn.dataset.team;
        const group = btn.dataset.group;
        const isSelected = selectedTeams.ro32.has(team);
        
        btn.classList.toggle('selected', isSelected);
        
        if (!isSelected) {
            if (groupCounts[group] >= 3 || (groupCounts[group] >= 2 && groupsWithThree >= 8) || selectedTeams.ro32.size >= 32) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        } else {
            btn.disabled = false;
        }
    });

    document.getElementById('ro32-status').innerText = `Selected: ${selectedTeams.ro32.size}/32 | Groups with 3 teams: ${groupsWithThree}/8`;
}

function renderBucket(targetStage, containerId, sourceSet, maxCount) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    let targetSet = selectedTeams[targetStage];

    sourceSet.forEach(team => {
        let btn = document.createElement('button');
        btn.className = `team-btn ${targetSet.has(team) ? 'selected' : ''}`;
        btn.innerText = team;
        
        btn.onclick = () => {
            if (targetSet.has(team)) {
                targetSet.delete(team);
                removeFromDownstream(targetStage, team);
            } else {
                if (targetSet.size >= maxCount) return;
                targetSet.add(team);
            }
            
            renderBucket(targetStage, containerId, sourceSet, maxCount);
            if (targetStage === 'ro16') renderBucket('qf', 'qf-selection', selectedTeams.ro16, 8);
            if (targetStage === 'qf') renderBucket('sf', 'sf-selection', selectedTeams.qf, 4);
            if (targetStage === 'sf') renderSplitBuckets();
            saveProgress();
        };
        
        if (!targetSet.has(team) && targetSet.size >= maxCount) btn.disabled = true;
        container.appendChild(btn);
    });
    
    if (document.getElementById(`${targetStage}-status`)) {
        document.getElementById(`${targetStage}-status`).innerText = `Selected: ${targetSet.size}/${maxCount}`;
    }
}

function renderSplitBuckets() {
    const finalContainer = document.getElementById('final-selection');
    const thirdContainer = document.getElementById('third-selection');
    finalContainer.innerHTML = ''; thirdContainer.innerHTML = '';
    
    selectedTeams.sf.forEach(team => {
        let fBtn = document.createElement('button');
        fBtn.className = `team-btn ${selectedTeams.final.has(team) ? 'selected' : ''}`;
        fBtn.innerText = team;
        fBtn.disabled = selectedTeams.third.has(team) || (!selectedTeams.final.has(team) && selectedTeams.final.size >= 2);
        fBtn.onclick = () => {
            if(selectedTeams.final.has(team)) { selectedTeams.final.delete(team); selectedTeams.winner = null; }
            else selectedTeams.final.add(team);
            renderSplitBuckets(); renderWinners(); saveProgress();
        };
        finalContainer.appendChild(fBtn);

        let tBtn = document.createElement('button');
        tBtn.className = `team-btn ${selectedTeams.third.has(team) ? 'selected' : ''}`;
        tBtn.innerText = team;
        tBtn.disabled = selectedTeams.final.has(team) || (!selectedTeams.third.has(team) && selectedTeams.third.size >= 2);
        tBtn.onclick = () => {
            if(selectedTeams.third.has(team)) { selectedTeams.third.delete(team); selectedTeams.thirdWinner = null; }
            else selectedTeams.third.add(team);
            renderSplitBuckets(); renderWinners(); saveProgress();
        };
        thirdContainer.appendChild(tBtn);
    });
    document.getElementById('final-status').innerText = `Finalists: ${selectedTeams.final.size}/2 | 3rd Place: ${selectedTeams.third.size}/2`;
}

function renderWinners() {
    const wContainer = document.getElementById('winner-selection');
    const tContainer = document.getElementById('third-winner-selection');
    wContainer.innerHTML = ''; tContainer.innerHTML = '';

    selectedTeams.final.forEach(team => {
        let btn = document.createElement('button');
        btn.className = `team-btn ${selectedTeams.winner === team ? 'selected' : ''}`;
        btn.innerText = team;
        btn.onclick = () => { selectedTeams.winner = team; renderWinners(); saveProgress(); };
        wContainer.appendChild(btn);
    });

    selectedTeams.third.forEach(team => {
        let btn = document.createElement('button');
        btn.className = `team-btn ${selectedTeams.thirdWinner === team ? 'selected' : ''}`;
        btn.innerText = team;
        btn.onclick = () => { selectedTeams.thirdWinner = team; renderWinners(); saveProgress(); };
        tContainer.appendChild(btn);
    });
}

function removeFromDownstream(stage, team) {
    // Explicitly cascade the deletions downstream based on where the removal happened
    if (stage === 'ro32') {
        selectedTeams.ro16.delete(team);
        selectedTeams.qf.delete(team);
        selectedTeams.sf.delete(team);
        selectedTeams.final.delete(team);
        selectedTeams.third.delete(team);
    } else if (stage === 'ro16') {
        selectedTeams.qf.delete(team);
        selectedTeams.sf.delete(team);
        selectedTeams.final.delete(team);
        selectedTeams.third.delete(team);
    } else if (stage === 'qf') {
        selectedTeams.sf.delete(team);
        selectedTeams.final.delete(team);
        selectedTeams.third.delete(team);
    } else if (stage === 'sf') {
        selectedTeams.final.delete(team);
        selectedTeams.third.delete(team);
    }

    // Always check and clear the ultimate winners just in case
    if (selectedTeams.winner === team) selectedTeams.winner = null;
    if (selectedTeams.thirdWinner === team) selectedTeams.thirdWinner = null;
    
    // Re-render the entire UI to reflect the deleted states
    renderBucket('ro16', 'ro16-selection', selectedTeams.ro32, 16);
    renderBucket('qf', 'qf-selection', selectedTeams.ro16, 8);
    renderBucket('sf', 'sf-selection', selectedTeams.qf, 4);
    renderSplitBuckets();
    renderWinners();
}

// Auto-Save Logic
function saveProgress() {
    let groupScores = {};
    document.querySelectorAll('.match input').forEach(input => {
        if (input.value) groupScores[input.id] = input.value;
    });
    
    let payload = {
        playerName: document.getElementById('player-name').value,
        group: typeof GAME_GROUP !== 'undefined' ? GAME_GROUP : "Default",// <--- ADD THIS LINE
        groupScores,
        knockout: {
            ro32: Array.from(selectedTeams.ro32), ro16: Array.from(selectedTeams.ro16),
            qf: Array.from(selectedTeams.qf), sf: Array.from(selectedTeams.sf),
            final: Array.from(selectedTeams.final), third: Array.from(selectedTeams.third),
            winner: selectedTeams.winner, thirdWinner: selectedTeams.thirdWinner
        }
    };
    localStorage.setItem("wc_save_state", JSON.stringify(payload));
}

function loadProgress() {
    let saved = localStorage.getItem("wc_save_state");
    if (!saved) return;
    
    try {
        let state = JSON.parse(saved);
        if (state.playerName) document.getElementById('player-name').value = state.playerName;
        
        if (state.groupScores) {
            for (let id in state.groupScores) {
                if (document.getElementById(id)) document.getElementById(id).value = state.groupScores[id];
            }
        }
        if (state.knockout) {
            selectedTeams.ro32 = new Set(state.knockout.ro32 || []);
            selectedTeams.ro16 = new Set(state.knockout.ro16 || []);
            selectedTeams.qf = new Set(state.knockout.qf || []);
            selectedTeams.sf = new Set(state.knockout.sf || []);
            selectedTeams.final = new Set(state.knockout.final || []);
            selectedTeams.third = new Set(state.knockout.third || []);
            selectedTeams.winner = state.knockout.winner || null;
            selectedTeams.thirdWinner = state.knockout.thirdWinner || null;

            updateRO32UI();
            renderBucket('ro16', 'ro16-selection', selectedTeams.ro32, 16);
            renderBucket('qf', 'qf-selection', selectedTeams.ro16, 8);
            renderBucket('sf', 'sf-selection', selectedTeams.qf, 4);
            renderSplitBuckets();
            renderWinners();
        }
    } catch(e) { console.error("Save file read error", e); }
}

document.addEventListener('input', saveProgress);

// Submission Logic (Validation + Admin Mode + Google Sheets)
function submitData() {
    let playerName = document.getElementById('player-name').value.trim();
    if (!playerName) return alert("❌ Please enter your name!");

    let isAdmin = (playerName.toUpperCase() === "ADMIN");
    let missingScores = false;
    let groupScores = {};
    
    document.querySelectorAll('.match input').forEach(input => {
        if (input.value === "") missingScores = true;
        groupScores[input.id] = input.value;
    });

    // Validation (Skipped for Admin)
    if (!isAdmin) {
        if (missingScores) return alert("❌ Please fill out all Group Stage scores!");
        if (selectedTeams.ro32.size < 32) return alert("❌ Please select exactly 32 teams for the RO32.");
        if (selectedTeams.ro16.size < 16) return alert("❌ Please select exactly 16 teams for the RO16.");
        if (selectedTeams.qf.size < 8) return alert("❌ Please select exactly 8 teams for the Quarter-Finals.");
        if (selectedTeams.sf.size < 4) return alert("❌ Please select exactly 4 teams for the Semi-Finals.");
        if (selectedTeams.final.size < 2) return alert("❌ Please select 2 Finalists.");
        if (selectedTeams.third.size < 2) return alert("❌ Please select 2 teams for the 3rd Place match.");
        if (!selectedTeams.winner) return alert("❌ Please select the World Champion.");
        if (!selectedTeams.thirdWinner) return alert("❌ Please select the 3rd Place Winner.");
    }

    let payload = {
        playerName: playerName,
        group: typeof GAME_GROUP !== 'undefined' ? GAME_GROUP : "Default", // <--- ADD THIS LINE
        groupScores,
        knockout: {
            ro32: Array.from(selectedTeams.ro32), ro16: Array.from(selectedTeams.ro16),
            qf: Array.from(selectedTeams.qf), sf: Array.from(selectedTeams.sf),
            final: Array.from(selectedTeams.final), third: Array.from(selectedTeams.third),
            winner: selectedTeams.winner, thirdWinner: selectedTeams.thirdWinner
        }
    };

    // Admin Bypass to Clipboard
    if (isAdmin) {
        navigator.clipboard.writeText(JSON.stringify(payload)).then(() => {
            alert("👑 ADMIN MODE: Master JSON copied to clipboard. Paste this into cell B1.");
        });
        return; 
    }

    // Insert your deployed Web App URL here
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDhkkVqOPTfLy7cWJQiHvKNcaDx0i105HeDVVs7si2EWu-xY2mh_3ZQbihzTk5v-rm/exec";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { 
            "Content-Type": "text/plain;charset=utf-8" 
        },
        redirect: "follow"
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === "success") {
            alert("💾 Data saved successfully! Press OK to download your receipt!");
            
            // Generate Native Text PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Your World Cup 2026 Predictions", 20, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(`Player: ${playerName}`, 20, 30);
            
            // --- Knockout Highlights Block ---
            let koY = 45; // Starting Y position
            const maxWidth = 170; // Max text width before breaking

            const addWrappedText = (text) => {
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, 20, koY);
                koY += (lines.length * 6); // Push next line down by 6 units per wrapped line
            };
            
            addWrappedText(`World Champion: ${selectedTeams.winner}`);
            addWrappedText(`3rd Place: ${selectedTeams.thirdWinner}`);
            addWrappedText(`Finalists: ${Array.from(selectedTeams.final).join(', ')}`);
            addWrappedText(`Semi-Finalists: ${Array.from(selectedTeams.sf).join(', ')}`);
            addWrappedText(`Quarter-Finalists: ${Array.from(selectedTeams.qf).join(', ')}`);
            addWrappedText(`Round of 16: ${Array.from(selectedTeams.ro16).join(', ')}`);
            addWrappedText(`Round of 32: ${Array.from(selectedTeams.ro32).join(', ')}`);
            // ---------------------------------
            // --- NEW: Group Stage Scores Block ---
            doc.addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Group Stage Scores", 20, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            
            let yPos = 30;
            let xPos = 20; // First column

            for (const [groupName, matches] of Object.entries(schedule)) {
                doc.setFont("helvetica", "bold");
                doc.text(`Group ${groupName}`, xPos, yPos);
                doc.setFont("helvetica", "normal");
                yPos += 5;

                matches.forEach((match, idx) => {
                    let score1 = groupScores[`g${groupName}_m${idx}_t1`] || "-";
                    let score2 = groupScores[`g${groupName}_m${idx}_t2`] || "-";
                    doc.text(`${match[0]} ${score1}:${score2} ${match[1]}`, xPos, yPos);
                    yPos += 5;
                });
                yPos += 5; // Extra space between groups

                // Move to second column or new page when near bottom
                if (yPos > 260) {
                    if (xPos === 20) {
                        xPos = 110; // Switch to right column
                        yPos = 30;  // Reset vertical position
                    } else {
                        doc.addPage();
                        xPos = 20;  // Reset to left column
                        yPos = 30;  // Reset vertical position
                    }
                }
            }
            // -------------------------------------

            doc.save(`${playerName}_WC2026_Receipt.pdf`);

        } else {
            alert("⚠️ Script connected, but returned an error.");
            console.error(data);
        }
    });
}

// Initialize on load
initGroupStage();
initRO32();
loadProgress();