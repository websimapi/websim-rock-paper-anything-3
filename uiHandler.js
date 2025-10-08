// UI Update Functions
function updateObjectHistory() {
  objectHistory.innerHTML = '<h3>🏆 Your Collection:</h3>';
  
  if (usedObjectsArray.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No objects created yet. Start a game to begin your collection!';
    emptyMessage.style.fontStyle = 'italic';
    emptyMessage.style.opacity = '0.7';
    objectHistory.appendChild(emptyMessage);
    return;
  }
  
  const scrollContainer = document.createElement('div');
  scrollContainer.style.maxHeight = '150px';
  scrollContainer.style.overflowY = 'auto';
  objectHistory.appendChild(scrollContainer);
  
  usedObjectsArray.forEach((obj, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <span>${obj} ${getObjectStats(obj)}</span>
      <button class="delete-object" data-index="${index}">🗑️</button>
    `;
    scrollContainer.appendChild(historyItem);
  });
}

function getObjectStats(obj) {
  if (!objectRelations[obj]) return '';
  
  const wins = objectRelations[obj].beats.length;
  const losses = objectRelations[obj].beatenBy.length;
  
  return `<span style="font-size: 12px; opacity: 0.8;">(W:${wins} L:${losses})</span>`;
}

function updateObjectDetails() {
  objectDetails.innerHTML = '<h3>⚔️ Object Relationships:</h3>';
  
  if (Object.keys(objectRelations).length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No relationships established yet. Play the game to create connections!';
    emptyMessage.style.fontStyle = 'italic';
    emptyMessage.style.opacity = '0.7';
    objectDetails.appendChild(emptyMessage);
    return;
  }
  
  const scrollContainer = document.createElement('div');
  scrollContainer.style.maxHeight = '150px';
  scrollContainer.style.overflowY = 'auto';
  objectDetails.appendChild(scrollContainer);
  
  for (let obj in objectRelations) {
    const detailItem = document.createElement('div');
    detailItem.className = 'relationship-item';
    detailItem.innerHTML = `<strong>${obj}</strong>:<br>
      <span style="color: #27ae60;">Beats: ${objectRelations[obj].beats.join(', ') || 'None'}</span><br>
      <span style="color: #e74c3c;">Beaten by: ${objectRelations[obj].beatenBy.join(', ') || 'None'}</span>`;
    scrollContainer.appendChild(detailItem);
  }
}

function updateUsedObjects() {
  usedObjects.textContent = 'Used objects: ' + usedObjectsArray.join(', ');
}

// Animation Functions
function animateCurrentObject() {
  currentObject.style.animation = 'bounce 1s, float 3s infinite';
  setTimeout(() => {
    currentObject.style.animation = 'float 3s infinite';
  }, 1000);
}

function showResult(message, isLoading = false) {
  if (isLoading) {
    result.innerHTML = '<div class="loading"></div>';
    result.style.backgroundColor = '#eaf2f8';
  } else {
    // Add some emoji flair to the results
    if (message.includes("can beat") || message.includes("would win")) {
      result.innerHTML = '✅ ' + message;
      result.style.backgroundColor = '#d5f5e3'; // Success green
    } else if (message.includes("cannot") || message.includes("wouldn't")) {
      result.innerHTML = '❌ ' + message;
      result.style.backgroundColor = '#fadbd8'; // Error red
    } else {
      result.innerHTML = '🤔 ' + message;
      result.style.backgroundColor = '#eaf2f8'; // Default blue
    }
  }
  
  result.style.opacity = '0';
  setTimeout(() => {
    result.style.opacity = '1';
  }, 100);
}

function switchToCreationMode(reset = false) {
    gameArea.style.display = 'flex';
    playModeArea.style.display = 'none';
    playModeBtn.style.display = 'block';
    creationModeBtn.style.display = 'none';
    document.body.classList.remove('battle-mode');

    if (reset || usedObjectsArray.length === 0) {
        emojiSelector.style.display = 'flex';
        startGameBtn.style.display = 'block';
        playNowBtn.style.display = 'block';
        gameArea.style.display = 'none';
        playNowBtn.disabled = usedObjectsArray.length === 0;
    } else {
        emojiSelector.style.display = 'none';
        startGameBtn.style.display = 'none';
        playNowBtn.style.display = 'none';
    }
}