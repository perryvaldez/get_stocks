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


(async () => {
  let url;
  let referrer;
  let content;
  let step;
  let matches;

  try {
    step = 1;
    url = BASE_URL;
    await getPage(url, cookieJar, { ...commonOpts, header: commonHeaders });

    step = 2;
    url = `${BASE_URL}/${COMPANY_DIR_MAIN_PAGE}`;
    referrer = BASE_URL;
    await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });

    step = 3;
    url = `${BASE_URL}/${STOCK_DATA_PAGE}?cmpy_id=${companyData.AC.cmpyId}&security_id=${companyData.AC.securityId}`;
    referrer = `${BASE_URL}/${COMPANY_DIR_MAIN_PAGE}`;
    content = await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });
    const keyVals = parseHtmlGetData(content);
    console.log(keyVals);
    console.log('');
  } catch (ex) {
    console.log(`Error in step ${step}: `, ex);
  }
})();

