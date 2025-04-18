// Realtime Mode using WebsimSocket for multiplayer functionality
let room;
let hostMode = false;
let gameSettings = {
  timer: 15,
  bestOf: 3,
};
let gameState = {
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,
  playerReady: false,
  opponentReady: false,
  playerSelection: null,
  opponentSelection: null,
  matchInProgress: false,
  timer: null,
};

// DOM Elements for Realtime Mode
const realtimeModeBtn = document.getElementById('realtime-mode-btn');
const realtimeModeArea = document.getElementById('realtime-mode-area');
const tabButtons = document.querySelectorAll('.realtime-tab-btn');
const tabContents = document.querySelectorAll('.realtime-tab-content');
const bestOfSetting = document.getElementById('best-of-setting');
const customRounds = document.getElementById('custom-rounds');
const timerSetting = document.getElementById('timer-setting');
const createRoomBtn = document.getElementById('create-room-btn');
const refreshRoomsBtn = document.getElementById('refresh-rooms-btn');
const roomList = document.getElementById('room-list');
const lobbyArea = document.getElementById('lobby-area');
const readyBtn = document.getElementById('ready-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const roomCode = document.getElementById('room-code');
const hostName = document.getElementById('host-name');
const roundsDisplay = document.getElementById('rounds-display');
const timerDisplay = document.getElementById('timer-display');
const playerCard = document.getElementById('player-self');
const opponentCard = document.getElementById('player-opponent');
const gameMatchArea = document.getElementById('game-match-area');
const playerScore = document.getElementById('player-score');
const opponentScore = document.getElementById('opponent-score');
const currentRound = document.getElementById('current-round');
const totalRounds = document.getElementById('total-rounds');
const countdownTimer = document.getElementById('countdown-timer');
const playerSelectedObject = document.getElementById('player-selected-object');
const opponentSelectedObject = document.getElementById('opponent-selected-object');
const playerObjectsGrid = document.getElementById('player-objects-grid');
const roundResult = document.getElementById('round-result');
const resultMessage = document.getElementById('result-message');
const resultExplanation = document.getElementById('result-explanation');
const nextRoundBtn = document.getElementById('next-round-btn');
const matchResult = document.getElementById('match-result');
const matchResultTitle = document.getElementById('match-result-title');
const finalScore = document.getElementById('final-score');
const rematchBtn = document.getElementById('rematch-btn');
const exitMatchBtn = document.getElementById('exit-match-btn');

// Initialize Realtime Mode
function initRealtimeMode() {
  realtimeModeBtn.addEventListener('click', () => {
    showRealtimeMode();
  });
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and hide all content
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.add('hidden'));
      
      // Add active class to clicked button and show corresponding content
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    });
  });
  
  // Handle best-of setting changes
  bestOfSetting.addEventListener('change', () => {
    if (bestOfSetting.value === 'custom') {
      customRounds.classList.remove('hidden');
    } else {
      customRounds.classList.add('hidden');
    }
  });
  
  // Create room button
  createRoomBtn.addEventListener('click', createRoom);
  
  // Refresh rooms button
  refreshRoomsBtn.addEventListener('click', refreshRooms);
  
  // Ready button
  readyBtn.addEventListener('click', toggleReady);
  
  // Leave lobby button
  leaveLobbyBtn.addEventListener('click', leaveLobby);
  
  // Next round button
  nextRoundBtn.addEventListener('click', startNextRound);
  
  // Rematch button
  rematchBtn.addEventListener('click', requestRematch);
  
  // Exit match button
  exitMatchBtn.addEventListener('click', exitMatch);
}

// Show the realtime mode UI
function showRealtimeMode() {
  // Hide other game areas
  gameArea.style.display = 'none';
  playModeArea.style.display = 'none';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  
  // Show realtime mode area
  realtimeModeArea.style.display = 'block';
  
  // Refresh the room list if on join tab
  if (!document.getElementById('join-tab').classList.contains('hidden')) {
    refreshRooms();
  }
}

// Create a new game room
async function createRoom() {
  hostMode = true;
  
  // Get settings
  gameSettings.timer = parseInt(timerSetting.value);
  
  if (bestOfSetting.value === 'custom') {
    gameSettings.bestOf = parseInt(customRounds.value);
  } else {
    gameSettings.bestOf = parseInt(bestOfSetting.value);
  }
  
  try {
    // Initialize the room
    room = new WebsimSocket();
    await room.initialize();
    
    // Set up initial room state
    room.updateRoomState({
      settings: gameSettings,
      gameStatus: 'waiting', // waiting, ready, in-progress, finished
      hostId: room.clientId,
    });
    
    // Set up initial presence
    room.updatePresence({
      ready: false,
      score: 0,
      selection: null,
      selectedStatus: false,
    });
    
    // Subscribe to room state changes
    room.subscribeRoomState(handleRoomStateChanges);
    
    // Subscribe to presence changes
    room.subscribePresence(handlePresenceChanges);
    
    // Subscribe to presence update requests (for game actions)
    room.subscribePresenceUpdateRequests(handleUpdateRequests);
    
    // Set up message handling for events
    room.onmessage = handleMessages;
    
    // Show the lobby UI
    showLobby();
    
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Failed to create room. Please try again.');
  }
}

