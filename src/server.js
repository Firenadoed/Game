const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8'])
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET
const MONGODB_URI = process.env.MONGODB_URI 
// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// ==================== DATABASE CONNECTION ====================

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== SCHEMAS ====================

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    socketId: { type: String, default: '0' },
    online: { type: Boolean, default: false },
    bestTime: { type: String, default: "null" },
    bestWS: { type: Number, default: 0 },
    MMR: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const GameSessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true },
    username: String,
    level: { type: Number, default: 1 },
    hearts: { type: Number, default: 5 },
    currentPhrase: String,
    currentExplanation: String,
    guessedLetters: [String],
    startTime: Date,
    lastActivity: Date,
    completed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }
});

const MessageSchema = new mongoose.Schema({
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const GameSession = mongoose.model('GameSession', GameSessionSchema);
const Message = mongoose.model('Message', MessageSchema);

// ==================== GAME PHRASES ====================

const GAME_PHRASES = [
    { 
        phrase: "The first computer programmer was Ada Lovelace", 
        explanation: "Ada Lovelace wrote the first algorithm intended to be carried out by a machine",
        difficulty: "medium"
    },
    { 
        phrase: "Python is a popular programming language for beginners", 
        explanation: "Python's simple syntax and readability make it a great choice for newcomers",
        difficulty: "easy"
    },
    { 
        phrase: "The World Wide Web was invented by Tim Berners Lee", 
        explanation: "Tim Berners Lee created the World Wide Web to facilitate information sharing among scientists",
        difficulty: "medium"
    },
    { 
        phrase: "JavaScript is used to make web pages interactive", 
        explanation: "JavaScript allows developers to create dynamic and interactive web elements",
        difficulty: "easy"
    },
    { 
        phrase: "HTML stands for HyperText Markup Language", 
        explanation: "HTML is the standard language used to create web pages",
        difficulty: "easy"
    },
    { 
        phrase: "An algorithm is a step by step procedure for solving a problem", 
        explanation: "Algorithms are essential for computer programming and problem-solving",
        difficulty: "easy"
    },
    { 
        phrase: "A byte consists of eight bits", 
        explanation: "A byte is a basic unit of information in computing and digital communications",
        difficulty: "easy"
    },
    { 
        phrase: "Linux is an open source operating system", 
        explanation: "Linux is widely used in servers, desktops, and mobile devices",
        difficulty: "medium"
    },
    { 
        phrase: "A function in programming is a block of code that performs a specific task", 
        explanation: "Functions help in organizing and reusing code efficiently",
        difficulty: "easy"
    },
    { 
        phrase: "Binary code is the fundamental language of computers", 
        explanation: "Binary code uses zeros and ones to represent data and instructions in computing",
        difficulty: "easy"
    },
    { 
        phrase: "C is a powerful general purpose programming language", 
        explanation: "C is widely used for system programming and building operating systems",
        difficulty: "hard"
    },
    { 
        phrase: "Java is a high level programming language", 
        explanation: "Java is known for its portability across different platforms",
        difficulty: "medium"
    },
    { 
        phrase: "CSS stands for Cascading Style Sheets", 
        explanation: "CSS is used to style and layout web pages",
        difficulty: "easy"
    },
    { 
        phrase: "SQL stands for Structured Query Language", 
        explanation: "SQL is used to manage and manipulate relational databases",
        difficulty: "medium"
    },
    { 
        phrase: "A compiler translates code from high level language to machine language", 
        explanation: "Compilers are crucial for running programs written in high-level languages",
        difficulty: "hard"
    },
    { 
        phrase: "RAM stands for Random Access Memory", 
        explanation: "RAM is a type of computer memory used for short-term data storage",
        difficulty: "easy"
    },
    { 
        phrase: "ROM stands for Read Only Memory", 
        explanation: "ROM is used to store firmware that is rarely changed",
        difficulty: "easy"
    },
    { 
        phrase: "A database is an organized collection of data", 
        explanation: "Databases allow efficient storage, retrieval, and management of data",
        difficulty: "medium"
    },
    { 
        phrase: "An operating system manages hardware and software resources", 
        explanation: "Operating systems provide a user interface and manage system resources",
        difficulty: "medium"
    },
    { 
        phrase: "TCP stands for Transmission Control Protocol", 
        explanation: "TCP is a fundamental protocol for reliable communication over networks",
        difficulty: "hard"
    },
    { 
        phrase: "IP stands for Internet Protocol", 
        explanation: "IP addresses devices and routes data across networks",
        difficulty: "medium"
    },
    { 
        phrase: "HTTP stands for HyperText Transfer Protocol", 
        explanation: "HTTP is used for transferring web pages over the internet",
        difficulty: "medium"
    },
    { 
        phrase: "URL stands for Uniform Resource Locator", 
        explanation: "A URL is the address used to access resources on the internet",
        difficulty: "easy"
    },
    { 
        phrase: "A firewall is a security system for networks", 
        explanation: "Firewalls protect networks by controlling incoming and outgoing traffic",
        difficulty: "medium"
    },
    { 
        phrase: "AI stands for Artificial Intelligence", 
        explanation: "AI involves creating machines that can perform tasks requiring human intelligence",
        difficulty: "medium"
    },
    { 
        phrase: "Machine learning is a subset of AI", 
        explanation: "Machine learning involves training algorithms to learn from data",
        difficulty: "hard"
    },
    { 
        phrase: "Cloud computing delivers services over the internet", 
        explanation: "Cloud computing provides scalable and flexible resources for computing needs",
        difficulty: "medium"
    },
    { 
        phrase: "Big Data refers to large and complex data sets", 
        explanation: "Big Data requires advanced tools to analyze and manage effectively",
        difficulty: "hard"
    },
    { 
        phrase: "Blockchain is a decentralized ledger technology", 
        explanation: "Blockchain is used for secure and transparent record-keeping",
        difficulty: "hard"
    },
    { 
        phrase: "Virtual reality creates immersive digital environments", 
        explanation: "VR uses technology to simulate real or imagined environments",
        difficulty: "hard"
    },
    { 
        phrase: "Augmented reality overlays digital information on the real world", 
        explanation: "AR enhances the real world with computer-generated sensory input",
        difficulty: "hard"
    },
    { 
        phrase: "IoT stands for Internet of Things", 
        explanation: "IoT connects everyday devices to the internet for data exchange",
        difficulty: "medium"
    },
    { 
        phrase: "Cybersecurity protects against digital threats", 
        explanation: "Cybersecurity involves measures to safeguard information and systems",
        difficulty: "medium"
    },
    { 
        phrase: "Encryption secures data by converting it into a code", 
        explanation: "Encryption protects sensitive information from unauthorized access",
        difficulty: "medium"
    },
    { 
        phrase: "A virus is a type of malicious software", 
        explanation: "Viruses can replicate and spread to other computers",
        difficulty: "easy"
    },
    { 
        phrase: "A trojan disguises itself as legitimate software", 
        explanation: "Trojans can give attackers unauthorized access to a user's system",
        difficulty: "medium"
    },
    { 
        phrase: "A worm is a self replicating malware", 
        explanation: "Worms spread across networks without user intervention",
        difficulty: "hard"
    },
    { 
        phrase: "Phishing is a technique to steal sensitive information", 
        explanation: "Phishing involves tricking users into providing personal data",
        difficulty: "medium"
    },
    { 
        phrase: "Spam refers to unsolicited messages", 
        explanation: "Spam is often sent in bulk and can be annoying or harmful",
        difficulty: "easy"
    }
];

// ==================== HINT SYSTEM ====================

let hintCache = [];
let hintsLoaded = false;
let loadingHints = false;

async function loadHintsFromAPI() {
    if (loadingHints) return;
    if (hintsLoaded && hintCache.length > 0) return;
    
    loadingHints = true;
    console.log('🔄 Loading hints from Datamuse API...');
    
    try {
        const words = ["software", "hardware", "algorithm", "data", "network", "database", "programming", "debugging", "compiler", "encryption"];
        const fetchPromises = words.map(word => 
            fetch(`https://api.datamuse.com/words?ml=${word}&md=d&max=500&rel_[jja]`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .catch(() => [])
        );
        
        const results = await Promise.all(fetchPromises);
        
        results.forEach(definitions => {
            definitions.forEach(definition => {
                if (definition.defs && definition.defs.length > 0) {
                    const programmingDefs = definition.defs.filter(def =>
                        ['software', 'programmer', 'computer programming', 'programming', 'computer', 'web development', 'virus']
                        .some(keyword => def.toLowerCase().includes(keyword)) &&
                        !def.includes(definition.word) &&
                        !/Acronym|acronym|Abbreviation|Initialism|misspell|radio|misspelling|Alternative spelling|short for|Alternative|abbr/gi.test(def)
                    );
                    if (programmingDefs.length > 0 && definition.word.length < 10) {
                        hintCache.push({
                            word: definition.word.toUpperCase(),
                            explanation: programmingDefs[0].replace(/\b(adj|n|adv|v)\b/gi, '').trim()
                        });
                    }
                }
            });
        });
        
        for (let i = hintCache.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [hintCache[i], hintCache[j]] = [hintCache[j], hintCache[i]];
        }
        
        hintsLoaded = true;
        loadingHints = false;
        console.log('✅ Hints loaded from API:', hintCache.length);
        
        if (hintCache.length === 0) {
            console.warn('⚠️ No hints from API, using fallback');
            useFallbackHints();
        }
        
        return hintCache;
    } catch (error) {
        console.error('❌ Failed to load hints:', error);
        loadingHints = false;
        useFallbackHints();
        return hintCache;
    }
}

function useFallbackHints() {
    hintCache = [
        { word: "CODE", explanation: "Instructions for a computer" },
        { word: "DATA", explanation: "Information stored in a computer" },
        { word: "PROGRAM", explanation: "A set of instructions" },
        { word: "ALGORITHM", explanation: "Step by step procedure" },
        { word: "NETWORK", explanation: "Connected computers" },
        { word: "DATABASE", explanation: "Organized data storage" },
        { word: "SOFTWARE", explanation: "Programs and data" },
        { word: "HARDWARE", explanation: "Physical computer parts" },
        { word: "COMPILER", explanation: "Translates code" },
        { word: "DEBUG", explanation: "Remove errors" },
        { word: "BINARY", explanation: "Base-2 number system" },
        { word: "CLOUD", explanation: "Internet-based computing" }
    ];
    hintsLoaded = true;
    console.log('📋 Fallback hints ready:', hintCache.length);
}

function getHintsForPhrase(phrase, count = 10) {
    const availableHints = hintCache.filter(hint => {
        const word = hint.word;
        for (let i = 0; i < word.length; i++) {
            if (!phrase.toLowerCase().includes(word[i].toLowerCase())) {
                return false;
            }
        }
        return true;
    });
    
    const shuffled = [...availableHints];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
}

function generateLettermap(phrase) {
    const lettermap = {};
    const letters = phrase.replace(/ /g, '').toUpperCase().split('');
    letters.forEach(letter => {
        if (!(letter in lettermap)) {
            lettermap[letter] = Object.keys(lettermap).length + 1;
        }
    });
    return lettermap;
}

loadHintsFromAPI();

// ==================== HELPER FUNCTIONS ====================

function getPhraseForLevel(level) {
    const difficulty = level <= 3 ? 'easy' : level <= 6 ? 'medium' : 'hard';
    const available = GAME_PHRASES.filter(p => p.difficulty === difficulty);
    return available[Math.floor(Math.random() * available.length)];
}

function getSpacePositions(phrase) {
    const spaces = [];
    for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] === ' ') {
            spaces.push(i);
        }
    }
    return spaces;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// ==================== JWT MIDDLEWARE ====================

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Handle both "Bearer token" and raw token formats
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Strict check - prevents garbage tokens from passing
        if (!decoded.username || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ==================== AUTHENTICATION ROUTES ====================

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        if (username.length < 3 || password.length < 3) {
            return res.status(400).json({ error: 'Username and password must be at least 3 characters' });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            password: hashedPassword,
            playerId: crypto.randomInt(10000, 99999)
        });
        
        await user.save();
        
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { 
                username: user.username,
                userId: user._id,
                playerId: user.playerId
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token: token,
            username: user.username,
            playerId: user.playerId
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== AUTH VALIDATION ROUTE ====================

app.get('/api/auth/validate', verifyToken, (req, res) => {
    res.json({
        valid: true,
        username: req.user.username,
        userId: req.user.userId,
        playerId: req.user.playerId
    });
});

// ==================== GAME ROUTES ====================

app.post('/api/game/start', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const phraseData = getPhraseForLevel(1);
        const lettermap = generateLettermap(phraseData.phrase);
        
        const sessionId = generateSessionId();
        const session = new GameSession({
            sessionId,
            username,
            level: 1,
            hearts: 5,
            currentPhrase: phraseData.phrase,
            currentExplanation: phraseData.explanation,
            guessedLetters: [],
            startTime: new Date(),
            lastActivity: new Date(),
            score: 0
        });
        
        await session.save();
        
        // Get hints for the phrase
        const hints = getHintsForPhrase(phraseData.phrase, 10);
        
        res.json({
            sessionId,
            level: 1,
            hearts: 5,
            phraseLength: phraseData.phrase.length,
            spaces: getSpacePositions(phraseData.phrase),
            totalLevels: 10,
            phrase: phraseData.phrase,
            lettermap: lettermap,
            explanation: phraseData.explanation,
            hints: hints
        });
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ error: 'Failed to start game' });
    }
});

