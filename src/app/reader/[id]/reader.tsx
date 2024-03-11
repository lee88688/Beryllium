"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { makeStyles } from "y/utils/makesStyles";
import { useReader } from "y/app/reader/[id]/epubReader";
import BookmarkTitle from "y/app/reader/[id]/bookmarkTitle";
import { getFileUrl } from "y/clientApi";
import {
  ReaderDrawer,
  drawerWidth,
  viewBreakPoint,
} from "y/app/reader/[id]/readerDrawer";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import truncate from "lodash/truncate";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import {
  type NestedItemData,
  type NestedListItemClick,
} from "y/components/nestedList";
import { useMutation, useQuery } from "@tanstack/react-query";
import useScreenWakeLock from "y/hooks/useScreenWakeLock";
import { ImagePreview } from "y/app/reader/[id]/imagePreview";
import { useMemoizedFn } from "ahooks";
import {
  addMark,
  getMark,
  removeMark,
  updateBookCurrent,
  updateMark,
} from "y/app/reader/[id]/actions";

type CreateMarkParams = Omit<Prisma.Mark, "id" | "userId">;
type UpdateMarkParams = Pick<Prisma.Mark, "id"> &
  Partial<Omit<Prisma.Mark, "id" | "userId" | "bookId">>;

const useStyles = makeStyles()((theme) => ({
  root: { display: "flex", flexDirection: "row-reverse" },
  appBar: {
    [theme.breakpoints.up(viewBreakPoint)]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginRight: `${drawerWidth}px`,
    },
  },
  appBarTitle: {
    flexGrow: 1,
  },
  main: {
    display: "flex",
    position: "relative",
    flexDirection: "column",
    height: "100vh",
    maxHeight: "100%",
    overflow: "hidden",
    flexGrow: 1,
    "& $shim": {
      // display: 'none',
      flexShrink: 0,
      [theme.breakpoints.up(viewBreakPoint)]: {
        display: "block",
      },
    },
  },
  content: {
    flexGrow: 1,
    overflow: "hidden",
    padding: theme.spacing(2),
  },
  pageIcon: {
    display: "none",
    cursor: "pointer",
    position: "absolute",
    top: "50%",
    fontSize: "2rem",
    [theme.breakpoints.up(viewBreakPoint)]: {
      display: "block",
    },
  },
  next: {
    right: theme.spacing(2),
  },
  prev: {
    left: theme.spacing(2),
  },
}));

type ReaderProps = {
  highlights: Prisma.Mark[];
  bookmarks: Prisma.Mark[];
  tocData: NestedItemData[];
} & Pick<Prisma.Book, "id" | "title" | "current" | "fileName" | "contentPath">;

