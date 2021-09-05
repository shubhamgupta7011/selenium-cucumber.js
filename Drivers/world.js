'use strict';

/**
 * world.js is loaded by the cucumber framework before loading the step definitions and feature files
 * it is responsible for setting up and exposing the driver/browser/expect/assert etc required within each step definition
 */
let driver, eyes;
let fs = require('fs-plus');
let path = require('path');
let requireDir = require('require-dir');
let merge = require('merge');
let chalk = require('chalk');
let selenium = require('selenium-webdriver');
let {expect, assert} = require('chai');
let reporter = require('cucumber-html-reporter');
let cucumberJunit = require('cucumber-junit');
let Eyes = require('eyes.selenium').Eyes;

// drivers
let FireFoxDriver = require('./firefoxDriver.js');
let PhantomJSDriver = require('./phantomDriver.js');
let ElectronDriver = require('./electronDriver.js');
let ChromeDriver = require('./chromeDriver');

/**
 * create the selenium browser based on global let set in index.js
 * @returns {ThenableWebDriver} selenium web driver
 */
function getDriverInstance() {
    switch (browserName || '') {
        case 'firefox': {
            driver = new FireFoxDriver();
            break;
        }

        case 'phantomjs': {
            driver = new PhantomJSDriver();
            break;
        }

        case 'electron': {
            driver = new ElectronDriver();
            break;
        }

        case 'chrome': {
            driver = new ChromeDriver();
            break;
        }

        default: {
            let driverFileName = path.resolve(process.cwd(), browserName);
            if (!fs.isFileSync(driverFileName)) {
                throw new Error('Could not find driver file: ' + driverFileName);
            }
            driver = require(driverFileName)();
        }
    }
    global.driver = driver;
    return global.driver;
}

/**
 * Initialize the eyes SDK and set your private API key via the config file.
 */
function getEyesInstance() {
    if (global.eyesKey) {
        let eyes = new Eyes();
        eyes.setApiKey(global.eyesKey);
        return eyes;
    }
    return null;
}

function consoleInfo() {
    let args = [].slice.call(arguments),
        output = chalk.bgBlue.white('\n>>>>> \n' + args + '\n<<<<<\n');
    console.log(output);
}

/**
 * Creates a list of letiables to expose globally and therefore accessible within each step definition
 * @returns {void}
 */
function createWorld() {
    let runtime = {
        driver: null,               // the browser object
        eyes: null,
        selenium: selenium,         // the raw nodejs selenium driver
        By: selenium.By,            // in keeping with Java expose selenium By
        by: selenium.By,            // provide a javascript lowercase version
        until: selenium.until,      // provide easy access to selenium until methods
        expect: expect,             // expose chai expect to allow letiable testing
        assert: assert,             // expose chai assert to allow letiable testing
        trace: consoleInfo,         // expose an info method to log output to the console in a readable/visible format
        page: global.page || {},    // empty page objects placeholder
        shared: global.shared || {} // empty shared objects placeholder
    };

    // expose properties to step definition methods via global variables
    Object.keys(runtime).forEach(function (key) {
        if (key === 'driver' && browserTeardownStrategy !== 'always') {
            return;
        }
        // make property/method available as a global (no this. prefix required)
        global[key] = runtime[key];
    });
}

/**
 * Import shared objects, pages object and helpers into global scope
 * @returns {void}
 */
function importSupportObjects() {
    if (global.sharedObjectPaths && Array.isArray(global.sharedObjectPaths) && global.sharedObjectPaths.length > 0) {
        let allDirs = {};
        global.sharedObjectPaths.forEach(function (itemPath) {
            if (fs.existsSync(itemPath)) {
                let dir = requireDir(itemPath, {camelcase: true, recurse: true});
                merge(allDirs, dir);
            }
        });
        if (Object.keys(allDirs).length > 0) {
            global.shared = allDirs;
        }
    }
    if (global.pageObjectPath && fs.existsSync(global.pageObjectPath)) {
        global.page = requireDir(global.pageObjectPath, {camelcase: true, recurse: true});
    }
    global.helpers = require('../utility/helpers');
}

function closeBrowser() {

    return driver.close().then(function () {
        if (browserName !== 'firefox') {
            return driver.quit();
        }
    });
}

async function teardownBrowser() {
    await Promise.resolve();
    helpers.clearCookiesAndStorages();
    //   closeBrowser();
}

// export the "World" required by cucumber to allow it to expose methods within step def's
module.exports = function () {
    createWorld();
    importSupportObjects();
    // this.World must be set!
    this.World = createWorld;

    // set the default timeout for all tests
    this.setDefaultTimeout(global.DEFAULT_TIMEOUT);

    // create the driver and applitools eyes before scenario if it's not instantiated
    this.registerHandler('BeforeScenario', function (scenario) {
            global.driver = !driver ? getDriverInstance() : driver;
            // if (!global.eyes) {
            //     global.eyes = getEyesInstance();
            //     eyes = global.eyes
            // }
        }
    )
    ;

    this.registerHandler('AfterFeatures', function (features, done) {
        let cucumberReportPath = path.resolve(global.reportsPath, 'cucumber-report.json');
        if (global.reportsPath && fs.existsSync(global.reportsPath)) {
            // generate the HTML report
            let reportOptions = {
                theme: 'bootstrap',
                jsonFile: cucumberReportPath,
                output: path.resolve(global.reportsPath, 'cucumber-report.html'),
                reportSuiteAsScenarios: true,
                launchReport: (!global.disableLaunchReport),
                ignoreBadJsonFile: true
            };
            reporter.generate(reportOptions);

            // grab the file data
            let reportRaw = fs.readFileSync(cucumberReportPath).toString().trim();
            let xmlReport = cucumberJunit(reportRaw);
            let junitOutputPath = path.resolve(global.junitPath, 'junit-report.xml');
            fs.writeFileSync(junitOutputPath, xmlReport);
        }
        if (browserTeardownStrategy !== 'always') {
            closeBrowser().then(() => done());
        } else {
            new Promise((resolve) => resolve(done()));
        }
    });

// executed after each scenario (always closes the browser to ensure fresh tests)
    this.After((scenario) => {
        if (scenario.isFailed() && !global.noScreenshot) {
            return global.driver.takeScreenshot().then(function (screenShot) {
                scenario.attach(new Buffer(screenShot, 'base64'), 'image/png');
                helpers.clearCookiesAndStorages();
                return teardownBrowser().then(() => {
                    if (eyes) {
                        return eyes.abortIfNotClosed()
                    }
                });
            });
        }
        return teardownBrowser();
    });
};
