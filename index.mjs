import moment from 'moment';
import converter from 'json-2-csv';
import { BASE_URL, USER_AGENT, COMPANY_DIR_MAIN_PAGE, STOCK_DATA_PAGE } from './lib/constants';
import { makeCookieJar, getPage, parseHtmlGetData } from './lib/util';
import companyData from './companies';

const cookieJar = makeCookieJar();
const commonHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Language': 'en-PH,en-US;q=0.9,en;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': USER_AGENT,
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

  try {
    url = BASE_URL;
    await getPage(url, cookieJar, { ...commonOpts, header: commonHeaders });

    url = `${BASE_URL}/${COMPANY_DIR_MAIN_PAGE}`;
    referrer = BASE_URL;
    await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });

    const companyKeyList = Object.keys(companyData);
    companyKeyList.sort();

    for (let i = 0; i < companyKeyList.length; i++) {
      let companyKey = companyKeyList[i];
      if (companyKey === '_') continue;

      url = `${BASE_URL}/${STOCK_DATA_PAGE}?cmpy_id=${companyData[companyKey].cmpyId}&security_id=${companyData[companyKey].securityId}`;
      referrer = `${BASE_URL}/${COMPANY_DIR_MAIN_PAGE}`;
      content = await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });
      const keyVals = parseHtmlGetData(content);

      let stockData = {
        Symbol: companyKey,
        Date: now.format('MM/DD/YYYY'),
        'Stock Price': keyVals['Last Traded Price'],
      };

      out.push(stockData);
    }

    const csv = await converter.json2csvAsync(out);
    console.log(csv);
  } catch (ex) {
    console.log(`Error: `, ex);
  }
})();

