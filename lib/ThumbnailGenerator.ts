import heic2any from "heic2any";
import * as pdfjsLib from "pdfjs-dist";

interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  videoSeekTime?: number;
}

type SupportedFileType =
  | "image"
  | "video"
  | "pdf"
  | "heic"
  | "text"
  | "unsupported";

export class ThumbnailGenerator {
  private config: ThumbnailConfig;

  private static getFileType(file: File): SupportedFileType {
    // Detect any plain text format
    const textTypes = [
      "application/json",
      "application/xml",
      "application/xhtml+xml",
      "application/javascript",
      "application/typescript",
      "application/x-yaml",
      "application/x-sh",
      "application/x-csh",
      "application/x-perl",
      "application/x-python",
      "application/sql",
      "application/csv", // sometimes seen
      "text/csv",
      "text/html",
      "text/xml",
      "text/javascript",
      "text/markdown",
      "text/x-yaml",
      "text/x-c",
      "text/x-c++",
      "text/x-java",
      "text/x-python",
      "text/x-shellscript",
    ];

    if (file.type.startsWith("text/") || textTypes.includes(file.type)) {
      return "text";
    }

    if (file.type === "application/pdf") return "pdf";
    if (file.type === "image/heic" || file.type === "image/heif") return "heic";
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";

    return "unsupported";
  }

  static isFileSupported(file: File) {
    return ThumbnailGenerator.getFileType(file) !== "unsupported";
  }

  constructor(
    config: ThumbnailConfig = {
      width: 600,
      height: 600,
      quality: 0.8,
      videoSeekTime: 1,
    },
  ) {
    this.config = config;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  /** Resize canvas to fit within max width/height while keeping aspect ratio */
  private setCanvasToAspect(
    sourceWidth: number,
    sourceHeight: number,
    canvas: HTMLCanvasElement,
  ) {
    const { width: maxW, height: maxH } = this.config;
    const scale = Math.min(maxW / sourceWidth, maxH / sourceHeight);

    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
  }

  private async generateTextThumbnail(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    const text = await file.text();
    const preview = text.length > 5000 ? text.slice(0, 5000) + "…" : text; // generous cap

    const { width: maxW, height: maxH } = this.config;
    const padding = 32;

    canvas.width = maxW;
    canvas.height = maxH;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Try font sizes from big → small until it fits
    let fontSize = 30; // starting font size
    const minFontSize = 8;
    let wrappedLines: string[] = [];
    let lineHeight = 0;

    while (fontSize >= minFontSize) {
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";
      lineHeight = fontSize * 1.3; // proportional line height

      wrappedLines = wrapText(preview, ctx, canvas.width - padding * 2);

      const totalHeight = wrappedLines.length * lineHeight;
      if (totalHeight <= canvas.height - padding * 2) {
        break; // fits!
      }

      fontSize -= 1; // try smaller
    }

    // Render text
    ctx.fillStyle = "#000000";
    let y = padding;
    for (const line of wrappedLines) {
      if (y + lineHeight > canvas.height - padding) break;
      ctx.fillText(line, padding, y);
      y += lineHeight;
    }

    // --- Helper ---
    function wrapText(
      text: string,
      ctx: CanvasRenderingContext2D,
      maxWidth: number,
    ): string[] {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      return lines;
    }
  }

  private async generateHEICThumbnail(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/webp",
      quality: this.config.quality,
    });

    const img = new Image();
    const url = URL.createObjectURL(convertedBlob as Blob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        this.setCanvasToAspect(img.width, img.height, canvas);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load HEIC image"));
      };
      img.src = url;
    });
  }

  private generateImageThumbnail(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = (): void => {
        this.setCanvasToAspect(img.width, img.height, canvas);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = (): void => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  }

  private generateVideoThumbnail(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = (): void => {
        const seekTime = Math.min(
          this.config.videoSeekTime || 1,
          video.duration * 0.1,
        );
        video.currentTime = seekTime;
      };

      video.onseeked = (): void => {
        this.setCanvasToAspect(video.videoWidth, video.videoHeight, canvas);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve();
      };

      video.onerror = (): void => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video"));
      };

      video.src = url;
      video.load();
    });
  }

  private async generatePDFThumbnail(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        throw new Error("Failed to get temporary canvas context");
      }

      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      const renderContext = {
        canvasContext: tempCtx,
        viewport: viewport,
      };

      await page.render(renderContext as any).promise;

      // Resize target canvas to fit aspect ratio
      this.setCanvasToAspect(tempCanvas.width, tempCanvas.height, canvas);
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      throw new Error(
        `Failed to generate PDF thumbnail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async generate(file: File): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Thumbnail canvas context is not available!");

    const fileType = ThumbnailGenerator.getFileType(file);

    try {
      switch (fileType) {
        case "image":
          await this.generateImageThumbnail(file, canvas, ctx);
          break;
        case "video":
          await this.generateVideoThumbnail(file, canvas, ctx);
          break;
        case "pdf":
          await this.generatePDFThumbnail(file, canvas, ctx);
          break;
        case "heic":
          await this.generateHEICThumbnail(file, canvas, ctx);
          break;
        case "text":
          await this.generateTextThumbnail(file, canvas, ctx);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch {
      return null;
    }

    const thumbnail = await new Promise<Blob | null>((res) => {
      canvas.toBlob((blob) => res(blob), "image/webp", this.config.quality);
    });

    if (!thumbnail) throw new Error("Could not generate thumbnail!");

    return thumbnail;
  }
}
