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
        <h1>Tread Lightly! This is a production site.</h1>
        <div id="tc-warning-header-icon"></div>
    </div>`;

    div.addEventListener('mouseover', function ($event) {
        $event.stopImmediatePropagation();
        console.log('hover banner');
    });

    document.body.appendChild(div);

    const closeIcon = document.getElementById('tc-warning-header-icon');
    closeIcon.addEventListener('click', removeWarning);
    closeIcon.addEventListener('mouseover', function ($event) {
        $event.stopImmediatePropagation();
    });

    const imgURL = chrome.extension.getURL("assets/img/Orion_close.svg");
    closeIcon.style.backgroundImage = `url(${imgURL})`;
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
