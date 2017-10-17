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
        const { Page, Profiler, DOM, CSS } = client;

        // Enables page and profile domain notifications.
        await Page.enable();
        await Profiler.enable();
        await DOM.enable();
        await CSS.enable();

        // Start capturing coverage data
        await Profiler.startPreciseCoverage();
        await CSS.startRuleUsageTracking();

        await Page.navigate({
          url: `file://${Path.resolve(__dirname, './client')}/index.html`
        });

        // Save the data for each style added to the document.
        // This is because the rule usage data only includes styleSheetId.
        // This helps map it back to the file name to which it belongs.
        await CSS.styleSheetAdded(({ header }) => styles.push(header));

        // Fires when all assets have finished loading
        // This includes js, css, images, ads, etc.
        await Page.loadEventFired();

        // Take a snapshot of all the coverage data ocne the load is complete
        const { coverage: styleSheetCoverages } = await CSS.takeCoverageDelta();
        const {
          result: scriptCoverages
        } = await Profiler.takePreciseCoverage();

        // Stop capturing coverage data
        await Profiler.stopPreciseCoverage();
        await CSS.stopRuleUsageTracking();

        // Go through all the unique styles added to the doc and
        // calculate the coverage stats for each of them
        styles.forEach(style => {
          resources.push({
            id: style.styleSheetId,
            file: style.sourceURL,
            coverage: calculateFinalStyleSheetCoverage(
              filterCoverageForStylesheet(
                styleSheetCoverages,
                style.styleSheetId
              ),
              style.length
            ),
            type: 'styleSheet'
          });
        });

        // Directly go through the coverage data and calculate coverage stats
        scriptCoverages.forEach(script => {
          resources.push({
            id: script.scriptId,
            file: script.url,
            coverage: calculateFinalScriptCoverage(script.functions),
            type: 'script'
          });
        });

        // Log the coverage data for all the resources
        resources.map(resource => {
          console.log(
            resource.file ===
            `file://${Path.resolve(__dirname, './client')}/index.html`
              ? `Inline ${resource.type}`
              : resource.file
          );
          console.log(
            `Type: ${resource.type}, Total: ${resource.coverage
              .total}, Unused: ${resource.coverage.unused}, Unused %: ${resource
              .coverage.percentage}`
          );
        });
      },
      err => {
        console.log('Error with remote interface', err);
      }
    );
  })
  .catch(err => {
    console.log('Error with launcher', err);
  });

/**
 * Takes the coverages for a single styleSheetId and returns the cumulative coverage stats for it
 * 
 * Sample input:
 *  [
 *    { styleSheetId: '45243.1', startOffset: 0, endOffset: 72, used: true },
 *    { styleSheetId: '45243.1', startOffset: 74, endOffset: 132, used: true },
 *    { styleSheetId: '45243.1', startOffset: 134, endOffset: 159, used: true },
 *    { styleSheetId: '45243.1', startOffset: 194, endOffset: 224, used: true }
 *  ];
 */
const calculateFinalStyleSheetCoverage = (coverages, total) => {
  const coverageDefaults = { used: 0 };

  const coverageData = coverages.reduce((coverageAcc, coverage) => {
    const used =
      coverageAcc.used +
      (coverage.used ? coverage.endOffset - coverage.startOffset : 0);
    const total =
      coverageAcc.total > coverage.endOffset
        ? coverageAcc.total
        : coverage.endOffset;
    return {
      used
    };
  }, coverageDefaults);

  return {
    total,
    unused: total - coverageData.used,
    percentage: total > 0 ? (total - coverageData.used) * 100 / total : 0
  };
};

/**
 * Filter an array of coverages based on styleSheetId
 * 
 * Sample input:
 *  [
 *    { styleSheetId: '45243.1', startOffset: 0, endOffset: 72, used: true },
 *    { styleSheetId: '45243.1', startOffset: 74, endOffset: 132, used: true },
 *    { styleSheetId: '45243.1', startOffset: 134, endOffset: 159, used: true },
 *    { styleSheetId: '45243.1', startOffset: 194, endOffset: 224, used: true },
 *    { styleSheetId: '45243.2', startOffset: 0, endOffset: 25, used: true },
 *    { styleSheetId: '45243.2', startOffset: 60, endOffset: 90, used: true }
 *  ];
 */
const filterCoverageForStylesheet = (coverages, id) => {
  return coverages.filter(coverage => coverage.styleSheetId === id);
};

/**
 * Get the coverage data for a given script based on the function usage
 * 
 * Sample Input:
 *  [
 *    {
 *      scriptId: '20',
 *      url:
 *        'file:///Users/karanjthakkar/Work/Repos/Personal/chrome-code-coverage/client/index_1.js',
 *      functions: [
 *        {
 *          functionName: 'a',
 *          ranges: [{ startOffset: 0, endOffset: 59, count: 1 }],
 *          isBlockCoverage: false
 *        },
 *        {
 *          functionName: 'b',
 *          ranges: [{ startOffset: 61, endOffset: 185, count: 0 }],
 *          isBlockCoverage: false
 *        }
 *      ]
 *    }
 *  ];
 */
const calculateFinalScriptCoverage = functions => {
  const fnDefaults = { total: 0, unused: 0 };

  const coverageData = functions.reduce((fnAcc, fn) => {
    const rangeDefaults = { total: 0, unused: 0 };

    const fnUsage = fn.ranges.reduce((rangeAcc, range) => {
      const unused =
        rangeAcc.unused +
        (range.count === 0 ? range.endOffset - range.startOffset : 0);
      const total =
        rangeAcc.total > range.endOffset ? rangeAcc.total : range.endOffset;
      return {
        total,
        unused
      };
    }, rangeDefaults);

    return {
      total: fnAcc.total > fnUsage.total ? fnAcc.total : fnUsage.total,
      unused: fnAcc.unused + fnUsage.unused
    };
  }, fnDefaults);

  return {
    total: coverageData.total,
    unused: coverageData.unused,
    percentage:
      coverageData.total > 0
        ? coverageData.unused * 100 / coverageData.total
        : 0
  };
};
