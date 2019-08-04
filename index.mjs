import moment from 'moment';
import converter from 'json-2-csv';
import { BASE_URL, USER_AGENT, COMPANY_DIR_MAIN_PAGE, STOCK_DATA_PAGE, BASE_URL_2, PSE_HOME, PSE_STOCK } from './lib/constants';
import { makeCookieJar, getPage, parseHtmlGetData, getJson } from './lib/util';
import companyData from './companies';

const cookieJar = makeCookieJar();
const commonHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Language': 'en-PH,en-US;q=0.9,en;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': USER_AGENT,
};

const commonHeadersPSE = {
  Accept: 'application/json',
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

const commonOpts = {
  credentials: 'include',
  referrerPolicy: 'no-referrer-when-downgrade',
  mode: 'cors',
};

const now = moment();

(async () => {
  let url;
  let referrer;
  let content;
  let step;

  const out = [];
  const outDict = {};

  try {

    // const csv = await converter.json2csvAsync(out);
    // console.log(csv);

    url = BASE_URL_2;
    await getPage(url, cookieJar, { ...commonOpts, header: commonHeaders });

    url = `${BASE_URL_2}/${PSE_HOME}`;
    referrer = BASE_URL_2;
    await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });

    const companyKeyList = Object.keys(companyData);
    companyKeyList.sort();

    for (let i = 0; i < companyKeyList.length; i++) {
      let companyKey = companyKeyList[i];
      if (companyKey === '_') continue;

      url = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
      referrer = `${BASE_URL_2}/${PSE_HOME}`;
      await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });

      url = `${BASE_URL_2}/${PSE_STOCK}?method=fetchHeaderData&ajax=true`;
      referrer = `${BASE_URL_2}/${PSE_STOCK}?id=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}&tab=0`;
      let opts = { ...commonOpts, method: 'POST', body: `company=${companyData[companyKey].cmpyId}&security=${companyData[companyKey].securityId}`, headers: { ...commonHeadersPSE, Referer: referrer } };
      content = await getJson(url, cookieJar, opts);

      outDict[companyKey] = {
        Symbol: companyKey,
        Date: content.records[0].lastTradedDate,
        'Stock Price': content.records[0].headerLastTradePrice,
        Change: content.records[0].headerChangeClose,
        'P/E Ratio': content.records[0].headerCurrentPe,
        '52-Week High': content.records[0].headerFiftyTwoWeekHigh,
        '52-Week Low': content.records[0].headerFiftyTwoWeekLow,
      };
    }

    const list = companyKeyList.map((key) => outDict[key]);
    console.log(list);
  } catch (ex) {
    console.log(`Error: `, ex);
  }
})();

