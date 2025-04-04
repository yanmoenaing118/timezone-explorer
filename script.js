document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const searchResults = document.getElementById('search-results');
  const timezoneCards = document.getElementById('timezone-cards');
  const utcTimeElement = document.getElementById('utc-time');
  const differentDatesContainer = document.getElementById(
    'different-dates-container'
  );
  const localTimeContainer = document.getElementById('local-time-container');

  // Store selected timezones
  let selectedTimezones = [];

  // Cache all available timezones
  const allTimezones = Intl.supportedValuesOf('timeZone');

  // Timezone coordinates data (approximate values for major cities in each timezone)
  const timezoneCoordinates = {
    // North America
    'America/New_York': { lat: 40.7128, lng: -74.006 },
    'America/Chicago': { lat: 41.8781, lng: -87.6298 },
    'America/Denver': { lat: 39.7392, lng: -104.9903 },
    'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
    'America/Anchorage': { lat: 61.2181, lng: -149.9003 },
    'America/Phoenix': { lat: 33.4484, lng: -112.074 },
    'America/Toronto': { lat: 43.6532, lng: -79.3832 },
    'America/Vancouver': { lat: 49.2827, lng: -123.1207 },
    'America/Mexico_City': { lat: 19.4326, lng: -99.1332 },
    'America/Bogota': { lat: 4.711, lng: -74.0721 },
    'America/Lima': { lat: -12.0464, lng: -77.0428 },
    'America/Santiago': { lat: -33.4489, lng: -70.6693 },
    'America/Sao_Paulo': { lat: -23.5505, lng: -46.6333 },
    'America/Buenos_Aires': { lat: -34.6037, lng: -58.3816 },

    // Europe
    'Europe/London': { lat: 51.5074, lng: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
    'Europe/Berlin': { lat: 52.52, lng: 13.405 },
    'Europe/Rome': { lat: 41.9028, lng: 12.4964 },
    'Europe/Madrid': { lat: 40.4168, lng: -3.7038 },
    'Europe/Moscow': { lat: 55.7558, lng: 37.6173 },
    'Europe/Athens': { lat: 37.9838, lng: 23.7275 },
    'Europe/Istanbul': { lat: 41.0082, lng: 28.9784 },
    'Europe/Stockholm': { lat: 59.3293, lng: 18.0686 },
    'Europe/Oslo': { lat: 59.9139, lng: 10.7522 },

    // Asia
    'Asia/Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Asia/Shanghai': { lat: 31.2304, lng: 121.4737 },
    'Asia/Hong_Kong': { lat: 22.3193, lng: 114.1694 },
    'Asia/Singapore': { lat: 1.3521, lng: 103.8198 },
    'Asia/Seoul': { lat: 37.5665, lng: 126.978 },
    'Asia/Dubai': { lat: 25.2048, lng: 55.2708 },
    'Asia/Bangkok': { lat: 13.7563, lng: 100.5018 },
    'Asia/Kolkata': { lat: 19.076, lng: 72.8777 },
    'Asia/Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Asia/Manila': { lat: 14.5995, lng: 120.9842 },
    'Asia/Taipei': { lat: 25.033, lng: 121.5654 },

    // Oceania
    'Australia/Sydney': { lat: -33.8688, lng: 151.2093 },
    'Australia/Melbourne': { lat: -37.8136, lng: 144.9631 },
    'Australia/Perth': { lat: -31.9505, lng: 115.8605 },
    'Australia/Brisbane': { lat: -27.4698, lng: 153.0251 },
    'Pacific/Auckland': { lat: -36.8509, lng: 174.7645 },
    'Pacific/Fiji': { lat: -18.1416, lng: 178.4419 },
    'Pacific/Honolulu': { lat: 21.3069, lng: -157.8583 },

    // Africa
    'Africa/Cairo': { lat: 30.0444, lng: 31.2357 },
    'Africa/Johannesburg': { lat: -26.2041, lng: 28.0473 },
    'Africa/Lagos': { lat: 6.5244, lng: 3.3792 },
    'Africa/Nairobi': { lat: -1.2921, lng: 36.8219 },
    'Africa/Casablanca': { lat: 33.5731, lng: -7.5898 },
  };

  // Default coordinates for timezones not in our list
  const defaultCoordinates = { lat: 0, lng: 0 };

  // Initialize with some default timezones
  const defaultTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
  defaultTimezones.forEach((timezone) => addTimezoneCard(timezone));

  // Update all times every second
  updateAllTimes();
  setInterval(updateAllTimes, 1000);

  // Event listeners
  searchButton.addEventListener('click', () => {
    const firstResult = searchResults.querySelector('.search-result-item');
    if (firstResult && firstResult.dataset.timezone) {
      addTimezoneCard(firstResult.dataset.timezone);
      searchResults.style.display = 'none';
      searchInput.value = '';
    }
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const firstResult = searchResults.querySelector('.search-result-item');
      if (firstResult && firstResult.dataset.timezone) {
        addTimezoneCard(firstResult.dataset.timezone);
        searchResults.style.display = 'none';
        searchInput.value = '';
      }
    } else {
      // Show typeahead suggestions as user types
      showTypeaheadSuggestions();
    }
  });

  // Show typeahead suggestions based on current input
  function showTypeaheadSuggestions() {
    const query = searchInput.value.trim().toLowerCase();

    // Only show suggestions if we have at least 2 characters
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    // Clear previous results
    searchResults.innerHTML = '';

    // Get matching timezones
    const matches = findMatchingTimezones(query);

    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="search-result-item">No results found</div>`;
      searchResults.style.display = 'block';
      return;
    }

    // Display results
    matches.forEach((timezone) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.dataset.timezone = timezone;

      // Format the display with highlighted matching text
      const displayName = formatTimezoneName(timezone);
      const highlightedName = highlightMatch(displayName, query);

      resultItem.innerHTML = highlightedName;

      resultItem.addEventListener('click', () => {
        addTimezoneCard(timezone);
        searchResults.style.display = 'none';
        searchInput.value = '';
      });

      searchResults.appendChild(resultItem);
    });

    searchResults.style.display = 'block';
  }

  // Highlight the matching portion of text
  function highlightMatch(text, query) {
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query.toLowerCase());

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return `${before}<strong class="highlight">${match}</strong>${after}`;
  }

  // Find matching timezones based on query
  function findMatchingTimezones(query) {
    // Search by timezone name, region, or country
    return allTimezones
      .filter((timezone) => {
        const name = timezone.toLowerCase();
        const parts = name.split('/');
        const formattedName = formatTimezoneName(timezone).toLowerCase();

        // Check if query matches any part of the timezone name
        return (
          name.includes(query) ||
          formattedName.includes(query) ||
          parts.some((part) =>
            part.replace('_', ' ').toLowerCase().includes(query)
          )
        );
      })
      .slice(0, 10); // Limit to 10 results
  }

  // Get coordinates for a timezone
  function getCoordinatesForTimezone(timezone) {
    return timezoneCoordinates[timezone] || defaultCoordinates;
  }

  // Add a timezone card to the display
  function addTimezoneCard(timezone) {
    // Don't add duplicates
    if (selectedTimezones.includes(timezone)) return;

    selectedTimezones.push(timezone);

    const card = document.createElement('div');
    card.className = 'timezone-card';
    card.dataset.timezone = timezone;

    const coordinates = getCoordinatesForTimezone(timezone);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-btn';
    removeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    removeButton.addEventListener('click', () => {
      timezoneCards.removeChild(card);
      selectedTimezones = selectedTimezones.filter((tz) => tz !== timezone);
      updateDifferentDatesSection();
    });

    card.innerHTML = `
      <h2>${getCountryFromTimezone(timezone)}</h2>
      <div class="region">${formatTimezoneName(timezone)}</div>
      <div class="time"></div>
      <div class="date"></div>
      <div class="offset"></div>
      <div class="coordinates">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
        </svg>
        <span>${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(
      4
    )}°</span>
      </div>
    `;

    card.appendChild(removeButton);
    timezoneCards.appendChild(card);
    updateTimeForCard(card);
    updateDifferentDatesSection();
  }

  // Update times for all cards
  function updateAllTimes() {
    // Update UTC reference time
    const now = new Date();
    utcTimeElement.textContent = now.toISOString().substr(11, 8);

    // Update each timezone card
    document.querySelectorAll('.timezone-card').forEach(updateTimeForCard);

    // Update the different dates section
    updateDifferentDatesSection();

    // Update local time section
    updateLocalTimeSection();
  }

  // Update time for a specific card
  function updateTimeForCard(card) {
    const timezone = card.dataset.timezone;
    const now = new Date();

    const options = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    const dateOptions = {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const timeFormatter = new Intl.DateTimeFormat('en-US', options);
    const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);

    const timeElement = card.querySelector('.time');
    const dateElement = card.querySelector('.date');
    const offsetElement = card.querySelector('.offset');

    timeElement.textContent = timeFormatter.format(now);
    dateElement.textContent = dateFormatter.format(now);

    // Calculate and display UTC offset
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const offsetString = formatter
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName').value;

    offsetElement.textContent = `UTC ${offsetString}`;
  }

  // Update the section showing timezones with different dates
  function updateDifferentDatesSection() {
    // Clear the container
    differentDatesContainer.innerHTML = '';

    // Get the local date (just the date part, not time)
    const now = new Date();
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDateStr = getDateString(now, localTimezone);

    // Find all timezones with different dates (not just selected ones)
    const differentDates = allTimezones.filter((timezone) => {
      const dateInTimezone = getDateString(now, timezone);
      return dateInTimezone !== localDateStr;
    });

    // If no different dates, show a message
    if (differentDates.length === 0) {
      differentDatesContainer.innerHTML = `
        <div class="empty-message">
          All regions are currently on the same date as your local time.
        </div>
      `;
      return;
    }

    // Group timezones by region for better organization
    const groupedTimezones = groupTimezonesByRegion(differentDates);

    // Create elements for each region group
    Object.entries(groupedTimezones).forEach(([region, timezones]) => {
      const regionContainer = document.createElement('div');
      regionContainer.className = 'region-group';

      const regionHeader = document.createElement('h3');
      regionHeader.className = 'region-header';
      regionHeader.textContent = region;
      regionContainer.appendChild(regionHeader);

      // Create elements for each timezone in this region
      timezones.forEach((timezone) => {
        const dateInTimezone = getDateString(now, timezone);
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        const localFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: localTimezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const coordinates = getCoordinatesForTimezone(timezone);

        const item = document.createElement('div');
        item.className = 'date-difference-item';

        // Add a button to add this timezone to the cards
        const addButton = document.createElement('button');
        addButton.className = 'add-timezone-btn';
        addButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        `;
        addButton.title = 'Add to comparison';

        // Only enable the button if this timezone isn't already selected
        if (selectedTimezones.includes(timezone)) {
          addButton.disabled = true;
          addButton.classList.add('disabled');
        } else {
          addButton.addEventListener('click', () => {
            addTimezoneCard(timezone);
            addButton.disabled = true;
            addButton.classList.add('disabled');
          });
        }

        item.innerHTML = `
          <div class="region-name">${formatTimezoneName(timezone)}</div>
          <div class="date-time-info">
            <div class="region-date">${dateFormatter.format(now)}</div>
            <div class="region-time">${timeFormatter.format(now)}</div>
          </div>
          <div class="local-date">Local: ${localFormatter.format(now)}</div>
          <div class="coordinates">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="10" r="3"></circle>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
            </svg>
            <span class="coordinate-values" data-lat="${
              coordinates.lat
            }" data-lng="${coordinates.lng}">
              ${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(4)}°
            </span>
            <button class="copy-coords-btn" title="Copy coordinates">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        `;

        item.appendChild(addButton);
        regionContainer.appendChild(item);

        // Add event listener for the copy button after the item is added to the DOM
        setTimeout(() => {
          const copyBtn = item.querySelector('.copy-coords-btn');
          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lat = coordinates.lat;
            const lng = coordinates.lng;
            const coordText = `${lat}, ${lng}`;

            navigator.clipboard.writeText(coordText).then(() => {
              // Show a temporary "Copied!" tooltip
              const tooltip = document.createElement('div');
              tooltip.className = 'copy-tooltip';
              tooltip.textContent = 'Copied!';
              copyBtn.appendChild(tooltip);

              // Remove the tooltip after a short delay
              setTimeout(() => {
                tooltip.remove();
              }, 1500);
            });
          });
        }, 0);
      });

      differentDatesContainer.appendChild(regionContainer);
    });
  }

  // Group timezones by their main region (continent or ocean)
  function groupTimezonesByRegion(timezones) {
    const groups = {};

    timezones.forEach((timezone) => {
      const parts = timezone.split('/');
      const region = parts[0];

      if (!groups[region]) {
        groups[region] = [];
      }

      groups[region].push(timezone);
    });

    // Sort timezones within each group
    Object.keys(groups).forEach((region) => {
      groups[region].sort();
    });

    return groups;
  }

  // Update the local time section
  function updateLocalTimeSection() {
    const now = new Date();
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const coordinates = getCoordinatesForTimezone(localTimezone);

    // Time formatters
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Get UTC offset
    const tzFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZoneName: 'longOffset',
    });
    const offsetString = tzFormatter
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName').value;

    // Create the local time display
    localTimeContainer.innerHTML = `
      <div class="local-time-details">
        <div class="local-detail">
          <div class="local-detail-label">Current Time</div>
          <div class="local-detail-value local-time-value">${timeFormatter.format(
            now
          )}</div>
        </div>
        
        <div class="local-detail">
          <div class="local-detail-label">Date</div>
          <div class="local-detail-value">${dateFormatter.format(now)}</div>
        </div>
        
        <div class="local-detail">
          <div class="local-detail-label">Timezone</div>
          <div class="local-detail-value">${formatTimezoneName(
            localTimezone
          )}</div>
          <div>UTC ${offsetString}</div>
          <div class="coordinates">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="10" r="3"></circle>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
            </svg>
            <span>${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(
      4
    )}°</span>
          </div>
        </div>
      </div>
    `;
  }

  // Get date string in YYYY-MM-DD format for a specific timezone
  function getDateString(date, timezone) {
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
    const year = parts.find((part) => part.type === 'year').value;
    const month = parts.find((part) => part.type === 'month').value;
    const day = parts.find((part) => part.type === 'day').value;

    return `${year}-${month}-${day}`;
  }

  // Format timezone name for display
  function formatTimezoneName(timezone) {
    return timezone.replace(/_/g, ' ').replace('/', ' / ');
  }

  // Extract country name from timezone
  function getCountryFromTimezone(timezone) {
    const parts = timezone.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !searchResults.contains(e.target) &&
      e.target !== searchInput &&
      e.target !== searchButton
    ) {
      searchResults.style.display = 'none';
    }
  });
});
