// ==================== CONFIGURATION ====================

const API_URL = window.location.origin;
let authToken = null;
let loggedUser = null;
let gameSessionId = null;
let currentLevel = 1;
let currentHearts = 5;
let guessedLetters = [];
let currentPhraseLength = 0;
let currentSpaces = [];
let timerInterval = null;
let formattedTime = '00:00';
let seconds = 0;
let minutes = 0;
let isMultiplayer = false;
let multiplayerGameId = null;
let opponentName = null;

// ==================== DOM REFERENCES ====================

const registerform = document.getElementById('registerform');
const loginform = document.getElementById('loginform');
const fullcontainer = document.querySelector('.fullcontainer');
const container = document.querySelector('.container');
const factcont = document.querySelector('.factcontainer');
const hintcont = document.querySelector('.hintcontainer');
const successcont = document.querySelector('.success');
const SuccessPhrase = document.querySelector('.SuccessPhrase');
const explanationbox = document.querySelector('.explanationbox');
const bodydiags = document.getElementById('bodydiags');
const headtext = document.getElementById('leveltext');
const unclickable2 = document.querySelector('.unclickable2');
const mainmenu = document.querySelector('.mainmenu');
const endbox = document.querySelector('.gameend');
const leaderboardcont = document.querySelector('.leaderboardcont');
const gameover = document.getElementById('gameover');
const muteToggle = document.getElementById('muteToggle');
const bgmusic = document.getElementById('bgmusic');

// ==================== HINT SYSTEM ====================

var hintword = [];
var usedHintWords = [];
var lettermap = {};
var phrase = "";
var hintsLoaded = false;
var currentHints = [];

async function loadHintsFromServer(phrase) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/hints/${encodeURIComponent(phrase)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to load hints');
        return await response.json();
    } catch (error) {
        console.error('Error loading hints:', error);
        return null;
    }
}

// ==================== FILL FUNCTIONS ====================

function fillAllBoxesWithNumber(number, letter) {
    console.log('🔍 Filling all boxes with number:', number, 'letter:', letter);
    
    const mainInputs = document.querySelectorAll('.main-input');
    mainInputs.forEach(input => {
        if (input.dataset.number === number && !input.disabled) {
            input.value = letter;
            input.style.backgroundColor = '#3a9a46';
            input.style.borderColor = '#4CAF50';
            input.disabled = true;
        }
    });
    
    const hintInputs = document.querySelectorAll('.hint-input');
    hintInputs.forEach(input => {
        if (input.dataset.number === number && !input.disabled) {
            input.value = letter;
            input.style.backgroundColor = '#3a9a46';
            input.style.borderColor = '#4CAF50';
            input.disabled = true;
        }
    });
    
    checkPhraseCompleteFromHints();
}

function clearAllBoxesWithNumber(number) {
    const mainInputs = document.querySelectorAll('.main-input');
    mainInputs.forEach(input => {
        if (input.dataset.number === number) {
            input.value = '';
            input.disabled = false;
            input.style.backgroundColor = 'rgba(255,255,255,0.1)';
            input.style.borderColor = '#666';
        }
    });
    
    const hintInputs = document.querySelectorAll('.hint-input');
    hintInputs.forEach(input => {
        if (input.dataset.number === number) {
            input.value = '';
            input.disabled = false;
            input.style.backgroundColor = 'rgba(255,255,255,0.05)';
            input.style.borderColor = '#666';
        }
    });
}

// ==================== HIGHLIGHT FUNCTIONS ====================

function highlightMatchingBoxes(number) {
    const mainInputs = document.querySelectorAll('.main-input');
    mainInputs.forEach(input => {
        if (input.dataset.number === number) {
            input.style.borderColor = '#4CAF50';
            input.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.5)';
            input.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
        }
    });
    
    const hintInputs = document.querySelectorAll('.hint-input');
    hintInputs.forEach(input => {
        if (input.dataset.number === number) {
            input.style.borderColor = '#4CAF50';
            input.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.5)';
            input.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
        }
    });
}

