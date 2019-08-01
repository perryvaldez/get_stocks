import { BASE_URL, USER_AGENT, COMPANY_DIR_MAIN_PAGE, STOCK_DATA_PAGE } from './lib/constants';
import { makeCookieJar, getPage } from './lib/util';
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
  // let url = `${BASE_URL}/${COMPANY_DIR_MAIN_PAGE}`;
  // let referrer = BASE_URL;

  let url = `${BASE_URL}/${STOCK_DATA_PAGE}?cmpy_id=${companyData.AGI.cmpyId}&security_id=${companyData.AGI.securityId}`;
  let referrer = COMPANY_DIR_MAIN_PAGE;

  try {
    const content = await getPage(url, cookieJar, { ...commonOpts, header: { ...{ commonHeaders }, Referer: referrer } });
    console.log(content);
  } catch (ex) {
    console.log('Error: ', ex);
  }
})();

