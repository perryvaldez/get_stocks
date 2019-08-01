import { COOKIE_JAR_FILE } from './constants';
import { fetch, CookieJar } from 'node-fetch-cookies';

export const makeCookieJar = () => new CookieJar('rw', COOKIE_JAR_FILE);

export const getPage = async (url, cookieJar, opts) => {
  const res = await fetch(cookieJar, url, opts);
  const content = await res.text();
  cookieJar.save();

  return content;
};

