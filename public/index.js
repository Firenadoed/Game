
var registerform = document.getElementById('registerform')
var loginform = document.getElementById('loginform')
var fullcontainer = document.querySelector('.fullcontainer')
var container = document.querySelector('.container')

//variable
var factcont = document.querySelector('.factcontainer');
var hintcont = document.querySelector('.hintcontainer')
var successcont= document.querySelector('.success')
var SuccessPhrase = document.querySelector('.SuccessPhrase')
var explanationbox = document.querySelector('.explanationbox')
var bodydiags = document.getElementById('bodydiags')
var headtext = document.getElementById('leveltext')
var unclickable2 = document.querySelector('.unclickable2')
var mainmenu = document.querySelector('.mainmenu')
var newcont = document.querySelector ('.gamecontainers')
var unclickable1 = document.querySelector('.unclickable1')
var endbox = document.querySelector ('.gameend')
var leaderboardcont = document.querySelector ('.leaderboardcont')


var hintword = [];
var currlevel = 1;

var heartsCount = 5;
var usedIndexes = [];
var usedHintWords= [];
var usedPhrases= [];
var timeattack = false;
var lettermap = {};
var leaderboardinfo= [];
var multiplayer = false;

var loggeduser;

const socket = io('ws://localhost:5000')






function showregister(){
loginform.style.display = 'none'
registerform.style.display = 'flex'

loginform.reset();
const loginErrorDiv = document.getElementById('loginError');
loginErrorDiv.textContent = '';
}

function showlogin(){
    loginform.style.display = 'flex'
    registerform.style.display = 'none'
    
    registerform.reset();
    const usernameErrorDiv = document.getElementById('usernameError');
    const passwordErrorDiv = document.getElementById('passwordError');
    usernameErrorDiv.textContent = '';
    passwordErrorDiv.textContent = '';
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 400 && result.message.includes('Username')) {
                usernameErrorDiv.textContent = result.message;
            } else {
                passwordErrorDiv.textContent = 'An unexpected error occurred. Please try again later.';
            }
        } else {
            alert('Registration successful!');
            showlogin();  
        }
    } catch (err) {
        passwordErrorDiv.textContent = 'An unexpected error occurred. Please try again later.';
    }
});




document.getElementById('loginform').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;
    const loginErrorDiv = document.getElementById('loginError');

    loggeduser = username;
    loginErrorDiv.textContent = '';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            loginErrorDiv.textContent = 'Invalid username or password. Please try again.';
        } else {
            alert('Login successful!');
            bgmusic.play();
            showgame();
        }
    } catch (err) {
        loginErrorDiv.textContent = 'An unexpected error occurred. Please try again later.';
    }
});



function showgame(){
fullcontainer.style.display = 'none'
container.style.display = 'flex'
}





function fetchLeaderboard() {
    fetch('/leaderboardinfo')
      .then(response => response.json())
      .then(data => {
      
        data.forEach(user => {
          user.bestTimeInSeconds = convertTimeToSeconds(user.bestTime);
        });
  
       
        data.sort((a, b) => a.bestTimeInSeconds - b.bestTimeInSeconds);
  
      

        leaderboardinfo = data.filter(user => user.bestTime !== "null");
      
        displayLeaderboard();
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        // Handle errors
      });
  }





  document.addEventListener('DOMContentLoaded', function () {


    var messageInput = document.getElementById('messageInput');
    var sendButton = document.getElementById('sendButton');
    var messages = document.getElementById('messages');

         // Receive new message from server
         socket.on('new message', function (data) {
            var messageElement = document.createElement('li');
            messageElement.textContent = data.user + ': ' + data.message;
            messages.appendChild(messageElement);
        });

        socket.on('load messages', function (receivedMessages) {
            messages.innerHTML = '';
            receivedMessages.forEach(function (message) {
                var messageElement = document.createElement('li');
                messageElement.textContent = message.user + ': ' + message.message;
                messages.appendChild(messageElement);
            });
        });

  
        sendButton.onclick = function () {
            var message = messageInput.value.trim();
            if (message !== '') {
                socket.emit('new message', { user: loggeduser, message: message });
                messageInput.value = '';
            }
        };


        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });






  })






















  function fetchDefinitions(word) {
      return fetch(`https://api.datamuse.com/words?ml=${word}&md=d&max=500&rel_[jja]`)
          .then(response => response.json())
          .catch(error => {
              console.error('Error fetching definitions:', error);
              return [];
          });
  }
  
  function formatDefinitions(definitions) {
      definitions.forEach(definition => {
          if (definition.defs && definition.defs.length > 0) {
              const programmingDefs = definition.defs.filter(def =>
                  ['software', 'programmer', 'computer programming', 'programming', 'computer', 'web development', 'virus']
                  .some(keyword => def.includes(keyword)) &&
                  !def.includes(definition.word) &&
                  !/Acronym|acronym|Abbreviation|Initialism|misspell|radio|misspelling|Alternative spelling|short for|Alternative|abbr/gi.test(def)
              );
              if (programmingDefs.length > 0 && definition.word.length < 10) {
                  const cleanedExplanation = programmingDefs[0].replace(/\b(adj|n|adv|v)\b/gi, '').trim();
                  hintword.push({
                      word: definition.word,
                      explanation: cleanedExplanation
                  });
              }
          }
      });
  }
  
  function randomizeHintWords() {
      for (let i = hintword.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [hintword[i], hintword[j]] = [hintword[j], hintword[i]];
      }
  }
  
  (async () => {
      const words = ["software", "hardware", "algorithm", "data", "network", "database", "programming", "debugging", "compiler", "encryption"]
          .filter(word => word.length < 10); // Filter words less than 10 letters long
  
      const promises = words.map(word => fetchDefinitions(word));
  
      const responses = await Promise.all(promises);
      responses.forEach(response => formatDefinitions(response));
  
      randomizeHintWords();
    
  })();
  


