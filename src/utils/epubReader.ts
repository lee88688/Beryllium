import ePub, { type Rendition, type Contents, type Book } from "epubjs";
import type * as Prisma from "@prisma/client";
import EventEmitter from "eventemitter3";
import { type Colors, getColorsValue } from "y/components/highlightEditor";
import { EpubAnnotationType } from "./constants";
import pick from "lodash/pick";

export class EpubReader extends EventEmitter<"selected" | "markClicked"> {
  book: Book;
  rendition: Rendition;

  handleSelected = (cfiRange: string, contents: Contents) => {
    const range = contents.window.getSelection()?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();

    this.emit("selected", cfiRange, rect, contents);
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
      stylesheet: "/style.css",
      // allowScriptedContent: true,
      // FIXME: need to add
      // script: `${process.env.PUBLIC_URL}/epubjs-ext/rendition-injection.js`,
    });

    this.rendition.on("selected", this.handleSelected);
    this.rendition.on("markClicked", this.handleMarkClicked);
  }

  display(target: string | number) {
    return this.rendition.display(target as string);
  }

  addHighlight(epubcfi: string, mark: Prisma.Mark) {
    // TODO: inject css instead of use css, use theme to inject.
    this.rendition.annotations.highlight(
      epubcfi,
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
}