// Join an existing game room
async function joinRoom(roomId) {
  hostMode = false;
  
  try {
    // Initialize the room with the specific room ID
    room = new WebsimSocket(roomId);
    await room.initialize();
    
    // Set up initial presence
    room.updatePresence({
      ready: false,
      score: 0,
      selection: null,
      selectedStatus: false,
    });
    
    // Subscribe to room state changes
    room.subscribeRoomState(handleRoomStateChanges);
    
    // Subscribe to presence changes
    room.subscribePresence(handlePresenceChanges);
    
    // Subscribe to presence update requests (for game actions)
    room.subscribePresenceUpdateRequests(handleUpdateRequests);
    
    // Set up message handling for events
    room.onmessage = handleMessages;
    
    // Show the lobby UI
    showLobby();
    
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join room. Please try again.');
  }
}

// Handle room state changes
function handleRoomStateChanges(currentRoomState) {
  if (!currentRoomState) return;
  
  // Update settings display
  if (currentRoomState.settings) {
    gameSettings = currentRoomState.settings;
    roundsDisplay.textContent = gameSettings.bestOf;
    timerDisplay.textContent = gameSettings.timer;
    totalRounds.textContent = gameSettings.bestOf;
  }
  
  // Update host info
  if (currentRoomState.hostId && room.peers[currentRoomState.hostId]) {
    hostName.textContent = room.peers[currentRoomState.hostId].username;
  }
  
  // Handle game status changes
  if (currentRoomState.gameStatus === 'ready' && 
      room.presence[room.clientId].ready && 
      getOpponentPresence()?.ready) {
    startGame();
  }
  
  // Handle round results if available
  if (currentRoomState.roundResult) {
    showRoundResults(currentRoomState.roundResult);
  }
}

// Handle presence changes
function handlePresenceChanges(currentPresence) {
  // Update opponent's card if they exist
  const opponent = getOpponentPresence();
  if (opponent) {
    const opponentPeer = getOpponentPeer();
    if (opponentPeer) {
      const opponentNameEl = opponentCard.querySelector('.player-name');
      const opponentStatusEl = opponentCard.querySelector('.player-status');
      const opponentAvatarEl = opponentCard.querySelector('.player-avatar');
      
      opponentNameEl.textContent = opponentPeer.username;
      opponentStatusEl.textContent = opponent.ready ? 'Ready' : 'Not Ready';
      opponentAvatarEl.style.backgroundImage = `url(${opponentPeer.avatarUrl})`;
      
      if (opponent.ready) {
        opponentCard.classList.add('player-ready');
      } else {
        opponentCard.classList.remove('player-ready');
      }
    }
  }
  
  // Update player's ready status display
  if (currentPresence[room.clientId]) {
    if (currentPresence[room.clientId].ready) {
      playerCard.classList.add('player-ready');
      readyBtn.textContent = 'Cancel Ready';
    } else {
      playerCard.classList.remove('player-ready');
      readyBtn.textContent = 'Ready';
    }
  }
  
  // Check if both players are ready and update game status
  if (hostMode && 
      currentPresence[room.clientId]?.ready && 
      getOpponentPresence()?.ready) {
    room.updateRoomState({
      gameStatus: 'ready'
    });
  }
  
  // Update scores during a match
  if (gameState.matchInProgress) {
    playerScore.textContent = currentPresence[room.clientId].score || 0;
    opponentScore.textContent = getOpponentPresence()?.score || 0;
  }
  
  // Handle selection status during a round
  if (gameState.matchInProgress && !roundResult.classList.contains('hidden')) {
    const playerSelected = currentPresence[room.clientId].selectedStatus;
    const opponentSelected = getOpponentPresence()?.selectedStatus;
    
    if (playerSelected && opponentSelected) {
      // Both have selected, reveal the objects
      revealSelections();
    }
  }
}

