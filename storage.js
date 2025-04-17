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