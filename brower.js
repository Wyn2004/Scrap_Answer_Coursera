const puppeteer = require("puppeteer");
require("dotenv").config();

const startBrowser = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      // Co cho phep hien trinh duyet UI len k ( true co false khong)
      headless: true,
      // Chrome su dung multiple layers cua sandbox de tranh nhung truong hop
      // khong dang tin cay, neu tin tuong content thi khong can set nhu vay
      args: ["--disable-setuid-sandbox"],
      // truy cap den trang web, bo qua loi bao mat
      ignoreHTTPSErrors: true,
      executablePath: process.env.EXE_CU_TABLE_PATH,
      userDataDir: process.env.USER_DATA_DIR,
    });
  } catch (error) {
    console.log("Do not start browser: " + error);
  }
  return browser;
};

module.exports = startBrowser;
