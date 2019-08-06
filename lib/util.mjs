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

  let content = null;

  for (let i = 0; i < MAX_TRIES; i +=1) {
    try {
      const res = await fetch(cookieJar, url, { ...opts, signal });
      content = await parseContentFunc(res);
      cookieJar.save();

      return content;
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      } else {
        if (i < MAX_TRIES - 1) {
          console.warn(`Timeout of ${TIMEOUT_MS} exceeded, retrying...`);
          await sleep(SLEEP_MS);
        } else {
          console.warn(`Timeout of ${TIMEOUT_MS} exceeded.`);
          if (timeoutFunc) {
            await timeoutFunc();
          }
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

export const zero = (numStr) => {
  const num = parseFloat(numStr);

  return (-0.001 <= num) && (num <= 0.001);
};

export const enq = (queue, item) => { queue.push(item) };

export const deq = (queue) => queue.shift();

