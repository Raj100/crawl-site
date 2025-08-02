import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function downloadFile(url, filePath, headers, errorFile, output) {
  if (fs.existsSync(filePath)) {
    console.log(`Already downloaded: ${filePath}`);
    return;
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const response = await axios.get(url, { responseType: 'arraybuffer', headers });
    fs.writeFileSync(filePath, response.data);
    console.log(`Downloaded: ${filePath}`);
  } catch (e) {
    fs.appendFileSync(path.join(output, errorFile), `Failed download ${url}: ${e.message}\n`);
  }
}

export async function downloadAndDecryptPDF(url, filePath, password, headers, errorFile, output) {
  if (fs.existsSync(filePath)) {
    console.log(`Already downloaded: ${filePath}`);
    return;
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const response = await axios.get(url, { responseType: 'arraybuffer', headers });
    const encPath = filePath.replace(/\.pdf$/, '_enc.pdf');
    fs.writeFileSync(encPath, response.data);

    await new Promise((resolve, reject) => {
      exec(`qpdf --password='${password}' --decrypt "${encPath}" "${filePath}"`, (err) =>
        err ? reject(err) : resolve()
      );
    });

    fs.unlinkSync(encPath);
    console.log(`Downloaded & Decrypted: ${filePath}`);
  } catch (e) {
    fs.appendFileSync(path.join(output, errorFile), `Failed PDF ${url}: ${e.message}\n`);
  }
}