function clearHighlights() {
    const mainInputs = document.querySelectorAll('.main-input');
    mainInputs.forEach(input => {
        if (!input.disabled) {
            input.style.borderColor = '#666';
            input.style.boxShadow = 'none';
            input.style.backgroundColor = 'rgba(255,255,255,0.1)';
        } else {
            input.style.borderColor = '#4CAF50';
            input.style.boxShadow = 'none';
            input.style.backgroundColor = '#3a9a46';
        }
    });
    
    const hintInputs = document.querySelectorAll('.hint-input');
    hintInputs.forEach(input => {
        if (!input.disabled) {
            input.style.borderColor = '#666';
            input.style.boxShadow = 'none';
            input.style.backgroundColor = 'rgba(255,255,255,0.05)';
        } else {
            input.style.borderColor = '#4CAF50';
            input.style.boxShadow = 'none';
            input.style.backgroundColor = '#3a9a46';
        }
    });
}

// ==================== CREATE MAIN PHRASE BOXES ====================

function createBoxes() {
    let letterindex = 0;
    const containerofinputs = document.createElement('div');
    containerofinputs.classList.add('containerofinputs');
    containerofinputs.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        padding: 10px;
    `;

    containerofinputs.addEventListener('click', function(e) {
        if (e.target === this) clearHighlights();
    });

    for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] === ' ') {
            const spaceDiv = document.createElement('div');
            spaceDiv.style.cssText = `width: 20px; height: 55px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;`;
            const spaceInput = document.createElement('input');
            spaceInput.type = "text";
            spaceInput.maxLength = 1;
            spaceInput.disabled = true;
            spaceInput.value = ' ';
            spaceInput.style.cssText = `width: 100%; height: 40px; border: none; background: transparent; color: white; font-size: 20px; text-align: center;`;
            spaceDiv.appendChild(spaceInput);
            containerofinputs.appendChild(spaceDiv);
        } else if (/^[a-zA-Z]$/.test(phrase[i])) {
            const letter = phrase[i].toUpperCase();
            if (!(letter in lettermap)) {
                lettermap[letter] = Object.keys(lettermap).length + 1;
            }

            const inputcont = document.createElement('div');
            inputcont.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 2px; width: 45px; cursor: pointer;`;

            const input = document.createElement('input');
            input.type = "text";
            input.maxLength = 1;
            input.id = 'letter' + letterindex;
            input.dataset.letter = letter;
            input.dataset.position = i;
            input.dataset.number = lettermap[letter];
            input.className = 'main-input';
            input.style.cssText = `
                text-transform: uppercase;
                display: block;
                width: 40px;
                height: 40px;
                text-align: center;
                font-size: 22px;
                font-weight: bold;
                background: rgba(255,255,255,0.1);
                color: white;
                border: 2px solid #666;
                border-radius: 4px;
                transition: all 0.3s ease;
                caret-color: white;
                cursor: pointer;
            `;
            input.autocomplete = "off";
            
            input.addEventListener('click', function(e) {
                const number = this.dataset.number;
                clearHighlights();
                highlightMatchingBoxes(number);
                e.stopPropagation();
            });
            
            input.addEventListener('input', function(e) {
                const input = this;
                const value = input.value.toUpperCase();
                const correctLetter = input.dataset.letter;
                const number = input.dataset.number;
                if (!value) return;
                if (!/^[A-Z]$/.test(value)) {
                    input.value = '';
                    return;
                }
                if (value === correctLetter) {
                    input.style.backgroundColor = '#3a9a46';
                    input.style.borderColor = '#4CAF50';
                    input.disabled = true;
                    fillAllBoxesWithNumber(number, value);
                    pressSound();
                    const allInputs = document.querySelectorAll('.main-input');
                    for (let i = 0; i < allInputs.length; i++) {
                        if (allInputs[i] === input && i < allInputs.length - 1) {
                            const next = allInputs[i + 1];
                            if (next && !next.disabled && !next.value) {
                                next.focus();
                                break;
                            }
                        }
                    }
                } else {
                    currentHearts--;
                    updateHeartCount(currentHearts);
                    wrongSound();
                    input.style.borderColor = 'red';
                    input.style.backgroundColor = 'rgba(255,0,0,0.3)';
                    setTimeout(() => {
                        input.style.borderColor = '#666';
                        input.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        input.value = '';
                    }, 300);
                    if (currentHearts === 0) showGameOver(phrase, '');
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value) {
                    const number = this.dataset.number;
                    clearAllBoxesWithNumber(number);
                    const allInputs = document.querySelectorAll('.main-input');
                    let prev = null;
                    for (let i = 0; i < allInputs.length; i++) {
                        if (allInputs[i] === this && i > 0) {
                            prev = allInputs[i - 1];
                            break;
                        }
                    }
                    if (prev && !prev.disabled) {
                        prev.value = '';
                        prev.focus();
                    }
                }
            });
            
            inputcont.appendChild(input);

            const number = document.createElement('span');
            number.style.cssText = `font-size: 14px; color: #4CAF50; font-weight: bold; text-align: center; height: 20px; line-height: 20px; font-family: monospace;`;
            number.textContent = lettermap[letter];
            inputcont.appendChild(number);

            containerofinputs.appendChild(inputcont);
            letterindex++;
        }
    }

    const oldContainer = document.querySelector('.containerofinputs');
    if (oldContainer) oldContainer.remove();
    factcont.appendChild(containerofinputs);
    factcont.style.display = 'flex';
    factcont.style.justifyContent = 'center';
    factcont.style.alignItems = 'center';
}

