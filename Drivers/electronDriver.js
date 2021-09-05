'use strict';
let selenium = require('selenium-webdriver');
let path = require('path');
let myapp = path.resolve(process.cwd(), 'MyApp.app/Contents/MacOS/MyApp');
/**
 * Creates a Selenium WebDriver using Firefox as the browser
 * @returns {ThenableWebDriver} selenium web driver
 */
module.exports = function () {
    return new selenium.Builder()
        .withCapabilities({
            chromeOptions: {
                // Here is the path to your Electron binary.
                binary: myapp
            }
        })
        .forBrowser('electron')
        .build();
};
