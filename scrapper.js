const scrapModules = (browser, url) =>
  new Promise(async (resolve, reject) => {
    let page;
    try {
      console.log(">>>> scrapModules");

      page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      // chờ lấy thẻ div list modules
      await page.waitForSelector(".css-y3t86r", { timeout: 5000 });
      console.log("Get list modules");

      const listModules = await page.$$(".css-y3t86r > li");
      if (!listModules || listModules.length === 0) {
        throw new Error("No modules found with the selector .css-y3t86r > li");
      }

      let data = [];
      for (let i = 0; i < listModules.length; i++) {
        const currentUrl = await page.url();
        const parts = currentUrl.split("/");
        parts[parts.length - 1] = i + 1;
        const url = parts.join("/");
        const response = await scrapMainCourse(browser, url);
        console.log("response", response);

        if (response) {
          data.push(...response);
        }
      }
      resolve(data);
      console.log("Done");
    } catch (error) {
      console.log("Error at scrapCourse: " + error);
      reject(error);
    } finally {
      if (page) {
        await page.close();
      }
      console.log("close scrapModules");
    }
  });

const scrapMainCourse = (browser, url) =>
  new Promise(async (resolve, reject) => {
    let page;
    try {
      console.log(">>>> scrapMainCourse");
      console.log("module", url);

      page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".rc-NamedItemListRefresh", {
        timeout: 10000,
      });

      // trường hợp data-test=WeekSingleItemDisplay-exam
      let listLessons = [];

      // Truy vấn các phần tử với data-test='WeekSingleItemDisplay-exam'
      let lessonsExam = await page.$$(
        ".rc-NamedItemListRefresh > ul > li > div[data-test='WeekSingleItemDisplay-exam']"
      );
      lessonsExam && listLessons.push(...lessonsExam);

      // Truy vấn các phần tử với data-test='WeekSingleItemDisplay-staffGraded'
      let lessonsStaffGraded = await page.$$(
        ".rc-NamedItemListRefresh > ul > li > div[data-test='WeekSingleItemDisplay-staffGraded']"
      );
      lessonsStaffGraded && listLessons.push(...lessonsStaffGraded);

      // Truy vấn các phần tử với data-test='WeekSingleItemDisplay-ungradedAssignment'
      let lessonsUngradedAssignment = await page.$$(
        ".rc-NamedItemListRefresh > ul > li > div[data-test='WeekSingleItemDisplay-ungradedAssignment']"
      );
      lessonsUngradedAssignment &&
        listLessons.push(...lessonsUngradedAssignment);

      console.log("Get list quiz lessons", listLessons.length);
      let data = [];

      if (listLessons.length > 0) {
        for (const lesson of listLessons) {
          const link = await lesson.$("a");

          if (link) {
            try {
              const newUrl = await link.evaluate((el) => el.href);
              console.log("newUrl", newUrl);

              // Thực hiện scrap quiz với URL mới
              const response = await scrapQuiz(browser, newUrl);
              console.log("response scrapQuiz", response);

              response && data.push(response);
            } catch (error) {
              console.log("Lỗi khi nhấp chuột hoặc tải trang:", error);
            }
          } else {
            console.log("Link not found!");
          }
        }
      } else {
        console.log("No lessons found in list!");
      }

      console.log("Get question and answer");
      resolve(data);
    } catch (error) {
      console.log("Error at scrapMainCourse: " + error);
      reject(error);
    } finally {
      console.log("close scrapMainCourse");

      if (page) {
        await page.close();
      }
    }
  });

const scrapQuiz = (browser, url) =>
  new Promise(async (resolve, reject) => {
    let page;
    try {
      console.log(">>>> scrapQuiz");

      page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#main-container");
      console.log("Go to webpage of quiz");

      const data = await page.$eval(
        ".rc-ItemNavBreadcrumbs > nav > ol > li:nth-child(2)",
        (el) => {
          return {
            title: el.querySelector("a").innerText,
          };
        }
      );
      console.log("Get title", data.title);

      // click button
      try {
        // Đợi cho nút xuất hiện trên trang đầu tiên
        await page.waitForSelector(
          'button[data-testid="feedback-button"], button[data-testid="view-feedback-button"]',
          { timeout: 20000 }
        );
        console.log("Button found!");
        // get url
        const currentUrl = await page.url();
        console.log("Current URL:", currentUrl);
        // set link data
        data.link = currentUrl + "/attempt";

        // Bấm vào nút, có 2 nut trên dom random
        const feedbackButton = await page.$(
          'button[data-testid="feedback-button"]'
        );
        const viewFeedbackButton = await page.$(
          'button[data-testid="view-feedback-button"]'
        );

        if (!feedbackButton && !viewFeedbackButton) {
          console.log("No buttons found!");
        } else {
          try {
            if (feedbackButton) {
              await feedbackButton.click();
              console.log("Feedback button clicked!");
            } else if (viewFeedbackButton) {
              await viewFeedbackButton.click();
              console.log("View feedback button clicked!");
            }

            await page.waitForNavigation({
              waitUntil: "domcontentloaded",
              timeout: 60000,
            });
          } catch (error) {
            console.error(
              "Error clicking button or waiting for navigation:",
              error
            );
          }
        }

        // get feedbackUrl
        try {
          const feedbackUrl = await page.url();
          // get answer
          const answerList = await scrapperQuestionAnswer(browser, feedbackUrl);
          data.questionList = answerList;
        } catch (error) {
          console.error("Error getting feedback URL:", error);
        }
      } catch (error) {
        console.error("Error clicking the button:", error);
      }

      // console.log("scrapQuiz data", data);

      resolve(data);
    } catch (error) {
      console.log("loi o scrapper category" + error);
      reject(error);
    } finally {
      if (page) {
        await page.close();
      }
      console.log("close scrapQuiz");
    }
  });

const scrapperQuestionAnswer = (browser, url) =>
  new Promise(async (resolve, reject) => {
    let page;
    try {
      console.log(">>>> scrapperQuestionAnswer", url);

      page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      // Điều kiện kiểm tra cả hai lớp CSS coursera có thể có 2class chồng chồng như va
      await page.waitForSelector(".css-dqaucz, .rc-FormPartsQuestion", {
        timeout: 10000,
      });

      console.log("Page loaded and navigation completed!");

      // cào question và answer
      const questionList = await page.$$eval(
        ".css-dqaucz > div, .rc-FormPartsQuestion",
        (els) => {
          return els.map((el, index) => {
            const temp = Array.from(
              el.querySelectorAll(".cui-isChecked > input")
            );

            const answer = temp.map(
              (input) => input.getAttribute("value") || "N/A"
            );
            console.log("answer", answer);

            return {
              id: index,
              question: el.getAttribute("aria-labelledby") || "N/A",
              answer,
            };
          });
        }
      );

      resolve(questionList);
    } catch (error) {
      console.log("loi o scrapper question" + error);
      reject(error);
    } finally {
      console.log("close scrapperQuestionAnswer");
      if (page) {
        await page.close();
      }
    }
  });

module.exports = {
  scrapModules,
  scrapMainCourse,
  scrapQuiz,
  scrapperQuestionAnswer,
};
