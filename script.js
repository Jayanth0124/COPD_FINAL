let prsChart = null;

document.addEventListener("DOMContentLoaded", function () {
    // Hide both sections on page load
    document.getElementById("prsChart").style.display = "none";
    document.getElementById("noDataPlaceholder").style.display = "flex";
    document.getElementById("geneResult").style.display = "none";
});

function searchGene() {
    const geneName = document.getElementById("geneInput").value.trim();
    const resultDiv = document.getElementById("geneResult");
    const chartCanvas = document.getElementById("prsChart");
    const placeholder = document.getElementById("noDataPlaceholder");

    // Reset previous state
    resultDiv.style.display = "none";
    chartCanvas.style.display = "none";
    placeholder.style.display = "flex";
    placeholder.querySelector("p").textContent = "Searching for PRS data...";

    if (!geneName) {
        resultDiv.innerHTML = "<p style='color: yellow;'>Please enter a gene name.</p>";
        resultDiv.style.display = "block";
        return;
    }

    // Show loading state
    resultDiv.innerHTML = "<p>Loading gene data...</p>";
    resultDiv.style.display = "block";

    fetch(`http://127.0.0.1:5000/search?gene=${geneName}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
                return;
            }

            let tableHTML = "<table class='gene-table'><tr>";
            Object.keys(data[0]).forEach(key => {
                tableHTML += `<th>${key}</th>`;
            });
            tableHTML += "</tr>";

            data.forEach(row => {
                tableHTML += "<tr>";
                Object.values(row).forEach(value => {
                    tableHTML += `<td>${value}</td>`;
                });
                tableHTML += "</tr>";
            });

            tableHTML += "</table>";
            resultDiv.innerHTML = tableHTML;
            resultDiv.style.display = "block";

            fetchPRSData(geneName);
        })
        .catch(error => {
            console.error("Error fetching gene data:", error);
            resultDiv.innerHTML = "<p style='color:red;'>Error fetching gene data.</p>";
        });
}

function fetchPRSData(geneName) {
    const placeholder = document.getElementById("noDataPlaceholder");
    const chartCanvas = document.getElementById("prsChart");

    fetch(`http://127.0.0.1:5000/prs_distribution?gene=${geneName}`)
        .then(response => response.json())
        .then(data => {
            const ctx = chartCanvas.getContext("2d");
            if (prsChart) {
                prsChart.destroy();
            }

            if (data && (data.Low || data.Medium || data.High)) {
                chartCanvas.style.display = "block";
                placeholder.style.display = "none";

                prsChart = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: ["Low", "Medium", "High"],
                        datasets: [{
                            label: `PRS Distribution for ${geneName}`,
                            data: [data.Low || 0, data.Medium || 0, data.High || 0],
                            backgroundColor: ["green", "orange", "red"]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            } else {
                chartCanvas.style.display = "none";
                placeholder.style.display = "flex";
                placeholder.querySelector("p").textContent = `No PRS data available for ${geneName}`;
            }
        })
        .catch(error => {
            console.error("Error fetching PRS data:", error);
            chartCanvas.style.display = "none";
            placeholder.style.display = "flex";
            placeholder.querySelector("p").textContent = "Error loading PRS data.";
        });
}