// Handle presence update requests (for game actions)
function handleUpdateRequests(updateRequest, fromClientId) {
  if (updateRequest.type === 'damageRequest') {
    // The winner is asking us to take damage (update our score)
    let newScore = room.presence[room.clientId].score || 0;
    newScore -= 1;
    
    room.updatePresence({
      score: newScore
    });
  }
}

// Handle socket messages (for game events)
function handleMessages(event) {
  const data = event.data;
  
  switch (data.type) {
    case "roundStart":
      startRound();
      break;
    case "timeWarning":
      countdownTimer.classList.add('countdown-warning');
      break;
    case "roundEnd":
      endRound();
      break;
    case "rematchRequest":
      if (confirm("Your opponent wants a rematch. Accept?")) {
        room.send({ type: "rematchAccepted" });
        resetGame();
      } else {
        room.send({ type: "rematchDeclined" });
      }
      break;
    case "rematchAccepted":
      resetGame();
      break;
    case "rematchDeclined":
      alert("Rematch declined by opponent.");
      exitMatch();
      break;
  }
}

// Show the lobby UI
function showLobby() {
  // Hide tab content and show lobby
  tabContents.forEach(content => content.classList.add('hidden'));
  lobbyArea.classList.remove('hidden');
  
  // Update room code display
  roomCode.textContent = room.clientId.slice(0, 4).toUpperCase();
  
  // Update player card with user info
  const playerNameEl = playerCard.querySelector('.player-name');
  const playerAvatarEl = playerCard.querySelector('.player-avatar');
  
  if (room.peers[room.clientId]) {
    playerNameEl.textContent = room.peers[room.clientId].username;
    playerAvatarEl.style.backgroundImage = `url(${room.peers[room.clientId].avatarUrl})`;
  }
}

// Toggle player ready status
function toggleReady() {
  const currentReadyStatus = room.presence[room.clientId].ready;
  room.updatePresence({
    ready: !currentReadyStatus
  });
}

// Leave the current lobby
function leaveLobby() {
  if (room) {
    room.updatePresence({
      ready: false
    });
    
    // If you're the host, update the room state
    if (hostMode && room.roomState.hostId === room.clientId) {
      room.updateRoomState({
        gameStatus: 'finished'
      });
    }
    
    // Close the connection
    // (Not actually available in the WebsimSocket API, but conceptually we'd disconnect)
    
    // Reset UI
    lobbyArea.classList.add('hidden');
    gameMatchArea.classList.add('hidden');
    document.getElementById('host-tab').classList.remove('hidden');
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === 'host') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    hostMode = false;
  }
}

// Start the game
function startGame() {
  // Hide lobby and show game area
  lobbyArea.classList.add('hidden');
  gameMatchArea.classList.remove('hidden');
  
  // Reset game state
  gameState.currentRound = 1;
  gameState.playerScore = 0;
  gameState.opponentScore = 0;
  gameState.matchInProgress = true;
  
  // Update UI
  currentRound.textContent = gameState.currentRound;
  playerScore.textContent = gameState.playerScore;
  opponentScore.textContent = gameState.opponentScore;
  
  // Populate player objects grid
  populateObjectGrid();
  
  // If host, initiate the first round
  if (hostMode) {
    room.send({ type: "roundStart" });
  }
}

// Populate the grid of objects the player can select
function populateObjectGrid() {
  playerObjectsGrid.innerHTML = '';
  
  // Add all objects from the player's collection
  usedObjectsArray.forEach(obj => {
    const objButton = document.createElement('button');
    objButton.className = 'object-selection-btn';
    objButton.textContent = obj;
    objButton.onclick = () => selectObject(obj);
    playerObjectsGrid.appendChild(objButton);
  });
}

// Handle object selection
function selectObject(object) {
  // Clear previous selection
  const buttons = playerObjectsGrid.querySelectorAll('.object-selection-btn');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  // Mark the selected button
  const selectedButton = Array.from(buttons).find(btn => btn.textContent === object);
  if (selectedButton) {
    selectedButton.classList.add('selected');
  }
  
  // Update player selection
  gameState.playerSelection = object;
  playerSelectedObject.textContent = object;
  
  // Update presence to indicate selection was made
  room.updatePresence({
    selection: object,
    selectedStatus: true
  });
}

// Start a round
function startRound() {
  // Reset selection state
  gameState.playerSelection = null;
  gameState.opponentSelection = null;
  
  // Update presence
  room.updatePresence({
    selection: null,
    selectedStatus: false
  });
  
  // Update UI
  playerSelectedObject.textContent = '?';
  opponentSelectedObject.textContent = '?';
  currentRound.textContent = gameState.currentRound;
  
  // Reset object selection buttons
  const buttons = playerObjectsGrid.querySelectorAll('.object-selection-btn');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  // Start the timer if host
  if (hostMode) {
    startTimer();
  }
}