var phrases = [
    { phrase: "The first computer programmer was Ada Lovelace", explanation: "Ada Lovelace wrote the first algorithm intended to be carried out by a machine" },
    { phrase: "Python is a popular programming language for beginners", explanation: "Python's simple syntax and readability make it a great choice for newcomers" },
    { phrase: "The World Wide Web was invented by Tim Berners Lee", explanation: "Tim Berners Lee created the World Wide Web to facilitate information sharing among scientists" },
    { phrase: "JavaScript is used to make web pages interactive", explanation: "JavaScript allows developers to create dynamic and interactive web elements" },
    { phrase: "HTML stands for HyperText Markup Language", explanation: "HTML is the standard language used to create web pages" },
    { phrase: "An algorithm is a step by step procedure for solving a problem", explanation: "Algorithms are essential for computer programming and problem-solving" },
    { phrase: "A byte consists of eight bits", explanation: "A byte is a basic unit of information in computing and digital communications" },
    { phrase: "Linux is an open source operating system", explanation: "Linux is widely used in servers, desktops, and mobile devices due to its open-source nature" },
    { phrase: "A function in programming is a block of code that performs a specific task", explanation: "Functions help in organizing and reusing code efficiently" },
    { phrase: "Binary code is the fundamental language of computers", explanation: "Binary code uses zeros and ones to represent data and instructions in computing" },
    { phrase: "C is a powerful general purpose programming language", explanation: "C is widely used for system programming and building operating systems" },
    { phrase: "Java is a high level programming language", explanation: "Java is known for its portability across different platforms" },
    { phrase: "CSS stands for Cascading Style Sheets", explanation: "CSS is used to style and layout web pages" },
    { phrase: "SQL stands for Structured Query Language", explanation: "SQL is used to manage and manipulate relational databases" },
    { phrase: "A compiler translates code from high level language to machine language", explanation: "Compilers are crucial for running programs written in high-level languages" },
    { phrase: "RAM stands for Random Access Memory", explanation: "RAM is a type of computer memory used for short-term data storage" },
    { phrase: "ROM stands for Read Only Memory", explanation: "ROM is used to store firmware that is rarely changed" },
    { phrase: "A database is an organized collection of data", explanation: "Databases allow efficient storage, retrieval, and management of data" },
    { phrase: "An operating system manages hardware and software resources", explanation: "Operating systems provide a user interface and manage system resources" },
    { phrase: "TCP stands for Transmission Control Protocol", explanation: "TCP is a fundamental protocol for reliable communication over networks" },
    { phrase: "IP stands for Internet Protocol", explanation: "IP addresses devices and routes data across networks" },
    { phrase: "HTTP stands for HyperText Transfer Protocol", explanation: "HTTP is used for transferring web pages over the internet" },
    { phrase: "URL stands for Uniform Resource Locator", explanation: "A URL is the address used to access resources on the internet" },
    { phrase: "A firewall is a security system for networks", explanation: "Firewalls protect networks by controlling incoming and outgoing traffic" },
    { phrase: "AI stands for Artificial Intelligence", explanation: "AI involves creating machines that can perform tasks requiring human intelligence" },
    { phrase: "Machine learning is a subset of AI", explanation: "Machine learning involves training algorithms to learn from data" },
    { phrase: "Cloud computing delivers services over the internet", explanation: "Cloud computing provides scalable and flexible resources for computing needs" },
    { phrase: "Big Data refers to large and complex data sets", explanation: "Big Data requires advanced tools to analyze and manage effectively" },
    { phrase: "Blockchain is a decentralized ledger technology", explanation: "Blockchain is used for secure and transparent record-keeping" },
    { phrase: "Virtual reality creates immersive digital environments", explanation: "VR uses technology to simulate real or imagined environments" },
    { phrase: "Augmented reality overlays digital information on the real world", explanation: "AR enhances the real world with computer-generated sensory input" },
    { phrase: "IoT stands for Internet of Things", explanation: "IoT connects everyday devices to the internet for data exchange" },
    { phrase: "Cybersecurity protects against digital threats", explanation: "Cybersecurity involves measures to safeguard information and systems" },
    { phrase: "Encryption secures data by converting it into a code", explanation: "Encryption protects sensitive information from unauthorized access" },
    { phrase: "A virus is a type of malicious software", explanation: "Viruses can replicate and spread to other computers" },
    { phrase: "A trojan disguises itself as legitimate software", explanation: "Trojans can give attackers unauthorized access to a user's system" },
    { phrase: "A worm is a self replicating malware", explanation: "Worms spread across networks without user intervention" },
    { phrase: "Phishing is a technique to steal sensitive information", explanation: "Phishing involves tricking users into providing personal data" },
    { phrase: "Spam refers to unsolicited messages", explanation: "Spam is often sent in bulk and can be annoying or harmful" },
    { phrase: "A botnet is a network of infected computers", explanation: "Botnets are controlled by attackers for malicious purposes" },
    { phrase: "Two factor authentication adds an extra layer of security", explanation: "2FA requires a second form of verification in addition to a password" },
    { phrase: "A router directs data between networks", explanation: "Routers are essential for internet connectivity" },
    { phrase: "Ethernet is a common wired networking technology", explanation: "Ethernet connects devices in a local area network" },
    { phrase: "Wi Fi is a wireless networking technology", explanation: "Wi-Fi allows devices to connect to the internet without cables" },
    { phrase: "Bluetooth enables short range wireless communication", explanation: "Bluetooth connects devices like headphones and keyboards wirelessly" },
    { phrase: "A domain name is the address of a website", explanation: "Domain names are human-readable addresses for websites" },
    { phrase: "DNS stands for Domain Name System", explanation: "DNS translates domain names into IP addresses" },
    { phrase: "A web browser is used to access websites", explanation: "Web browsers interpret and display HTML content from the internet" },
    { phrase: "An IP address is a unique identifier for devices on a network", explanation: "IP addresses are used for addressing and routing data" },
    { phrase: "A subnet is a subdivision of an IP network", explanation: "Subnets help organize and manage large networks" },
    { phrase: "A gateway connects different networks", explanation: "Gateways act as entry and exit points for network traffic" },
    { phrase: "NAT stands for Network Address Translation", explanation: "NAT allows multiple devices to share a single public IP address" },
    { phrase: "VoIP stands for Voice over Internet Protocol", explanation: "VoIP enables voice communication over the internet" },
    { phrase: "SSL stands for Secure Sockets Layer", explanation: "SSL is used to secure communications over the internet" },
    { phrase: "HTTPS is a secure version of HTTP", explanation: "HTTPS encrypts data to protect it during transmission" },
    { phrase: "An API stands for Application Programming Interface", explanation: "APIs allow different software applications to communicate" },
    { phrase: "JSON stands for JavaScript Object Notation", explanation: "JSON is a lightweight format for data interchange" },
    { phrase: "XML stands for eXtensible Markup Language", explanation: "XML is used to define rules for encoding documents" },
    { phrase: "A pixel is a single point in a digital image", explanation: "Pixels are the smallest units of a digital display" },
    { phrase: "A vector graphic uses paths instead of pixels", explanation: "Vector graphics are scalable without losing quality" },
    { phrase: "An emulator mimics the functions of another system", explanation: "Emulators allow running software designed for different hardware" },
    { phrase: "A virtual machine emulates a physical computer", explanation: "Virtual machines run operating systems and applications in isolated environments" },
    { phrase: "An IDE stands for Integrated Development Environment", explanation: "IDEs provide tools for coding, debugging, and testing software" },
    { phrase: "A debugger is used to find and fix errors in code", explanation: "Debuggers help programmers identify and resolve issues" },
    { phrase: "Version control systems manage changes to code", explanation: "VCS like Git track and merge code changes across teams" },
    { phrase: "An open source project is publicly accessible", explanation: "Open-source projects allow anyone to view, modify, and distribute the code" },
    { phrase: "A kernel is the core of an operating system", explanation: "The kernel manages system resources and hardware interactions" },
    { phrase: "Firmware is software embedded in hardware", explanation: "Firmware provides low-level control for a device's specific hardware" },
    { phrase: "A thread is a sequence of executable commands", explanation: "Threads allow concurrent execution within a program" },
    { phrase: "Multithreading allows multiple threads to run concurrently", explanation: "Multithreading improves the performance of complex applications" },
    { phrase: "A process is an instance of a running program", explanation: "Processes are independent and have their own memory space" },
    { phrase: "Load balancing distributes workloads across resources", explanation: "Load balancing ensures optimal resource use and performance" },
    { phrase: "A cache stores frequently accessed data for quick access", explanation: "Caches improve the speed of data retrieval" },
    { phrase: "A shell provides a user interface for accessing an operating system's services", explanation: "Shells can be command-line based or graphical" },
    { phrase: "A sandbox is an isolated environment for testing", explanation: "Sandboxes prevent code from affecting the rest of the system" },
    { phrase: "An SDK stands for Software Development Kit", explanation: "SDKs provide tools and libraries for developing applications" },
    { phrase: "A CLI stands for Command Line Interface", explanation: "CLIs allow users to interact with software using text commands" },
    { phrase: "GUI stands for Graphical User Interface", explanation: "GUIs provide visual elements for user interaction" },
    { phrase: "An API key is a code used to identify and authenticate an application or user", explanation: "API keys control access to APIs and track usage" },
    { phrase: "A webhook allows one application to send real time data to another application", explanation: "Webhooks are used for automated communication between systems" },
    { phrase: "JSON is often used in web development for data exchange", explanation: "JSON's lightweight structure makes it ideal for web APIs" },
    { phrase: "HTML and CSS are the foundational languages of the web", explanation: "HTML structures content, while CSS styles it" },
    { phrase: "Java is used for building platform independent applications", explanation: "Java's Write Once, Run Anywhere capability is a key feature" },
    { phrase: "Ruby is known for its elegant syntax", explanation: "Ruby is often used for web development with the Rails framework" },
    { phrase: "Go is known for its efficiency and simplicity", explanation: "Go was developed by Google for scalable and efficient software" },
    { phrase: "Kotlin is fully interoperable with Java", explanation: "Kotlin is officially supported for Android development" },
    { phrase: "Swift is designed for building apps on Apple platforms", explanation: "Swift's syntax is safe, fast, and expressive" },
    { phrase: "Rust focuses on performance and safety", explanation: "Rust is used for system-level programming" },
    { phrase: "Dart is used for building mobile, desktop, and web applications", explanation: "Dart is the programming language behind Flutter" },
    { phrase: "TypeScript adds static types to JavaScript", explanation: "TypeScript helps catch errors during development" },
    { phrase: "Node.js allows JavaScript to be used on the server side", explanation: "Node.js is known for its event-driven architecture" },
    { phrase: "React is a library for building user interfaces", explanation: "React was developed by Facebook and emphasizes component-based development" },
    { phrase: "Angular is a platform for building web applications", explanation: "Angular provides a comprehensive framework for building single-page applications" },
    { phrase: "Vue.js is known for its simplicity and flexibility", explanation: "Vue.js is a progressive framework for building user interfaces" },
    { phrase: "Machine learning models learn from data", explanation: "Machine learning involves training models to make predictions or decisions" },
    { phrase: "Deep learning is a subset of machine learning", explanation: "Deep learning uses neural networks to model complex patterns in data" },
    { phrase: "A neural network is inspired by the human brain", explanation: "Neural networks consist of interconnected nodes called neurons" },
    { phrase: "Natural language processing enables computers to understand human language", explanation: "NLP is used for tasks like language translation and sentiment analysis" },
    { phrase: "Computer vision allows machines to interpret visual information", explanation: "Computer vision is used in applications like image recognition and autonomous vehicles" },
    { phrase: "Data mining extracts useful information from large data sets", explanation: "Data mining techniques are used to discover patterns and insights" },
    { phrase: "A chatbot is an AI that can simulate conversation", explanation: "Chatbots are used for customer service and virtual assistance" },
    { phrase: "A recommendation system suggests items based on user preferences", explanation: "Recommendation systems are used by platforms like Netflix and Amazon" },
    { phrase: "An autonomous vehicle can drive itself without human input", explanation: "Autonomous vehicles use sensors and AI to navigate and make decisions" }
  ];
  



