/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import ePub, {
  type Rendition,
  type Contents,
  type Book,
  EpubCFI,
} from "epubjs";
import { type Annotation } from "epubjs/types/annotations";
import type * as Prisma from "@prisma/client";
import EventEmitter from "eventemitter3";
import { type Colors, getColorsValue } from "y/components/highlightEditor";
import { EpubAnnotationType } from "./constants";
import pick from "lodash/pick";
import { type DisplayedLocation } from "epubjs/types/rendition";

declare module "epubjs/types/rendition" {}

export class EpubReader extends EventEmitter<
  "selected" | "markClicked" | "relocated" | "displayed"
> {
  book: Book;
  rendition: Rendition;

  handleSelected = (cfiRange: string, contents: Contents) => {
    const range = contents.window.getSelection()?.getRangeAt(0);
    if (!range) return;

    // in iframe viewport is the inner width and height
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Viewport_concepts

    const iframes = document.getElementsByTagName("iframe");
    const iframe = Array.from(iframes).find(
      (iframe) => iframe.contentWindow === contents.window,
    );
    if (!iframe) return;
    const rect = range.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    rect.x = rect.x + iframeRect.x;
    rect.y = rect.y + iframeRect.y;

    this.emit("selected", cfiRange, range, rect, contents);
  };

  handleMarkClicked = (
    cfiRange: string,
    data: Prisma.Mark,
    contents: Contents,
  ) => {
    const g = document.querySelector<SVGGElement>(
      `g[data-epubcfi="${cfiRange}"]`,
    );

    this.emit("markClicked", cfiRange, data, g, contents);
  };

  constructor(opfUrl: string, elementId: string) {
    super();

    this.book = ePub(opfUrl);
    this.rendition = this.book.renderTo(elementId, {
      manager: "continuous",
      flow: "paginated",
      width: "100%",
      height: "100%",
      snap: true,
      // stylesheet: "/style.css",
      // allowScriptedContent: true,
      // FIXME: need to add
      // script: `${process.env.PUBLIC_URL}/epubjs-ext/rendition-injection.js`,
    });

    this.rendition.on("selected", this.handleSelected);
    this.rendition.on("markClicked", this.handleMarkClicked);
    this.rendition.on("relocated", (location: Location) =>
      this.emit("relocated", location),
    );
    this.rendition.on("displayed", () => this.emit("displayed"));
  }

  registerTheme(name: string, value: Record<string, unknown>) {
    this.rendition.themes.register(name, value);
  }

  useTheme(name: string) {
    this.rendition.themes.select(name);
  }

  display(target: string | number) {
    return this.rendition.display(target as string);
  }

  prev() {
    return this.rendition.prev();
  }

  next() {
    return this.rendition.next();
  }

  addHighlight(mark: Omit<Prisma.Mark, "userId">) {
    // TODO: inject css instead of use css, use theme to inject.
    this.rendition.annotations.highlight(
      mark.epubcfi,
      pick(mark, "id", "color"),
      undefined,
      undefined,
      {
        fill: getColorsValue(mark.color as Colors),
      },
    );
  }

  removeHighlight(epubcfi: string) {
    this.rendition.annotations.remove(epubcfi, EpubAnnotationType.Highlight);
  }

  updateHighlight(mark: Pick<Prisma.Mark, "epubcfi" | "color">) {
    const annotations = (this.rendition.annotations as any)
      ._annotations as Record<string, Annotation>;

    const hash = encodeURI(mark.epubcfi) + EpubAnnotationType.Highlight;
    const current = annotations[hash];
    if (!current || (current as any).data.color === mark.color) return;

    (current as any).data.color = mark.color;
    (current as any).styles = {
      fill: getColorsValue(mark.color as Colors),
    };

    const g = document.querySelector<SVGGElement>(
      `g[data-epubcfi="${mark.epubcfi}"]`,
    );
    if (!g) {
      console.warn(`${mark.epubcfi} element is not found!`);
      return;
    }

    g.dataset.color = mark.color;
    g.setAttribute("fill", getColorsValue(mark.color as Colors)!);
  }

  currentLocation() {
    return this.rendition.currentLocation() as unknown as Promise<{
      start: DisplayedLocation;
      end: DisplayedLocation;
    }>;
  }

  getRange(cfi: string) {
    return this.rendition.getRange(cfi);
  }

  destroy() {
    this.book.destroy();
  }
}
