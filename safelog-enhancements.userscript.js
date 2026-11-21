// ==UserScript==
// @name         LimaNovember.Aero - Safelog Enhancements
// @namespace    https://limanovember.aero/
// @version      0.7
// @description  Make Safelog work like I want to
// @icon         https://limanovember.aero/images/icon.png
// @author       thomfre
// @match        https://www.safelogweb.com/*
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @downloadURL  https://raw.githubusercontent.com/thomfre/safelog-enhancements/main/safelog-enhancements.userscript.js
// @updateURL    https://raw.githubusercontent.com/thomfre/safelog-enhancements/main/safelog-enhancements.userscript.meta.js
// ==/UserScript==

const ID_PREFIX = 'ctl00_ctl00_contentHolder_pageBody_';
const FORM_TABLE_ID = `${ID_PREFIX}formLayoutTable`;

// Custom text fields (FAATEX___X) where suggestions and quick buttons are just noise.
// G (Logbook in use) is left alone on purpose. K, L and M (Student Lesson, Operating School,
// Student Course) are new in Safelog - add them here if you want them quiet as well.
const quietTextFields = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'I', 'J'];

// Time-of-day fields that should default to LOCAL on new flights
const setLocal = [`${ID_PREFIX}DEPARTURETIME_lstAMPM`, `${ID_PREFIX}ARRIVALTIME_lstAMPM`];

// The "Instrument Approaches" free text type (ETCTEXT type id 8) is used for links
const ETCTEXT_ORIGINAL_LABEL = 'Instrument Approaches';
const ETCTEXT_NEW_LABEL = 'Links';

const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

const addStyle = (css) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
};

const quietenTextFields = () => {
    const css = [];

    quietTextFields.forEach((letter) => {
        const containerId = `${ID_PREFIX}FAATEX___${letter}`;

        // Recent-value buttons + the new suggestion dropdown (rendered by STEXT.js)
        css.push(`#${containerId}_cacheButtonsContainer`);
        css.push(`#${containerId} ul.dropdown-list`);

        const input = document.getElementById(`${containerId}_txtValue`);
        if (input) {
            input.onfocus = null;
            input.setAttribute('autocomplete', 'off');
        }

        // Keep the suggestion list empty as well as hidden, so that Enter/arrow keys
        // can't pick a suggestion that isn't visible
        const dropdown = document.querySelector(`#${containerId} ul.dropdown-list`);
        if (dropdown) {
            const empty = () => {
                if (dropdown.firstChild) {
                    dropdown.replaceChildren();
                }
            };
            empty();
            new MutationObserver(empty).observe(dropdown, { childList: true });
        }
    });

    addStyle(`${css.join(',\n')} { display: none !important; }`);
};

// Renames "Instrument Approaches" to "Links" inside the free text (ETCTEXT) control.
// The control is rendered client side, so we watch it and relabel whatever shows up.
const relabelEtcText = () => {
    const container = document.getElementById(`${ID_PREFIX}ETCTEXT`);
    if (!container) {
        return;
    }

    const skipTags = ['TEXTAREA', 'SCRIPT', 'STYLE'];
    const labelAttributes = ['placeholder', 'title', 'aria-label', 'value'];

    const relabelTextNode = (node) => {
        // The hidden textarea holds the JSON that is posted back - never touch that
        if (node.parentElement && skipTags.includes(node.parentElement.tagName)) return;

        if (node.nodeValue && node.nodeValue.includes(ETCTEXT_ORIGINAL_LABEL)) {
            node.nodeValue = node.nodeValue.replaceAll(ETCTEXT_ORIGINAL_LABEL, ETCTEXT_NEW_LABEL);
        }
    };

    const relabelElement = (el) => {
        if (skipTags.includes(el.tagName)) return;

        labelAttributes.forEach((attr) => {
            if (attr === 'value' && !['BUTTON', 'INPUT'].includes(el.tagName)) return;
            if (attr === 'value' && el.tagName === 'INPUT' && !['button', 'submit'].includes(el.type)) return;

            const value = el.getAttribute(attr);
            if (value && value.includes(ETCTEXT_ORIGINAL_LABEL)) {
                el.setAttribute(attr, value.replaceAll(ETCTEXT_ORIGINAL_LABEL, ETCTEXT_NEW_LABEL));
            }
        });
    };

    const relabel = (root) => {
        if (root.nodeType === Node.TEXT_NODE) {
            relabelTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE) return;

        relabelElement(root);
        root.querySelectorAll('*').forEach(relabelElement);

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            relabelTextNode(walker.currentNode);
        }
    };

    relabel(container);

    new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData') {
                relabelTextNode(mutation.target);
            } else if (mutation.type === 'attributes') {
                relabelElement(mutation.target);
            } else {
                mutation.addedNodes.forEach(relabel);
            }
        });
    }).observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: labelAttributes
    });
};

const isNewFlight = () => {
    if (document.URL.includes('logxid')) return false;

    // The page header says "New Flight" (SINGLEFLIGHTNEW icon) when adding a flight
    const icon = document.querySelector('img.pageHeaderCaptionIcon');
    return !icon || (icon.getAttribute('src') || '').includes('SINGLEFLIGHTNEW');
};

const setNewFlightDefaults = () => {
    setLocal.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.value !== 'LOCAL') {
            el.value = 'LOCAL';
            if (typeof pageWindow.InputControl_TIMEOFDAY_timeOfDayChanged === 'function') {
                pageWindow.InputControl_TIMEOFDAY_timeOfDayChanged(id);
            }
        }
    });

    const logbookInUse = document.getElementById(`${ID_PREFIX}FAATEX___G_txtValue`);
    if (logbookInUse && !logbookInUse.value) {
        logbookInUse.value = 'PPL';
    }

    const holdersOperatingCapacity = document.getElementById(`${ID_PREFIX}HOLDERSOPERATINGCAPACITY_lstValue`);
    if (holdersOperatingCapacity) {
        holdersOperatingCapacity.value = '16'; // 16 = INST
    }
};

const enhance = () => {
    console.log('Safelog Enhancements: form found, doing work');

    quietenTextFields();
    relabelEtcText();

    if (isNewFlight()) {
        setNewFlightDefaults();
    }
};

// The flight form can show up after the script has started, so wait for it (but not forever)
const whenFormIsReady = (callback, timeoutMs = 15000) => {
    if (document.getElementById(FORM_TABLE_ID)) {
        callback();
        return;
    }

    const observer = new MutationObserver(() => {
        if (document.getElementById(FORM_TABLE_ID)) {
            observer.disconnect();
            clearTimeout(timer);
            callback();
        }
    });

    const timer = setTimeout(() => observer.disconnect(), timeoutMs);

    observer.observe(document.documentElement, { childList: true, subtree: true });
};

(function () {
    'use strict';

    console.log('Starting Safelog Enhancements');

    whenFormIsReady(enhance);
})();