var phrase = getNextPhrase();

function getNextPhrase() {           
    let nextPhrase;
    if (usedPhrases.length === phrases.length) {
        usedPhrases = []; 
    }
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * phrases.length);
    } while (usedPhrases.some(obj => obj.phrase === phrases[randomIndex].phrase));

    nextPhrase = phrases[randomIndex].phrase;
    usedPhrases.push({ phrase: nextPhrase });
    return nextPhrase;
}

function dcmatch(){
    socket.emit("dcmatch", loggeduser)
}

function startgame() {
    if(multiplayer){
        heartsCount = 500;
    }
    bgmusic.play();
    startTimer();

   
    
    bodydiags.style.display ='none'
    mainmenu.style.transition = "opacity 1s ease";
    mainmenu.style.opacity = 0;
    setTimeout(function() {
        mainmenu.style.display = "none";
        bodydiags.style.display ='none'
    }, 1000);

    var gamecontainers = document.querySelector('.gamecontainers')

    gamecontainers.style.transition = "opacity 1s ease";
    gamecontainers.style.opacity = 1;
    setTimeout(function() {
        gamecontainers.style.display = "block";
      
    }, 1000);
    setupGame();
}

function setupGame() {
    createBoxes();
    createinputforhint();
    setupInputBoxListeners();
}


