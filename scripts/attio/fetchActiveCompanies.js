// Fetch active entries from the Ecosystem list
async function fetchActiveEntries() {
  console.log("Fetching active entries from the Ecosystem list");
  const response = await fetch(
    "https://api.attio.com/v2/lists/ecosystem/entries/query",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${process.env.ATTIO_API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          status_3: "Active",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ecosystem entries: ${response.status} ${response.statusText}`
    );
  }

  const activeEntries = await response.json();

  console.log(
    `Fetched ${activeEntries.data.length} entries from ecosystem list\n`
  );

  return activeEntries.data;
}

// Extract company IDs and ecosystem data from entries
function extractEcosystemFields(entriesData) {
  return entriesData.map((item) => ({
    parent_record_id: item.parent_record_id,
    modules_guards:
      item.entry_values?.modules_guards?.map((mod) => mod.value).join(", ") ||
      "",
    safe_apps_smart: item.entry_values?.sa_application?.[0]?.value || "",
  }));
}

// Fetch company details from the companies API
async function fetchCompanyDetails(ecosystemFields) {
  const allCompaniesData = [];

  // Process IDs in chunks of 100 due to API limit
  for (let i = 0; i < ecosystemFields.length; i += 100) {
    const chunk = ecosystemFields.slice(i, i + 100);
    console.log(`Fetching companies ${i + 1} to ${i + chunk.length}`);

    const response = await fetch(
      "https://api.attio.com/v2/objects/companies/records/query",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.ATTIO_API_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            record_id: {
              $in: chunk.map((entry) => entry.parent_record_id),
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch companies (chunk ${i + 1} to ${i + chunk.length}): ${
          response.status
        } ${response.statusText}`
      );
    }

    const companiesData = await response.json();

    // Merge ecosystem data with company data
    const mergedData = companiesData.data.map((company) => {
      const ecosystemEntry = chunk.find(
        (entry) => entry.parent_record_id === company.id.record_id
      );

      const companyName = company.values?.name?.[0]?.value || "";
      return {
        ...company,
        sanitizedName: sanitizeFilename(companyName),
        modules_guards: ecosystemEntry.modules_guards,
        safe_apps_smart: ecosystemEntry.safe_apps_smart,
      };
    });

    allCompaniesData.push(...mergedData);
  }

  console.log(`Fetched details for ${allCompaniesData.length} companies`);

  return allCompaniesData;
}

// Clean filename for filesystem (same as in fetchLogos.js)
function sanitizeFilename(filename) {
  return filename.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

// Map company data to required format
function mapCompanyData(activeCompaniesData) {
  const mappedData = activeCompaniesData.map((company) => {
    const values = company.values;

    const companyName = values?.name?.[0]?.value || "";
    const sanitizedName = sanitizeFilename(companyName);
    const logoUrl = values?.logo_url?.[0]?.value || "";
    // Extract file extension from logoUrl (e.g., ".png", ".jpg")
    let logoExtension = "";
    if (logoUrl) {
      const match = logoUrl.match(/\.[a-zA-Z0-9]+$/);
      logoExtension = match ? match[0] : "";
    }
    const domain = values?.domains?.[0]?.domain || "";

    return {
      project: companyName,
      description: values?.description?.[0]?.value || "",
      project_scope: values?.project_scope?.[0]?.option?.title || "",
      primary_category: values?.primary_category?.[0]?.option?.title || "",
      secondary_categories:
        values?.secondary_categories
          ?.map((cat) => cat.option?.title)
          .join(", ") || "",
      logo_url: logoUrl,
      logo_path: companyName ? `/logos/${sanitizedName}${logoExtension}` : "",
      value_prop: values?.value_prop?.[0]?.value || "",
      project_website: domain ? `https://${domain}/` : "",
      github_dev_docs: values?.github_5?.[0]?.value || "",
      twitter: values?.twitter?.[0]?.value || "",
      primary_integration:
        values?.primary_integration
          ?.map((int) => int.option?.title)
          .join(", ") || "",
      packages:
        values?.packages?.map((pkg) => pkg.option?.title).join(", ") || "",
      modules_guards: company.modules_guards || "",
      safe_apps_smart: company.safe_apps_smart || "",
      networks:
        values?.networks?.map((net) => net.option?.title).join(", ") || "",
    };
  });

  return mappedData;
}

// Order by name, save results to file and log summary
function saveAndLogResults(mappedCompanies) {
  // Sort companies by project name
  const sortedCompanies = mappedCompanies.sort((a, b) =>
    a.project.localeCompare(b.project)
  );

  require("fs").writeFileSync(
    "data.json",
    JSON.stringify(sortedCompanies, null, 2)
  );

  console.log("\nData has been saved to 'data.json'");
  console.log(`Total companies processed: ${mappedCompanies.length}`);
}

// Main function that orchestrates the process
async function getActiveCompanies() {
  try {
    const activeEntries = await fetchActiveEntries();
    const ecosystemFields = extractEcosystemFields(activeEntries);
    const activeCompaniesData = await fetchCompanyDetails(ecosystemFields);
    const mappedCompanies = mapCompanyData(activeCompaniesData);

    saveAndLogResults(mappedCompanies);
    return activeCompaniesData; // Return the raw data for logo processing
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    process.exit(1);
  }
}

// Only allow importing
if (require.main === module) {
  getActiveCompanies();
}

module.exports = { getActiveCompanies };