app.post('/api/game/guess', verifyToken, async (req, res) => {
    try {
        const { sessionId, letter, position } = req.body;
        const username = req.user.username;
        
        if (!sessionId || !letter) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const session = await GameSession.findOne({ sessionId, username });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.completed) {
            return res.status(400).json({ error: 'Game already completed' });
        }
        
        if (Date.now() - session.lastActivity > 15 * 60 * 1000) {
            await GameSession.deleteOne({ sessionId });
            return res.status(401).json({ error: 'Session expired' });
        }
        
        const normalizedLetter = letter.toUpperCase();
        const phrase = session.currentPhrase;
        
        if (session.guessedLetters.includes(normalizedLetter)) {
            return res.json({
                correct: false,
                alreadyGuessed: true,
                hearts: session.hearts,
                message: 'Already guessed this letter'
            });
        }
        
        const positions = [];
        for (let i = 0; i < phrase.length; i++) {
            if (phrase[i].toUpperCase() === normalizedLetter) {
                positions.push(i);
            }
        }
        
        if (positions.length === 0) {
            session.hearts--;
            session.lastActivity = new Date();
            await session.save();
            
            if (session.hearts === 0) {
                await GameSession.deleteOne({ sessionId });
                return res.json({
                    correct: false,
                    gameOver: true,
                    hearts: 0,
                    phrase: phrase,
                    explanation: session.currentExplanation
                });
            }
            
            return res.json({
                correct: false,
                hearts: session.hearts,
                gameOver: false,
                positions: []
            });
        }
        
        session.guessedLetters.push(normalizedLetter);
        session.score += 10 * positions.length;
        session.lastActivity = new Date();
        await session.save();
        
        return res.json({
            correct: true,
            hearts: session.hearts,
            gameOver: false,
            positions: positions,
            score: session.score
        });
        
    } catch (error) {
        console.error('Error processing guess:', error);
        res.status(500).json({ error: 'Failed to process guess' });
    }
});

