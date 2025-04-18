// Initialize WebsimSocket
const room = new WebsimSocket();

// DOM Element References
const currentObject = document.getElementById('current-object');
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const result = document.getElementById('result');
const usedObjects = document.getElementById('used-objects');
const showTutorial = document.getElementById('show-tutorial');
const closeTutorial = document.getElementById('close-tutorial');
const tutorial = document.getElementById('tutorial');
const emojiSelector = document.getElementById('emoji-selector');
const startGameBtn = document.getElementById('start-game');
const playNowBtn = document.getElementById('play-now');
const gameArea = document.getElementById('game-area');
const objectHistory = document.getElementById('object-history');
const playModeBtn = document.getElementById('play-mode-btn');
const playModeArea = document.getElementById('play-mode-area');
const computerObject = document.getElementById('computer-object');
const playerObjects = document.getElementById('player-objects');
const playResult = document.getElementById('play-result');
const objectDetails = document.getElementById('object-details');
const leaderboardLink = document.getElementById('leaderboard-link');
const leaderboardArea = document.getElementById('leaderboard-area');
const backToGameBtn = document.getElementById('back-to-game');

// Game State
let usedObjectsArray = [];
let selectedEmoji = '';
let objectRelations = {};
let conversationHistory = [];
let currentPlayerUsername = '';

// Local Storage Functions
function loadFromLocalStorage() {
  const savedObjects = localStorage.getItem('usedObjects');
  const savedRelations = localStorage.getItem('objectRelations');
  
  if (savedObjects) {
    usedObjectsArray = JSON.parse(savedObjects);
    updateObjectHistory();
  }
  
  if (savedRelations) {
    objectRelations = JSON.parse(savedRelations);
  }
  
  updateObjectDetails();
}

function saveToLocalStorage() {
  localStorage.setItem('usedObjects', JSON.stringify(usedObjectsArray));
  localStorage.setItem('objectRelations', JSON.stringify(objectRelations));
  updateObjectHistory();
  updateObjectDetails();
}

// UI Update Functions
function updateObjectHistory() {
  objectHistory.innerHTML = '<h3>Object History:</h3>';
  
  usedObjectsArray.forEach((obj, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <span>${obj}</span>
      <button class="delete-object" data-index="${index}">Delete</button>
    `;
    objectHistory.appendChild(historyItem);
  });
}

function updateObjectDetails() {
  objectDetails.innerHTML = '<h3>Object Details:</h3>';
  
  for (let obj in objectRelations) {
    const detailItem = document.createElement('div');
    detailItem.innerHTML = `<strong>${obj}</strong>:<br>
      Beats: ${objectRelations[obj].beats.join(', ') || 'None'}<br>
      Beaten by: ${objectRelations[obj].beatenBy.join(', ') || 'None'}`;
    objectDetails.appendChild(detailItem);
  }
}

function updateUsedObjects() {
  usedObjects.textContent = 'Used objects: ' + usedObjectsArray.join(', ');
}

// Object Management Functions
function deleteObject(index) {
  const deletedObject = usedObjectsArray[index];
  usedObjectsArray.splice(index, 1);
  delete objectRelations[deletedObject];
  
  for (let obj in objectRelations) {
    objectRelations[obj].beats = objectRelations[obj].beats.filter(item => item !== deletedObject);
    objectRelations[obj].beatenBy = objectRelations[obj].beatenBy.filter(item => item !== deletedObject);
  }
  
  saveToLocalStorage();
}

function combineEmojiData(newEmoji, existingEmoji) {
  // Combine the relationships for duplicate emojis
  if (!objectRelations[newEmoji]) {
    objectRelations[newEmoji] = { beats: [], beatenBy: [] };
  }
  
  if (objectRelations[existingEmoji]) {
    // Merge 'beats' and 'beatenBy' arrays without duplicates
    objectRelations[existingEmoji].beats.forEach(beaten => {
      if (!objectRelations[newEmoji].beats.includes(beaten)) {
        objectRelations[newEmoji].beats.push(beaten);
      }
    });
    
    objectRelations[existingEmoji].beatenBy.forEach(beater => {
      if (!objectRelations[newEmoji].beatenBy.includes(beater)) {
        objectRelations[newEmoji].beatenBy.push(beater);
      }
    });
  }
}

// Animation Functions
function animateCurrentObject() {
  currentObject.style.animation = 'bounce 1s';
  setTimeout(() => {
    currentObject.style.animation = '';
  }, 1000);
}

function showResult(message, isLoading = false) {
  result.innerHTML = isLoading ? '<div class="loading"></div>' : message;
  result.style.opacity = '0';
  setTimeout(() => {
    result.style.opacity = '1';
  }, 100);
}

// AI Interaction Functions
async function evaluateObjects(newObject, currentObj) {
  try {
    showResult('', true);
    
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the judge in a creative game called "Rock Paper Anything" where players suggest objects that can beat other objects.
          Your task is to evaluate if the new object can logically beat the current object.
          Be generous in allowing logical relationships - if there's any reasonable way the new object could beat the current one, allow it.
          Consider real world physics, properties, and creative logical relationships.
          Think broadly about how objects could interact, considering size, strength, abilities, and natural properties.
          Be lenient and creative in your judgments - the goal is to keep the game fun while maintaining some logic.`
        },
        {
          role: "user",
          content: `Evaluate if "${newObject}" can logically beat "${currentObj}".
          Provide your answer in JSON format with the following fields:
          - valid: boolean indicating if the new object can beat the current one
          - explanation: detailed explanation of why it works or doesn't work
          - suggestedEmoji: an appropriate emoji representation for the new object (if text was entered)`
        }
      ],
      json: true
    });
    
    return JSON.parse(completion.content);
  } catch (error) {
    console.error("Error evaluating objects:", error);
    return { valid: false, explanation: "An error occurred during evaluation. Please try again." };
  }
}

