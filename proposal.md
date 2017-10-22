# Leveraging Headless Chrome using Chrome Debugging Protocol and Possible Use Cases

### Overview:
Ever since chrome launched cross platform support for Headless mode since Chrome 59, there has been a lot of buzz regarding the variety of use cases that can be achieved with it. These include, but are not limited to, easier automated testing, screenshot/pdf generation, access to all of devtools features using the devtools protocol including audits, performance, coverage, etc. In this talk, I'd like to present a bunch of things that folks can achieve today using Headless Chrome and instrumenting it using the powerful Chrome Debugging Protocol(CDP).

### Outline:

#### 1. What is Chrome Debugging Protocol?
  
  - What is it?
  - What API's are available to you?
  - Brief intro to chrome-remote-interface: a nodejs lib that makes using CDP more easier

#### 2. Static and dynamic CSS/JS coverage

  - API to capture coverage
  - High level overview of the API for CSS/JS coverage
  - Usecases:
    - Identify usage of unnecessary polyfills
    - Find out unused framework code, like bootstrap
    - Run it along with auomation tests to find redundant code for app

#### 3. Violation reporting using Log domain

  - API to to capture violations
  - Usecases:
    - Event handlers that take a long time to execute
    - Identify long running tasks
    - Find out code that blocked parser/event loop

#### 4. Screenshot/PDF generation

  - API to capture screenshots
  - Usecases:
    - Generate dynamic images on the server eg: memes
    - Generate invoices, pdf slides, etc.

### Takeaways/Learnings

- How to use the low level chrome-remote-interface library
- Different API's available for CDP
- Code samples to try out different use cases like code coverage, screenshot generation, etc.
