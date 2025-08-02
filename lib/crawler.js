import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { downloadFile, downloadAndDecryptPDF } from './downloader.js';

const TIMEOUT = 10000;
const MAX_RETRIES = 3;

function logError(msg, errorFile) {
  fs.appendFileSync(errorFile, msg + '\n');
  console.error(msg);
}

async function fetchHTML(url, headers, dynamic = false) {
  if (!dynamic) {
    const res = await axios.get(url, { headers, timeout: TIMEOUT });
    return res.data;
  }
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders(headers);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT });
  const content = await page.content();
  await browser.close();
  return content;
}

export async function crawl(options) {
  const {
    url: START_URL,
    parallel,
    depth,
    filetypes,
    header,
    password,
    output,
    errors,
    dynamic
  } = options;

  const DEPTH = depth === 'infinite' ? Infinity : parseInt(depth, 10);
  const PARALLEL = parseInt(parallel, 10);
  const FILE_TYPES = filetypes.split(',').map(ext => ext.trim());
  const BASE_DOMAIN = new URL(START_URL).hostname;

  let headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; CrawlSite/1.0)',
    'Accept': '*/*'
  };
  if (header) {
    header.forEach(h => {
      const [k, ...v] = h.split(':');
      headers[k.trim()] = v.join(':').trim();
    });
  }

  const visitedFile = path.join(output, 'visited.json');
  let visited = new Set();
  if (fs.existsSync(visitedFile)) {
    visited = new Set(JSON.parse(fs.readFileSync(visitedFile)));
  }
  fs.writeFileSync(path.join(output, errors), '');

  const queue = [{ url: START_URL, depth: 0 }];

  while (queue.length > 0) {
    const batch = queue.splice(0, PARALLEL);
    await Promise.all(batch.map(async ({ url, depth }) => {
      if (visited.has(url) || depth > DEPTH) return;
      visited.add(url);
      fs.writeFileSync(visitedFile, JSON.stringify([...visited]));

      console.log(`Visiting: ${url} (depth ${depth})`);
      let html;
      try {
        html = await fetchHTML(url, headers, dynamic);
      } catch (e) {
        logError(`Failed to fetch ${url}: ${e.message}`, path.join(output, errors));
        return;
      }

      const $ = cheerio.load(html);
      const links = $('a').map((_, el) => $(el).attr('href')).get().filter(Boolean);

      for (let link of links) {
        const fullUrl = new URL(link, url).href;
        if (!fullUrl.includes(BASE_DOMAIN)) continue;

        const matchedType = FILE_TYPES.find(ext => fullUrl.toLowerCase().includes(ext.toLowerCase()));
        if (matchedType) {
          const filePath = path.join(output, new URL(fullUrl).pathname.replace(/^\/+/, ''));
          if (matchedType.toLowerCase() === '.pdf' && password) {
            await downloadAndDecryptPDF(fullUrl, filePath, password, headers, errors, output);
          } else {
            await downloadFile(fullUrl, filePath, headers, errors, output);
          }
        } else if (!visited.has(fullUrl)) {
          queue.push({ url: fullUrl, depth: depth + 1 });
        }
      }
    }));
  }

  console.log('Crawl finished. Check error log for failures.');
}
