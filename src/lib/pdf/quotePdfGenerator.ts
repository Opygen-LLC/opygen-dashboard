import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function generateQuotePDF(quote: any, companySettings?: any): jsPDF {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Color Palette matching PDF screenshots
    const darkTeal = [15, 76, 92]; // #0F4C5C - Header Banner & Primary Headings
    const lightTealBg = [238, 246, 248]; // Light background for Billed By / To boxes
    const tableHeaderBg = [15, 76, 92];
    const tableAltRowBg = [245, 250, 251];
    const textDark = [30, 41, 59]; // Slate 800
    const textMuted = [71, 85, 105]; // Slate 600
    const lineTeal = [15, 76, 92];

    let y = 14;

    // Helper: Draw page header bar
    const drawHeaderBanner = () => {
        // Top banner background
        doc.setFillColor(darkTeal[0], darkTeal[1], darkTeal[2]);
        doc.rect(margin, y, contentWidth, 30, "F");

        // Left text: PROPOSAL TYPE & SUBTITLE
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const proposalTypeStr = (quote.proposalType || "SOFTWARE DEVELOPMENT PROPOSAL").toUpperCase();
        doc.text(proposalTypeStr, margin + 6, y + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const subtitleStr = quote.proposalSubtitle || quote.projectName || "";
        doc.text(subtitleStr, margin + 6, y + 18);

        // Right text: PROPOSAL REF & DATE
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("PROPOSAL", pageWidth - margin - 6, y + 10, { align: "right" });

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const quoteNoStr = quote.quoteNumber || `REF: QT-${(quote._id || "").substring(0, 8).toUpperCase()}`;
        const refLine = quoteNoStr.startsWith("REF:") ? quoteNoStr : `REF: ${quoteNoStr}`;
        doc.text(refLine, pageWidth - margin - 6, y + 17, { align: "right" });

        const dateStr = quote.createdAt
            ? new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
        doc.text(`Date: ${dateStr}`, pageWidth - margin - 6, y + 23, { align: "right" });

        y += 36;
    };

    // Helper: Check space and add page if needed
    const ensureSpace = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - 20) {
            drawFooter();
            doc.addPage();
            y = 14;
            drawHeaderBanner();
        }
    };

    // Helper: Draw Section Heading with line
    const drawSectionHeading = (title: string) => {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
        doc.text(title.toUpperCase(), margin, y);

        y += 2;
        doc.setDrawColor(lineTeal[0], lineTeal[1], lineTeal[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
    };

    // Helper: Draw Footer on all pages
    const drawFooter = () => {
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const footerY = pageHeight - 14;
            doc.setDrawColor(200, 210, 215);
            doc.setLineWidth(0.3);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            const footerMsg = quote.footerNote || "Thank you for the opportunity. We look forward to building something great together. | Opygen";
            doc.text(footerMsg, pageWidth / 2, footerY, { align: "center" });
        }
    };

    // --- STEP 1: HEADER BANNER ---
    drawHeaderBanner();

    // --- STEP 2: BILLED BY / BILLED TO CARDS ---
    ensureSpace(32);
    const colWidth = (contentWidth - 6) / 2;

    // BILLED BY
    doc.setFillColor(lightTealBg[0], lightTealBg[1], lightTealBg[2]);
    doc.rect(margin, y, colWidth, 30, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text("BILLED BY", margin + 5, y + 6);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const billedByName = quote.billedBy?.name || companySettings?.companyName || "MD. Faysal Mridha";
    doc.text(billedByName, margin + 5, y + 13);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const billedByTitle = quote.billedBy?.title || "Full Stack Developer";
    const billedByContact = quote.billedBy?.email || quote.billedBy?.phone || "";
    if (billedByContact) {
        doc.text(billedByContact, margin + 5, y + 24);
    }

    // BILLED TO
    const rightColX = margin + colWidth + 6;
    doc.setFillColor(lightTealBg[0], lightTealBg[1], lightTealBg[2]);
    doc.rect(rightColX, y, colWidth, 30, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text("BILLED TO", rightColX + 5, y + 6);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const billedToName = quote.billedTo?.name || quote.clientName || "Client";
    doc.text(billedToName, rightColX + 5, y + 13);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const billedToCompany = quote.billedTo?.company || quote.clientPhone || "";
    doc.text(billedToCompany, rightColX + 5, y + 19);
    const billedToCountry = quote.billedTo?.country || quote.clientSocialLink || "";
    doc.text(billedToCountry, rightColX + 5, y + 24);

    y += 36;

    // --- STEP 3: PROJECT OVERVIEW ---
    const overviewText = quote.projectOverview || quote.projectDetails;
    if (overviewText) {
        drawSectionHeading("PROJECT OVERVIEW");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);

        const splitOverview = doc.splitTextToSize(overviewText, contentWidth);
        ensureSpace(splitOverview.length * 4.5 + 4);
        doc.text(splitOverview, margin, y);
        y += splitOverview.length * 4.5 + 8;
    }

    // --- STEP 4: DYNAMIC FEATURE TABLES ---
    if (quote.featureSections && quote.featureSections.length > 0) {
        quote.featureSections.forEach((section: any) => {
            if (!section.title || !section.features || section.features.length === 0) return;

            drawSectionHeading(section.title);

            if (section.description) {
                doc.setFontSize(8.5);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
                const splitDesc = doc.splitTextToSize(section.description, contentWidth);
                doc.text(splitDesc, margin, y);
                y += splitDesc.length * 4 + 4;
            }

            const tableRows = section.features.map((feat: any, idx: number) => [
                (idx + 1).toString(),
                feat.featureName || "",
                feat.description || "",
            ]);

            autoTable(doc, {
                startY: y,
                head: [["#", "Feature", "Description"]],
                body: tableRows,
                theme: "plain",
                margin: { left: margin, right: margin },
                headStyles: {
                    fillColor: [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8.5,
                    cellPadding: 4,
                },
                bodyStyles: {
                    textColor: [textDark[0], textDark[1], textDark[2]],
                    fontSize: 8.5,
                    cellPadding: 4,
                },
                alternateRowStyles: {
                    fillColor: [tableAltRowBg[0], tableAltRowBg[1], tableAltRowBg[2]],
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
                    1: { cellWidth: 50, fontStyle: "bold" },
                    2: { cellWidth: "auto" },
                },
                didDrawPage: () => {
                    // Check for footer
                },
            });

            y = (doc as any).lastAutoTable.finalY + 8;
        });
    }

    // --- STEP 5: PROJECT SCOPE & PRICING TABLE ---
    if (quote.phases && quote.phases.length > 0) {
        drawSectionHeading("PROJECT SCOPE & PRICING");

        const currencySymbol = quote.currency === "USD" ? "$" : quote.currency === "EUR" ? "€" : "৳";

        let totalValue = 0;
        const scopeRows = quote.phases.map((p: any, idx: number) => {
            const minB = Number(p.minBudget) || 0;
            const maxB = Number(p.maxBudget) || minB;
            totalValue += maxB;

            let amountStr = "";
            if (minB === maxB) {
                amountStr = `${currencySymbol}${minB.toLocaleString()}`;
            } else {
                amountStr = `${currencySymbol}${minB.toLocaleString()} - ${currencySymbol}${maxB.toLocaleString()}`;
            }

            return [
                (idx + 1).toString(),
                `${p.phaseName}\n${p.description || ""}`,
                p.phaseTag || `Phase ${idx + 1}`,
                amountStr,
            ];
        });

        // Add summary row
        scopeRows.push([
            "",
            "TOTAL PROJECT VALUE",
            "",
            `${currencySymbol}${totalValue.toLocaleString()}`,
        ]);

        autoTable(doc, {
            startY: y,
            head: [["#", "Deliverable / Description", "Phase", `Amount (${quote.currency || "USD"})`]],
            body: scopeRows,
            theme: "plain",
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: 4,
            },
            bodyStyles: {
                textColor: [textDark[0], textDark[1], textDark[2]],
                fontSize: 8.5,
                cellPadding: 4,
            },
            alternateRowStyles: {
                fillColor: [tableAltRowBg[0], tableAltRowBg[1], tableAltRowBg[2]],
            },
            columnStyles: {
                0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
                1: { cellWidth: "auto", fontStyle: "normal" },
                2: { cellWidth: 28, halign: "center", fontStyle: "bold" },
                3: { cellWidth: 38, halign: "right", fontStyle: "bold" },
            },
            didParseCell: (data) => {
                // Style total row
                if (data.row.index === scopeRows.length - 1) {
                    data.cell.styles.fillColor = [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // --- STEP 6: PAYMENT SCHEDULE TABLE ---
    if (quote.paymentSchedule && quote.paymentSchedule.length > 0) {
        drawSectionHeading("PAYMENT SCHEDULE");

        const currencySymbol = quote.currency === "USD" ? "$" : quote.currency === "EUR" ? "€" : "৳";

        let totalPmt = 0;
        const pmtRows = quote.paymentSchedule.map((pmt: any, idx: number) => {
            const amt = Number(pmt.amount) || 0;
            totalPmt += amt;
            return [
                (idx + 1).toString(),
                `${pmt.milestone}\n${pmt.trigger || ""}`,
                pmt.calculation || "",
                `${currencySymbol}${amt.toLocaleString()}`,
            ];
        });

        pmtRows.push([
            "",
            "TOTAL",
            "",
            `${currencySymbol}${totalPmt.toLocaleString()}`,
        ]);

        autoTable(doc, {
            startY: y,
            head: [["PMT #", "Milestone / Trigger", "Calculation", `Amount (${quote.currency || "USD"})`]],
            body: pmtRows,
            theme: "plain",
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: 4,
            },
            bodyStyles: {
                textColor: [textDark[0], textDark[1], textDark[2]],
                fontSize: 8.5,
                cellPadding: 4,
            },
            alternateRowStyles: {
                fillColor: [tableAltRowBg[0], tableAltRowBg[1], tableAltRowBg[2]],
            },
            columnStyles: {
                0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
                1: { cellWidth: 70, fontStyle: "bold" },
                2: { cellWidth: "auto", fontStyle: "normal" },
                3: { cellWidth: 38, halign: "right", fontStyle: "bold" },
            },
            didParseCell: (data) => {
                if (data.row.index === pmtRows.length - 1) {
                    data.cell.styles.fillColor = [tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // --- STEP 7: PAYMENT ACCOUNT DETAILS BOX ---
    if (quote.paymentAccount && quote.paymentAccount.providerName) {
        ensureSpace(28);
        doc.setFillColor(lightTealBg[0], lightTealBg[1], lightTealBg[2]);
        doc.rect(margin, y, contentWidth, 24, "F");

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
        doc.text("PAYMENT RECEIVING ACCOUNT DETAILS", margin + 6, y + 6);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);

        const p = quote.paymentAccount;
        const line1 = `Provider: ${p.providerName || "N/A"}  |  Account Name: ${p.accountName || "N/A"}`;
        const line2 = `Account Number: ${p.accountNumber || "N/A"}${p.routingNumber ? `  |  Routing No: ${p.routingNumber}` : ""}${p.branch ? `  |  Branch: ${p.branch}` : ""}`;

        doc.text(line1, margin + 6, y + 12);
        doc.text(line2, margin + 6, y + 18);

        y += 30;
    }

    // --- STEP 8: TERMS & CONDITIONS ---
    if (quote.termsAndConditions && quote.termsAndConditions.length > 0) {
        drawSectionHeading("TERMS & CONDITIONS");

        quote.termsAndConditions.forEach((term: any, idx: number) => {
            const titleLine = `${idx + 1}. ${term.title}`;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(textDark[0], textDark[1], textDark[2]);

            const splitText = doc.splitTextToSize(term.text, contentWidth - 4);
            ensureSpace(splitText.length * 4 + 6);

            doc.text(titleLine, margin, y);
            y += 4.5;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(splitText, margin + 4, y);

            y += splitText.length * 4 + 4;
        });
        y += 4;
    }

    // --- STEP 9: AGREEMENT & ACCEPTANCE (SIGNATURES) ---
    drawSectionHeading("AGREEMENT & ACCEPTANCE");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const agreementStatement = "By signing below, both parties acknowledge that they have read, understood, and agree to the full scope, terms, and payment schedule outlined in this proposal. This document shall serve as a binding service agreement between the parties upon signature.";
    const splitStatement = doc.splitTextToSize(agreementStatement, contentWidth);

    ensureSpace(splitStatement.length * 4 + 45);
    doc.text(splitStatement, margin, y);
    y += splitStatement.length * 4 + 8;

    // Side-by-side signature boxes
    const sigBoxWidth = (contentWidth - 6) / 2;

    // Developer Signature Box
    doc.setFillColor(lightTealBg[0], lightTealBg[1], lightTealBg[2]);
    doc.rect(margin, y, sigBoxWidth, 32, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text("FREELANCER / DEVELOPER", margin + 5, y + 5);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(billedByName, margin + 5, y + 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(billedByTitle, margin + 5, y + 16);

    doc.text("Signature: ___________________________", margin + 5, y + 23);
    doc.text("Date: _______________________________", margin + 5, y + 28);

    // Client Signature Box
    const clientSigX = margin + sigBoxWidth + 6;
    doc.setFillColor(lightTealBg[0], lightTealBg[1], lightTealBg[2]);
    doc.rect(clientSigX, y, sigBoxWidth, 32, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text("CLIENT / AUTHORIZED REPRESENTATIVE", clientSigX + 5, y + 5);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(billedToName, clientSigX + 5, y + 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`${billedToCompany} ${billedToCountry ? `— ${billedToCountry}` : ""}`, clientSigX + 5, y + 16);

    doc.text("Signature: ___________________________", clientSigX + 5, y + 23);
    doc.text("Date: _______________________________", clientSigX + 5, y + 28);

    y += 38;

    // Attach footer to all pages
    drawFooter();

    return doc;
}
