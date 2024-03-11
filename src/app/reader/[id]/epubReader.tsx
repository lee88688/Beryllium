"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { type Contents, type Location } from "epubjs";
import Popper, { type PopperProps } from "@mui/material/Popper";
import { HighlightEditor } from "y/components/highlightEditor";
import { getElementHeading } from "./reader";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import { EpubReader } from "y/utils/epubReader";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { useMemoizedFn, usePrevious } from "ahooks";
import useVirtualKeyboard from "y/hooks/useVirtualKeyboard";
import { addMark, removeMark, updateMark } from "y/app/reader/[id]/actions";

// window.EpubCFI = EpubCFI;

type ExcludeFunction<T> = T extends (...args: unknown[]) => unknown ? never : T;

type VirtualElement = ExcludeFunction<
  Exclude<PopperProps["anchorEl"], null | undefined | HTMLElement>
>;

type UseReaderProps = {
  opfUrl: string;
  bookId: number;
  startCfi: string;
  highlightList: Prisma.Mark[];
  containerEl: HTMLElement | null;
  onHighlightRefetch: () => void;
  onLocationChange: (href: string) => void;
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
  containerEl,
  onHighlightRefetch,
  onLocationChange,
}: UseReaderProps) {
  const epubReaderRef = useRef<EpubReader>();

  // const anchorEl = useRef<VirtualElement>();
  const [anchorEl, setAnchorEl] = useState<VirtualElement | undefined>();
  const [openPopover, setOpenPopover] = useState(false);
  const [curEditorValue, setCurEditorValue] = useState<EditorValue>(
    EMPTY_EDITOR_VALUE(bookId),
  );
  const curEditorValueRef = useRef<EditorValue>(curEditorValue);
  const preEditorValue = useRef(curEditorValue);

  // point curEditorValueRef to curEditorValue
  curEditorValueRef.current = curEditorValue;

  const theme = useTheme();

  const addMarkMutation = useMutation({
    mutationFn: (val: EditorValue) => addMark(val),
  });

  const updateMarkMutation = useMutation({
    mutationFn: (val: EditorValue & { id: number }) => updateMark(val),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeMark({ id }),
  });

  const updateHighlightElement = useCallback((value: EditorValue) => {
    epubReaderRef.current?.updateHighlight(value);
  }, []);

  const clearHighlightEditor = useCallback(
    (hidden?: boolean) => {
      // anchorEl.current = undefined;
      setAnchorEl(undefined);
      setOpenPopover(hidden ?? false);
      setCurEditorValue(EMPTY_EDITOR_VALUE(bookId));
    },
    [bookId],
  );

  const handleSelected = useCallback(
    (epubcfi: string, range: Range, rect: DOMRect, contents: Contents) => {
      const currentWindow = contents.window;
      // when user changes again, temporarily disable editor and show when user stops
      const handleSelectionChange = () => {
        currentWindow.document.removeEventListener(
          "selectionchange",
          handleSelectionChange,
        );
        clearHighlightEditor();
      };
      contents.window.document.addEventListener(
        "selectionchange",
        handleSelectionChange,
      );

      setAnchorEl({
        // nodeType: 1,
        getBoundingClientRect: () => rect,
      });

      const title = getElementHeading(
        range.commonAncestorContainer as HTMLElement,
      );

      setCurEditorValue((val) => {
        let v = val;
        // when val has a id, it means user clicks a existing mark without closing and selects strings.
        if (val.id) {
          v = EMPTY_EDITOR_VALUE(val.bookId);
        }
        return {
          ...v,
          epubcfi,
          selectedString: range.toString(),
          type: MarkType.Highlight,
          title,
        };
      });
      setOpenPopover(true);
    },
    [clearHighlightEditor],
  );

  const { isSupported, boundingRect, isKeyboardOpen } = useVirtualKeyboard();

  const handleMarkClick = useMemoizedFn(
    (epubcfi: string, data: EditorValue, g: SVGGElement) => {
      const preRect: DOMRect = g.getBoundingClientRect();
      setAnchorEl({
        getBoundingClientRect: () => {
          // when editor input click and virtual keyboard show
          // svg may dispear and keep the position
          let rect = g.getBoundingClientRect();
          if (rect.width === 0) {
            rect = preRect;
          }
          return rect;
        },
      });
      // anchorEl.current = g;
      const d = highlightList.find((item) => item.id === data.id) ?? data;
      setCurEditorValue(d);
      setOpenPopover(true);
    },
  );

  const handleRelocated = useMemoizedFn((location: Location) => {
    onLocationChange(location.start.href);
  });

  useEffect(() => {
    const epubReader = new EpubReader(opfUrl, "viewer");
    epubReaderRef.current = epubReader;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).epubReader = epubReaderRef.current;
    epubReader.registerTheme("light", {});
    epubReader.registerTheme("dark", {
      body: {
        color: "white",
      },
    });
    // when book has no current, it is empty string
    void epubReaderRef.current.display(startCfi || 0);
    epubReaderRef.current.on("selected", handleSelected);
    epubReaderRef.current.on("markClicked", handleMarkClick);
    epubReaderRef.current.on("relocated", handleRelocated);

    return () => epubReader.destroy();
  }, [handleMarkClick, handleRelocated, handleSelected, opfUrl, startCfi]);

  useEffect(() => {
    epubReaderRef.current?.once("displayed", () => {
      highlightList.forEach((item) => {
        epubReaderRef.current?.addHighlight(item);
      });
    });
    // todo: temporarily omit this, and add highlightList check later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeMode = theme.palette.mode;
  useEffect(() => {
    epubReaderRef.current?.useTheme(themeMode);
  }, [themeMode]);

  const addMarkMutate = addMarkMutation.mutateAsync;
  const handleEditorChange = useCallback(
    (value: EditorValue) => {
      if (!value.id) {
        // create new highlight
        void addMarkMutate(value).then((res) => {
          setCurEditorValue((val) => {
            const value = { ...val, id: res.data };
            epubReaderRef.current?.addHighlight(value);

            return value;
          });
          onHighlightRefetch();
        });
      }
      setCurEditorValue(value);
    },
    [addMarkMutate, onHighlightRefetch],
  );

  const handleEditorCancel = useCallback(() => {
    // todo: does `updateHighlightElement` really need?
    // canceling will remove changes
    updateHighlightElement(preEditorValue.current);
    setCurEditorValue(EMPTY_EDITOR_VALUE(preEditorValue.current.bookId));
    setOpenPopover(false);
  }, [updateHighlightElement]);

  const updateMarkMutate = updateMarkMutation.mutateAsync;
  const handleConfirm = useCallback(
    async (value: EditorValue) => {
      const val = { ...curEditorValue, ...value };
      if (!val.id) return;

      await updateMarkMutate(val as EditorValue & { id: number });
      updateHighlightElement(value);
      setOpenPopover(false);
      onHighlightRefetch();
    },
    [
      curEditorValue,
      onHighlightRefetch,
      updateHighlightElement,
      updateMarkMutate,
    ],
  );

  const removeMutate = removeMutation.mutateAsync;
  const handleRemove = useCallback(
    async (value: EditorValue) => {
      const { id, epubcfi } = { ...curEditorValue, ...value };
      if (!id) return;

      await removeMutate(id);
      setOpenPopover(false);
      epubReaderRef.current?.removeHighlight(epubcfi);
      onHighlightRefetch();
    },
    [curEditorValue, onHighlightRefetch, removeMutate],
  );

  const preAnchorEl = usePrevious(anchorEl);
  const isKeyboardOpenRef = useRef(isKeyboardOpen);
  if (isSupported && isKeyboardOpenRef.current !== isKeyboardOpen) {
    // when virtual keyboard api is supported
    // use virtual keyboard boundingRect to calculate position
    isKeyboardOpenRef.current = isKeyboardOpen;
    if (isKeyboardOpen) {
      const rect = anchorEl?.getBoundingClientRect();
      setAnchorEl({
        getBoundingClientRect: () => {
          const r = DOMRect.fromRect(rect);
          r.x = window.innerWidth / 2;
          r.width = 0;
          r.y = window.innerHeight - (boundingRect?.height ?? 0) - r.height;
          return r;
        },
      });
    } else {
      setAnchorEl(preAnchorEl);
    }
  }

  const modifiers = useMemo(() => {
    return [
      {
        name: "flip",
        options: {
          rootBoundary: containerEl ?? "document",
        },
      },
    ];
  }, [containerEl]);

  const bookItem = (
    <React.Fragment>
      <div id="viewer" style={{ height: "100%", width: "100%" }}></div>
      <Popper
        open={openPopover}
        anchorEl={anchorEl}
        container={containerEl}
        placement="top"
        modifiers={modifiers}
      >
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
      clearHighlightEditor();
      return epubReaderRef.current?.next();
    },
    prevPage: () => {
      clearHighlightEditor();
      return epubReaderRef.current?.prev();
    },
  };
}
