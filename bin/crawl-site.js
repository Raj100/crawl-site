import { Command } from 'commander';
import { crawl } from '../lib/crawler.js';

const program = new Command();

program
  .requiredOption('-u, --url <url>', 'Start URL')
  .option('-p, --parallel <number>', 'Parallel downloads', '5')
  .option('-d, --depth <depth>', 'Max crawl depth (number or "infinite")', '3')
  .option('-f, --filetypes <types>', 'Comma-separated extensions (default: .pdf)', '.pdf')
  .option('-H, --header <header...>', 'Custom headers (Key:Value)')
  .option('-P, --password <password>', 'PDF decryption password')
  .option('-o, --output <path>', 'Output directory', '.')
  .option('-e, --errors <file>', 'Error log file', 'errors.txt')
  .option('--dynamic', 'Use Puppeteer to render JS-based pages')
  .parse(process.argv);

crawl(program.opts());
