document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submit-button');
  const serverStatus = document.getElementById('server-status');
  const refreshButton = document.getElementById('refresh-button');
  const laneCheckboxes = document.querySelectorAll('input[name="lanes"]');
  const regionSelect = document.getElementById('region');

  if (refreshButton) {
    refreshButtonListener = () => {
      console.log('Refresh button clicked');
      window.electronAPI.refreshStats();
    };
    refreshButton.addEventListener('click', refreshButtonListener);
  }

  window.electronAPI.loadConfig().then(savedConfig => {
    if (savedConfig) {
      document.getElementById('summonerNamesURL').value = savedConfig.summonerNamesURL || '';
      document.getElementById('region').value = savedConfig.region || 'euw';
      if (savedConfig.displayedLanes) {
        document.querySelectorAll('input[name="lanes"]').forEach(checkbox => {
          checkbox.checked = savedConfig.displayedLanes.includes(checkbox.value);
        });
      }
    }
  });

  submitButton.addEventListener('click', () => {
    const config = {
      summonerNamesURL: document.getElementById('summonerNamesURL').value,
      region: document.getElementById('region').value,
      displayedLanes: Array.from(document.querySelectorAll('input[name="lanes"]:checked')).map(
        el => el.value
      ),
    };

    if (!config.summonerNamesURL) {
      alert('Please enter a valid OP.GG Multisearch URL');
      return;
    }

    window.electronAPI.saveConfig(config);
    window.electronAPI.openNewWindow();
  });

  laneCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const visibleLanes = Array.from(document.querySelectorAll('input[name="lanes"]:checked')).map(
        el => el.value
      );

      window.electronAPI.updateLaneVisibility(visibleLanes);
    });
  });

  window.electronAPI.onServerStatus(status => {
    serverStatus.textContent = `Server Status: ${status}`;
  });

  regionSelect.addEventListener('change', async () => {
    const config = {
      summonerNamesURL: document.getElementById('summonerNamesURL').value,
      region: regionSelect.value,
      displayedLanes: Array.from(document.querySelectorAll('input[name="lanes"]:checked')).map(
        el => el.value
      ),
    };

    await window.electronAPI.saveConfig(config);
    window.electronAPI.refreshStats();
  });
});
