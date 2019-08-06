import moment from 'moment';
import _ from 'lodash';
import AbortController from 'abort-controller';
import { fetch, CookieJar } from 'node-fetch-cookies';
import {COOKIE_JAR_FILE, SLEEP_MS, TIMEOUT_MS} from './constants';

export const makeCookieJar = () => new CookieJar('rw', COOKIE_JAR_FILE);

export const makeRequest = async (url, cookieJar, opts, parseContentFunc, timeoutFunc) => {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = setTimeout(() => { controller.abort(); }, TIMEOUT_MS);
  const MAX_TRIES = 3;

  for (let i = 0; i < MAX_TRIES; i +=1) {
    try {
      const res = await fetch(cookieJar, url, { ...opts, signal });
      const content = await parseContentFunc(res);
      cookieJar.save();

      return content;
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      } else {
        console.warn(`Timeout of ${TIMEOUT_MS} exceeded, retrying...`);
        await sleep(SLEEP_MS);
        if (timeoutFunc) {
          await timeoutFunc();
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }
};

export const getPage = async (url, cookieJar, opts, timeoutFunc) =>
  makeRequest(url, cookieJar, opts, async (res) => res.text(), timeoutFunc);

export const getJson = async (url, cookieJar, opts, timeoutFunc) =>
  makeRequest(url, cookieJar, opts, async (res) => res.json(), timeoutFunc);

export const sleep = async (ms) => new Promise(
  resolve => { setTimeout(resolve, ms); },
);

export const formatDate = (str) => {
 // Expected format: 'MMMM DD, YYYY'
  const date = moment(str, 'MMMM D, YYYY');

  return date.format('MM/DD/YYYY');
};
