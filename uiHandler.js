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

function showLeaderboard() {
  // Hide game elements
  gameArea.style.display = 'none';
  playModeArea.style.display = 'none';
  emojiSelector.style.display = 'none';
  startGameBtn.style.display = 'none';
  playNowBtn.style.display = 'none';
  objectHistory.style.display = 'none';
  objectDetails.style.display = 'none';
  
  // Show leaderboard
  leaderboardArea.style.display = 'block';
  backToGameBtn.style.display = 'block';
  
  // Load leaderboard data
  loadLeaderboardData();
}

function hideLeaderboard() {
  // Show game elements
  emojiSelector.style.display = 'flex';
  startGameBtn.style.display = 'inline-block';
  playNowBtn.style.display = 'inline-block';
  objectHistory.style.display = 'block';
  objectDetails.style.display = 'block';
  
  // Hide leaderboard
  leaderboardArea.style.display = 'none';
  backToGameBtn.style.display = 'none';
}

async function loadLeaderboardData() {
  const leaderboardTable = document.getElementById('leaderboard-table');
  const leaderboardBody = document.getElementById('leaderboard-body');
  
  // Clear existing data
  leaderboardBody.innerHTML = '<tr><td colspan="5">Loading leaderboard data...</td></tr>';
  
  try {
    // Subscribe to leaderboard data
    room.collection('leaderboard').subscribe(stats => {
      // Sort by wins (descending)
      stats.sort((a, b) => b.wins - a.wins);
      
      // Clear loading message
      leaderboardBody.innerHTML = '';
      
      if (stats.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5">No leaderboard data available yet</td></tr>';
        return;
      }
      
      // Add rows for each player
      stats.forEach((player, index) => {
        const winRate = player.total_games > 0 ? 
          ((player.wins / player.total_games) * 100).toFixed(1) + '%' : '0%';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td class="player-name">
            <img src="https://images.websim.ai/avatar/${player.username}" alt="Avatar" class="avatar">
            ${player.username}
          </td>
          <td>${player.wins}</td>
          <td>${player.losses}</td>
          <td>${winRate}</td>
        `;
        
        // Highlight current player
        if (player.username === currentPlayerUsername) {
          row.classList.add('current-player');
        }
        
        leaderboardBody.appendChild(row);
      });
      
      // Show recent matches
      loadRecentMatches();
    });
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    leaderboardBody.innerHTML = '<tr><td colspan="5">Error loading leaderboard data</td></tr>';
  }
}

async function loadRecentMatches() {
  const recentMatchesDiv = document.getElementById('recent-matches');
  
  // Clear existing data
  recentMatchesDiv.innerHTML = '<h3>Recent Matches</h3><div class="loading">Loading recent matches...</div>';
  
  try {
    // Get recent matches (limited to last 10)
    room.collection('match').subscribe(matches => {
      // Sort by creation time (newest first)
      const recentMatches = matches.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      
      // Clear loading message
      recentMatchesDiv.innerHTML = '<h3>Recent Matches</h3>';
      
      if (recentMatches.length === 0) {
        recentMatchesDiv.innerHTML += '<p>No matches played yet</p>';
        return;
      }
      
      // Create list of recent matches
      const matchList = document.createElement('ul');
      matchList.className = 'match-list';
      
      recentMatches.forEach(match => {
        const resultClass = match.result === 'win' ? 'win' : 
                           match.result === 'loss' ? 'loss' : 'tie';
        
        const resultText = match.result === 'win' ? 'won' : 
                          match.result === 'loss' ? 'lost' : 'tied';
        
        const li = document.createElement('li');
        li.className = `match-item ${resultClass}`;
        li.innerHTML = `
          <span class="player-name">${match.username}</span> 
          ${resultText} with 
          <span class="object">${match.player_object}</span> vs 
          <span class="object">${match.computer_object}</span>
          <span class="match-time">${formatTime(new Date(match.created_at))}</span>
        `;
        
        matchList.appendChild(li);
      });
      
      recentMatchesDiv.appendChild(matchList);
    });
  } catch (error) {
    console.error("Error loading recent matches:", error);
    recentMatchesDiv.innerHTML = '<h3>Recent Matches</h3><p>Error loading recent matches</p>';
  }
}

function formatTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}