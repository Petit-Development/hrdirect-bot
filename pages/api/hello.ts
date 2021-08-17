import type { NextApiRequest, NextApiResponse } from "next";
import excel from "exceljs";
//import chrome from "chrome-aws-lambda";
//import puppeteer from "puppeteer-core";
import puppeteer from "puppeteer";
import {server} from "../../config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let username = req.body.username;
  let password = req.body.password;
  let person = req.body.person;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("content-disposition", "filename=thing.xlsx");
  var data = await queryHrDirect(person, username, password, res);
  res.end(data);
}

async function queryHrDirect(
  name: string,
  userName: string,
  password: string,
  res: NextApiResponse
) {
  const options = {
    args: ["--no-sandbox"],
    headless: true,
  };

  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  await page.goto("https://mytests.hrdirect.com/main/customer_logon.aspx");
  await page.type("#MainContent_customerID", userName);
  await page.type("#MainContent_password", password);
  await page.click("#MainContent_B1");
  //await page.screenshot({ path: "thisPath.png" });

  await page.goto("https://mytests.hrdirect.com/main/view_results.aspx");

  //await page.waitForSelector("#MainContent_ApplicantDDL");
  const people = await page.$$("select option");

  let selectedPerson: string | null = null;
  for (var i = 0; i < people.length; i++) {
    let currName = await people[i].evaluate((i) => i.innerHTML);
    if (currName === name) {
      selectedPerson = await people[i].evaluate((i) => i.getAttribute("value"));
      break;
    }
  }

  if (selectedPerson == null) return;

  await page.select("#MainContent_ApplicantDDL", selectedPerson);
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.waitForSelector("#MainContent_ShowForApplicantBtn");
  await page.click("#MainContent_ShowForApplicantBtn");

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#MainContent_ListGridView");

  var allRows = await page.$$("#MainContent_ListGridView tr");
  if (allRows == null) return;

  var aptv2 = allRows[2];
  var rowData = await aptv2.$$("td");

  var sessionIdData = rowData[6];
  var sessionId = await sessionIdData.evaluate((item) => item.innerHTML);

  await page.goto(
    `https://mytests.hrdirect.com/main/test_scores.aspx?TestSession=${sessionId}`
  );

  await page.waitForSelector("#MainContent_DisplayScoresTable");

  await page.goto("https://mytests.hrdirect.com/main/candidate_responses.aspx");
  await page.waitForSelector("#MainContent_DisplayScoresTable");

  var responses = await page.waitForSelector("#MainContent_DisplayScoresTable");
  var rows = await responses!.$$("table tbody tr");

  // The first element is all the text for some reason
  rows.shift();

  var workbook = new excel.Workbook();
  var fileRes = await fetch(`${server}/cdat.xlsx`);
  await workbook.xlsx.load(await fileRes.arrayBuffer());
  var dataSheet = workbook.worksheets.find((sheet) => sheet.name === "Data");

  for (var i = 0; i < rows.length; i += 3) {
    var questionNumber = await rows[i].$eval(
      "td:nth-child(1)",
      (item) => item.textContent
    );
    var questionText = await rows[i].$eval(
      "td:nth-child(2)",
      (item) => item.textContent
    );
    var questionAnswer = await rows[i + 1].$eval(
      "td:nth-child(2)",
      (item) => item.textContent
    );
    dataSheet!.insertRow(i + 1, [questionNumber, questionText]);
    dataSheet!.insertRow(i + 2, ["Candidate Response:", questionAnswer]);
  }

  workbook.xlsx.write(res);
  await browser.close();

  return await workbook.xlsx.writeBuffer();
}
