// Generate a QR PNG for the audience to scan.
// Usage: node scripts/make-qr.mjs <url> [outfile]
// Example: node scripts/make-qr.mjs https://demo.example.com web-qr.png
import QRCode from "qrcode";

const url = process.argv[2];
const out = process.argv[3] || "web-qr.png";

if (!url) {
  console.error("Usage: node scripts/make-qr.mjs <url> [outfile]");
  process.exit(1);
}

await QRCode.toFile(out, url, {
  width: 1024,
  margin: 2,
  errorCorrectionLevel: "M",
});

console.log("wrote " + out + " for " + url);
