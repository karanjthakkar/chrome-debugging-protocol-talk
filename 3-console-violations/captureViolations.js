'use strict';

const CDP = require('chrome-remote-interface');
const ChromeLauncher = require('chrome-launcher');
const Path = require('path');

const styles = [];
const resources = [];

ChromeLauncher.launch({
  port: 9222,
  chromeFlags: ['--headless', '--disable-gpu'],
  chromePath:
    process.env.NODE_ENV === 'production' ? '/usr/bin/google-chrome' : undefined
})
  .then(() => {
    CDP().then(
      async client => {
        const { Page, Log, Runtime } = client;

        // Enables all necessary domains
        await Page.enable();
        await Log.enable();
        await Runtime.enable();

        await Log.startViolationsReport({
          config: [
            // { name: 'longTask', threshold: 30 },
            // { name: 'longLayout', threshold: 30 },
            // { name: 'blockedEvent', threshold: 30 },
            // { name: 'blockedParser', threshold: 30 },
            // { name: 'discouragedAPIUse', threshold: -1 },
            { name: 'handler', threshold: 30 }, // event handlers
            { name: 'recurringHandler', threshold: 30 } // rAF, setTimeout
          ]
        });

        Log.entryAdded(({ entry }) => {
          console.log(entry.text);
        });

        await Page.navigate({
          url: `file://${Path.resolve(__dirname, './client')}/index.html`
        });

        // Fires when all assets have finished loading
        // This includes js, css, images, ads, etc.
        await Page.loadEventFired();

        await Runtime.evaluate({
          expression: `document.querySelector('.app-body').click()`
        });

        await Log.stopViolationsReport();
      },
      err => {
        console.log('Error with remote interface', err);
      }
    );
  })
  .catch(err => {
    console.log('Error with launcher', err);
  });
