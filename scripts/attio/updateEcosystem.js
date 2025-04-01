const { getActiveCompanies } = require("./fetchActiveCompanies");
const { fetchAndSaveLogos } = require("./fetchLogos");

// Check for required environment variable
if (!process.env.ATTIO_API_TOKEN) {
  console.error("Error: ATTIO_API_TOKEN environment variable is required");
  process.exit(1);
}

async function updateEcosystem() {
  try {
    // First fetch companies data
    console.log("Fetching companies data...");
    const companiesData = await getActiveCompanies();

    // Then fetch and save logos
    console.log("\nFetching company logos...");
    await fetchAndSaveLogos(companiesData);

    console.log("\n✓ Ecosystem update completed successfully!");
  } catch (error) {
    console.error("Error updating ecosystem:", error.message);
    process.exit(1);
  }
}

updateEcosystem();
