'use strict';
let chromedriver = require('chromedriver');
let selenium = require('selenium-webdriver');

/**
 * Creates a Selenium WebDriver using Chrome as the browser
 * @returns {ThenableWebDriver} selenium web driver
 */
module.exports = function() {
    let driver = new selenium.Builder().withCapabilities({
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        chromeOptions: {
            args: ['start-maximized', 'disable-extensions']
        },
        path: chromedriver.path
    }).build();
    driver.manage().window().maximize();
    return driver;
};
