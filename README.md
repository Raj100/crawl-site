# Site Crawler
Let site-crawl,crawl. So you don't have to!

###Installation
```
npm install -g crawl-site
```

### Usage 
'-u, --url <url>' -> Start URL
'-p, --parallel <number>' -> No. of Parallel downloads (default: 5)
'-d, --depth <depth>', -> Max crawl depth (number or "infinite") (default: 3)
'-f, --filetypes <types>' ->  Comma-separated extensions (default: .pdf)
'-H, --header <header...>' -> Custom headers (Key:Value)
'-P, --password <password>' -> PDF decryption password
'-o, --output <path>' -> Output directory
'-e, --errors <file>' -> Error log file (default: errors.txt)
'--dynamic' -> Use Puppeteer to render JS-based pages

###Example usage 
```
crawl-site -u "https://example.com/start" -f .pdf,.docx -d infinite -p 10 --dynamic
```

- with custom headers
```
crawl-site -u "https://example.com/private" -H "Authorization:Bearer YOUR_TOKEN" -H "Accept-Language:en-US"
```




