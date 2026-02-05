import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToXLSX = async (data: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analysis Results');

    // Set column widths
    worksheet.columns = [
        { width: 20 }, // A: Label
        { width: 30 }, // B: Value/Data
        { width: 15 }, // C: Code
        { width: 15 }, // D: Dose
        { width: 15 }, // E: Zone
        { width: 25 }, // F: CLSI BP
        { width: 25 }, // G: EUCAST BP
        { width: 15 }, // H: CLSI Res
        { width: 15 }, // I: EUCAST Res
    ];

    let curentRow = 1;

    // 1. Report Title
    worksheet.mergeCells(`A${curentRow}:I${curentRow}`);
    const titleCell = worksheet.getCell(`A${curentRow}`);
    titleCell.value = "AST ANALYSIS REPORT";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    curentRow += 2;

    // Loop through batches
    for (const item of data) {
        const batchName = item.batchName || "Unknown Batch";
        const date = item.date || "";
        const time = item.time || "";
        const totalImages = item.plate ? 1 : (item.images?.length || 0);

        // 2. Metadata
        const metadata = [
            ["Batch Name:", batchName],
            ["Date:", date],
            ["Time:", time],
            ["Total Images:", totalImages],
            ["Data Base: ", `ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}`]
        ];

        metadata.forEach(([label, value]) => {
            worksheet.getCell(`A${curentRow}`).value = label;
            worksheet.getCell(`A${curentRow}`).font = { bold: true };
            worksheet.getCell(`B${curentRow}`).value = value;
            curentRow++;
        });
        curentRow++;

        // Handle plates (images)
        const plates = item.plate ? [item.plate] : (item.images || []);

        for (let index = 0; index < plates.length; index++) {
            const plate = plates[index];
            const imageIndex = index + 1;
            const bacteria = plate.strain_code || item.bacteria || "Unknown";

            // 3. Image Header
            worksheet.getCell(`A${curentRow}`).value = "Image No.:";
            worksheet.getCell(`A${curentRow}`).font = { bold: true };
            worksheet.getCell(`B${curentRow}`).value = imageIndex;
            curentRow++;

            worksheet.getCell(`A${curentRow}`).value = "Bacteria:";
            worksheet.getCell(`A${curentRow}`).font = { bold: true };
            worksheet.getCell(`B${curentRow}`).value = bacteria;
            curentRow++;

            // 4. Embed Image
            if (plate.result_image_url) {
                try {
                    // Fetch image as buffer
                    const imageUrl = `http://127.0.0.1:8000/uploaded_images/${plate.result_image_url.split('\\').pop().split('/').pop()}`;
                    const response = await fetch(imageUrl);
                    const buffer = await response.arrayBuffer();

                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: 'jpeg', // Assuming jpeg/png
                    });

                    // Insert image (taking up roughly 10 rows, columns A-D)
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: curentRow },
                        ext: { width: 400, height: 400 }
                    });

                    curentRow += 21; // Skip rows for image space
                } catch (e) {
                    console.error("Failed to embed image", e);
                    worksheet.getCell(`A${curentRow}`).value = "[Image Load Failed]";
                    curentRow++;
                }
            } else {
                worksheet.getCell(`A${curentRow}`).value = "[No Image]";
                curentRow++;
            }

            curentRow++;

            // 5. Table Headers
            const headers = ["Drug Name", "Code", "Dose (µg)", "Zone (mm)", "CLSI Breakpoints", "EUCAST Breakpoints", "CLSI Result", "EUCAST Result"];
            headers.forEach((h, i) => {
                const cell = worksheet.getCell(curentRow, i + 1);
                cell.value = h;
                cell.font = { bold: true };
                cell.border = { bottom: { style: 'thin' } };
            });
            curentRow++;

            // 6. Data Rows
            (plate.results || []).forEach((result: any) => {
                const rowData = [
                    result.antibiotic?.name || "Unknown",
                    result.antibiotic?.name ? result.antibiotic.name.substring(0, 3).toUpperCase() : "-",
                    result.antibiotic?.concentration_ug || "",
                    result.diameter_mm?.toFixed(1) || "",
                    "S≥.., I=..-.., R≤..",
                    "S≥.., R<..",
                    result.clsi_interpretation || "",
                    result.eucast_interpretation || ""
                ];

                rowData.forEach((val, i) => {
                    worksheet.getCell(curentRow, i + 1).value = val;
                });
                curentRow++;
            });

            curentRow += 2; // Spacing
        }
    }

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}.xlsx`);
};
