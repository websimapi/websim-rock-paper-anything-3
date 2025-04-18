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
  
  gameArea.style.display = 'none';
  playModeArea.style.display = 'block';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  
  // Add animation for battle transition
  document.body.classList.add('battle-mode');
  
  const computerSelection = usedObjectsArray[Math.floor(Math.random() * usedObjectsArray.length)];
  computerObject.textContent = `Computer's Object: ${computerSelection}`;
  computerObject.classList.add('computer-selected');
  
  playerObjects.innerHTML = 'Your Objects: ';
  usedObjectsArray.forEach(obj => {
    const objButton = document.createElement('button');
    objButton.className = 'player-object-btn';
    objButton.textContent = obj;
    objButton.onclick = () => playRound(obj, computerSelection);
    playerObjects.appendChild(objButton);
  });
  
  playResult.textContent = 'Choose an object to battle the computer!';
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