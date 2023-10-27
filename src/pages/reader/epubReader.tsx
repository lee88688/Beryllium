import React, { useState, useRef, useEffect, useCallback } from "react";
import ePub, { type Rendition, type Contents } from "epubjs";
import { EpubCFI } from "epubjs";
import Popper, { type PopperProps } from "@mui/material/Popper";
import {
  Colors,
  HighlightEditor,
  getColorsValue,
} from "y/components/highlightEditor";
import { addMark, removeMark, apiUpdateMark } from "../clientApi";
import { getElementHeading } from "./index";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import { EpubReader } from "y/utils/epubReader";
import { useMutation } from "@tanstack/react-query";

// window.EpubCFI = EpubCFI;

type VirtualElement = Exclude<PopperProps["anchorEl"], null | undefined>;

type UseReaderProps = {
  opfUrl: string;
  bookId: number;
  startCfi: string;
  highlightList: Prisma.Mark[];
  onHighlightRefetch: () => void;
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
  onHighlightRefetch,
}: UseReaderProps) {
  const epubReaderRef = useRef<EpubReader>();

  const anchorEl = useRef<VirtualElement>();
  const [openPopover, setOpenPopover] = useState(false);
  const [curEditorValue, setCurEditorValue] = useState<EditorValue>(
    EMPTY_EDITOR_VALUE(bookId),
  );
  const curEditorValueRef = useRef<EditorValue>(curEditorValue);
  const preEditorValue = useRef(curEditorValue);

  // point curEditorValueRef to curEditorValue
  curEditorValueRef.current = curEditorValue;

  const addMarkMutation = useMutation({
    mutationFn: (val: EditorValue) => addMark(val),
  });

  const updateMarkMutation = useMutation({
    mutationFn: (val: EditorValue & { id: number }) => apiUpdateMark(val),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeMark(id),
  });

  const updateHighlightElement = useCallback((value: EditorValue) => {
    epubReaderRef.current?.updateHighlight(value);
  }, []);

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

  const handleMarkClick = useCallback(
    (epubcfi: string, data: EditorValue, g: SVGGElement) => {
      anchorEl.current = g;
      setCurEditorValue(data);
      setOpenPopover(true);
    },
    [],
  );

  useEffect(() => {
    epubReaderRef.current = new EpubReader(opfUrl, "viewer");
    // when book has no current, it is empty string
    void epubReaderRef.current.display(startCfi || 0);
    epubReaderRef.current.on("selected", handleSelected);
    epubReaderRef.current.on("markClicked", handleMarkClick);
  }, []);

  useEffect(() => {
    highlightList.forEach((item) => {
      epubReaderRef.current?.addHighlight(item);
    });
  }, []);

  const handleEditorChange = useCallback(
    (value: EditorValue) => {
      if (!value.id) {
        // create new highlight
        console.log("current editor value", value);
        addMarkMutation
          .mutateAsync(value)
          .then((res) => {
            setCurEditorValue((val) => {
              const value = { ...val, id: res.data };
              epubReaderRef.current?.addHighlight(value);

              return value;
            });
          })
          .catch((e) => console.error(e));
      }
      setCurEditorValue(value);
    },
    [addMarkMutation.mutateAsync],
  );

  const handleEditorCancel = useCallback(() => {
    // canceling will remove changes
    updateHighlightElement(preEditorValue.current);
    setOpenPopover(false);
  }, [updateHighlightElement]);

  const handleConfirm = useCallback(
    async (value: EditorValue) => {
      const val = { ...curEditorValue, ...value };
      if (!val.id) return;

      await updateMarkMutation.mutateAsync(val);
      updateHighlightElement(value);
      setOpenPopover(false);
      onHighlightRefetch();
    },
    [
      curEditorValue,
      onHighlightRefetch,
      updateHighlightElement,
      updateMarkMutation.mutateAsync,
    ],
  );

  const handleRemove = useCallback(
    async (value: EditorValue) => {
      const { id, epubcfi } = { ...curEditorValue, ...value };
      if (!id) return;

      await removeMutation.mutateAsync(id);
      setOpenPopover(false);
      epubReaderRef.current?.removeHighlight(epubcfi);
      onHighlightRefetch();
    },
    [curEditorValue, onHighlightRefetch, removeMutation.mutateAsync],
  );

  const bookItem = (
    <React.Fragment>
      <div id="viewer" style={{ height: "100%", width: "100%" }}></div>
      <Popper open={openPopover} anchorEl={anchorEl.current} placement="bottom">
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
    epubReaderRef,
    nextPage: () => {
      return epubReaderRef.current?.next();
    },
    prevPage: () => {
      return epubReaderRef.current?.prev();
    },
  };
}