function createBoxes() {
    let letterindex = 0;
    
    const containerofinputs = document.createElement('div');
    containerofinputs.classList.add('containerofinputs');


    containerofinputs.style.display = 'flex';
    containerofinputs.style.justifyContent = 'center';
    containerofinputs.style.alignItems = 'center';

    for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] === ' ') {
            const spaceInput = document.createElement('input');
            spaceInput.type = "text";
            spaceInput.maxLength = 1;
            spaceInput.classList.add("space");
            spaceInput.disabled = true;
            spaceInput.value = ' ';
            containerofinputs.appendChild(spaceInput);

        } else if (/^[a-zA-Z]$/.test(phrase[i])) {
            const letter = phrase[i].toUpperCase();
            if (!(letter in lettermap)) {
                lettermap[letter] = Object.keys(lettermap).length + 1;
            }

            const inputcont = document.createElement('div');
            inputcont.classList.add('inputcont');

            const input = document.createElement('input');
            input.type = "text";
            input.maxLength = 1;
            input.id = 'letter' + letterindex;
            input.dataset.letter = letter;
            input.style.textTransform = "uppercase";
            input.style.display = "block";
            input.autocomplete = "off"; 
            inputcont.appendChild(input);

            const number = document.createElement('span');
            number.style.fontSize = '18px';
            number.textContent = lettermap[letter];
            number.style.display = "block"; 
            number.style.color = "white";
            number.style.textAlign = "center";
            inputcont.appendChild(number);

            containerofinputs.appendChild(inputcont);

            letterindex++;
        }
    }

    factcont.appendChild(containerofinputs);
    factcont.style.display = 'flex';
    factcont.style.justifyContent = 'center';
    factcont.style.alignItems = 'center';
}



