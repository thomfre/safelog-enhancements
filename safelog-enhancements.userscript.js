// ==UserScript==
// @name         LimaNovember.Aero - Safelog Enhancements
// @namespace    https://limanovember.aero/
// @version      0.6
// @description  Make Safelog work like I want to
// @icon         https://limanovember.aero/images/icon.png
// @author       thomfre
// @match        https://www.safelogweb.com/*
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @downloadURL  https://raw.githubusercontent.com/thomfre/safelog-enhancements/main/safelog-enhancements.userscript.js
// @updateURL    https://raw.githubusercontent.com/thomfre/safelog-enhancements/main/safelog-enhancements.userscript.meta.js
// ==/UserScript==

const disableOnfocusFor = [
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___A_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___B_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___C_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___D_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___E_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___F_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___H_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___I_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___J_txtValue'
];

const removeThings = [
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___A_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___B_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___C_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___D_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___E_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___F_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___H_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___I_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___J_cacheButtonsContainer'
];

const setLocal = [
    'ctl00_ctl00_contentHolder_pageBody_DEPARTURETIME_lstAMPM',
    'ctl00_ctl00_contentHolder_pageBody_ARRIVALTIME_lstAMPM'
];

let callbackRan = false;

const observeAndAct = (selector, callback, includeSubTree = false) => {
    const element = document.querySelector(selector);

    if (!element) {
        console.warn("Form element not found, aborting");
        return;
    };

    const observer = new MutationObserver(callback);

    const observerConfig = {
        subtree: includeSubTree,
        attributes: true,
        childList: true,
        characterData: true
    };

    observer.observe(element, observerConfig);
    observeForInstrumentAppRow();

    setTimeout(() => {
        if (!callbackRan) {
            callback();
        }
    }, 2000);

    return observer;
};

const observeForInstrumentAppRow = () => {
    const table = document.getElementById('ctl00_ctl00_contentHolder_pageBody_formLayoutTable');
    if (!table) {
        console.warn("formLayoutTable not found, aborting row watcher");
        return;
    }

    const renameRowIfMatch = (row) => {
        const textarea = row.querySelector('textarea[data-input-for-etctext-type-id="8"]');
        if (!textarea) return;

        const label = row.querySelector('td.label');
        if (label) {
            label.innerText = 'Links';
        }
    };

    // Handle rows that might already be present
    table.querySelectorAll('tr.IC-ETCTEXT-ITEM-ROW').forEach(renameRowIfMatch);

    const rowObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return; // skip text nodes

                if (node.matches && node.matches('tr.IC-ETCTEXT-ITEM-ROW')) {
                    renameRowIfMatch(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('tr.IC-ETCTEXT-ITEM-ROW').forEach(renameRowIfMatch);
                }
            });
        });
    });

    rowObserver.observe(table, {
        childList: true,
        subtree: true
    });

    return rowObserver;
};

(function () {
    'use strict';

    console.log("Starting Safelog Enhancements");

    observeAndAct(`table.layout`, () => {
        console.log("Form found, doing work");
        callbackRan = true;

        disableOnfocusFor.map((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.onfocus = () => {};
                el.setAttribute('autocomplete', 'off');
            }
        });

        removeThings.map((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
            }
        });

        const instrumentApproaches = document.querySelector('#ctl00_ctl00_contentHolder_pageBody_ETCTEXT a[data-create-button-for-etctext-type-id="8"]');
        if (instrumentApproaches) {
            instrumentApproaches.innerText = 'Links';
        }

        if (!document.URL.includes('logxid')) {
            setLocal.map((id) => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = 'LOCAL';
                    InputControl_TIMEOFDAY_timeOfDayChanged(id);
                }
            });

            const logbookInUse = document.getElementById('ctl00_ctl00_contentHolder_pageBody_FAATEX___G_txtValue');
            if (logbookInUse) {
                logbookInUse.value = 'PPL';
            }

            const holdersOperatingCapacity = document.getElementById('ctl00_ctl00_contentHolder_pageBody_HOLDERSOPERATINGCAPACITY_lstValue');
            if (holdersOperatingCapacity) {
                holdersOperatingCapacity.value = '16'; // 16 = INST
            }
        }
    });
})();
