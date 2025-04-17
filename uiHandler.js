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