// Start the countdown timer
function startTimer() {
  let timeLeft = gameSettings.timer;
  countdownTimer.textContent = timeLeft;
  countdownTimer.classList.remove('countdown-warning');
  
  clearInterval(gameState.timer);
  
  gameState.timer = setInterval(() => {
    timeLeft--;
    countdownTimer.textContent = timeLeft;
    
    // Send warning at 5 seconds
    if (timeLeft === 5) {
      room.send({ type: "timeWarning" });
    }
    
    // End round when time is up
    if (timeLeft <= 0) {
      clearInterval(gameState.timer);
      room.send({ type: "roundEnd" });
    }
  }, 1000);
}

// End the current round
function endRound() {
  clearInterval(gameState.timer);
  
  // If player hasn't selected, pick a random object
  if (!gameState.playerSelection) {
    const randomIndex = Math.floor(Math.random() * usedObjectsArray.length);
    selectObject(usedObjectsArray[randomIndex]);
  }
  
  // Check if both players have selected
  setTimeout(() => {
    // If opponent hasn't selected yet, wait for them
    const opponentSelected = getOpponentPresence()?.selectedStatus;
    
    if (!opponentSelected) {
      // Wait for opponent selection
      const waitMessage = document.createElement('div');
      waitMessage.className = 'waiting-message';
      waitMessage.textContent = 'Waiting for opponent to select...';
      document.querySelector('.match-area').appendChild(waitMessage);
    } else {
      // Both have selected, determine winner
      revealSelections();
    }
  }, 500);
}

