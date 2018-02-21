const UrlKey = "tread_urls";
const DefaultSite = { url: '', enabled: false, options: { style: 'tc-popup'} };
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
function saveUrl(url, enabled, options) {
  getUrls((urls) => {
    let result = [...urls];

    const index = urls.findIndex(u => u.url === url);
   
    // new url
    if (index === -1) {
      const newUrl = {url , options, enabled};
      result.push(newUrl);
    } else {
      result[index].enabled = enabled;
      result[index].options = options;
    }
    
    let item = {};
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
function setHeaderState (enable) {
  const c = ' warning';
  const header = document.getElementById('header');
  if (!header) return;

  if (enable) {
    header.className += c;
  } else {
    header.className = header.className.replace(c, '');
  }
}

/** 
 * Shows the options and sets the state.
*/
function setOptionsState (enable, urlOptions) {
  const options = document.getElementById('options-wrapper');
  if (!options) return;

  if (enable) {
    options.style.display = 'block';
    // grab style from options or default to tc-popup
    const radio = document.getElementById(urlOptions.style) || document.getElementById('tc-popup');
    radio.checked = true;
  } else {
    options.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.querySelector('#tc-enable-warning');
  const styleOptions = document.getElementsByName('warningstyle');
  
  getCurrentTabUrl((tab, url) => {
    const domainName = getDomainName(url);
    
    getUrls((urls) => {
      // Get site from storage or default to new site.
      const site = urls.find(u => u.url === domainName) || Object.assign(DefaultSite, {url: domainName});
      
      checkbox.checked = site.enabled;
      setHeaderState(site.enabled);
      setOptionsState(site.enabled, site.options);

      checkbox.addEventListener('change', function () {
        saveUrl(domainName, this.checked, site.options);
        setHeaderState(this.checked);
        setOptionsState(this.checked, site.options);
        chrome.tabs.sendMessage(tab.id, { name: 'toggle-warning', enabled: this.checked, options: site.options }, null, null)
      });
      
      styleOptions.forEach(o => {
        o.onclick = function () {
          site.options.style = this.value;
          saveUrl(domainName, site.enabled, site.options);
          chrome.tabs.sendMessage(tab.id, { name: 'change-style', style: this.value }, null, null)
        }
      })
    });
  });
});