async function getObjectRelationships(obj1, obj2) {
  try {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the judge in a creative game called "Rock Paper Anything" where objects compete against each other.
          Your task is to determine which object would win in a conflict between the two objects and explain why.
          Be generous in considering logical relationships - if there's a reasonable way one could beat the other, allow it.
          Think creatively about how objects could interact, considering all possible properties and relationships.`
        },
        {
          role: "user",
          content: `Analyze the relationship between "${obj1}" and "${obj2}".
          Determine which object would win in a conflict and explain why.
          Provide your answer in JSON format with the following fields:
          - winner: the object that would win
          - loser: the object that would lose
          - explanation: detailed explanation of why the winner beats the loser`
        }
      ],
      json: true
    });
    
    return JSON.parse(completion.content);
  } catch (error) {
    console.error("Error getting relationship:", error);
    return null;
  }
}

// Game Logic Functions
async function submitObject() {
  const newObject = userInput.value.trim();
  if (!newObject) return;
  
  submitBtn.disabled = true;
  
  try {
    const aiData = await evaluateObjects(newObject, currentObject.textContent);
    
    if (aiData.valid) {
      const displayObject = aiData.suggestedEmoji || newObject;
      
      // Animate object change
      currentObject.style.transform = 'scale(0)';
      setTimeout(() => {
        currentObject.textContent = displayObject;
        currentObject.style.transform = 'scale(1)';
        animateCurrentObject();
      }, 300);
      
      // Update object relationships
      if (!objectRelations[displayObject]) {
        objectRelations[displayObject] = {
          beats: [],
          beatenBy: []
        };
      }
      
      if (!objectRelations[currentObject.textContent]) {
        objectRelations[currentObject.textContent] = {
          beats: [],
          beatenBy: []
        };
      }
      
      objectRelations[displayObject].beats.push(currentObject.textContent);
      objectRelations[currentObject.textContent].beatenBy.push(displayObject);
      
      // Check if object already exists and combine data if needed
      const existingIndex = usedObjectsArray.findIndex(obj => obj === displayObject);
      if (existingIndex !== -1) {
        combineEmojiData(displayObject, usedObjectsArray[existingIndex]);
      } else {
        usedObjectsArray.push(displayObject);
      }
      
      updateUsedObjects();
      saveToLocalStorage();
      showResult(aiData.explanation);
    } else {
      showResult(aiData.explanation);
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('An error occurred. Please try again.');
  }
  
  userInput.value = '';
  submitBtn.disabled = false;
}

async function playRound(playerObj, computerObj) {
  if (objectRelations[playerObj] && objectRelations[playerObj].beats.includes(computerObj)) {
    playResult.textContent = `You win! ${playerObj} beats ${computerObj}`;
  } else if (objectRelations[computerObj] && objectRelations[computerObj].beats.includes(playerObj)) {
    playResult.textContent = `You lose! ${computerObj} beats ${playerObj}`;
  } else {
    playResult.textContent = "Analyzing matchup...";
    const relationship = await getObjectRelationships(playerObj, computerObj);
    
    if (relationship) {
      if (relationship.winner === playerObj) {
        playResult.textContent = `You win! ${relationship.explanation}`;
        if (!objectRelations[playerObj].beats.includes(computerObj)) {
          objectRelations[playerObj].beats.push(computerObj);
          objectRelations[computerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      } else if (relationship.winner === computerObj) {
        playResult.textContent = `You lose! ${relationship.explanation}`;
        if (!objectRelations[computerObj].beats.includes(playerObj)) {
          objectRelations[computerObj].beats.push(playerObj);
          objectRelations[playerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      }
    } else {
      playResult.textContent = "It's a tie! No clear winner.";
    }
  }
  
  setTimeout(startPlayMode, 3000);
}

function startPlayMode() {
  if (usedObjectsArray.length < 2) {
    alert("You need at least 2 objects to play. Please create more objects first.");
    return;
  }
  
  gameArea.style.display = 'none';
  playModeArea.style.display = 'block';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  
  const computerSelection = usedObjectsArray[Math.floor(Math.random() * usedObjectsArray.length)];
  computerObject.textContent = `Computer's Object: ${computerSelection}`;
  
  playerObjects.innerHTML = 'Your Objects: ';
  usedObjectsArray.forEach(obj => {
    const objButton = document.createElement('button');
    objButton.className = 'player-object-btn';
    objButton.textContent = obj;
    objButton.onclick = () => playRound(obj, computerSelection);
    playerObjects.appendChild(objButton);
  });
  
  playResult.textContent = '';
}

// Event Listeners
emojiSelector.addEventListener('click', e => {
  if (e.target.classList.contains('emoji-option')) {
    // Clear previous selection
    emojiSelector.querySelectorAll('.emoji-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Set new selection
    selectedEmoji = e.target.dataset.emoji;
    e.target.classList.add('selected');
    startGameBtn.disabled = false;
  }
});

startGameBtn.addEventListener('click', () => {
  if (selectedEmoji) {
    emojiSelector.style.display = 'none';
    startGameBtn.style.display = 'none';
    playNowBtn.style.display = 'none';
    gameArea.style.display = 'block';
    playModeArea.style.display = 'none';
    
    currentObject.textContent = selectedEmoji;
    
    if (!usedObjectsArray.includes(selectedEmoji)) {
      usedObjectsArray.push(selectedEmoji);
    }
    
    if (!objectRelations[selectedEmoji]) {
      objectRelations[selectedEmoji] = {
        beats: [],
        beatenBy: []
      };
    }
    
    updateUsedObjects();
    saveToLocalStorage();
    animateCurrentObject();
  }
});

playNowBtn.addEventListener('click', () => {
  if (usedObjectsArray.length > 0) {
    emojiSelector.style.display = 'none';
    startGameBtn.style.display = 'none';
    playNowBtn.style.display = 'none';
    gameArea.style.display = 'block';
    playModeArea.style.display = 'none';
    
    currentObject.textContent = usedObjectsArray[usedObjectsArray.length - 1];
    updateUsedObjects();
    animateCurrentObject();
  } else {
    alert('No saved objects found. Please start a new game.');
  }
});

submitBtn.addEventListener('click', submitObject);

userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    submitObject();
  }
});

