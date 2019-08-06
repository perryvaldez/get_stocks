import converter from 'json-2-csv';
import { USER_AGENT, BASE_URL_2, PSE_HOME, PSE_STOCK } from './lib/constants';
import { makeCookieJar, getPage, getJson, formatDate, zero, enq, deq } from './lib/util';
import companyData from './companies';

const cookieJar = makeCookieJar();

const commonHeadersPSE = {
  Accept: 'application/json',
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Cache-Control': 'no-cache',
  'Origin': 'https://www.pse.com.ph',
  'Pragma': 'no-cache',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

const commonOpts = {
  credentials: 'include',
  referrerPolicy: 'no-referrer-when-downgrade',
  mode: 'cors',
};

const getHomePage = async () => {
  let url;
  let referrer;
  let headers;
  let opts;
  let content;

  url = BASE_URL_2;
  headers = commonHeadersPSE;
  opts = { ...commonOpts, headers };
  content = await getPage(url, cookieJar, opts);
  if (!content) return null;

  url = `${BASE_URL_2}/${PSE_HOME}`;
  referrer = BASE_URL_2;
  headers = { ...commonHeadersPSE, Referer: referrer };
  opts =  { ...commonOpts, headers };
  content = await getPage(url, cookieJar, opts);
  if (!content) return null;

  return content;
};

(async () => {
  let url;
  let referrer;
  let content;
  let headers;
  let opts;
  let asOfDate;

  const queue = [];
  const outDict = {};

  try {
    console.warn('Starting...');
    content = await getHomePage();
    if (!content) return;

    console.warn('Getting company data...');
    const companyKeyList = Object.keys(companyData);
    companyKeyList.sort();

    for (let i = 0; i < companyKeyList.length; i++) {
      enq(queue, companyKeyList[i]);
    }

    while (queue.length > 0) {
      let companyKey = deq(queue);
      if (companyKey === '_') continue;

      try {
        console.warn('Processing: ', companyKey);
        url = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
        referrer = `${BASE_URL_2}/${PSE_HOME}`;
        headers = { ...commonHeadersPSE, Referer: referrer };
        opts = { ...commonOpts, headers };
        content = await getPage(url, cookieJar, opts, async () => {
          console.warn('Trying later.');
          enq(queue, companyKey);
        });

        if (!content) continue;

        asOfDate = '';
        const match = content.match(/<div id="comTopInfo">\s*As of ([a-zA-Z]+\s+[0-9]+\s*,\s*[0-9]+)/);
        if (match) {
          asOfDate = match[1];
        }

        url = `${BASE_URL_2}/${PSE_STOCK}?method=fetchHeaderData&ajax=true`;
        referrer = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
        headers = { ...commonHeadersPSE, Referer: referrer };
        opts = { ...commonOpts, method: 'POST', body: `company=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}`, headers };
        content = await getJson(url, cookieJar, opts, async () => {
          console.warn('Trying later.');
          enq(queue, companyKey);
        });

        if (!content) continue;

        if (!content.records || !content.records[0].lastTradedDate) {
          console.warn(`Unable to fetch the record for "${companyKey}": `, content);
        } else {
          outDict[companyKey] = {
            Symbol: companyKey,
            Date: formatDate(asOfDate),
            'Stock Price': !zero(content.records[0].headerLastTradePrice) ? content.records[0].headerLastTradePrice : content.records[0].headerSqPrevious,
            Change: content.records[0].headerChangeClose,
            'P/E Ratio': content.records[0].headerCurrentPe,
            '52-Week High': content.records[0].headerFiftyTwoWeekHigh,
            '52-Week Low': content.records[0].headerFiftyTwoWeekLow,
          };
        }
      } catch (itemEx) {
        console.error(`Error while fetching ${companyKey}: `, itemEx);
      }
    }

    const list = companyKeyList.map((key) => outDict[key]);
    const csv = await converter.json2csvAsync(list);
    console.log(csv);

    // console.log(list);
  } catch (ex) {
    console.error(`Error: `, ex);
  }
})();