// ==================== COMPLETE LEVEL ROUTE ====================

app.post('/api/game/complete', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const username = req.user.username;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Missing session ID' });
        }
        
        const session = await GameSession.findOne({ sessionId, username });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.completed) {
            return res.status(400).json({ error: 'Game already completed' });
        }
        
        // Level is complete! Just advance to next level
        const nextLevel = session.level + 1;
        const bonus = 50;
        session.score += bonus;
        
        if (nextLevel > 10) {
            // Game complete!
            session.completed = true;
            session.timeTaken = Math.floor((Date.now() - session.startTime) / 1000);
            await session.save();
            
            const formattedTime = formatTime(session.timeTaken);
            
            // Save to leaderboard
            const user = await User.findOne({ username });
            if (user) {
                if (user.bestTime === "null" || formattedTime < user.bestTime) {
                    user.bestTime = formattedTime;
                }
                const timeSeconds = parseInt(formattedTime.split(':')[0]) * 60 + parseInt(formattedTime.split(':')[1]);
                const mmrIncrease = Math.max(0, 100 - timeSeconds) + Math.floor(session.score / 10);
                user.MMR += mmrIncrease;
                await user.save();
            }
            
            await GameSession.deleteOne({ sessionId });
            
            return res.json({
                success: true,
                levelComplete: true,
                gameComplete: true,
                score: session.score,
                timeTaken: formattedTime
            });
        }
        
        // Get next phrase
        const nextPhrase = getPhraseForLevel(nextLevel);
        const newLettermap = generateLettermap(nextPhrase.phrase);
        
        // Update session with new level data
        session.level = nextLevel;
        session.currentPhrase = nextPhrase.phrase;
        session.currentExplanation = nextPhrase.explanation;
        session.guessedLetters = [];
        session.lastActivity = new Date();
        await session.save();
        
        // Get hints for next phrase
        const hints = getHintsForPhrase(nextPhrase.phrase, 10);
        
        console.log('✅ Level complete! Advancing to level:', nextLevel);
        
        return res.json({
            success: true,
            levelComplete: true,
            gameComplete: false,
            nextLevel: nextLevel,
            newPhrase: nextPhrase.phrase,
            newLettermap: newLettermap,
            newExplanation: nextPhrase.explanation,
            hints: hints,
            score: session.score,
            hearts: session.hearts
        });
        
    } catch (error) {
        console.error('Error completing level:', error);
        res.status(500).json({ error: 'Failed to complete level' });
    }
});

