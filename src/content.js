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
function insertWarning (style) {
    let timeout = null;
    
    const div = document.createElement("div");
    const st = style === 'tc-popup' ? `${style} right` : style;
    
    div.innerHTML =
    `<div id="tc-warning-header" class="${st}">
        <h1>Tread Lightly! <span id="tc-custom-message"></span></h1>
        <div id="tc-warning-header-icon"></div>
    </div>`;

    div.addEventListener('mouseover', function ($event) {
        $event.stopImmediatePropagation();
        
        if (timeout !== null) return;
        
        timeout = setTimeout(function() {
            const header = document.getElementById('tc-warning-header');
            const hClass = header.className;
            if (hClass.search('tc-popup') > -1) {
                if (hClass.search('right') > -1) header.className = hClass.replace('right', 'left');
                else if (hClass.search('left') > -1) header.className = hClass.replace('left', 'right');
            }
            clearTimeout(timeout);
            timeout = null;
        }, 300);
    });

    document.body.appendChild(div);

    const closeIcon = document.getElementById('tc-warning-header-icon');
    closeIcon.addEventListener('click', removeWarning);
    closeIcon.addEventListener('mouseover', function ($event) {
        $event.stopImmediatePropagation();
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    });

    const imgURL = chrome.extension.getURL("assets/img/Orion_close.svg");
    closeIcon.style.backgroundImage = `url(${imgURL})`;
};

function updateMessage (message) {
    const span = document.getElementById('tc-custom-message');
    while (span.firstChild) {
        span.removeChild(span.firstChild);
    }
    span.appendChild(document.createTextNode(message));
}
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
    const site = urls.find(u => u.url === url);
    if (site && site.enabled) {
        insertWarning(site.options.style);
        updateMessage(site.options.message);
    }
});

chrome.runtime.onMessage.addListener((message, sender, callback) => {
    if (message.name === 'toggle-warning') {
        if (message.enabled) {
            insertWarning(message.options.style);
        } else {
            removeWarning();
        }
    }

    if (message.name === 'change-style') {
        removeWarning();
        insertWarning(message.options.style);
        updateMessage(message.options.message);
    }

    if (message.name === 'change-message') {
        updateMessage(message.msg);
    }
});
