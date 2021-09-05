const selenium = require("selenium-webdriver");
const localizador = require("cucumber");
module.exports = {
    /**
     * returns a promise that is called when the url has loaded and the body element is present
     * @param {string} url - url to load
     * @param {int} waitInSeconds - number of seconds to wait for page to load
     * @returns {Promise} resolved when url has loaded otherwise rejects
     * @example
     *      helpers.loadPage('http://www.google.com');
     */
    loadPage: (url, waitInSeconds) => {
        let timeout = (waitInSeconds) ? (waitInSeconds * 1000) : DEFAULT_TIMEOUT;
        return driver.get(url).then(() => driver.wait(until.elementLocated(by.css('body')), timeout));
    },

    /**
     * returns the value of an attribute on an element
     * @param {string} htmlCssSelector - HTML css selector used to find the element
     * @param {string} attributeName - attribute name to retrieve
     * @returns {string} the value of the attribute or empty string if not found
     * @example
     *      helpers.getAttributeValue('body', 'class');
     */
    getAttributeValue: (htmlCssSelector, attributeName) =>
        driver.findElement(by.css(htmlCssSelector)).then((el) => el.getAttribute(attributeName)),

    /**
     * returns list of elements matching a query selector who's inner text matches param.
     * WARNING: The element returned might not be visible in the DOM and will therefore have restricted interactions
     * @param {string} cssSelector - css selector used to get list of elements
     * @param {string} textToMatch - inner text to match (does not have to be visible)
     * @returns {Promise} resolves with list of elements if query matches, otherwise rejects
     * @example
     *      helpers.getElementsContainingText('nav[role="navigation"] ul li a', 'Safety Boots')
     */
    getElementsContainingText: (cssSelector, textToMatch) => {
        function findElementsContainingText(query, content) {
            let results = [];
            let txtProp = ('textContent' in document) ? 'textContent' : 'innerText';
            let elements = document.querySelectorAll(query);
            for (let i = 0, l = elements.length; i < l; i++) {
                if (elements[i][txtProp].trim() === content.trim()) {
                    results.push(elements[i]);
                }
            }
            return results;
        }

        return driver.findElements(by.js(findElementsContainingText, cssSelector, textToMatch));
    },

    /**
     * returns first elements matching a query selector who's inner text matches textToMatch param
     * @param {string} cssSelector - css selector used to get list of elements
     * @param {string} textToMatch - inner text to match (does not have to be visible)
     * @returns {Promise} resolves with first element containing text otherwise rejects
     * @example
     *      helpers.getFirstElementContainingText('nav[role="navigation"] ul li a', 'Safety Boots').click();
     */
    getFirstElementContainingText: (cssSelector, textToMatch) =>
        helpers.getElementsContainingText(cssSelector, textToMatch).then((elements) => elements[0]),

    /**
     * clicks an element (or multiple if present) that is not visible, useful in situations where a menu needs a hover before a child link appears
     * @param {string} cssSelector - css selector used to locate the elements
     * @param {string} textToMatch - text to match inner content (if present)
     * @returns {Promise} resolves if element found and clicked, otherwise rejects
     * @example
     *      helpers.clickHiddenElement('nav[role="navigation"] ul li a','Safety Boots');
     */
    clickHiddenElement: (cssSelector, textToMatch) => {
        function clickElementInDom(query, content) {
            let elements = document.querySelectorAll(query);
            let txtProp = ('textContent' in document) ? 'textContent' : 'innerText';
            for (let i = 0, l = elements.length; i < l; i++) {
                if (content) {
                    if (elements[i][txtProp] === content) {
                        elements[i].click();
                    }
                } else {
                    elements[i].click();
                }
            }
        }

        return driver.findElements(by.js(clickElementInDom, cssSelector, textToMatch));
    },

    /**
     * Waits until a HTML attribute equals a particular value
     * @param {string} elementSelector - HTML element CSS selector
     * @param {string} attributeName - name of the attribute to inspect
     * @param {string} attributeValue - value to wait for attribute to equal
     * @param {int} waitInMilliseconds - number of milliseconds to wait for page to load
     * @returns {Promise} resolves if attribute eventually equals, otherwise rejects
     * @example
     *      helpers.waitUntilAttributeEquals('html', 'data-busy', 'false', 5000);
     */
    waitUntilAttributeEquals: (elementSelector, attributeName, attributeValue, waitInMilliseconds) => {
        let timeout = waitInMilliseconds || DEFAULT_TIMEOUT;
        let timeoutMessage = attributeName + ' does not equal ' + attributeValue + ' after ' + waitInMilliseconds + ' milliseconds';
        return driver.wait(() => (helpers.getAttributeValue(elementSelector, attributeName).then(value => value === attributeValue))
            , timeout, timeoutMessage);
    },

    /**
     * Waits until a HTML attribute exists
     * @param {string} elementSelector - HTML element CSS selector
     * @param {string} attributeName - name of the attribute to inspect
     * @param {int} waitInMilliseconds - number of milliseconds to wait for page to load
     * @returns {Promise} resolves if attribute exists within timeout, otherwise rejects
     * @example
     *      helpers.waitUntilAttributeExists('html', 'data-busy', 5000);
     */
    waitUntilAttributeExists: (elementSelector, attributeName, waitInMilliseconds) => {
        let timeout = waitInMilliseconds || DEFAULT_TIMEOUT;
        let timeoutMessage = attributeName + ' does not exists after ' + waitInMilliseconds + ' milliseconds';
        return driver.wait(() => helpers.getAttributeValue(elementSelector, attributeName)
            .then(value => value !== null), timeout, timeoutMessage);
    },

    /**
     * Waits until a HTML attribute no longer exists
     * @param {string} elementSelector - HTML element CSS selector
     * @param {string} attributeName - name of the attribute to inspect
     * @param {int} waitInMilliseconds - number of milliseconds to wait for page to load
     * @returns {Promise} resolves if attribute is removed within timeout, otherwise rejects
     * @example
     *      helpers.waitUntilAttributeDoesNotExists('html', 'data-busy', 5000);
     */
    waitUntilAttributeDoesNotExists: (elementSelector, attributeName, waitInMilliseconds) => {
        let timeout = waitInMilliseconds || DEFAULT_TIMEOUT;
        let timeoutMessage = attributeName + ' still exists after ' + waitInMilliseconds + ' milliseconds';
        return driver.wait(() =>
            helpers.getAttributeValue(elementSelector, attributeName).then(value => value === null), timeout, timeoutMessage
        );
    },

    /**
     * Waits until an css element exists and returns it
     * @param {string} elementSelector - HTML element CSS selector
     * @param {int} waitInMilliseconds - (optional) number of milliseconds to wait for the element
     * @returns {Promise} a promise that will resolve if the element is found within timeout
     * @example
     *      helpers.waitForCssXpathElement('#login-button', 5000);
     */
    waitForCssXpathElement:  (elementSelector, waitInMilliseconds) =>{
        let timeout = waitInMilliseconds || DEFAULT_TIMEOUT;
        let selector = (localizador.indexOf('//') === 0) ? "xpath" : "css";
        let timeoutMessage = attributeName + ' still exists after ' + waitInMilliseconds + ' milliseconds';
        return driver.wait(selenium.until.elementLocated({[selector]: elementSelector}), timeout, timeoutMessage);
    },

    scrollToElement: element => driver.executeScript('return arguments[0].scrollIntoView(false);', element),

    /**
     * Select a value inside a dropdown list by its text
     * @param {string} elementSelector - css or xpath selector
     * @param {string} optionName - name of the option to be chosen
     * @returns {Promise} a promise that will resolve if the element is found within timeout
     * @example
     *      helpers.selectByVisibleText('#country', 'Brazil');
     */
    selectDropdownValueByVisibleText: async (elementSelector, optionName) => {
        let select = await helpers.waitForCssXpathElement(elementSelector);
        let selectElements = await select.findElements({css: 'option'});
        let options = [];
        for (let option of selectElements) {
            options.push((await option.getText()).toUpperCase());
        }
        optionName = optionName.toUpperCase();
        return selectElements[options.indexOf(optionName)].click();
    },

    /**
     * Awaits and returns an array of all windows opened
     * @param {int} waitInMilliseconds - (optional) number of milliseconds to wait for the result
     * @returns {Promise} a promise that will resolve with an array of window handles.
     * @example
     *      helpers.waitForNewWindows();
     */
    waitForNewWindows: async function (waitInMilliseconds) {
        let timeout = waitInMilliseconds || DEFAULT_TIMEOUT;
        let windows = [];
        for (let i = 0; i < timeout; i += 1000) {
            windows = await driver.getAllWindowHandles();
            if (windows.length > 1) return windows;
            await driver.sleep(1000);
        }
    },

    /**
     * Get the content value of a :before pseudo element
     * @param {string} cssSelector - css selector of element to inspect
     * @returns {Promise} executes .then with value
     * @example
     *      helpers.getPseudoElementBeforeValue('body header').then(function(value) {
     *          console.log(value);
     *      });
     */
    getPseudoElementBeforeValue: cssSelector => {
        function getBeforeContentValue(qs) {
            let el = document.querySelector(qs);
            let styles = el ? window.getComputedStyle(el, ':before') : null;
            return styles ? styles.getPropertyValue('content') : '';
        }
        return driver.executeScript(getBeforeContentValue, cssSelector);
    },

    /**
     * Get the content value of a :after pseudo element
     * @param {string} cssSelector - css selector of element to inspect
     * @returns {Promise} executes .then with value
     * @example
     *      helpers.getPseudoElementAfterValue('body header').then(function(value) {
     *          console.log(value);
     *      });
     */
    getPseudoElementAfterValue: (cssSelector) => {
        function getAfterContentValue(qs) {
            let el = document.querySelector(qs);
            let styles = el ? window.getComputedStyle(el, ':after') : null;
            return styles ? styles.getPropertyValue('content') : '';
        }

        return driver.executeScript(getAfterContentValue, cssSelector);
    },

    clearCookies: () => driver.manage().deleteAllCookies(),
    clearStorages: () => driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();'),
    clearCookiesAndStorages: () => helpers.clearCookies().then(helpers.clearStorages())
};
