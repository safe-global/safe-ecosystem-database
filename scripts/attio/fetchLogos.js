const fs = require("fs");
const path = require("path");

// Create logos directory if it doesn't exist
const LOGOS_DIR = "./logos";
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR);
}

// MIME type to file extension mapping
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

// Download image from URL
async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  const extension = MIME_TO_EXT[contentType] || ".png";

  // Update filepath with correct extension if needed
  const finalFilepath = filepath.endsWith(extension)
    ? filepath
    : filepath.replace(/\.[^/.]+$/, "") + extension;

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(finalFilepath, Buffer.from(buffer));
  return finalFilepath;
}

async function fetchAndSaveLogos(companiesData) {
  try {
    console.log(`Processing ${companiesData.length} companies for logos...`);

    for (const company of companiesData) {
      const companyName = company.values?.name?.[0]?.value;
      const logoUrl = company.values?.logo_url?.[0]?.value;

      if (companyName && logoUrl) {
        const filepath = path.join(LOGOS_DIR, company.sanitizedName);

        try {
          await downloadImage(logoUrl, filepath);
        } catch (error) {
          console.error(
            `× Failed to download logo for ${companyName}:`,
            error.message
          );
        }
      }
    }

    console.log("\nLogo download process completed!");
  } catch (error) {
    console.error("Error processing logos:", error.message);
    process.exit(1);
  }
}

// Allow both direct execution and importing
if (require.main === module) {
  console.error(
    "This script should be called with company data from updateEcosystem.js"
  );
  process.exit(1);
}

module.exports = { fetchAndSaveLogos };