app.post('/api/game/restart', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const username = req.user.username;
        
        if (sessionId) {
            await GameSession.deleteOne({ sessionId, username });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error restarting game:', error);
        res.status(500).json({ error: 'Failed to restart game' });
    }
});

// ==================== LEADERBOARD ROUTES ====================

app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}, 'username bestTime bestWS MMR')
            .sort({ MMR: -1 })
            .limit(50);
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ==================== HINT ROUTES ====================

app.get('/api/hints/:phrase', verifyToken, (req, res) => {
    try {
        const phrase = decodeURIComponent(req.params.phrase);
        const hints = getHintsForPhrase(phrase, 10);
        const lettermap = generateLettermap(phrase);
        
        res.json({
            success: true,
            hints: hints,
            lettermap: lettermap,
            phraseLength: phrase.length,
            spaces: getSpacePositions(phrase)
        });
    } catch (error) {
        console.error('Error getting hints:', error);
        res.status(500).json({ error: 'Failed to get hints' });
    }
});

app.get('/api/hints/status', (req, res) => {
    res.json({
        hintsLoaded: hintsLoaded,
        hintCount: hintCache.length,
        loading: !hintsLoaded
    });
});

// ==================== MESSAGE ROUTES ====================

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// ==================== SOCKET.IO ====================

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error("Authentication required"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Strict validation
        if (!decoded.username || !decoded.userId) {
            return next(new Error("Invalid token payload"));
        }

        socket.user = decoded;
        next();
    } catch (error) {
        return next(new Error("Invalid token"));
    }
});

