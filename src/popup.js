const UrlKey = "tread_urls";
/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(tab, url);
  });
}

/**
 * Gets the saved urls.
 *
 * @param {function(string)} callback called with the saved urls on success, 
 * or a falsy value if no url.
 */
function getUrls(callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(null, (items) => {
    let result = items[UrlKey] || [];
    callback(chrome.runtime.lastError ? null : result);
  });
}

/**
 * Save the url.
 * @param {string} url URL for which background color is to be saved.
 */
function saveUrl(url, shouldSave) {
  getUrls((urls) => {
    
    let result = [...urls];

    const index = urls.indexOf(url);

    // Add or remove the url from the list.
    if (shouldSave && index === -1) {
      result.push(url);
    }

    if (!shouldSave && index > -1) {
      result.splice(url);
    }
    
    let item = { };
    item[UrlKey] = result;
    
    chrome.storage.sync.set(item);
  });
}

/**
 * Returns the domain name of a url.
 *
 * @param {string} url the url to parse
 */
function getDomainName (url) {
    
  if (!url || typeof url !== 'string') return null;

  let reg = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;
  const matches = url.match(reg);

  if (matches.length > 1 && matches[1]) {
      return matches[1]
  }

  return null;
};

/** 
 * Updates the banner styling to show the enabled state.
*/
function toggleHeaderState (enable) {
  const c = ' warning';
  const header = document.getElementById('header');
  
  if (!header) return;

  if (enable) {
    header.className += c;
  } else {
    header.className = header.className.replace(c, '');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.querySelector('#tc-enable-warning');
  
  getCurrentTabUrl((tab, url) => {
    const domainName = getDomainName(url);
    
    getUrls((urls) => {
      // set initial state before subscribing to event.
      if (urls.indexOf(domainName) > -1) {
        checkbox.checked = true;
        toggleHeaderState(true);
      }

      checkbox.addEventListener('change', function () {
        saveUrl(domainName, this.checked);
        toggleHeaderState(this.checked);
        chrome.tabs.sendMessage(tab.id, { enabled: this.checked }, null, null)
      });
    });
  });

});