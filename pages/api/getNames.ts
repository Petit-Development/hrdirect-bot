import type { NextApiRequest, NextApiResponse } from "next";
//import chrome from "chrome-aws-lambda";
//import puppeteer from "puppeteer-core";
import puppeteer from "puppeteer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  let username = req.body.username;
  let password = req.body.password;
  res.setHeader("Content-Type", "application/json");
  var data = await getAvailableNames(username, password);
  res.status(200).send(data);
}

async function getAvailableNames(
  username: string,
  password: string
): Promise<string[]> {
  const options = {
    args: ["--no-sandbox"],
    headless: true,
  };
  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  // Disable downloading images
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "stylesheet" ||
      request.resourceType() === "font" ||
      request.resourceType() === "script"
    ) {
      request.abort();
    } else request.continue();
  });

  await page.goto("https://mytests.hrdirect.com/main/customer_logon.aspx");
  await page.type("#MainContent_customerID", username);
  await page.type("#MainContent_password", password);
  await page.click("#MainContent_B1");
  //await page.screenshot({ path: "thisPath.png" });

  await page.goto("https://mytests.hrdirect.com/main/view_results.aspx");

  //await page.waitForSelector("#MainContent_ApplicantDDL");
  const people = await page.$$("select option");
  const names = [];
  for (var i = 0; i < people.length; i++) {
    var personName = await people[i].evaluate((item) => item.innerHTML);
    names.push(personName);
  }

  return names;
}