showTutorial.addEventListener('click', e => {
  e.preventDefault();
  tutorial.style.display = 'flex';
});

closeTutorial.addEventListener('click', () => {
  tutorial.style.display = 'none';
});

objectHistory.addEventListener('click', e => {
  if (e.target.classList.contains('delete-object')) {
    const index = parseInt(e.target.dataset.index);
    deleteObject(index);
  }
});

playModeBtn.addEventListener('click', startPlayMode);

leaderboardLink.addEventListener('click', (e) => {
  e.preventDefault();
  showLeaderboard();
  // Update URL without refreshing
  window.history.pushState({}, '', '?view=leaderboard');
});

backToGameBtn.addEventListener('click', () => {
  hideLeaderboard();
  // Update URL without refreshing
  window.history.pushState({}, '', window.location.pathname);
});

// Initialize
async function initialize() {
  await room.initialize();
  loadFromLocalStorage();
  getCurrentUsername();
  
  // Check if there are saved objects to enable/disable the Play Now button
  playNowBtn.disabled = usedObjectsArray.length === 0;
  
  // Check if we're on the leaderboard page (from URL parameter)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'leaderboard') {
    showLeaderboard();
  }
}

async function getCurrentUsername() {
  try {
    const userInfo = room.peers[room.clientId];
    if (userInfo && userInfo.username) {
      currentPlayerUsername = userInfo.username;
      console.log("Current player username:", currentPlayerUsername);
    }
  } catch (error) {
    console.error("Error getting username:", error);
    // Use a random name if we can't get the username
    currentPlayerUsername = "Player_" + Math.floor(Math.random() * 1000);
  }
}

function showLeaderboard() {
  // This function is not defined in the plan
}

function hideLeaderboard() {
  // This function is not defined in the plan
}

// Initialize
initialize();