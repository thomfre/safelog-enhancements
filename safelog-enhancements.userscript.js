// ==UserScript==
// @name         LimaNovember.Aero - Safelog Enhancements
// @namespace    https://limanovember.aero/
// @version      0.1
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
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___G_txtValue',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___H_txtValue'
];

const removeThings = [
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___A_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___B_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___C_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___D_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___E_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___F_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___G_cacheButtonsContainer',
    'ctl00_ctl00_contentHolder_pageBody_FAATEX___H_cacheButtonsContainer'
];

const observeAndAct = (selector, callback, includeSubTree = false) => {
    const element = document.querySelector(selector);

    if (!element) return;

    const observer = new MutationObserver(callback);

    const observerConfig = {
        subtree: includeSubTree,
        attributes: true,
        childList: true,
        characterData: true
    };

    observer.observe(element, observerConfig);

    return observer;
};

(function () {
    'use strict';

    observeAndAct(`#aspnetForm`, () => {
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
    });
})();