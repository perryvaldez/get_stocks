import converter from 'json-2-csv';
import { USER_AGENT, BASE_URL_2, PSE_HOME, PSE_STOCK } from './lib/constants';
import { makeCookieJar, getPage, getJson } from './lib/util';
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

(async () => {
  let url;
  let referrer;
  let content;
  let headers;
  let opts;

  const outDict = {};

  try {

    url = BASE_URL_2;
    headers = commonHeadersPSE;
    opts = { ...commonOpts, headers };
    await getPage(url, cookieJar, opts);

    url = `${BASE_URL_2}/${PSE_HOME}`;
    referrer = BASE_URL_2;
    headers = { ...commonHeadersPSE, Referer: referrer };
    opts =  { ...commonOpts, headers };
    await getPage(url, cookieJar, opts);

    const companyKeyList = Object.keys(companyData);
    companyKeyList.sort();

    for (let i = 0; i < companyKeyList.length; i++) {
      let companyKey = companyKeyList[i];
      if (companyKey === '_') continue;

      try {
        console.warn('Processing: ', companyKey);
        url = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
        referrer = `${BASE_URL_2}/${PSE_HOME}`;
        headers = { ...commonHeadersPSE, Referer: referrer };
        opts = { ...commonOpts, headers };
        await getPage(url, cookieJar, opts);

        url = `${BASE_URL_2}/${PSE_STOCK}?method=fetchHeaderData&ajax=true`;
        referrer = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
        headers = { ...commonHeadersPSE, Referer: referrer };
        opts = { ...commonOpts, method: 'POST', body: `company=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}`, headers };
        content = await getJson(url, cookieJar, opts);

        if (!content.records[0].lastTradedDate) {
          console.warn(`No record for "${companyKey}": `, content);
        } else {
          outDict[companyKey] = {
            Symbol: companyKey,
            Date: content.records[0].lastTradedDate.substr(0, 10),
            'Stock Price': content.records[0].headerLastTradePrice,
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

