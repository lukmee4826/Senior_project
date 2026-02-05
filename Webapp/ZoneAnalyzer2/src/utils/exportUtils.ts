import * as XLSX from 'xlsx';

export const exportToXLSX = (data: any[], filename: string) => {
    // Flatten the data for Excel format
    const flatData: any[] = [];

    data.forEach((item) => {
        const batchName = item.batchName || "Unknown Batch";
        const date = item.date || "";
        const time = item.time || "";

        // Handle single image results (from ResultsView) or history details
        const plates = item.plate ? [item.plate] : (item.images || []);

        plates.forEach((plate: any, index: number) => {
            const imageIndex = index + 1;
            const bacteria = plate.strain_code || item.bacteria || "Unknown";

            (plate.results || []).forEach((result: any) => {
                flatData.push({
                    "Batch Name": batchName,
                    "Date": date,
                    "Time": time,
                    "Image #": imageIndex,
                    "Bacteria": bacteria,
                    "Antibiotic": result.antibiotic?.name || "Unknown",
                    "Code": result.antibiotic?.name ? result.antibiotic.name.substring(0, 3).toUpperCase() : "-",
                    "Concentration (µg)": result.antibiotic?.concentration_ug || "",
                    "Diameter (mm)": result.diameter_mm?.toFixed(1) || "",
                    "CLSI Interp": result.clsi_interpretation || "",
                    "EUCAST Interp": result.eucast_interpretation || ""
                });
            });
        });
    });

    if (flatData.length === 0) {
        alert("No data to export");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis Results");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};
