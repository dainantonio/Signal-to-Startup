import jsPDF from 'jspdf';

export interface PDFExportData {
  opportunityName: string;
  marketMode: string;
  countryTag?: string;
  businessPlan: string;
  costBreakdown: Array<{
    item: string;
    cost: number;
    type: string;
    notes?: string;
  }>;
  grants: Array<{
    name: string;
    organization: string;
    amount: string;
    why_this_qualifies: string;
    how_to_apply: string;
  }>;
  checklist: Array<{
    title: string;
    description: string;
    phase: number;
    time_estimate: string;
  }>;
  investors: Array<{
    name: string;
    focus: string;
    stage: string;
    website?: string;
  }>;
  generatedAt: string;
}

export async function exportToPDF(data: PDFExportData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const addPage = () => {
    pdf.addPage();
    yPos = margin;
  };

  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      addPage();
    }
  };

  const addText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = [30, 30, 30],
    maxWidth?: number
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, maxWidth || contentWidth);
    checkPageBreak(lines.length * fontSize * 0.5);
    pdf.text(lines, margin, yPos);
    yPos += lines.length * fontSize * 0.45 + 2;
  };

  const addDivider = () => {
    checkPageBreak(8);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
  };

  const addSectionHeader = (title: string) => {
    checkPageBreak(16);
    yPos += 4;
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin - 2, yPos - 4, contentWidth + 4, 10, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text(title.toUpperCase(), margin + 2, yPos + 2);
    yPos += 10;
  };

  // ─── COVER ────────────────────────────────

  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Signal to Startup', margin, 18);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 150, 150);
  pdf.text('by EntrepAIneur', margin, 26);
  pdf.text('signal-to-startup.vercel.app', margin, 33);

  yPos = 55;

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(10, 10, 10);
  const nameLines = pdf.splitTextToSize(data.opportunityName, contentWidth);
  pdf.text(nameLines, margin, yPos);
  yPos += nameLines.length * 10 + 4;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const marketLabel = data.countryTag
    ? `${data.countryTag} · ${data.marketMode}`
    : data.marketMode;
  pdf.text(`Market: ${marketLabel}`, margin, yPos);
  yPos += 6;
  pdf.text(
    `Generated: ${new Date(data.generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    margin,
    yPos
  );
  yPos += 6;

  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    'AI-generated content for informational purposes only. Not financial or legal advice.',
    margin,
    yPos
  );
  yPos += 12;

  addDivider();

  // ─── BUSINESS PLAN ────────────────────────

  addSectionHeader('Business Plan');

  const cleanPlan = data.businessPlan
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .trim();

  const sections = cleanPlan
    .split(/(?=\d+\.\s+[A-Z])/)
    .filter((s) => s.trim().length > 10);

  for (const section of sections) {
    const headingMatch = section.match(/^(\d+\.\s+[^\n]+)/);
    if (headingMatch) {
      checkPageBreak(20);
      addText(headingMatch[1].trim(), 10, 'bold', [30, 30, 30]);
      const body = section.replace(headingMatch[1], '').trim();
      if (body) {
        addText(body, 9, 'normal', [80, 80, 80]);
      }
    } else {
      addText(section.trim(), 9, 'normal', [80, 80, 80]);
    }
    yPos += 3;
  }

  // ─── STARTUP COSTS ────────────────────────

  addPage();
  addSectionHeader('Startup Cost Breakdown');

  const totalCost = data.costBreakdown.reduce((sum, item) => sum + item.cost, 0);

  checkPageBreak(20);
  pdf.setFillColor(10, 10, 10);
  pdf.roundedRect(margin, yPos, contentWidth, 14, 3, 3, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL STARTUP COST', margin + 4, yPos + 5);
  pdf.text(`$${totalCost.toLocaleString()}`, pageWidth - margin - 4, yPos + 5, {
    align: 'right',
  });
  yPos += 18;

  for (const item of data.costBreakdown) {
    checkPageBreak(14);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 30, 30);

    const itemLines = pdf.splitTextToSize(item.item, contentWidth * 0.65);
    pdf.text(itemLines, margin, yPos);

    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      item.type === 'monthly' ? 'Monthly' : 'One-time',
      margin + contentWidth * 0.68,
      yPos
    );

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text(`$${item.cost.toLocaleString()}`, pageWidth - margin, yPos, {
      align: 'right',
    });

    if (item.notes) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(140, 140, 140);
      const noteLines = pdf.splitTextToSize(item.notes, contentWidth * 0.65);
      yPos += itemLines.length * 4;
      pdf.text(noteLines, margin, yPos);
    }

    yPos += Math.max(itemLines.length, 1) * 5 + 2;

    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;
  }

  // ─── GRANTS ────────────────────────────────

  if (data.grants.length > 0) {
    addPage();
    addSectionHeader('Funding & Grant Sources');

    for (const grant of data.grants) {
      checkPageBreak(40);

      pdf.setFillColor(252, 252, 252);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(margin, yPos, contentWidth, 2, 2, 2, 'FD');

      yPos += 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      const grantNameLines = pdf.splitTextToSize(grant.name, contentWidth * 0.7);
      pdf.text(grantNameLines, margin + 3, yPos);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(21, 128, 61);
      pdf.text(grant.amount, pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += grantNameLines.length * 5 + 2;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(grant.organization, margin + 3, yPos);
      yPos += 5;

      if (grant.why_this_qualifies) {
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const qualLines = pdf.splitTextToSize(
          grant.why_this_qualifies,
          contentWidth - 6
        );
        checkPageBreak(qualLines.length * 4 + 4);
        pdf.text(qualLines, margin + 3, yPos);
        yPos += qualLines.length * 4 + 3;
      }

      yPos += 6;
    }
  }

  // ─── CHECKLIST ─────────────────────────────

  if (data.checklist.length > 0) {
    addPage();
    addSectionHeader('Launch Checklist');

    const phases: Record<number, string> = {
      1: 'Phase 1 — Research & Validation',
      2: 'Phase 2 — Legal & Setup',
      3: 'Phase 3 — Build & Prepare',
      4: 'Phase 4 — Launch & First Customers',
    };

    let currentPhase = 0;

    for (const step of data.checklist) {
      if (step.phase !== currentPhase) {
        currentPhase = step.phase;
        checkPageBreak(14);
        yPos += 4;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text(phases[currentPhase] || `Phase ${currentPhase}`, margin, yPos);
        yPos += 7;
      }

      checkPageBreak(16);

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, yPos - 3.5, 4, 4, 1, 1);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 30, 30);
      const stepLines = pdf.splitTextToSize(step.title, contentWidth - 8);
      pdf.text(stepLines, margin + 7, yPos);
      yPos += stepLines.length * 4.5;

      if (step.time_estimate) {
        pdf.setFontSize(7);
        pdf.setTextColor(140, 140, 140);
        pdf.text(`${step.time_estimate}`, margin + 7, yPos);
        yPos += 4;
      }

      yPos += 2;
    }
  }

  // ─── INVESTORS ──────────────────────────────

  if (data.investors.length > 0) {
    addPage();
    addSectionHeader('Investor Matches');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'AI-suggested investors. Verify fit independently before outreach.',
      margin,
      yPos
    );
    yPos += 8;

    for (const investor of data.investors) {
      checkPageBreak(20);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text(investor.name, margin, yPos);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Stage: ${investor.stage}`, pageWidth - margin, yPos, {
        align: 'right',
      });
      yPos += 5;

      const focusLines = pdf.splitTextToSize(investor.focus, contentWidth);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(focusLines, margin, yPos);
      yPos += focusLines.length * 4 + 6;

      addDivider();
    }
  }

  // ─── FOOTER ON ALL PAGES ──────────────────

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text(
      `Signal to Startup by EntrepAIneur  ·  signal-to-startup.vercel.app  ·  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const fileName = `${data.opportunityName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 40)}-execution-plan.pdf`;

  pdf.save(fileName);
}
