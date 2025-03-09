let latestKDAData = null;
let isRequestInProgress = false;
let currentSlide = 0;

async function fetchStats() {
  if (isRequestInProgress) return null;
  try {
    isRequestInProgress = true;
    const response = await fetch('http://localhost:3000/api/stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  } finally {
    isRequestInProgress = false;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
function sanitizeText(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent;
}

function sanitizeUrl(url) {
  if (!url) return '';
  if (url.startsWith('https://static.wikia.nocookie.net/')) {
    return url;
  }
  return '';
}

function updateDisplay(data) {
  if (!data) return;
  if (data.rankIcon) {
    document.querySelector('.rank-icon').src = sanitizeUrl(data.rankIcon);
    document.querySelector('.rank-icon').style.display = 'block';
  } else {
    document.querySelector('.rank-icon').style.display = 'none';
  }
  document.querySelector('.summoner-name').textContent = sanitizeText(data.summonerName);

  if (data.rank) {
    document.querySelector('.rank-lp').textContent = `Rank ${data.rank} - ${data.lp} LP`;
  } else {
    document.querySelector('.rank-lp').textContent = `${data.lp} LP`;
  }
  document.querySelector('.win-rate').textContent =
    `${data.wins}W ${data.losses}L (${data.winPercentage})`;
  document.querySelector('.win-loss').textContent =
    `${data.dailyWinLoss.WIN}W/${data.dailyWinLoss.LOSS}L`;
  document.querySelector('.kda').textContent =
    `K/D: ${data.dailyKDA.kills}/${data.dailyKDA.deaths}`;
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % 2;
  document.querySelector('.carousel').style.transform = `translateX(-${currentSlide * 300}px)`;
}

async function initialize() {
  try {
    latestKDAData = await fetchStats();
    if (latestKDAData) {
      updateDisplay(latestKDAData);
    }
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initialize();
  setInterval(nextSlide, 5000);
});

window.electronAPI.onRefreshStats(() => {
  initialize();
});

setInterval(initialize, 60000);