//somehow works?? but is not really representing all letters in phrase
function createinputforhint() {
    hintcont.innerText = " ";
    let hintWordCount = 0; 
    let selectedHintWords = [];

    // First pass: select hint words that are not used and present in the phrase
    hintword.forEach(wordObj => {
        if (hintWordCount >= 10) return;
        if (usedHintWords.includes(wordObj.word)) return;

        const word = wordObj.word;
        const explanation = wordObj.explanation;
        let present = true;
        for (let i = 0; i < word.length; i++) {
            if (!phrase.toLowerCase().includes(word[i].toLowerCase())) {
                present = false;
                break;
            }
        }
        if (present) {
            hintWordCount++;
            selectedHintWords.push(wordObj);
            usedHintWords.push(wordObj.word); // Add to usedHintWords
        }
    });

    // Second pass: ensure all characters in the phrase are covered
    let phraseChars = new Set(phrase.toLowerCase());
    let coveredChars = new Set(selectedHintWords.flatMap(wordObj => [...wordObj.word.toLowerCase()]));

    phraseChars.forEach(char => {
        if (!coveredChars.has(char)) {
            // Find a new word containing the missing character
            let foundReplacement = false;
            for (let i = 0; i < hintword.length; i++) {
                const wordObj = hintword[i];
                if (!usedHintWords.includes(wordObj.word) && wordObj.word.toLowerCase().includes(char)) {
                    const word = wordObj.word;
                    let present = true;
                    for (let j = 0; j < word.length; j++) {
                        if (!phrase.toLowerCase().includes(word[j].toLowerCase())) {
                            present = false;
                            break;
                        }
                    }
                    if (present) {
                        // Replace one of the existing hint words
                        for (let k = 0; k < selectedHintWords.length; k++) {
                            if (!selectedHintWords[k].word.toLowerCase().includes(char)) {
                                usedHintWords.push(wordObj.word); // Add to usedHintWords
                                selectedHintWords[k] = wordObj;
                                coveredChars = new Set(selectedHintWords.flatMap(wordObj => [...wordObj.word.toLowerCase()]));
                                foundReplacement = true;
                                break;
                            }
                        }
                    }
                }
                if (foundReplacement) break;
            }
        }
    });

    selectedHintWords.forEach(wordObj => {
        const word = wordObj.word;
        const explanation = wordObj.explanation;

        const wordContainer = document.createElement('div');
        wordContainer.classList.add('hintwords');
        hintcont.appendChild(wordContainer);

        const explanationSpan = document.createElement('span');
        explanationSpan.textContent = ` ${explanation}`;
        explanationSpan.style.fontWeight = 'bold'; 
        explanationSpan.style.fontSize = '20px';
        wordContainer.appendChild(explanationSpan);

        const inputNumberContainer = document.createElement('div');
        inputNumberContainer.classList.add('eachhintword');
        inputNumberContainer.style.display = 'flex';
        inputNumberContainer.style.alignItems = 'center';

        for (let i = 0; i < word.length; i++) {
            if (word[i] === ' ') {
                const spaceInput = document.createElement('input');
                spaceInput.type = "text";
                spaceInput.maxLength = 1;
                spaceInput.style.width = '10px';
                spaceInput.disabled = true;
                spaceInput.value = ' ';
                spaceInput.style.border = 'none';
                spaceInput.classList.add("space");
                inputNumberContainer.appendChild(spaceInput);
            } else {
                const inputNumberWrapper = document.createElement('div');
                inputNumberWrapper.classList.add('intnumhint');
                inputNumberWrapper.style.display = 'flex';
                inputNumberWrapper.style.flexDirection = 'column';
                inputNumberWrapper.style.alignItems = 'center';

                const hintInput = document.createElement('input');
                hintInput.type = "text";
                hintInput.maxLength = 1;
                hintInput.style.width = '30px';
                hintInput.style.marginRight = '5px';
                hintInput.style.textTransform = 'uppercase';
                hintInput.value = "";
                hintInput.autocomplete = "off";
                hintInput.dataset.letter = word[i].toUpperCase(); 
                inputNumberWrapper.appendChild(hintInput);

                const wordNumber = document.createElement('span');
                wordNumber.style.fontSize = '20px';
                wordNumber.textContent = lettermap[word[i].toUpperCase()];
                inputNumberWrapper.appendChild(wordNumber);

                inputNumberContainer.appendChild(inputNumberWrapper);
            }
        }

        wordContainer.appendChild(inputNumberContainer);
    });
}



