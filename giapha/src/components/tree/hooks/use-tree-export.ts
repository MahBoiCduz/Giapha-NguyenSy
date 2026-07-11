"use client";

import { useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";

export function useTreeExport() {
  const exportToPng = useCallback(async (element: HTMLElement) => {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    downloadImage(dataUrl, "pha-do.png");
  }, []);

  const exportToJpg = useCallback(async (element: HTMLElement) => {
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    downloadImage(dataUrl, "pha-do.jpg");
  }, []);

  const exportToPdf = useCallback(
    async (element: HTMLElement) => {
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const img = new window.Image();
      img.src = dataUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });

      pdf.addImage(img.src, "PNG", 0, 0, img.width, img.height, undefined, "FAST");
      pdf.save("pha-do.pdf");
    },
    []
  );

  return { exportToPng, exportToJpg, exportToPdf };
}

function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