// Reveal both players' selections and determine the winner
async function revealSelections() {
  // Get selections
  const playerObj = room.presence[room.clientId].selection;
  const opponentObj = getOpponentPresence()?.selection;
  
  if (!playerObj || !opponentObj) return;
  
  // Update display
  playerSelectedObject.textContent = playerObj;
  opponentSelectedObject.textContent = opponentObj;
  
  // Remove any waiting message
  const waitMessage = document.querySelector('.waiting-message');
  if (waitMessage) waitMessage.remove();
  
  // If host, determine the winner
  if (hostMode) {
    try {
      // First check existing relationships
      let winnerObj, loserObj, explanation;
      
      if (objectRelations[playerObj] && objectRelations[playerObj].beats.includes(opponentObj)) {
        winnerObj = playerObj;
        loserObj = opponentObj;
        explanation = `${winnerObj} beats ${loserObj} based on established rules.`;
      } else if (objectRelations[opponentObj] && objectRelations[opponentObj].beats.includes(playerObj)) {
        winnerObj = opponentObj;
        loserObj = playerObj;
        explanation = `${winnerObj} beats ${loserObj} based on established rules.`;
      } else {
        // No established relationship, use AI to determine winner
        const relationship = await getObjectRelationships(playerObj, opponentObj);
        
        if (relationship) {
          winnerObj = relationship.winner;
          loserObj = relationship.loser;
          explanation = relationship.explanation;
          
          // Add this relationship to the object relations
          if (!objectRelations[winnerObj]) {
            objectRelations[winnerObj] = { beats: [], beatenBy: [] };
          }
          if (!objectRelations[loserObj]) {
            objectRelations[loserObj] = { beats: [], beatenBy: [] };
          }
          
          if (!objectRelations[winnerObj].beats.includes(loserObj)) {
            objectRelations[winnerObj].beats.push(loserObj);
          }
          if (!objectRelations[loserObj].beatenBy.includes(winnerObj)) {
            objectRelations[loserObj].beatenBy.push(winnerObj);
          }
          
          // Save to local storage
          saveToLocalStorage();
        } else {
          // If AI can't determine, it's a tie
          explanation = "It's a tie! Both objects are evenly matched.";
        }
      }
      
      // Determine which client won
      let winnerId = null;
      if (winnerObj === playerObj) {
        winnerId = room.clientId;
      } else if (winnerObj === opponentObj) {
        // Find opponent ID
        const opponentId = Object.keys(room.presence).find(id => id !== room.clientId);
        if (opponentId) {
          winnerId = opponentId;
        }
      }
      
      // Update round result in room state
      room.updateRoomState({
        roundResult: {
          winnerObj,
          loserObj,
          winnerId,
          explanation,
          round: gameState.currentRound
        }
      });
      
      // Update scores
      if (winnerId) {
        // If host won
        if (winnerId === room.clientId) {
          room.updatePresence({
            score: (room.presence[room.clientId].score || 0) + 1
          });
          
          // Ask opponent to update their score
          const opponentId = Object.keys(room.presence).find(id => id !== room.clientId);
          if (opponentId) {
            room.requestPresenceUpdate(opponentId, {
              type: 'damageRequest'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error determining winner:', error);
      
      // Fall back to "tie" in case of error
      room.updateRoomState({
        roundResult: {
          explanation: "Unable to determine a winner. It's a tie!",
          round: gameState.currentRound
        }
      });
    }
  }
}

// Show the round results
function showRoundResults(result) {
  const playerObj = room.presence[room.clientId].selection;
  const opponentObj = getOpponentPresence()?.selection;
  
  playerSelectedObject.textContent = playerObj;
  opponentSelectedObject.textContent = opponentObj;
  
  // Highlight the winner
  if (result.winnerId === room.clientId) {
    document.querySelector('.player-selection').classList.add('winner');
    document.querySelector('.opponent-selection').classList.add('loser');
    resultMessage.textContent = "You Win!";
  } else if (result.winnerId) {
    document.querySelector('.player-selection').classList.add('loser');
    document.querySelector('.opponent-selection').classList.add('winner');
    resultMessage.textContent = "You Lose!";
  } else {
    resultMessage.textContent = "It's a Tie!";
  }
  
  resultExplanation.textContent = result.explanation;
  roundResult.classList.remove('hidden');
  
  // Check if the match is over
  const playerScore = room.presence[room.clientId].score || 0;
  const opponentScore = getOpponentPresence()?.score || 0;
  const winThreshold = Math.ceil(gameSettings.bestOf / 2);
  
  if (playerScore >= winThreshold || opponentScore >= winThreshold) {
    // Match is over
    if (playerScore > opponentScore) {
      matchResultTitle.textContent = "Victory!";
    } else {
      matchResultTitle.textContent = "Defeat!";
    }
    
    finalScore.textContent = `Final score: ${playerScore} - ${opponentScore}`;
    
    // Show match result instead of round result
    roundResult.classList.add('hidden');
    matchResult.classList.remove('hidden');
  }
}

// Start the next round
function startNextRound() {
  // Clear round results
  roundResult.classList.add('hidden');
  document.querySelector('.player-selection').classList.remove('winner', 'loser');
  document.querySelector('.opponent-selection').classList.remove('winner', 'loser');
  
  // Clear roundResult from roomState
  if (hostMode) {
    room.updateRoomState({
      roundResult: null
    });
  }
  
  // Increment round counter
  gameState.currentRound++;
  currentRound.textContent = gameState.currentRound;
  
  // If host, start the next round
  if (hostMode) {
    setTimeout(() => {
      room.send({ type: "roundStart" });
    }, 500);
  }
}

// Request a rematch
function requestRematch() {
  matchResult.classList.add('hidden');
  room.send({ type: "rematchRequest" });
}

// Exit the match
function exitMatch() {
  matchResult.classList.add('hidden');
  gameMatchArea.classList.add('hidden');
  lobbyArea.classList.remove('hidden');
  
  // Reset ready status
  room.updatePresence({
    ready: false,
    score: 0,
    selection: null,
    selectedStatus: false
  });
  
  // Update game status if host
  if (hostMode) {
    room.updateRoomState({
      gameStatus: 'waiting',
      roundResult: null
    });
  }
}

// Reset the game for a new match
function resetGame() {
  matchResult.classList.add('hidden');
  
  // Reset game state
  gameState.currentRound = 1;
  
  // Reset presence
  room.updatePresence({
    score: 0,
    selection: null,
    selectedStatus: false,
    ready: true
  });
  
  // If host, update room state
  if (hostMode) {
    room.updateRoomState({
      gameStatus: 'ready',
      roundResult: null
    });
  }
}

// Refresh the list of available rooms
async function refreshRooms() {
  // In a real implementation, this would query available rooms
  // For this demo, we'll simulate it with a loading message
  roomList.innerHTML = '<p class="empty-message">Looking for rooms...</p>';
  
  // Simulate loading delay
  setTimeout(() => {
    roomList.innerHTML = '<p class="empty-message">No rooms found. Try creating your own!</p>';
  }, 2000);
}

// Helper function to get opponent's presence
function getOpponentPresence() {
  const opponentId = Object.keys(room.presence).find(id => id !== room.clientId);
  return opponentId ? room.presence[opponentId] : null;
}

// Helper function to get opponent's peer info
function getOpponentPeer() {
  const opponentId = Object.keys(room.presence).find(id => id !== room.clientId);
  return opponentId ? room.peers[opponentId] : null;
}

// Initialize realtime mode
document.addEventListener('DOMContentLoaded', initRealtimeMode);