function setupInputBoxListeners() {
    const inputConts = document.querySelectorAll('.factcontainer, .eachhintword');

    inputConts.forEach(inputCont => {
        const inputBoxes = inputCont.querySelectorAll('input[type="text"]');
        inputBoxes.forEach(inputBox => {
            inputBox.addEventListener('focus', function() {
                
                hintcont.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            inputBox.addEventListener('click', function() {
                const dataLetter = inputBox.dataset.letter;
                const correspondingHintInput = hintcont.querySelector(`input[data-letter="${dataLetter}"]`);
                if (!inputBox.closest('.hintcontainer')) {
                    correspondingHintInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            inputBox.addEventListener('click', function() {
                const dataLetter = inputBox.dataset.letter;
                const allInputBoxes = document.querySelectorAll(`input[data-letter="${dataLetter}"]`);
                allInputBoxes.forEach(box => {
                    box.style.backgroundColor = '#3a9a46'; // Dark green color
                    box.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                });
            });

            inputBox.addEventListener('blur', function() {
                const dataLetter = inputBox.dataset.letter;
                const allInputBoxes = document.querySelectorAll(`input[data-letter="${dataLetter}"]`);
                allInputBoxes.forEach(box => {
                    box.style.backgroundColor = '';
                    box.parentNode.style.backgroundColor = '';
                });
            });

            inputBox.addEventListener('input', function() {
                const dataLetter = inputBox.dataset.letter;
                const inputValue = inputBox.value.toUpperCase();
                if (inputValue === dataLetter) {
                    pressSound();
                    const allInputBoxes = document.querySelectorAll(`input[data-letter="${dataLetter}"]:not([disabled])`);
                    allInputBoxes.forEach(box => {
                        box.value = inputValue;
                        box.style.backgroundColor = '#3a9a46'; // Dark green color
                        box.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                    });
                    checkGuess();
                    const currentIndex = Array.from(inputBox.parentNode.parentNode.children).indexOf(inputBox.parentNode);
                    let nextIndex = currentIndex + 1;
                    let nextInputBoxContainer = inputBox.parentNode.parentNode.children[nextIndex];

                    while (nextInputBoxContainer) {
                        let nextInputBox = nextInputBoxContainer.querySelector('input[type="text"]:not([disabled])');
                        if (nextInputBox && !nextInputBox.value) {
                            break;
                        }
                        nextIndex++;
                        nextInputBoxContainer = inputBox.parentNode.parentNode.children[nextIndex];
                    }

                    if (nextInputBoxContainer) {

                        let nextInputBox = nextInputBoxContainer.querySelector('input[type="text"]:not([disabled])');
                        nextInputBox.focus();
                        const nextDataLetter = nextInputBox.dataset.letter;
                        const allNextInputBoxes = document.querySelectorAll(`input[data-letter="${nextDataLetter}"]:not([disabled])`);
                        allNextInputBoxes.forEach(box => {
                            box.style.backgroundColor = '#3a9a46'; // Dark green color
                            box.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                        });
                    }
                } else {
                    if (inputValue === '') {
                        inputBox.style.backgroundColor = '#3a9a46'; // Dark green color
                        inputBox.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                    } else {
                        wrongSound();
                        heartsCount--;
                        updateHeartCount();
                        inputBox.style.backgroundColor = 'red';
                        inputBox.parentNode.style.backgroundColor = 'red';
                    }
                }
            });


            inputBox.addEventListener('keydown', function(event) {
                if (event.key === 'Backspace' && inputBox.value === '') {
                    event.preventDefault();
                    const currentIndex = Array.from(inputBox.parentNode.parentNode.children).indexOf(inputBox.parentNode);
                    let prevIndex = currentIndex - 1;
                    let prevInputBox = null;
                    while (prevIndex >= 0) {
                        prevInputBox = inputBox.parentNode.parentNode.children[prevIndex].querySelector('input[type="text"]');
                        if (prevInputBox && !prevInputBox.disabled) {
                            break;
                        }
                        prevIndex--;
                    }
                    if (prevInputBox) {
                        prevInputBox.focus();
                        const dataLetter = prevInputBox.dataset.letter;
                        const allInputBoxes = document.querySelectorAll(`input[data-letter="${dataLetter}"]`);
                        allInputBoxes.forEach(box => {
                            box.style.backgroundColor = '#3a9a46'; // Dark green color
                            box.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                            box.value = '';
                        });
                    }

                } else if (event.key === 'Tab') {
                    event.preventDefault();
                    const currentIndex = Array.from(inputBox.parentNode.parentNode.children).indexOf(inputBox.parentNode);
                    let nextIndex = currentIndex + 1;
                    let nextInputBox = null;
                    while (nextIndex < inputBox.parentNode.parentNode.children.length) {
                        nextInputBox = inputBox.parentNode.parentNode.children[nextIndex].querySelector('input[type="text"]');
                        if (nextInputBox && !nextInputBox.disabled) {
                            break;
                        }
                        nextIndex++;
                    }
                    if (nextInputBox) {
                        nextInputBox.focus();
                        const dataLetter = nextInputBox.dataset.letter;
                        const allInputBoxes = document.querySelectorAll(`input[data-letter="${dataLetter}"]`);
                        allInputBoxes.forEach(box => {
                            box.style.backgroundColor = '#3a9a46'; // Dark green color
                            box.parentNode.style.backgroundColor = '#3a9a46'; // Dark green color
                        });
                    }
                }
            });
        });
    });
}


function checkGuess() {
    const letterInputs = document.querySelectorAll('.inputcont input[type="text"]');
    const spanofinputs = document.querySelectorAll('.inputcont span');
    let completed = true;
    let delay = 0;


    for (let i = 0; i < letterInputs.length; i++) {
        const dataLetter = letterInputs[i].dataset.letter;
        if (letterInputs[i].value.toUpperCase() !== dataLetter.toUpperCase()) {
            completed = false;
            break;
        }
    }

    if (completed) {
        for (let i = 0; i < letterInputs.length; i++) {
            const dataLetter = letterInputs[i].dataset.letter;
            const jumpSound = new Audio('sounds/check.wav'); 
            setTimeout(() => {
                letterInputs[i].classList.add('jumping');
                spanofinputs[i].style.color = "lightgreen";
                spanofinputs[i].innerText = '✔'; 
                jumpSound.play(); 
            }, delay);
            setTimeout(() => {
                letterInputs[i].classList.remove('jumping');
            }, delay + 1000); 
            delay += 130; 
        }
        setTimeout(() => {
            currlevel++;
            hideContainers();
            headtext.innerHTML = 'Level: ' + currlevel;
        }, delay + 1000); 
    }
}


function hideContainers() {
    if (multiplayer) {

        socket.emit('winner', { winnerSocketId: socket.id, enemyname,loggeduser});
     


        const nextPhraseObj = phrases.find(obj => obj.phrase === phrase);
        const nextPhrase = nextPhraseObj.phrase;
        const nextExplanation = nextPhraseObj.explanation;

    
        var gamecontainers = document.querySelector('.gamecontainers')
        gamecontainers.style.display = 'none'

        var winnercont = document.querySelector(".win")
      
        winnercont.style.display = 'block'

    }else{
    const nextPhraseObj = phrases.find(obj => obj.phrase === phrase);
    const nextPhrase = nextPhraseObj.phrase;
    const nextExplanation = nextPhraseObj.explanation;

    var gamecontainers = document.querySelector('.gamecontainers')
    gamecontainers.style.display = 'none'
    
    
    successcont.style.display = 'block'
    bodydiags.style.display ='block'

    SuccessPhrase.innerHTML = '';
    SuccessPhrase.innerHTML = nextPhrase;
   
    explanationbox.innerHTML = '';
    explanationbox.innerHTML = nextExplanation;}

}

function startnext() {
    lettermap = {};
    phrase = getNextPhrase();
    const letterInputs = document.querySelectorAll('.inputcont input[type="text"]');
    letterInputs.forEach(input => input.value = '');

    const containerofinputs = document.querySelector('.containerofinputs');
    containerofinputs.parentNode.removeChild(containerofinputs);
    

    successcont.style.display = 'none'
    
    if (currlevel == 11) {
        endgame();
        playCompleteAudio();
    }  else {
        nextlevel()
    }

   
    
}

function nextlevel(){
    var gamecontainers = document.querySelector('.gamecontainers')

    gamecontainers.style.transition = "opacity 1s ease";
    gamecontainers.style.opacity = 1;
    setTimeout(function() {
        gamecontainers.style.display = "block";
        bodydiags.style.display ='none'
    }, 300);

    setupGame();
}


function restart() {
    buttonclicksound();
    heartsCount = 5;
    currlevel = 1;
    lettermap = {};
    formattedTime = ''

    const hearts = document.querySelectorAll('.heart');
    hearts.forEach(heart => {
        heart.style.visibility = 'visible';
        heart.style.animation = 'none'; 
    });

    gameover.style.display = 'none';
    unclickable2.style.display = 'none';
    stopSound();
   

    const containerofinputs = document.querySelector('.containerofinputs');
    if (containerofinputs) {
        containerofinputs.parentNode.removeChild(containerofinputs);
    }

    headtext.innerHTML = 'Level: ' + currlevel;
    phrase = getNextPhrase();
    startgame();
}


function mainmenus(){
    dcmatch();
    stopSound();
    buttonclicksound();
    heartsCount = 5;
    updateHeartCount();
    currlevel = 1;
    multiplayer = false;


    const containerofinputs = document.querySelector('.containerofinputs');
        if (containerofinputs) {
            containerofinputs.parentNode.removeChild(containerofinputs);
        }
    
        headtext.innerHTML = 'Level: ' + currlevel;
        phrase = getNextPhrase();
        
    
    var newcont = document.querySelector('.gamecontainers')
    var losercont = document.querySelector(".loss")
    var winnercont = document.querySelector(".win")
    
    findvar1.style.display = 'none';
    findvar2.style.display = 'none';
    findvar3.style.display = 'none';
    winnercont.style.display = 'none'
    losercont.style.display= 'none';
    leaderboardcont.style.display = 'none';
    unclickable1.style.display = 'none';
    endbox.style.display = 'none'
    unclickable2.style.display = 'none';

    mainmenu.style.display = 'block';
    mainmenu.style.opacity = 1;
    newcont.style.display = 'none';
    
    
    
    }
    


function endgame(){

 unclickable1.style.display = 'block';
 endbox.style.display ='block'
    
      
console.log(formattedTime)

fetch('/sendtime', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ formattedTime,loggeduser }), // Pass the variable in the request body
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('There was a problem with your fetch operation:', error);
});
 }


     

 function showleaderboard(){
    mainmenu.style.display = 'none'
    bodydiags.style.display ='block';
    leaderboardcont.style.display = 'block';
    displayLeaderboard();
     
}    



let timerInterval;
let formattedTime;

function startTimer() {
    formattedTime = 0;
    let seconds = 0;
    let minutes = 0;
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        formattedTime = padNumber(minutes) + ':' + padNumber(seconds); 
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);

}

function padNumber(number) {
    return (number < 10) ? '0' + number : number;
}

var datatype = ['BEST TIME', 'WIN STREAK', 'MOST W POINTS'];
var dataindex = 0;

var databtn = document.getElementById('databtn');

function changedata() {
    dataindex = (dataindex + 1) % datatype.length;
    databtn.textContent = datatype[dataindex];


    displayLeaderboard();
}





fetchLeaderboard();

function displayLeaderboard() {
    fetchLeaderboard();
    var label;
    const leaderboard = leaderboardinfo
  
    const top10Divs = document.querySelectorAll('.top10');
    if(dataindex == 0){
        var enterdata = "bestTime"
       label = "Time"
    }else if(dataindex == 1){
         var enterdata = "bestWS"
            label = "Wins"
         leaderboard.sort((a, b) => b.bestWS - a.bestWS);
    }else{
         var enterdata = "MMR"
         leaderboard.sort((a, b) => b.MMR - a.MMR);
          label = "Score"
    }
    
    top10Divs.forEach(div => {
        div.innerHTML = '';
    });

    let displayedEntries = 0;
   
    for (let i = 0; i < Math.min(leaderboard.length, top10Divs.length); i++) {
        const entry = leaderboard[i];
        if (dataindex === 1 && entry.bestWS === 0) {
            continue;
        }else if(dataindex === 2 && entry.MMR <= 0 ){
            continue;
        }
        const topDiv = top10Divs[displayedEntries];
        topDiv.innerHTML = `<p class='leadname'>${entry.username} <div class="rank">Rank</div> <div class="ranknum">${displayedEntries + 1}</div> </p><br style="line-height: 0.2;"></br> </p><p class='time' style="margin-top: -30px;">${label}: ${entry[enterdata]}</p>`;
        displayedEntries++;
    }
}


function closetab(){
    location.reload();
}

function convertTimeToSeconds(timeStr) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return (minutes * 60) + seconds;
  }