// ==================== CREATE HINTS ====================

async function createHintsForPhrase(phrase) {
    if (!hintcont) return;
    hintcont.innerHTML = '';
    if (!phrase) {
        hintcont.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">No hints available</p>';
        return;
    }
    
    const data = await loadHintsFromServer(phrase);
    if (!data || !data.hints || data.hints.length === 0) {
        hintcont.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">No hints available</p>';
        return;
    }
    
    if (data.lettermap) lettermap = data.lettermap;
    currentHints = data.hints;
    hintword = data.hints;
    
    const title = document.createElement('h3');
    title.textContent = '💡 Solve the Hints';
    title.style.cssText = `color: #4CAF50; text-align: center; font-size: 20px; margin-bottom: 15px; font-family: Arial, sans-serif;`;
    hintcont.appendChild(title);
    
    data.hints.forEach((hint) => {
        const word = hint.word;
        const explanation = hint.explanation;
        
        const wordContainer = document.createElement('div');
        wordContainer.className = 'hintwords';
        wordContainer.style.cssText = `
            border: 1px solid rgba(255,255,255,0.15);
            padding: 12px;
            margin: 10px 0;
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            color: white;
            cursor: default;
        `;
        hintcont.appendChild(wordContainer);
        
        wordContainer.addEventListener('click', function(e) {
            if (e.target === this || e.target.closest('.hint-explanation') || e.target.closest('.hint-word-display')) {
                clearHighlights();
            }
        });
        
        const explanationSpan = document.createElement('div');
        explanationSpan.className = 'hint-explanation';
        explanationSpan.textContent = `📖 ${explanation}`;
        explanationSpan.style.cssText = `font-size: 16px; color: #ddd; margin-bottom: 8px; font-style: italic;`;
        wordContainer.appendChild(explanationSpan);
        
        const wordDisplay = document.createElement('div');
        wordDisplay.className = 'hint-word-display';
        wordDisplay.style.cssText = `display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center; padding: 5px 0;`;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            if (letter === ' ') {
                const spaceSpan = document.createElement('span');
                spaceSpan.style.cssText = `width: 15px; height: 30px; display: inline-block;`;
                wordDisplay.appendChild(spaceSpan);
            } else {
                const letterBox = document.createElement('div');
                letterBox.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 2px; width: 32px; cursor: pointer;`;
                
                const box = document.createElement('input');
                box.type = "text";
                box.maxLength = 1;
                box.value = "";
                box.className = 'hint-input';
                box.autocomplete = "off";
                box.dataset.letter = letter.toUpperCase();
                box.dataset.number = lettermap[letter.toUpperCase()] || '?';
                box.style.cssText = `
                    width: 32px;
                    height: 32px;
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    background: rgba(255,255,255,0.05);
                    color: white;
                    border: 2px solid #666;
                    border-radius: 4px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    caret-color: white;
                    cursor: pointer;
                `;
                
                box.addEventListener('click', function(e) {
                    const number = this.dataset.number;
                    clearHighlights();
                    highlightMatchingBoxes(number);
                    e.stopPropagation();
                });
                
                box.addEventListener('input', function(e) {
                    const input = this;
                    const value = input.value.toUpperCase();
                    const correctLetter = input.dataset.letter;
                    const number = input.dataset.number;
                    if (!value) return;
                    if (!/^[A-Z]$/.test(value)) {
                        input.value = '';
                        return;
                    }
                    if (value === correctLetter) {
                        fillAllBoxesWithNumber(number, value);
                        pressSound();
                        const allBoxes = wordContainer.querySelectorAll('.hint-input');
                        let nextBox = null;
                        for (let i = 0; i < allBoxes.length; i++) {
                            if (allBoxes[i] === input && i < allBoxes.length - 1) {
                                nextBox = allBoxes[i + 1];
                                if (nextBox && !nextBox.disabled && !nextBox.value) {
                                    nextBox.focus();
                                    break;
                                }
                            }
                        }
                    } else {
                        currentHearts--;
                        updateHeartCount(currentHearts);
                        wrongSound();
                        input.style.borderColor = 'red';
                        input.style.backgroundColor = 'rgba(255,0,0,0.3)';
                        setTimeout(() => {
                            input.style.borderColor = '#666';
                            input.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            input.value = '';
                        }, 300);
                        if (currentHearts === 0) showGameOver(phrase, '');
                    }
                });
                
                box.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !this.value) {
                        const number = this.dataset.number;
                        clearAllBoxesWithNumber(number);
                        const allBoxes = wordContainer.querySelectorAll('.hint-input');
                        let prevBox = null;
                        for (let i = 0; i < allBoxes.length; i++) {
                            if (allBoxes[i] === this && i > 0) {
                                prevBox = allBoxes[i - 1];
                                break;
                            }
                        }
                        if (prevBox) prevBox.focus();
                    }
                });
                
                letterBox.appendChild(box);
                
                const numberSpan = document.createElement('span');
                numberSpan.className = 'hint-number';
                numberSpan.style.cssText = `font-size: 12px; color: #4CAF50; font-weight: bold; text-align: center; font-family: monospace; cursor: pointer;`;
                numberSpan.textContent = lettermap[letter.toUpperCase()] || '?';
                letterBox.appendChild(numberSpan);
                
                wordDisplay.appendChild(letterBox);
            }
        }
        wordContainer.appendChild(wordDisplay);
    });
}

