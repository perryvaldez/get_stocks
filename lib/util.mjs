import _ from 'lodash';
import { fetch, CookieJar } from 'node-fetch-cookies';
import { COOKIE_JAR_FILE, SLEEP_MS } from './constants';

export const makeCookieJar = () => new CookieJar('rw', COOKIE_JAR_FILE);

export const getPage = async (url, cookieJar, opts) => {
  const res = await fetch(cookieJar, url, opts);
  const content = await res.text();
  cookieJar.save();

  await sleep(SLEEP_MS);
  return content;
};

export const sleep = async (ms) => new Promise(
  resolve => { setTimeout(resolve, ms); },
);

const htmlUnescape = (html) => {
  let ret = _.unescape(html);
  return ret.replace('&nbsp;', ' ');
};

export const parseHtmlGetData = (content) => {
  const keyVals = {};
  const keyValPattern = '<th>\\s*([^<>]+)\\s*<\\/th>[^<]*<td\\s*[^>]*>\\s*([^<>]+)\\s*<\\/td>';

  let matches = content.match(new RegExp(`${keyValPattern}`, 'g'));
  if (matches) {
    for (let i = 0; i < matches.length; i += 1) {
      let singleMatch = matches[i].match(new RegExp(keyValPattern));
      if (singleMatch) {
        keyVals[htmlUnescape(singleMatch[1]).trim()] = htmlUnescape(singleMatch[2]).trim();
      }
    }
  }

  return keyVals;
};