const matchmakingQueue = [];
const activeMultiplayerGames = new Map();

io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.username}`);
    
    Message.find().sort({ timestamp: -1 }).limit(50)
        .then(messages => {
            socket.emit('load messages', messages.reverse());
        })
        .catch(err => console.error('Error loading messages:', err));
    
    socket.on('new message', async (data) => {
        try {
            const message = new Message({
                user: socket.user.username,
                message: data.message
            });
            await message.save();
            io.emit('new message', {
                user: socket.user.username,
                message: data.message,
                timestamp: message.timestamp
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    
    socket.on('addmatch', () => {
        const existing = matchmakingQueue.findIndex(u => u.socketId === socket.id);
        if (existing !== -1) {
            matchmakingQueue.splice(existing, 1);
        }
        
        matchmakingQueue.push({
            socketId: socket.id,
            username: socket.user.username,
            joinedAt: Date.now()
        });
        
        console.log(`🎮 ${socket.user.username} added to matchmaking`);
        findMatches();
    });
    
    socket.on('dcmatch', () => {
        const index = matchmakingQueue.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            console.log(`👋 ${socket.user.username} removed from matchmaking`);
        }
    });
    
    socket.on('multiplayer_guess', async (data) => {
        const { gameId, letter, position } = data;
        const game = activeMultiplayerGames.get(gameId);
        
        if (!game || game.finished) {
            socket.emit('guess_result', { 
                correct: false, 
                error: 'Game not found or finished' 
            });
            return;
        }
        
        let player = null;
        let playerKey = null;
        if (game.player1.socketId === socket.id) {
            player = game.player1;
            playerKey = 'player1';
        } else if (game.player2.socketId === socket.id) {
            player = game.player2;
            playerKey = 'player2';
        } else {
            return;
        }
        
        const normalizedLetter = letter.toUpperCase();
        if (player.guessedLetters.includes(normalizedLetter)) {
            socket.emit('guess_result', { 
                correct: false, 
                message: 'Already guessed' 
            });
            return;
        }
        
        const phrase = game.phrase;
        const positions = [];
        let correct = false;
        
        for (let i = 0; i < phrase.length; i++) {
            if (phrase[i].toUpperCase() === normalizedLetter) {
                positions.push(i);
                correct = true;
            }
        }
        
        if (!correct) {
            socket.emit('guess_result', {
                correct: false,
                message: 'Wrong letter!'
            });
            return;
        }
        
        player.guessedLetters.push(normalizedLetter);
        player.progress += positions.length;
        
        const totalLetters = phrase.replace(/ /g, '').length;
        if (player.progress === totalLetters) {
            player.completed = true;
            game.finished = true;
            
            const winner = player;
            const loser = playerKey === 'player1' ? game.player2 : game.player1;
            
            // Update MMR
            const winnerUser = await User.findOne({ username: winner.username });
            const loserUser = await User.findOne({ username: loser.username });
            
            if (winnerUser && loserUser) {
                winnerUser.MMR += 25;
                winnerUser.bestWS += 1;
                if (loserUser.MMR > 0) {
                    loserUser.MMR = Math.max(0, loserUser.MMR - 25);
                }
                loserUser.bestWS = 0;
                await winnerUser.save();
                await loserUser.save();
            }
            
            io.to(loser.socketId).emit('loser', { 
                winner: winner.username,
                phrase: phrase,
                explanation: game.explanation
            });
            
            io.to(winner.socketId).emit('winner', { 
                phrase: phrase,
                explanation: game.explanation,
                time: formatTime(Math.floor((Date.now() - game.startTime) / 1000))
            });
            
            activeMultiplayerGames.delete(gameId);
            console.log(`🏆 ${winner.username} won against ${loser.username}`);
        }
        
        socket.emit('guess_result', {
            correct: true,
            positions,
            progress: player.progress,
            total: totalLetters,
            completed: player.completed
        });
    });
    
    socket.on("disconnect", async () => {
        console.log(`👋 User disconnected: ${socket.user.username}`);
        
        const index = matchmakingQueue.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
        }
        
        for (const [gameId, game] of activeMultiplayerGames) {
            if (game.player1.socketId === socket.id || game.player2.socketId === socket.id) {
                const opponent = game.player1.socketId === socket.id ? game.player2 : game.player1;
                io.to(opponent.socketId).emit('opponent_disconnected', {
                    message: 'Your opponent disconnected'
                });
                activeMultiplayerGames.delete(gameId);
            }
        }
        
        try {
            await User.findOneAndUpdate(
                { username: socket.user.username },
                { online: false, socketId: '0' }
            );
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    });
});

function findMatches() {
    while (matchmakingQueue.length >= 2) {
        const user1 = matchmakingQueue.shift();
        const user2 = matchmakingQueue.shift();
        
        const phrase = getPhraseForLevel(1);
        const gameId = generateSessionId();
        
        const gameData = {
            gameId,
            phrase: phrase.phrase,
            explanation: phrase.explanation,
            player1: {
                socketId: user1.socketId,
                username: user1.username,
                guessedLetters: [],
                progress: 0,
                completed: false
            },
            player2: {
                socketId: user2.socketId,
                username: user2.username,
                guessedLetters: [],
                progress: 0,
                completed: false
            },
            startTime: Date.now(),
            finished: false
        };
        
        activeMultiplayerGames.set(gameId, gameData);
        
        const gameInfo = {
            gameId,
            opponentname: user2.username,
            opponentSocketId: user2.socketId,
            phraseLength: phrase.phrase.length,
            spaces: getSpacePositions(phrase.phrase)
        };
        
        io.to(user1.socketId).emit('match found', {
            ...gameInfo,
            opponentname: user2.username
        });
        
        io.to(user2.socketId).emit('match found', {
            ...gameInfo,
            opponentname: user1.username,
            opponentSocketId: user1.socketId
        });
        
        console.log(`🎯 Match found: ${user1.username} vs ${user2.username}`);
    }
}

setInterval(findMatches, 3000);

// ==================== CLEANUP JOBS ====================

async function deleteOldMessages() {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const result = await Message.deleteMany({ timestamp: { $lt: oneHourAgo } });
        if (result.deletedCount > 0) {
            console.log(`🗑️ Deleted ${result.deletedCount} old messages`);
        }
    } catch (error) {
        console.error('Error deleting old messages:', error);
    }
}

setInterval(deleteOldMessages, 5 * 60 * 1000);

async function deleteOldSessions() {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const result = await GameSession.deleteMany({ 
            lastActivity: { $lt: oneHourAgo } 
        });
        if (result.deletedCount > 0) {
            console.log(`🗑️ Deleted ${result.deletedCount} old game sessions`);
        }
    } catch (error) {
        console.error('Error deleting old sessions:', error);
    }
}

setInterval(deleteOldSessions, 10 * 60 * 1000);

// ==================== START SERVER ====================

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log(`📊 MongoDB: ${MONGODB_URI ? '✅ Configured' : '❌ Not configured'}`);
});