var findvar1 = document.getElementById('findtext')
var findvar2 = document.getElementById('loading')
var findvar3 = document.getElementById('goback')

function findmatch (){
mainmenu.style.display = 'none';
bodydiags.style.display = 'block';
findvar1.style.display = 'block'
findvar2.style.display = 'block'
findvar3.style.display = 'block'

socket.emit("addmatch", loggeduser)


}

var enemy;
var enemyname;

socket.on('match found', function(data) {
    const opponent = data.opponentname;
    enemy = data.opponentSocketId;
    enemyname = opponent;
    multiplayer = true;
    findvar1.style.display = 'none';
    findvar2.style.display = 'none';
    findvar3.style.display = 'none';

    startgame();
    console.log('Match found! Your opponent:', opponent);
    console.log('Match found! Your opponent socket ID:', enemy); 
});




socket.on("loser", (data) => {
    const nextPhraseObj = phrases.find(obj => obj.phrase === phrase);
    const nextPhrase = nextPhraseObj.phrase;
    const nextExplanation = nextPhraseObj.explanation;


    var gamecontainers = document.querySelector('.gamecontainers')
    gamecontainers.style.display = 'none'

    var losercont = document.querySelector(".loss")
  
   losercont.style.display = 'block'
});





































function updateHeartCount() {
    const hearts = document.querySelectorAll('.heart');
    for (let i = 0; i < hearts.length; i++) {
        if (i < heartsCount) {
            hearts[i].style.visibility = 'visible';
            hearts[i].style.animation = ''; 
        } else {
            hearts[i].style.animation = 'explode 0.5s forwards';
            setTimeout(() => {
                hearts[i].style.visibility = 'hidden';
            }, 500); 
        }
    }

    if (heartsCount === 0) {
        unclickable2.style.display = "block";
        gameover.style.display = 'block';
        gameoversound();
        if (bgmusic.paused === false) { 
            bgmusic.pause(); 
        }
    } else if (heartsCount === 5) {

        for (let i = 0; i < hearts.length; i++) {
            hearts[i].style.visibility = 'visible';
            hearts[i].style.animation = '';
        }
    }
}




