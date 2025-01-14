const scrappers = require("./scrapper");
const fs = require("fs");

// Tạo ham điều hướng
const scrapController = async (browserInstance) => {
  try {
    let browser = await browserInstance;
    const urls = [
      "https://www.coursera.org/learn/research-methods/home/week/1",
      "https://www.coursera.org/learn/research-methodologies/home/week/1",
      "https://www.coursera.org/learn/being-researcher/home/module/1",
      "https://www.coursera.org/learn/advanced-writing/home/module/1",
      "https://www.coursera.org/learn/introduction-to-research-for-essay-writing/home/module/1",
    ];

    const data = await scrapAllData(browser, urls);

    // export data
    exportJsonFile(data);

    console.log("final data", JSON.stringify(data));
    await browser.close();
  } catch (error) {
    console.log("Error at scrapController: " + error);
  }
};

const scrapAllData = async (browser, urls) =>
  new Promise(async (resolve, reject) => {
    try {
      let data = [];
      for (const url of urls) {
        console.log(url);
        const response = await scrappers.scrapModules(browser, url);
        console.log("response controller:", response);

        if (response) {
          data.push(...response);
        }
      }
      console.log(data);

      resolve(data);
    } catch (error) {
      console.log("Error during scraping: ", error);
      reject(error);
    }
  });

const exportJsonFile = (data) => {
  const currentDate = new Date();
  // Lấy giờ, phút, ngày, tháng, năm từ currentDate
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();

  // Tạo tên file theo định dạng hh-mm_dd_MM_YYYY.json
  const fileName = `${hours}-${minutes}_${day}-${month}-${year}.json`;

  fs.writeFile(fileName, JSON.stringify(data), (error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Write data to json file successfully !!!");
    }
  });
};

module.exports = scrapController;