// ==================== CHECK COMPLETION ====================

function checkPhraseCompleteFromHints() {
    const allInputs = document.querySelectorAll('.main-input');
    let allFilled = true;
    let filledCount = 0;
    let totalCount = allInputs.length;
    
    for (const input of allInputs) {
        if (!input.value && !input.disabled) {
            allFilled = false;
            break;
        }
        if (input.value) filledCount++;
    }
    
    console.log(`📊 Filled ${filledCount}/${totalCount} letters`);
    
    if (allFilled) {
        console.log('🎉 All letters filled! Completing level...');
        allInputs.forEach(input => input.disabled = true);
        setTimeout(() => completeLevel(), 500);
    }
}

// ==================== COMPLETE LEVEL ====================

async function completeLevel() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please login again.');
            return;
        }
        
        const response = await fetch('/api/game/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId: gameSessionId })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');
        
        if (data.levelComplete) {
            if (data.gameComplete) {
                showGameComplete(data.score, data.timeTaken);
            } else {
                if (data.newPhrase) phrase = data.newPhrase;
                if (data.newLettermap) lettermap = data.newLettermap;
                if (data.hints) currentHints = data.hints;
                if (data.nextLevel) currentLevel = data.nextLevel;
                if (data.hearts !== undefined) currentHearts = data.hearts;
                showLevelComplete(data.nextLevel, data.score);
            }
        }
    } catch (error) {
        console.error('Complete level error:', error);
        alert('Failed to complete level. Please try again.');
        const allInputs = document.querySelectorAll('.main-input');
        allInputs.forEach(input => {
            if (!input.value) input.disabled = false;
        });
    }
}

// ==================== SOCKET.IO ====================

let socket = null;