var bgmusic = document.getElementById('bgmusic');
bgmusic.volume = 0.2;

const muteToggle = document.getElementById('muteToggle');
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



var gameOverAudio;
var completeaudio;

function gameoversound(){
    gameOverAudio = new Audio('sounds/lose.mp3');
    gameOverAudio.volume = 0.3;
    gameOverAudio.loop = true;
    gameOverAudio.play();
}
function stopSound() {
    if (gameOverAudio) {
        gameOverAudio.pause();
    }
    if (completeaudio) {
        completeaudio.pause();
    }
}


function buttonclicksound() {
    var audio = new Audio('sounds/btnclick.wav');
    audio.play();}

    
function successsound() {
    var audio = new Audio('sounds/success.wav');
    audio.play();}


    function pressSound() {
        var audio = new Audio('sounds/press.wav');
        audio.play();
      }
      function wrongSound() {
        var audio = new Audio('sounds/wrong.wav');
        audio.play();
      }
    

      function playCompleteAudio() {
        completeaudio = new Audio('sounds/complete.mp3');
        completeaudio.play();
    }

    document.addEventListener('DOMContentLoaded', bgmusic);

    



 
document.addEventListener('DOMContentLoaded', function () {

    const buttons = document.querySelectorAll('button');
    const hoverSound = new Audio('sounds/hoversound.wav');
    const clickSound = new Audio('sounds/btnpress.mp3');

    buttons.forEach(button => {
       
        button.addEventListener('mouseover', function () {
            // Check if the button is not the excluded button
            if (button.id !== 'muteToggle') {
                hoverSound.play();
            }
        });

     
        button.addEventListener('click', function () {
            // Check if the button is not the excluded button
            if (button.id !== 'muteToggle') {
                clickSound.play();
            }
        });
    });
});














