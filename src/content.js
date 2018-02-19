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
 * Creates the HTML markup and appends it to the body
 */
function insertWarning () {
    const div = document.createElement("div");

    div.innerHTML =
    `<div id="tc-warning-header">
        <div id="tc-warning-header-icon"><i class="fal fa-times-octagon"></i></div>
        <h1>Tread Lightly! This is a production site.</h1>
    </div>`;

    document.body.appendChild(div);

    document.getElementById('tc-warning-header-icon').addEventListener('click', removeWarning);
};

/** 
 * Removes the appended HTML warning header.
*/
function removeWarning () {
   const banner = document.getElementById('tc-warning-header');
   if (banner) {
       const icon = document.getElementById('tc-warning-header-icon').removeEventListener('click', removeWarning);
       banner.parentNode.removeChild(banner);
   }
}

/**
 * Returns the domain name of a url.
 *
 * @param {string} url the url to parse
 */
function parseUrl (url) {
    
    if (!url || typeof url !== 'string') return null;

    let reg = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/;
    const matches = url.match(reg);

    if (matches.length > 1 && matches[1]) { 
        return matches[1]
    }

    return null;
};

const UrlKey = "tread_urls";

getUrls((urls) => {
    const url = parseUrl(location.href);
    if (urls.indexOf(url) > -1) {
        insertWarning();
    }
});

chrome.runtime.onMessage.addListener((message, sender, callback) => {
    if (message.enabled) {
        insertWarning();
    } else {
        removeWarning();
    }
})