function initializeSocket() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('⚠️ No token, skipping socket connection');
        return;
    }
    
    socket = io(window.location.origin, {
        auth: { token: token }
    });
    
    socket.on('connect', () => {
        console.log('🔌 Socket connected');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        if (error.message === 'Authentication required' || error.message === 'Invalid token') {
            forceLogout();
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
    });
    
    socket.on('new message', (data) => {
        const messages = document.getElementById('messages');
        const messageElement = document.createElement('li');
        messageElement.textContent = data.user + ': ' + data.message;
        messages.appendChild(messageElement);
        messages.scrollTop = messages.scrollHeight;
    });
    
    socket.on('load messages', (receivedMessages) => {
        const messages = document.getElementById('messages');
        messages.innerHTML = '';
        receivedMessages.forEach((message) => {
            const messageElement = document.createElement('li');
            messageElement.textContent = message.user + ': ' + message.message;
            messages.appendChild(messageElement);
        });
        messages.scrollTop = messages.scrollHeight;
    });
    
    socket.on('match found', (data) => {
        console.log('🎯 Match found! Opponent:', data.opponentname);
        opponentName = data.opponentname;
        multiplayerGameId = data.gameId;
        isMultiplayer = true;
        currentPhraseLength = data.phraseLength;
        currentSpaces = data.spaces;
        document.getElementById('findtext').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('goback').style.display = 'none';
        startMultiplayerGame();
    });
    
    socket.on('winner', (data) => {
        showMultiplayerWin(data.phrase, data.explanation, data.time);
    });
    
    socket.on('loser', (data) => {
        showMultiplayerLoss(data.winner, data.phrase, data.explanation);
    });
    
    socket.on('opponent_disconnected', () => {
        alert('Your opponent disconnected!');
        forceLogout();
    });
    
    socket.on('guess_result', (data) => {
        if (data.correct) {
            data.positions.forEach(pos => fillLetter(pos, data.letter || ''));
        }
    });
}

// ==================== AUTHENTICATION ====================

function showregister() {
    loginform.style.display = 'none';
    registerform.style.display = 'flex';
    loginform.reset();
    document.getElementById('loginError').textContent = '';
}

function showlogin() {
    loginform.style.display = 'flex';
    registerform.style.display = 'none';
    registerform.reset();
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
}

document.getElementById('registerform').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const usernameErrorDiv = document.getElementById('usernameError');
    const passwordErrorDiv = document.getElementById('passwordError');
    usernameErrorDiv.textContent = '';
    passwordErrorDiv.textContent = '';
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (!response.ok) {
            if (result.error && result.error.includes('Username')) {
                usernameErrorDiv.textContent = result.error;
            } else {
                passwordErrorDiv.textContent = result.error || 'Registration failed';
            }
        } else {
            alert('Registration successful!');
            showlogin();
        }
    } catch (err) {
        passwordErrorDiv.textContent = 'An unexpected error occurred';
    }
});

// ==================== LOGIN FORM ====================

document.getElementById('loginform').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = e.target.username.value;
    const password = e.target.password.value;
    const loginErrorDiv = document.getElementById('loginError');
    loginErrorDiv.textContent = '';
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) {
            loginErrorDiv.textContent = data.error || 'Invalid username or password';
            return;
        }
        
        authToken = data.token;
        loggedUser = data.username;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('username', loggedUser);
        
        console.log('✅ Login successful!');
        showgame();
        initializeSocket();
        bgmusic.play();
    } catch (err) {
        loginErrorDiv.textContent = 'An unexpected error occurred';
        console.error('Login error:', err);
    }
});

function showgame() {
    fullcontainer.style.display = 'none';
    container.style.display = 'flex';
    mainmenu.style.display = 'block';
}

// ==================== GAME FUNCTIONS ====================

async function startGame() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please login first');
            forceLogout();
            return;
        }
        
        const response = await fetch('/api/game/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            alert('Session expired. Please login again.');
            forceLogout();
            return;
        }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to start game');
        
        gameSessionId = data.sessionId;
        currentLevel = data.level;
        currentHearts = data.hearts;
        currentPhraseLength = data.phraseLength;
        currentSpaces = data.spaces;
        guessedLetters = [];
        isMultiplayer = false;
        
        if (data.phrase) phrase = data.phrase;
        if (data.lettermap) lettermap = data.lettermap;
        if (data.hints) currentHints = data.hints;
        
        mainmenu.style.transition = "opacity 1s ease";
        mainmenu.style.opacity = 0;
        setTimeout(() => mainmenu.style.display = "none", 1000);
        
        const gamecontainers = document.querySelector('.gamecontainers');
        gamecontainers.style.display = 'block';
        gamecontainers.style.opacity = 1;
        headtext.innerHTML = 'Level: ' + currentLevel;
        
        createBoxes();
        updateHeartCount(currentHearts);
        if (phrase) await createHintsForPhrase(phrase);
        startTimer();
        bgmusic.play();
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    }
}

function updateHeartCount(hearts) {
    const heartElements = document.querySelectorAll('.heart');
    for (let i = 0; i < heartElements.length; i++) {
        heartElements[i].style.visibility = i < hearts ? 'visible' : 'hidden';
    }
    if (hearts === 0) {
        unclickable2.style.display = "block";
        gameover.style.display = 'block';
        gameoversound();
        bgmusic.pause();
    }
}

