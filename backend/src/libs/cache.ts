import { createClient } from 'redis';
import util from "util";
import * as crypto from "crypto";


const options = {
    legacyMode: true,
    url: process.env.REDIS_URI,
}

export const client = createClient(options);

client.on('connect', () => {
    console.log("Connected to Redis");
});
client.on('error', err => {
  console.log('redis error: ' + err);
  //init();
});

client.on('ready', err => {
  console.log("redis is ready");
});

client.on('end', err => {
  console.log("redis connection is ended");
});

//reconnecting
client.on('reconnecting', err => {
  console.log("redis connection is reconnecting");
});


export const init = async () => {
  if (client.isOpen || client.isReady) {
    return;
  }
    await client.connect();
}

function encryptParams(params: any) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: any,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option !== undefined && optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }
  return set(finalKey, value);
}

export function getFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const setPromisefy = util.promisify(client.SET).bind(client);
  if (option !== undefined && optionValue !== undefined) {
    return setPromisefy(key, value, option, optionValue);
  }

  return setPromisefy(key, value);
}

export function get(key: string) {
  const getPromisefy = util.promisify(client.GET).bind(client);
  return getPromisefy(key);
}

export function getKeys(pattern: string) {
  const getKeysPromisefy = util.promisify(client.KEYS).bind(client);
  return getKeysPromisefy(pattern);
}

export function del(key: string) {
  const delPromisefy = util.promisify(client.DEL).bind(client);
  return delPromisefy(key);
}

export async function delFromPatternR(pattern: string) {
  const all = await getKeys(pattern);
  for (let item of all) {
    del(item);
  }
}

export const cacheLayer = {
  init,
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPatternR
};
