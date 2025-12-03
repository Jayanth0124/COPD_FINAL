let prsChart = null;
let copdData = []; // Global variable to hold fetched data

// Function to load the data once on script initialization
async function loadData() {
    try {
        const response = await fetch("copd_data.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        copdData = await response.json();

        // NOTE: The loaded JSON data from copd_data.json is missing 
        // the "Effect Size (Beta)" field crucial for PRS calculation.
        // We'll add a dummy column so the PRS calculation logic works 
        // without a TypeError, but results are non-scientific until 
        // real effect size data is included.
        copdData = copdData.map(record => ({
            ...record,
            // Use 0.2 as a placeholder for each SNP
            "Effect Size (Beta)": record["Effect Size (Beta)"] !== undefined ? record["Effect Size (Beta)"] : 0.2
        }));
        
        console.log("Data loaded successfully.");

    } catch (error) {
        console.error("Error loading COPD data:", error);
        // Display user-friendly error message on the page
        document.getElementById("geneResult").innerHTML = "<p style='color:red;'>Error loading initial gene data (copd_data.json). Check console for details.</p>";
        document.getElementById("geneResult").style.display = "block";
    }
}

// Immediately load data when script starts
loadData();


document.addEventListener("DOMContentLoaded", function () {
    // Hide sections on page load
    document.getElementById("prsChart").style.display = "none";
    document.getElementById("noDataPlaceholder").style.display = "flex";
    document.getElementById("geneResult").style.display = "none";
});

function searchGene() {
    const geneName = document.getElementById("geneInput").value.trim().toUpperCase();
    const resultDiv = document.getElementById("geneResult");
    const chartCanvas = document.getElementById("prsChart");
    const placeholder = document.getElementById("noDataPlaceholder");

    // Reset previous state
    resultDiv.style.display = "none";
    chartCanvas.style.display = "none";
    placeholder.style.display = "flex";
    placeholder.querySelector("p").textContent = "Searching for PRS data...";

    if (!geneName) {
        resultDiv.innerHTML = "<p style='color:red;'>Please enter a gene name.</p>";
        resultDiv.style.display = "block";
        return;
    }
    
    // Check if data is loaded
    if (copdData.length === 0 || copdData[0]["Effect Size (Beta)"] === undefined) {
        resultDiv.innerHTML = "<p style='color:red;'>Data is unavailable. Please check the console for loading errors.</p>";
        resultDiv.style.display = "block";
        return;
    }

    // 1. Filter gene data
    const geneData = copdData.filter(row => row["Gene Name"].toUpperCase() === geneName);

    if (geneData.length === 0) {
        resultDiv.innerHTML = `<p style="color:red;">Gene ${geneName} not found.</p>`;
        resultDiv.style.display = "block";
        return;
    }

    // 2. Display gene data table
    let tableHTML = "<table class='gene-table'><tr>";
    // Use keys from the first entry to create headers
    Object.keys(geneData[0]).forEach(key => {
        // Exclude the added dummy column if it's identical to other header counts
        tableHTML += `<th>${key}</th>`;
    });
    tableHTML += "</tr>";

    geneData.forEach(row => {
        tableHTML += "<tr>";
        Object.values(row).forEach(value => {
            // Format floating point numbers to 4 decimal places for clean display
            const formattedValue = (typeof value === 'number' && !Number.isInteger(value)) ? value.toFixed(4) : value;
            tableHTML += `<td>${formattedValue}</td>`;
        });
        tableHTML += "</tr>";
    });

    tableHTML += "</table>";
    resultDiv.innerHTML = tableHTML;
    resultDiv.style.display = "block";

    // 3. Calculate PRS Distribution
    calculatePRSData(geneName, geneData, chartCanvas, placeholder);
}

function calculatePRSData(geneName, geneData, chartCanvas, placeholder) {
    
    // Calculate PRS score as the sum of "Effect Size (Beta)"
    const prsScore = geneData.reduce((sum, row) => sum + row["Effect Size (Beta)"], 0);

    // Replicate Python logic for thresholds
    let data = { "Low": 0, "Medium": 0, "High": 0 };
    if (prsScore < 0.5) {
        data.Low = prsScore;
    } else if (prsScore < 1.0) {
        data.Medium = prsScore;
    } else {
        data.High = prsScore;
    }

    const ctx = chartCanvas.getContext("2d");
    if (prsChart) {
        prsChart.destroy();
    }

    if (data.Low > 0 || data.Medium > 0 || data.High > 0) {
        chartCanvas.style.display = "block";
        placeholder.style.display = "none";

        prsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Low", "Medium", "High"],
                datasets: [{
                    label: `PRS Distribution for ${geneName}`,
                    // Use the dummy score, formatted to 4 decimal places
                    data: [data.Low || 0, data.Medium || 0, data.High || 0],
                    backgroundColor: ["green", "orange", "red"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total PRS Score'
                        }
                    }
                }
            }
        });
    } else {
        chartCanvas.style.display = "none";
        placeholder.style.display = "flex";
        placeholder.querySelector("p").textContent = `No PRS data available for ${geneName}`;
    }
}
