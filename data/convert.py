import pandas as pd


# Load the summary data from the correct subfolder and select only the required columns
df_sum = pd.read_csv("data/uidai_cluster_summary.csv")
df_sum = df_sum[["cluster", "cluster_label", "cluster_signature"]]
df_sum.columns = ["Cluster", "Label", "Operational Signature"]

# Export to LaTeX in the correct subfolder
with open("data/table_cluster_summary.tex", "w") as f:
    f.write(df_sum.to_latex(index=False, 
                           escape=True, 
                           bold_rows=True,
                           column_format='l l p{8cm}')) # 'p{8cm}' allows text wrapping

print("✅ Table 5 exported to data/table_cluster_summary.tex")
import pandas as pd

# Load the cluster profile data from the correct subfolder
df_profile = pd.read_csv("data/uidai_cluster_profile.csv")

# Rename columns to be human-readable (and LaTeX safe)
df_profile.columns = [
    "Cluster", "Log Enrol", "Youth %", 
    "Update Load", "Biometric Stress", "Coverage Gap"
]

# Export to .tex in the correct subfolder
df_profile.to_latex("data/table_cluster_profile.tex", 
                    index=False, 
                    float_format="%.2f",
                    escape=False,  # Set escape=False to allow underscores in LaTeX
                    column_format='c c c c c c')

print("✅ Table 4 exported to data/table_cluster_profile.tex")
import pandas as pd


# Read the CSV from the correct subfolder and select only the required columns
df = pd.read_csv("data/uidai_clustering_model_comparison.csv")
df = df[["method", "k", "silhouette", "davies_bouldin"]]
df.columns = ["Model", "Method", "Silhouette", "Davies--Bouldin"]

# Export directly to a LaTeX file
df.to_latex("data/table_model_comparison.tex", 
             index=False, 
             float_format="%.3f",
             escape=False) # Set escape=False to allow underscores in LaTeX