// ==================== LEVEL / GAME COMPLETE ====================

function showLevelComplete(nextLevel, score) {
    const successcont = document.querySelector('.success');
    const bodydiags = document.getElementById('bodydiags');
    if (!successcont) return;
    
    successcont.style.display = 'block';
    bodydiags.style.display = 'block';
    const gamecontainers = document.querySelector('.gamecontainers');
    if (gamecontainers) gamecontainers.style.display = 'none';
    currentLevel = nextLevel;
    
    const SuccessPhrase = document.querySelector('.SuccessPhrase');
    const explanationbox = document.querySelector('.explanationbox');
    if (SuccessPhrase) SuccessPhrase.innerHTML = 'Level ' + (nextLevel - 1) + ' Complete! 🎉';
    if (explanationbox) explanationbox.innerHTML = 'Score: ' + score + ' | Ready for Level ' + nextLevel;
    successSound();
}

function showGameComplete(score, time) {
    const successcont = document.querySelector('.success');
    const bodydiags = document.getElementById('bodydiags');
    successcont.style.display = 'block';
    bodydiags.style.display = 'block';
    const gamecontainers = document.querySelector('.gamecontainers');
    if (gamecontainers) gamecontainers.style.display = 'none';
    
    const SuccessPhrase = document.querySelector('.SuccessPhrase');
    const explanationbox = document.querySelector('.explanationbox');
    SuccessPhrase.innerHTML = '🎉 YOU WIN! 🎉';
    explanationbox.innerHTML = 'Time: ' + time + ' | Score: ' + score + ' | You completed all 10 levels!';
    stopTimer();
    playCompleteAudio();
}

function showGameOver(phrase, explanation) {
    unclickable2.style.display = "block";
    gameover.style.display = 'block';
    document.querySelector('.gamecontainers').style.display = 'none';
    const gameOverPhrase = document.getElementById('gameOverPhrase');
    if (gameOverPhrase) gameOverPhrase.textContent = 'The phrase was: ' + phrase;
    stopTimer();
    gameoversound();
    bgmusic.pause();
}

function startnext() {
    const containerofinputs = document.querySelector('.containerofinputs');
    if (containerofinputs) containerofinputs.remove();
    document.querySelector('.success').style.display = 'none';
    document.getElementById('bodydiags').style.display = 'none';
    const gamecontainers = document.querySelector('.gamecontainers');
    if (gamecontainers) {
        gamecontainers.style.display = 'block';
        gamecontainers.style.opacity = 1;
    }
    headtext.innerHTML = 'Level: ' + currentLevel;
    createBoxes();
    updateHeartCount(currentHearts);
    if (phrase) createHintsForPhrase(phrase);
}

function fillLetter(position, letter) {
    const inputs = document.querySelectorAll('.main-input');
    for (const input of inputs) {
        if (parseInt(input.dataset.position) === position) {
            input.value = letter;
            input.style.backgroundColor = '#3a9a46';
            input.style.borderColor = '#4CAF50';
            input.disabled = true;
        }
    }
}

// ==================== MULTIPLAYER ====================

function startMultiplayerGame() {
    const gamecontainers = document.querySelector('.gamecontainers');
    gamecontainers.style.display = 'block';
    gamecontainers.style.opacity = 1;
    headtext.innerHTML = 'Multiplayer vs ' + opponentName;
    mainmenu.style.display = 'none';
    createGameUI(currentPhraseLength, currentSpaces);
    updateHeartCount(500);
    startTimer();
}

function showMultiplayerWin(phrase, explanation, time) {
    const winnercont = document.querySelector(".win");
    winnercont.style.display = 'block';
    document.querySelector('.gamecontainers').style.display = 'none';
    document.getElementById('winPhrase').textContent = 'The phrase was: ' + phrase;
    document.getElementById('winTime').textContent = 'Time: ' + time;
    stopTimer();
    playCompleteAudio();
}

function showMultiplayerLoss(winner, phrase, explanation) {
    const losercont = document.querySelector(".loss");
    losercont.style.display = 'block';
    document.querySelector('.gamecontainers').style.display = 'none';
    document.getElementById('lossPhrase').textContent = 'The phrase was: ' + phrase;
    document.getElementById('lossWinner').textContent = 'Winner: ' + winner;
    stopTimer();
}

