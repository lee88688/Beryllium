import React, { useState, useRef, useEffect, useCallback } from "react";
import ePub, { type Rendition, type Contents } from "epubjs";
import { EpubCFI } from "epubjs";
import Popper, { type PopperProps } from "@mui/material/Popper";
import {
  Colors,
  HighlightEditor,
  getColorsValue,
} from "y/components/highlightEditor";
import { addMark, removeMark, updateMark } from "../clientApi";
import { getElementHeading } from "./index";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import { EpubReader } from "y/utils/epubReader";

// window.EpubCFI = EpubCFI;

type VirtualElement = Exclude<PopperProps["anchorEl"], null | undefined>;

type UseReaderProps = {
  opfUrl: string;
  bookId: number;
  startCfi: string;
  highlightList: Prisma.Mark[];
};

type EditorValue = Omit<Prisma.Mark, "id" | "userId"> & { id?: number };

const EMPTY_EDITOR_VALUE = (bookId: number) => ({
  color: "",
  content: "",
  epubcfi: "",
  selectedString: "",
  type: MarkType.Highlight,
  title: "",
  bookId,
});

export function useReader({
  opfUrl,
  bookId,
  startCfi,
  highlightList,
}: UseReaderProps) {
  const epubReaderRef = useRef<EpubReader>();

  const rendition = useRef<Rendition>();
  const anchorEl = useRef<VirtualElement>();
  const [openPopover, setOpenPopover] = useState(false);
  const [curEditorValue, setCurEditorValue] = useState<EditorValue>(
    EMPTY_EDITOR_VALUE(bookId),
  );
  const curEditorValueRef = useRef<EditorValue>(curEditorValue);
  const preEditorValue = useRef(curEditorValue);

  // point curEditorValueRef to curEditorValue
  curEditorValueRef.current = curEditorValue;

  const updateHighlightElement = (value: EditorValue, temporarily = true) => {
    const { epubcfi } = value;
    const g = document.querySelector<SVGGElement>(
      `g[data-epubcfi="${epubcfi}"]`,
    );

    if (!g) {
      console.warn(`${epubcfi} element is not found!`);
      return;
    }

    Object.keys(g.dataset).forEach((k) => {
      g.dataset[k] = value[k];
    });
    g.setAttribute("fill", getColorsValue(value.color)!);
    if (!temporarily) {
      // change rendition's annotations
    }
  };

  const getHighlightSelectedFunction =
    (cfi: string) => (e: React.MouseEvent<HTMLElement>) => {
      // new add highlight callback
      // void touchstart trigger
      if (e.type.startsWith("touch")) {
        e.stopPropagation();
        return;
      }
      const g = document.querySelector<SVGGElement>(
        `g[data-epubcfi="${cfi}"]`,
      )!;
      const editorValue = { ...curEditorValueRef.current };
      Object.keys(g.dataset).forEach((k) => (editorValue[k] = g.dataset[k]));
      preEditorValue.current = { ...editorValue };
      setCurEditorValue(editorValue);
      anchorEl.current = e.target as unknown as VirtualElement;
      setOpenPopover(true);
    };

  const handleSelected = useCallback(
    (epubcfi: string, range: Range, rect: DOMRect, contents: Contents) => {
      const handleSelectionChange = () => {
        contents.window.removeEventListener(
          "selectionchange",
          handleSelectionChange,
        );
        anchorEl.current = undefined;
        setOpenPopover(false);
        setCurEditorValue(EMPTY_EDITOR_VALUE(bookId));
      };
      contents.window.addEventListener(
        "selectionchange",
        handleSelectionChange,
      );

      anchorEl.current = {
        nodeType: 1,
        getBoundingClientRect: () => rect,
      };

      const title = getElementHeading(
        range.commonAncestorContainer as HTMLElement,
      );

      setCurEditorValue((val) => {
        return {
          ...val,
          epubcfi,
          selectedString: range.toString(),
          type: MarkType.Highlight,
          title,
        };
      });
      setOpenPopover(true);
    },
    [bookId],
  );

  useEffect(() => {
    epubReaderRef.current = new EpubReader(opfUrl, "viewer");
    void epubReaderRef.current.display(startCfi);
    epubReaderRef.current.on("selected", handleSelected);
  }, []);

  // useEffect(() => {
  //   const book = ePub(opfUrl);
  //   rendition.current = book.renderTo("viewer", {
  //     manager: "continuous",
  //     flow: "paginated",
  //     width: "100%",
  //     height: "100%",
  //     snap: true,
  //     stylesheet: "/style.css",
  //     // allowScriptedContent: true,
  //     // FIXME: need to add
  //     // script: `${process.env.PUBLIC_URL}/epubjs-ext/rendition-injection.js`,
  //   });
  //   console.log("rendition", rendition);
  //   // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //   rendition.current.display(startCfi || 0);

  //   let epubcfi = "";
  //   let selectedString = "";
  //   // when registered selected event, all references in selected callback function are frozen
  //   // curEditorValue will be changed, and it would not change in selected callback.
  //   // so it's important to change `curEditorValue` to `curEditorValueRef`.
  //   rendition.current.on(
  //     "selected",
  //     function (cfiRange: string, contents: Contents) {
  //       if (!epubcfi) {
  //         const fn = async (e: MouseEvent) => {
  //           contents.document.removeEventListener("mouseup", fn);
  //           const color = Colors.Red;
  //           const content = "";
  //           // const cfi = epubcfi; // epubcfi will be set to null, save a copy.
  //           const title = getElementHeading(e.target);
  //           console.log(title);
  //           const curValue = {
  //             color,
  //             content,
  //             epubcfi,
  //             selectedString,
  //             type: MarkType.Highlight,
  //             title,
  //           };
  //           rendition.current?.annotations.highlight(
  //             epubcfi,
  //             { ...curValue },
  //             getHighlightSelectedFunction(epubcfi),
  //             "",
  //             { fill: getColorsValue(color) },
  //           );
  //           // rendition.current?.annotations.mark(
  //           //   epubcfi,
  //           //   { ...curValue },
  //           //   getHighlightSelectedFunction(epubcfi),
  //           // );
  //           setCurEditorValue({ ...curValue });
  //           // const { data: markId } = await addMark(bookId, { ...curValue });
  //           // dispatch(getHighlightList(bookId)); // update highlight list
  //           // setCurEditorValue({ ...curValue, id: markId });
  //           epubcfi = "";
  //           selectedString = "";
  //         };
  //         contents.document.addEventListener("mouseup", fn);
  //       }
  //       epubcfi = cfiRange;
  //       selectedString = contents.window.getSelection()?.toString() ?? "";
  //     },
  //   );

  //   rendition.current.on("markClicked", (...args) => console.log(...args));
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [opfUrl]);

  // useEffect(() => {
  //   if (openPopover && curEditorValue.epubcfi) {
  //     // find the highlight element and compare with the color before. if not the same, change element's color.
  //     updateHighlightElement(curEditorValue);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [curEditorValue.color]);

  useEffect(() => {
    highlightList.forEach((item) => {
      epubReaderRef.current?.addHighlight(item);
    });
  }, [highlightList]);

  const handleEditorChange = useCallback((value: EditorValue) => {
    if (!value.id) {
      // create new highlight
      console.log("current editor value", value);
      addMark({ ...value })
        .then((res) => setCurEditorValue((val) => ({ ...val, id: res.data })))
        .catch((e) => console.error(e));
    }
    setCurEditorValue(value);
  }, []);

  const handleEditorCancel = () => {
    // canceling will remove changes
    updateHighlightElement(preEditorValue.current);
    setOpenPopover(false);
  };

  const handleConfirm = async (value: EditorValue) => {
    const { id } = { ...curEditorValue, ...value };
    await updateMark(id, bookId, value);
    // dispatch(getHighlightList(bookId)); // update highlight list
    updateHighlightElement(value, false);
    setOpenPopover(false);
  };

  const handleRemove = async (value: EditorValue) => {
    const { id, epubcfi, type } = { ...curEditorValue, ...value };
    await removeMark(id, bookId);
    // dispatch(getHighlightList(bookId)); // update highlight list
    rendition.current?.annotations.remove(new EpubCFI(epubcfi), type);
    setOpenPopover(false);
  };

  const bookItem = (
    <React.Fragment>
      <div id="viewer" style={{ height: "100%", width: "100%" }}></div>
      <Popper open={openPopover} anchorEl={anchorEl.current} placement="top">
        <HighlightEditor
          {...curEditorValue}
          onChange={handleEditorChange}
          onConfirm={handleConfirm}
          onCancel={handleEditorCancel}
          onDelete={handleRemove}
        />
      </Popper>
    </React.Fragment>
  );

  return {
    bookItem,
    rendition,
    nextPage: () => {
      return epubReaderRef.current?.next();
    },
    prevPage: () => {
      return epubReaderRef.current?.prev();
    },
  };
}
