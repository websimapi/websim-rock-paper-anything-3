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

async function playRound(playerObj, computerObj) {
  // Store the result for leaderboard
  let matchResult = '';
  
  if (objectRelations[playerObj] && objectRelations[playerObj].beats.includes(computerObj)) {
    playResult.textContent = `You win! ${playerObj} beats ${computerObj}`;
    matchResult = 'win';
  } else if (objectRelations[computerObj] && objectRelations[computerObj].beats.includes(playerObj)) {
    playResult.textContent = `You lose! ${computerObj} beats ${playerObj}`;
    matchResult = 'loss';
  } else {
    playResult.textContent = "Analyzing matchup...";
    const relationship = await getObjectRelationships(playerObj, computerObj);
    
    if (relationship) {
      if (relationship.winner === playerObj) {
        playResult.textContent = `You win! ${relationship.explanation}`;
        matchResult = 'win';
        if (!objectRelations[playerObj].beats.includes(computerObj)) {
          objectRelations[playerObj].beats.push(computerObj);
          objectRelations[computerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      } else if (relationship.winner === computerObj) {
        playResult.textContent = `You lose! ${relationship.explanation}`;
        matchResult = 'loss';
        if (!objectRelations[computerObj].beats.includes(playerObj)) {
          objectRelations[computerObj].beats.push(playerObj);
          objectRelations[playerObj].beatenBy.push(playerObj);
          saveToLocalStorage();
        }
      } else {
        // Handle tie
        playResult.textContent = "It's a tie! No clear winner.";
        matchResult = 'tie';
      }
    } else {
      playResult.textContent = "It's a tie! No clear winner.";
      matchResult = 'tie';
    }
  }
  
  // Record match in the database
  await recordMatch(playerObj, computerObj, matchResult);
  
  setTimeout(startPlayMode, 3000);
}

async function recordMatch(playerObj, computerObj, result) {
  try {
    await room.collection('match').create({
      player_object: playerObj,
      computer_object: computerObj,
      result: result,
      game_mode: 'play_mode'
    });
    
    // Update player stats
    const playerStats = await getPlayerStats(currentPlayerUsername);
    
    // Update or create player stats
    if (playerStats) {
      await room.collection('leaderboard').update(playerStats.id, {
        wins: result === 'win' ? playerStats.wins + 1 : playerStats.wins,
        losses: result === 'loss' ? playerStats.losses + 1 : playerStats.losses,
        ties: result === 'tie' ? playerStats.ties + 1 : playerStats.ties,
        total_games: playerStats.total_games + 1
      });
    } else {
      await room.collection('leaderboard').create({
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        ties: result === 'tie' ? 1 : 0,
        total_games: 1
      });
    }
  } catch (error) {
    console.error("Error recording match:", error);
  }
}

async function getPlayerStats(username) {
  try {
    const stats = room.collection('leaderboard').filter({ username: username }).getList();
    return stats && stats.length > 0 ? stats[0] : null;
  } catch (error) {
    console.error("Error getting player stats:", error);
    return null;
  }
}