function findmatch() {
    mainmenu.style.display = 'none';
    bodydiags.style.display = 'block';
    document.getElementById('findtext').style.display = 'block';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('goback').style.display = 'block';
    if (socket) {
        socket.emit('addmatch');
    } else {
        alert('Please login first');
        forceLogout();
    }
}

function dcmatch() {
    if (socket) socket.emit('dcmatch');
    mainmenus();
}

function createGameUI(length, spaces) {
    const containerofinputs = document.createElement('div');
    containerofinputs.classList.add('containerofinputs');
    containerofinputs.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        padding: 10px;
    `;
    factcont.appendChild(containerofinputs);
}

// ==================== TIMER ====================

function startTimer() {
    seconds = 0;
    minutes = 0;
    formattedTime = '00:00';
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        formattedTime = padNumber(minutes) + ':' + padNumber(seconds);
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) timerDisplay.textContent = formattedTime;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function padNumber(number) {
    return (number < 10) ? '0' + number : number;
}

// ==================== AUDIO FUNCTIONS ====================

function pressSound() {
    try { const audio = new Audio('sounds/press.wav'); audio.play(); } catch (e) {}
}
function wrongSound() {
    try { const audio = new Audio('sounds/wrong.wav'); audio.play(); } catch (e) {}
}
function successSound() {
    try { const audio = new Audio('sounds/success.wav'); audio.play(); } catch (e) {}
}
function gameoversound() {
    try { 
        const audio = new Audio('sounds/lose.mp3');
        audio.volume = 0.3;
        audio.loop = true;
        audio.play();
    } catch (e) {}
}
function playCompleteAudio() {
    try { const audio = new Audio('sounds/complete.mp3'); audio.play(); } catch (e) {}
}
function buttonclicksound() {
    try { const audio = new Audio('sounds/btnclick.wav'); audio.play(); } catch (e) {}
}

// ==================== UI FUNCTIONS ====================

function mainmenus() {
    stopTimer();
    buttonclicksound();
    if (socket) socket.emit('dcmatch');
    currentHearts = 5;
    currentLevel = 1;
    isMultiplayer = false;
    multiplayerGameId = null;
    opponentName = null;
    
    const containerofinputs = document.querySelector('.containerofinputs');
    if (containerofinputs) containerofinputs.remove();
    
    const gamecontainers = document.querySelector('.gamecontainers');
    if (gamecontainers) gamecontainers.style.display = 'none';
    const successEl = document.querySelector('.success');
    if (successEl) successEl.style.display = 'none';
    const lossEl = document.querySelector('.loss');
    if (lossEl) lossEl.style.display = 'none';
    const winEl = document.querySelector('.win');
    if (winEl) winEl.style.display = 'none';
    const gameoverEl = document.getElementById('gameover');
    if (gameoverEl) gameoverEl.style.display = 'none';
    const findtextEl = document.getElementById('findtext');
    if (findtextEl) findtextEl.style.display = 'none';
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const gobackEl = document.getElementById('goback');
    if (gobackEl) gobackEl.style.display = 'none';
    if (leaderboardcont) leaderboardcont.style.display = 'none';
    if (endbox) endbox.style.display = 'none';
    if (unclickable2) unclickable2.style.display = 'none';
    if (mainmenu) {
        mainmenu.style.display = 'block';
        mainmenu.style.opacity = 1;
    }
    if (bodydiags) bodydiags.style.display = 'none';
    updateHeartCount(5);
}

function restart() {
    buttonclicksound();
    mainmenus();
    startGame();
}

function showleaderboard() {
    mainmenu.style.display = 'none';
    bodydiags.style.display = 'block';
    leaderboardcont.style.display = 'block';
    displayLeaderboard();
}

async function displayLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        const top10Divs = document.querySelectorAll('.top10');
        top10Divs.forEach(div => div.innerHTML = '');
        let displayed = 0;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            if (displayed >= top10Divs.length) break;
            const entry = data[i];
            if (entry.bestTime === "null" && entry.MMR === 0) continue;
            const topDiv = top10Divs[displayed];
            topDiv.innerHTML = `
                <p class='leadname'>${entry.username} 
                    <div class="rank">Rank</div> 
                    <div class="ranknum">${i + 1}</div> 
                </p>
                <p class='time' style="margin-top: -30px;">
                    Time: ${entry.bestTime} | MMR: ${entry.MMR}
                </p>
            `;
            displayed++;
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

function closetab() {
    location.reload();
}

// ==================== LOGOUT (CLEAN) ====================

function forceLogout() {
    console.log("🚪 Logging out...");

    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    authToken = null;
    loggedUser = null;

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    stopTimer();
    bgmusic.pause();

    currentHearts = 5;
    currentLevel = 1;
    isMultiplayer = false;
    multiplayerGameId = null;
    opponentName = null;

    document.querySelectorAll('.containerofinputs').forEach(el => el.remove());

    const gamecontainers = document.querySelector('.gamecontainers');
    if (gamecontainers) gamecontainers.style.display = 'none';
    const successEl = document.querySelector('.success');
    if (successEl) successEl.style.display = 'none';
    const lossEl = document.querySelector('.loss');
    if (lossEl) lossEl.style.display = 'none';
    const winEl = document.querySelector('.win');
    if (winEl) winEl.style.display = 'none';
    const gameoverEl = document.getElementById('gameover');
    if (gameoverEl) gameoverEl.style.display = 'none';
    const leaderboardEl = document.querySelector('.leaderboardcont');
    if (leaderboardEl) leaderboardEl.style.display = 'none';
    const endboxEl = document.querySelector('.gameend');
    if (endboxEl) endboxEl.style.display = 'none';
    const unclickable2El = document.querySelector('.unclickable2');
    if (unclickable2El) unclickable2El.style.display = 'none';
    const findtextEl = document.getElementById('findtext');
    if (findtextEl) findtextEl.style.display = 'none';
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const gobackEl = document.getElementById('goback');
    if (gobackEl) gobackEl.style.display = 'none';

    fullcontainer.style.display = 'flex';
    container.style.display = 'none';
    loginform.style.display = 'flex';
    registerform.style.display = 'none';
    mainmenu.style.display = 'none';
    bodydiags.style.display = 'none';

    updateHeartCount(5);
    loginform.reset();
    document.getElementById('loginError').textContent = '';

    console.log('✅ Logged out successfully');
}

// Alias for backward compatibility
const logout = forceLogout;

// ==================== MUSIC CONTROLS ====================

bgmusic.volume = 0.2;
muteToggle.addEventListener('click', () => {
    if (bgmusic.paused) {
        bgmusic.play();
        muteToggle.style.backgroundColor = 'white';
        muteToggle.style.backgroundImage = 'url(images/unmute.png)';
    } else {
        bgmusic.pause();
        muteToggle.style.backgroundColor = 'white';
        muteToggle.style.backgroundImage = 'url(images/mute.png)';
    }
});

// ==================== CHAT ====================

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    sendButton.onclick = function() {
        const message = messageInput.value.trim();
        if (message && socket) {
            socket.emit('new message', { message: message });
            messageInput.value = '';
        }
    };
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendButton.click();
    });
});

// ==================== AUTO-LOGIN CHECK ====================

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    if (!token || !username) {
        console.log('ℹ️ No saved credentials found');
        fullcontainer.style.display = 'flex';
        container.style.display = 'none';
        loginform.style.display = 'flex';
        registerform.style.display = 'none';
        mainmenu.style.display = 'none';
        bodydiags.style.display = 'none';
        return;
    }

    try {
        console.log('🔍 Validating token with /api/auth/validate...');
        
        const res = await fetch('/api/auth/validate', {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error('Invalid token');
        }

        const data = await res.json();
        authToken = token;
        loggedUser = data.username;

        console.log("✅ Auto-login successful!");
        showgame();
        initializeSocket();
        bgmusic.play();

    } catch (err) {
        console.log("❌ Auto-login failed:", err.message);
        forceLogout();
    }
    
    const buttons = document.querySelectorAll('button:not(#muteToggle)');
    const hoverSound = new Audio('sounds/hoversound.wav');
    buttons.forEach(button => {
        button.addEventListener('mouseover', () => { hoverSound.play(); });
        button.addEventListener('click', buttonclicksound);
    });
});

// ==================== EXPOSE FUNCTIONS TO HTML ====================

window.startGame = startGame;
window.startnext = startnext;
window.restart = restart;
window.mainmenus = mainmenus;
window.showleaderboard = showleaderboard;
window.closetab = closetab;
window.findmatch = findmatch;
window.dcmatch = dcmatch;
window.showlogin = showlogin;
window.showregister = showregister;
window.logout = forceLogout;
window.forceLogout = forceLogout;