const startBrowser = require("./brower");
const scraperController = require("./scrapController");

// Khoi tao browser
let browser = startBrowser();

// Goi ham
scraperController(browser);
