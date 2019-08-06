import _ from 'lodash';
import AbortController from 'abort-controller';
import { fetch, CookieJar } from 'node-fetch-cookies';
import {COOKIE_JAR_FILE, SLEEP_MS, TIMEOUT_MS} from './constants';

export const makeCookieJar = () => new CookieJar('rw', COOKIE_JAR_FILE);

export const makeRequest = async (url, cookieJar, opts, parseContentFunc) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, SLEEP_MS);
  const MAX_TRIES = 3;

  for (let i = 0; i < MAX_TRIES; i +=1) {
    try {
      const res = await fetch(cookieJar, url, opts);
      const content = await parseContentFunc(res);
      cookieJar.save();

      return content;
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      } else {
        console.warn(`Timeout of ${TIMEOUT_MS} exceeded, retrying...`);
        await sleep(SLEEP_MS);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
};

export const getPage = async (url, cookieJar, opts) =>
  makeRequest(url, cookieJar, opts, async (res) => res.text());

export const getJson = async (url, cookieJar, opts) =>
  makeRequest(url, cookieJar, opts, async (res) => res.json());

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

