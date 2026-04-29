const express = require("express");
const path = require("path");
const axios = require("axios");
const fs = require("fs");

const { log } = require("console");

const app = express();

const ID = 'AKfycbwIia-YTUvWLVHiLosEq2w8caXc5Qayrn49mVa6QyO4Y80b9nQRFiSCLMlaDEyayqdUPw';
const SHEET_API = `https://script.google.com/macros/s/${ID}/exec`;

// ensure images folder exists
const IMG_DIR = path.join(__dirname, "..", "images");
console.log("IMG_DIR:", IMG_DIR);
if (!fs.existsSync(IMG_DIR)) {
  console.log("Creating images folder:", IMG_DIR);
  fs.mkdirSync(IMG_DIR);
}
// create fallback image if missing
const FALLBACK_IMG = path.join(IMG_DIR, "fallback.png");
console.log("FALLBACK_IMG:", FALLBACK_IMG);
if (!fs.existsSync(FALLBACK_IMG)) {
  console.warn("Fallback image not found:", FALLBACK_IMG);
  // create a simple placeholder if missing
  fs.writeFileSync(FALLBACK_IMG, Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==",
    "base64"
  ));
  console.log("Created fallback image:", FALLBACK_IMG);
}

// enable CORS
app.use(require("cors")());

// cache (important for performance)
let cache = {
  data: [],
  lastFetch: 0
};

const CACHE_TIME = 60 * 1000; // 1 min

// fetch from Google Sheets
async function fetchData() {
  const now = Date.now();

  if (now - cache.lastFetch < CACHE_TIME) {
    return cache.data;
  }

  const res = await axios.get(SHEET_API);
  cache.data = res.data;
  cache.lastFetch = now;

  return cache.data;
}

function getFileName(url) {
  try {
    // remove query params
    url = url.split("?")[0];

    // extract last meaningful part
    var parts = url.split("/").filter(Boolean);

    if (parts.length >= 2) {
      var size = parts[parts.length - 2];   // 300x200
      var format = parts[parts.length - 1]; // png

      // handle case like /300x200/png
      if (!format.includes(".")) {
        return size + "." + format;
      }

      // handle case like /image.png
      return format;
    }

    // fallback
    return "img_" + Date.now() + ".jpg";

  } catch (e) {
    return "img_" + Date.now() + ".jpg";
  }
}

// download + cache
async function downloadImage(url) {
  try {

    console.log("Downloading:", url);

    if (!url) {
      return FALLBACK_IMG;
    }

    const fileName = getFileName(url);
    const filePath = path.join(IMG_DIR, fileName);

    // ✅ cache hit
    if (fs.existsSync(filePath)) {
      return filePath;
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*"
      },
      maxRedirects: 5
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve) => {
      writer.on("finish", () => resolve(filePath));

      writer.on("error", (err) => {
        console.error("Write failed:", err.message);
        resolve(FALLBACK_IMG);
      });
    });

  } catch (err) {
    console.error("Download failed:", url, err.message);
    return FALLBACK_IMG;
  }
}

// main API
app.get("/data", async (req, res) => {
  try {
    let data = await fetchData(); // your existing sheet fetch

    // download images in parallel
    const updated = await Promise.all(
      data.map(async (item) => {

        if (item.image) {
          const localPath = await downloadImage(item.image);

          item.image = localPath; // replace URL with local path
        }

        return item;
      })
    );

    res.json({
      success: true,
      count: updated.length,
      data: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// health check (for InDesign ping)
app.get("/ping", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

