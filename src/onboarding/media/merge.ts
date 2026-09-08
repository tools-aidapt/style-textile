/**
 * Several files, one document.
 *
 * The National ID is two photos, educational certificates are however many
 * somebody has, and payslips are three. HR wants one file per document, so
 * they become one PDF — in the order shown in the UI, which is drag-reorderable
 * and where the first two ID slots are labelled Front and Back.
 *
 * Pages from a source PDF are copied, not rasterised: a clean two-page
 * certificate PDF inside a merged document should still be text.
 */

import { PDFDocument, degrees } from "pdf-lib";

/** A4, in points. Kenyan HR prints these. */
const A4_SHORT = 595.28;
const A4_LONG = 841.89;
/** 12 mm, so nothing important sits in a stapler or a scanner's dead zone. */
const MARGIN = 34.02;

export type MergeItem =
  | { kind: "jpeg"; bytes: ArrayBuffer }
  | { kind: "pdf"; bytes: ArrayBuffer };

/**
 * One PDF, pages in the order given.
 *
 * A landscape photo gets a landscape page rather than being shrunk to fit a
 * portrait one — a landscape ID card on a portrait page is half the size it
 * could be, and this is a document somebody has to read.
 */
export const mergeToPdf = async (items: MergeItem[]): Promise<Uint8Array> => {
  const merged = await PDFDocument.create();

  for (const item of items) {
    if (item.kind === "pdf") {
      const source = await PDFDocument.load(item.bytes);
      const copied = await merged.copyPages(source, source.getPageIndices());
      copied.forEach((page) => merged.addPage(page));
      continue;
    }

    const image = await merged.embedJpg(item.bytes);
    const landscape = image.width > image.height;
    const pageWidth = landscape ? A4_LONG : A4_SHORT;
    const pageHeight = landscape ? A4_SHORT : A4_LONG;

    const page = merged.addPage([pageWidth, pageHeight]);
    const boxWidth = pageWidth - MARGIN * 2;
    const boxHeight = pageHeight - MARGIN * 2;
    // Contain, never cover: cropping the edge off an ID is not a layout
    // decision this form gets to make
    const scale = Math.min(boxWidth / image.width, boxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
      rotate: degrees(0),
    });
  }

  return merged.save();
};