export default function Reader(props: ReaderProps) {
  const [currentTocItem, setCurrentTocItem] = useState("");
  const currentCfiRef = useRef(props.current);

  const { classes, cx } = useStyles();
  const router = useRouter();
  const id = props.id;
  const title = props.title;
  const cfi = props.current;
  const bookFileName = props.fileName;
  const content = props.contentPath;
  const contentUrl = getFileUrl(bookFileName, content);

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const highlightListQuery = useQuery({
    queryKey: ["getMark", id, MarkType.Highlight] as const,
    queryFn: () =>
      getMark({ bookId: id, type: MarkType.Highlight }).then((res) => res.data),
    initialData: props.highlights,
  });

  const highlightList = highlightListQuery.data;

  const refetchHighlightList = useCallback(() => {
    return highlightListQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookmarkListQuery = useQuery({
    queryKey: ["getMark", id, MarkType.Bookmark],
    queryFn: () =>
      getMark({ bookId: id, type: MarkType.Bookmark }).then((res) => res.data),
    initialData: props.bookmarks,
  });

  const bookmarkList = bookmarkListQuery.data;

  const removeMarkMutation = useMutation({
    mutationFn: (id: number) => removeMark({ id }),
  });

  const containerElRef = useRef<HTMLDivElement>(null);

  const { bookItem, nextPage, prevPage, epubReaderRef } = useReader({
    highlightList,
    opfUrl: contentUrl,
    bookId: id,
    startCfi: cfi,
    containerEl: containerElRef.current,
    onHighlightRefetch: refetchHighlightList,
    onLocationChange: setCurrentTocItem,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const menuOpen = (e) => setMenuAnchorEl(e.currentTarget);
  const menuClose = () => setMenuAnchorEl(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useScreenWakeLock();

  useEffect(() => {
    void router.prefetch("/bookshelf");
  }, [router]);

  const reportCurrentLocation = useCallback(async () => {
    const location = await epubReaderRef.current?.currentLocation();
    const cfi = location?.start?.cfi;
    if (!cfi || currentCfiRef.current === cfi) return;
    currentCfiRef.current = cfi;
    await updateBookCurrent({ bookId: id, current: cfi });
  }, [epubReaderRef, id]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(reportCurrentLocation, 1000);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [reportCurrentLocation]);

  const goBack = async () => {
    void router.push("/bookshelf");
    if (!epubReaderRef.current) return;

    return reportCurrentLocation();
  };

  const handleTocClick = useMemoizedFn<NestedListItemClick>(({ src }) => {
    // do not update, keep current nest list's open state
    // setCurrentTocItem(src);
    return epubReaderRef.current?.display(src);
  });

  const handleHighlightClick = useMemoizedFn(
    ({ epubcfi }: Pick<Prisma.Mark, "epubcfi">) => {
      return epubReaderRef.current?.display(epubcfi);
    },
  );

  const handleRemoveMark = useMemoizedFn(async (mark: Prisma.Mark) => {
    await removeMarkMutation.mutateAsync(mark.id);
    await Promise.all([
      bookmarkListQuery.refetch(),
      highlightListQuery.refetch(),
    ]);
    epubReaderRef.current?.removeHighlightById(mark.id);
  });

  // add or update bookmark
  const [bookmarkTitleOpen, setBookmarkTitleOpen] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const createOrUpdateBookmarkRef = useRef<
    CreateMarkParams | UpdateMarkParams | undefined
  >();

  const addBookmark = async () => {
    if (!epubReaderRef.current) return;

    const location = await epubReaderRef.current.currentLocation();
    const cfi = location.start.cfi;
    const range = epubReaderRef.current.getRange(cfi);
    const title = range.startContainer
      ? getElementHeading(range.startContainer as HTMLElement)
      : "";
    createOrUpdateBookmarkRef.current = {
      bookId: id,
      type: MarkType.Bookmark,
      selectedString: truncate(range.startContainer.textContent ?? ""),
      epubcfi: cfi,
      title,
      color: "",
      content: "",
    };
    setBookmarkTitleOpen(true);
    setBookmarkTitle(title);
  };

  const handleBookmarkTitleConfirm = async (title: string) => {
    if (!createOrUpdateBookmarkRef.current) return;

    setBookmarkTitleOpen(false);
    const mark = createOrUpdateBookmarkRef.current;
    if ((mark as UpdateMarkParams).id) {
      await updateMark({
        ...(mark as UpdateMarkParams),
        title,
      });
    } else {
      await addMark({
        ...(mark as CreateMarkParams),
        title,
      });
    }
    createOrUpdateBookmarkRef.current = undefined;
    await bookmarkListQuery.refetch();
  };

  const handleModifyMark = useMemoizedFn((mark: Prisma.Mark) => {
    createOrUpdateBookmarkRef.current = {
      id: mark.id,
      title: mark.title,
    } as UpdateMarkParams;
    setBookmarkTitleOpen(true);
    setBookmarkTitle(mark.title);
  });

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={goBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" noWrap className={classes.appBarTitle}>
            {title}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={addBookmark}>
            <BookmarkBorderIcon />
          </IconButton>
          {isSmDown && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuOpenIcon />
            </IconButton>
          )}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={menuClose}
            keepMounted
          >
            <MenuItem onClick={addBookmark}>添加书签</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <ReaderDrawer
        id={id}
        open={drawerOpen}
        currentTocItem={currentTocItem}
        tocData={props.tocData}
        bookmarks={bookmarkList}
        highlights={highlightList}
        onDrawerClose={() => setDrawerOpen(false)}
        onClickToc={handleTocClick}
        onClickHighlight={handleHighlightClick}
        onRemoveMark={handleRemoveMark}
        onModifyMark={handleModifyMark}
      />
      <main className={classes.main}>
        <Toolbar />
        <div ref={containerElRef} className={classes.content}>
          {bookItem}
        </div>
        <ArrowBackIosIcon
          onClick={prevPage}
          className={cx(classes.pageIcon, classes.prev)}
        />
        <ArrowForwardIosIcon
          onClick={nextPage}
          className={cx(classes.pageIcon, classes.next)}
        />
      </main>
      <BookmarkTitle
        open={bookmarkTitleOpen}
        title={bookmarkTitle}
        onCancel={() => setBookmarkTitleOpen(false)}
        onConfirm={handleBookmarkTitleConfirm}
      />
      <ImagePreview />
    </div>
  );
}

export function getElementHeading(el: HTMLElement) {
  let headingText = el.textContent;
  let curEl = el;
  const isBody = () => curEl.tagName && curEl.tagName.toLowerCase() === "body";
  while (!isBody()) {
    const tagName = curEl.tagName ? curEl.tagName.toLowerCase() : "";
    if (tagName.startsWith("h")) {
      headingText = curEl.textContent;
      break;
    } else if (!!curEl.previousElementSibling) {
      curEl = curEl.previousElementSibling as HTMLElement;
    } else {
      curEl = curEl.parentElement!;
    }
  }
  return headingText ?? "";
}
