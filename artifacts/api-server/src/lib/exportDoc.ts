import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";
import PDFDocument from "pdfkit";
import type { DraftSectionJson } from "@workspace/db";

export async function draftToDocx(
  title: string,
  sections: DraftSectionJson[],
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 44 })],
      heading: HeadingLevel.TITLE,
    }),
  ];
  for (const s of sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: s.title, bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
    );
    for (const para of s.content.split(/\n\n+/)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para.trim(), size: 22 })],
          spacing: { after: 120 },
        }),
      );
    }
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

export function draftToPdf(
  title: string,
  sections: DraftSectionJson[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text(title, { align: "left" });
    doc.moveDown();

    for (const s of sections) {
      doc.fontSize(16).text(s.title, { underline: false });
      doc.moveDown(0.5);
      doc.fontSize(11).text(s.content, { align: "left", lineGap: 2 });
      doc.moveDown();
    }
    doc.end();
  });
}
