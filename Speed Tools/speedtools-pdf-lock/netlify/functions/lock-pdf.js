import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { pdfBase64, password, filename } = JSON.parse(event.body);

    if (!pdfBase64 || !password) {
      return { statusCode: 400, body: "Missing data" };
    }

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, "input.pdf");
    const outputPath = path.join(tmpDir, "output.pdf");

    fs.writeFileSync(inputPath, Buffer.from(pdfBase64, "base64"));

    await new Promise((resolve, reject) => {
      execFile(
        "qpdf",
        [
          "--encrypt",
          password,
          password,
          "256",
          "--",
          inputPath,
          outputPath
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    const lockedPdf = fs.readFileSync(outputPath).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        lockedPdf,
        outputName: filename.replace(/\.pdf$/i, "_locked.pdf")
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "PDF lock failed"
    };
  }
}