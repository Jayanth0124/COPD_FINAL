from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Load the PRS dataset
df = pd.read_csv("prs_data.xlsx - SNP_Effect_Sizes.csv") # Corrected from pd.read_excel("prs_data.xlsx")

@app.route("/search")
def search_gene():
    gene_name = request.args.get("gene", "").upper()
    
    if not gene_name:
        return jsonify({"error": "No gene name provided"}), 400
    
    # Filter rows where "Gene Name" matches the input
    gene_data = df[df["Gene Name"].str.upper() == gene_name]

    if gene_data.empty:
        return jsonify({"error": "Gene not found"}), 404

    return jsonify(gene_data.to_dict(orient="records"))

@app.route("/prs_distribution")
def prs_distribution():
    gene_name = request.args.get("gene", "").upper()

    if not gene_name:
        return jsonify({"error": "No gene name provided"}), 400

    # Filter data for the selected gene
    gene_data = df[df["Gene Name"].str.upper() == gene_name]

    if gene_data.empty:
        return jsonify({"Low": 0, "Medium": 0, "High": 0})  # No data for this gene

    # Compute PRS score as the sum of "Effect Size (Beta)"
    prs_score = gene_data["Effect Size (Beta)"].sum()

    # Define thresholds dynamically based on real data
    if prs_score < 0.5:
        return jsonify({"Low": prs_score, "Medium": 0, "High": 0})
    elif prs_score < 1.0:
        return jsonify({"Low": 0, "Medium": prs_score, "High": 0})
    else:
        return jsonify({"Low": 0, "Medium": 0, "High": prs_score})

if __name__ == "__main__":
    app.run(debug=True)
