// Game Logic Functions
async function submitObject() {
  const newObject = userInput.value.trim();
  if (!newObject) return;
  
  submitBtn.disabled = true;
  
  try {
    const aiData = await evaluateObjects(newObject, currentObject.textContent);
    
    if (aiData.valid) {
      const displayObject = aiData.suggestedEmoji || newObject;
      
      // Add confetti effect for successful submission
      createConfetti();
      
      // Animate object change
      currentObject.style.transform = 'scale(0) rotate(180deg)';
      setTimeout(() => {
        currentObject.textContent = displayObject;
        currentObject.style.transform = 'scale(1) rotate(0deg)';
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
      // Shake effect for rejection
      currentObject.classList.add('shake');
      setTimeout(() => {
        currentObject.classList.remove('shake');
      }, 500);
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('An error occurred. Please try again.');
  }
  
  userInput.value = '';
  submitBtn.disabled = false;
}

// Add confetti effect for successful submissions
function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.opacity = Math.random() + 0.5;
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

function startPlayMode() {
  if (usedObjectsArray.length < 2) {
    alert("You need at least 2 objects to play. Please create more objects first.");
    return;
  }
  
  // Check if we're in multiplayer mode and should pair with another player
  if (room && room.peers && Object.keys(room.peers).length > 1) {
    startMultiplayerBattleMode();
  } else {
    startComputerBattleMode();
  }
}

function startComputerBattleMode() {
  gameArea.style.display = 'none';
  playModeArea.style.display = 'block';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  
  // Add animation for battle transition
  document.body.classList.add('battle-mode');
  
  // Select computer's object but don't reveal it yet
  const computerSelection = usedObjectsArray[Math.floor(Math.random() * usedObjectsArray.length)];
  
  // Only show that computer has made a choice, not what it is
  computerObject.textContent = `Computer has chosen an object. Choose yours to battle!`;
  computerObject.classList.add('computer-selected');
  computerObject.dataset.selection = computerSelection; // Store selection but don't display
  
  playerObjects.innerHTML = 'Your Objects: ';
  usedObjectsArray.forEach(obj => {
    const objButton = document.createElement('button');
    objButton.className = 'player-object-btn';
    objButton.textContent = obj;
    objButton.onclick = () => playComputerRound(obj, computerSelection);
    playerObjects.appendChild(objButton);
  });
  
  playResult.textContent = 'Choose an object to battle the computer!';
}

async function playComputerRound(playerObj, computerObj) {
  // Reveal computer's choice now that player has chosen
  computerObject.textContent = `Computer's Object: ${computerObj}`;
  
  // Disable all player object buttons
  const buttons = playerObjects.querySelectorAll('.player-object-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === playerObj) {
      btn.classList.add('selected-object');
    }
  });
  
  if (objectRelations[playerObj] && objectRelations[playerObj].beats.includes(computerObj)) {
    playResult.textContent = `You win! ${playerObj} beats ${computerObj}`;
    playResult.className = 'win-result';
  } else if (objectRelations[computerObj] && objectRelations[computerObj].beats.includes(playerObj)) {
    playResult.textContent = `You lose! ${computerObj} beats ${playerObj}`;
    playResult.className = 'lose-result';
  } else {
    playResult.textContent = "Analyzing matchup...";
    const relationship = await getObjectRelationships(playerObj, computerObj);
    
    if (relationship) {
      if (relationship.winner === playerObj) {
        playResult.textContent = `You win! ${relationship.explanation}`;
        playResult.className = 'win-result';
        if (!objectRelations[playerObj].beats.includes(computerObj)) {
          objectRelations[playerObj].beats.push(computerObj);
          objectRelations[computerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      } else if (relationship.winner === computerObj) {
        playResult.textContent = `You lose! ${relationship.explanation}`;
        playResult.className = 'lose-result';
        if (!objectRelations[computerObj].beats.includes(playerObj)) {
          objectRelations[computerObj].beats.push(playerObj);
          objectRelations[playerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      }
    } else {
      playResult.textContent = "It's a tie! No clear winner.";
      playResult.className = '';
    }
  }
  
  // Create play again button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.textContent = '🔄 Play Again';
  playAgainBtn.className = 'play-again-btn';
  playAgainBtn.onclick = startComputerBattleMode;
  playResult.appendChild(document.createElement('br'));
  playResult.appendChild(playAgainBtn);
  
  // Create return button
  const returnBtn = document.createElement('button');
  returnBtn.textContent = '↩️ Return to Game';
  returnBtn.className = 'return-btn';
  returnBtn.onclick = returnToMainGame;
  playResult.appendChild(returnBtn);
}

function startMultiplayerBattleMode() {
  gameArea.style.display = 'none';
  playModeArea.style.display = 'block';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  
  // Add animation for battle transition
  document.body.classList.add('battle-mode');
  
  // Check if we're the initiator (first player to enter battle mode)
  // or the second player
  const isInitiator = !room.roomState.battleActive;
  
  if (isInitiator) {
    // First player - set up the battle and wait for opponent
    room.updateRoomState({
      battleActive: true,
      battleInitiator: room.clientId,
      availableObjects: usedObjectsArray,
      playerSelections: {}
    });
    
    computerObject.textContent = `Waiting for an opponent...`;
    computerObject.classList.add('computer-selected');
    playerObjects.innerHTML = '<div class="waiting-spinner"></div>';
    playResult.textContent = 'Battle mode initiated! Waiting for another player to join...';
    
    // Start checking for opponent
    checkForOpponent();
  } else {
    // Second player - join the existing battle
    joinExistingBattle();
  }
}

function checkForOpponent() {
  // Already handled by subscribeRoomState callback
  // This function is now just a placeholder
}

function joinExistingBattle() {
  // We're the second player, so update presence to show we joined
  room.updatePresence({
    inBattle: true,
    opponentId: room.roomState.battleInitiator
  });
  
  // Notify via event that we've joined
  room.send({
    type: "battleJoined",
    joinerId: room.clientId
  });
  
  // Show the initiator's objects for battle
  displayBattleInterface(room.roomState.availableObjects);
}

function displayBattleInterface(objectsToUse) {
  computerObject.textContent = `Opponent has joined! They are choosing their object...`;
  computerObject.classList.add('computer-selected');
  
  playerObjects.innerHTML = 'Choose your object: ';
  objectsToUse.forEach(obj => {
    const objButton = document.createElement('button');
    objButton.className = 'player-object-btn';
    objButton.textContent = obj;
    objButton.onclick = () => selectObjectForMultiplayerBattle(obj);
    playerObjects.appendChild(objButton);
  });
  
  playResult.textContent = 'Make your selection. Your opponent will not see your choice until both players have chosen.';
}

function selectObjectForMultiplayerBattle(selectedObj) {
  // Disable all buttons to prevent changing selection
  const buttons = playerObjects.querySelectorAll('.player-object-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === selectedObj) {
      btn.classList.add('selected-object');
    }
  });
  
  // Update our selection in room state
  const selections = {...room.roomState.playerSelections};
  selections[room.clientId] = selectedObj;
  room.updateRoomState({
    playerSelections: selections
  });
  
  playResult.textContent = 'You selected ' + selectedObj + '. Waiting for opponent...';
  
  // No need to check for both selections here - that's handled in the subscribeRoomState callback
}

function resolveBattle(mySelection, opponentSelection, opponentId) {
  computerObject.textContent = `Opponent's Object: ${opponentSelection}`;
  
  // Check if we already know the relationship
  if (objectRelations[mySelection] && objectRelations[mySelection].beats.includes(opponentSelection)) {
    playResult.textContent = `You win! ${mySelection} beats ${opponentSelection}`;
    playResult.className = 'win-result';
    room.send({
      type: "battleResult",
      winner: room.clientId,
      loser: opponentId,
      explanation: `${mySelection} beats ${opponentSelection}`
    });
  } else if (objectRelations[opponentSelection] && objectRelations[opponentSelection].beats.includes(mySelection)) {
    playResult.textContent = `You lose! ${opponentSelection} beats ${mySelection}`;
    playResult.className = 'lose-result';
    room.send({
      type: "battleResult",
      winner: opponentId,
      loser: room.clientId,
      explanation: `${opponentSelection} beats ${mySelection}`
    });
  } else {
    // We need to determine the winner through AI
    playResult.textContent = "Analyzing matchup...";
    getObjectRelationships(mySelection, opponentSelection).then(relationship => {
      if (relationship) {
        if (relationship.winner === mySelection) {
          playResult.textContent = `You win! ${relationship.explanation}`;
          playResult.className = 'win-result';
          // Update our knowledge base
          if (!objectRelations[mySelection].beats.includes(opponentSelection)) {
            objectRelations[mySelection].beats.push(opponentSelection);
            objectRelations[opponentSelection].beatenBy.push(mySelection);
            saveToLocalStorage();
          }
          room.send({
            type: "battleResult",
            winner: room.clientId,
            loser: opponentId,
            explanation: relationship.explanation
          });
        } else if (relationship.winner === opponentSelection) {
          playResult.textContent = `You lose! ${relationship.explanation}`;
          playResult.className = 'lose-result';
          // Update our knowledge base
          if (!objectRelations[opponentSelection].beats.includes(mySelection)) {
            objectRelations[opponentSelection].beats.push(mySelection);
            objectRelations[mySelection].beatenBy.push(opponentSelection);
            saveToLocalStorage();
          }
          room.send({
            type: "battleResult",
            winner: opponentId,
            loser: room.clientId,
            explanation: relationship.explanation
          });
        }
      } else {
        playResult.textContent = "It's a tie! No clear winner.";
        room.send({
          type: "battleResult",
          tie: true,
          explanation: "No clear winner determined"
        });
      }
      
      // Add buttons to play again or return
      addPlayAgainButtons();
    });
  }
}

function addPlayAgainButtons() {
  // Create play again button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.textContent = '🔄 Play Again';
  playAgainBtn.className = 'play-again-btn';
  playAgainBtn.onclick = () => {
    // Reset battle state in room
    room.updateRoomState({
      playerSelections: {},
      battleActive: true
    });
    startMultiplayerBattleMode();
  };
  
  // Create return button
  const returnBtn = document.createElement('button');
  returnBtn.textContent = '↩️ Return to Game';
  returnBtn.className = 'return-btn';
  returnBtn.onclick = () => {
    // End the battle
    room.updateRoomState({
      battleActive: false,
      battleInitiator: null,
      availableObjects: [],
      playerSelections: {}
    });
    room.updatePresence({
      inBattle: false,
      opponentId: null
    });
    returnToMainGame();
  };
  
  playResult.appendChild(document.createElement('br'));
  playResult.appendChild(playAgainBtn);
  playResult.appendChild(returnBtn);
}

function returnToMainGame() {
  gameArea.style.display = 'block';
  playModeArea.style.display = 'none';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'inline-block';
  document.body.classList.remove('battle-mode');
  
  // If we were in a multiplayer battle, leave it
  if (room && room.presence[room.clientId] && room.presence[room.clientId].inBattle) {
    room.updatePresence({
      inBattle: false,
      opponentId: null
    });
    
    // If we were the initiator, clear the battle state
    if (room.roomState.battleInitiator === room.clientId) {
      room.updateRoomState({
        battleActive: false,
        battleInitiator: null,
        availableObjects: [],
        playerSelections: {}
      });
    }
  }
}