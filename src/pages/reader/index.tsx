import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
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
import { useReader } from "./epubReader";
import {
  apiUpdateBookCurrent,
  getFileUrl,
  getMark,
  removeMark,
} from "../clientApi";
import { ReaderDrawer, drawerWidth, viewBreakPoint } from "./readerDrawer";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import truncate from "lodash/truncate";
import { addMark } from "../clientApi";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import { type GetServerSidePropsResult, type GetServerSideProps } from "next";
import { withSessionSsr } from "y/server/wrap";
import { prisma } from "y/server/db";
import groupBy from "lodash/groupBy";
import { getBookToc } from "y/server/service/book";
import {
  type NestedItemData,
  type NestedListItemClick,
} from "y/components/nestedList";
import { useMutation, useQuery } from "@tanstack/react-query";

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
    padding: theme.spacing(3),
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
} & Pick<Prisma.Book, "title" | "current" | "fileName" | "contentPath">;

export default function Reader(props: ReaderProps) {
  const [currentTocItem, setCurrentTocItem] = useState("");

  const { classes, cx } = useStyles();
  const router = useRouter();
  const query = router.query;
  const id = Number.parseInt(query.id as string);
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
    mutationFn: (id: number) => removeMark(id),
  });

  const { bookItem, nextPage, prevPage, epubReaderRef } = useReader({
    highlightList,
    opfUrl: contentUrl,
    bookId: id,
    startCfi: cfi,
    onHighlightRefetch: refetchHighlightList,
    onLocationChange: setCurrentTocItem,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const menuOpen = (e) => setMenuAnchorEl(e.currentTarget);
  const menuClose = () => setMenuAnchorEl(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const addBookmark = async () => {
    if (!epubReaderRef.current) return;

    const location = await epubReaderRef.current.currentLocation();
    const cfi = location.start.cfi;
    const range = epubReaderRef.current.getRange(cfi);
    const title = range.startContainer
      ? getElementHeading(range.startContainer as HTMLElement)
      : "";
    await addMark({
      bookId: id,
      type: MarkType.Bookmark,
      selectedString: truncate(range.startContainer.textContent ?? ""),
      epubcfi: cfi,
      title,
      color: "",
      content: "",
    });
    await bookmarkListQuery.refetch();
  };

  const goBack = async () => {
    void router.push("/bookshelf");
    if (!epubReaderRef.current) return;

    const location = await epubReaderRef.current?.currentLocation();
    const cfi = location.start.cfi;
    console.log("current cfi", location);
    await apiUpdateBookCurrent(id, cfi);
  };

  const handleTocClick = useCallback<NestedListItemClick>(
    ({ src }) => {
      // do not update, keep current nest list's open state
      // setCurrentTocItem(src);
      return epubReaderRef.current?.display(src);
    },
    [epubReaderRef],
  );

  const handleHighlightClick = useCallback(
    ({ epubcfi }: Pick<Prisma.Mark, "epubcfi">) => {
      return epubReaderRef.current?.display(epubcfi);
    },
    [epubReaderRef],
  );

  const handleRemoveMark = useCallback(
    async (mark: Prisma.Mark) => {
      await removeMarkMutation.mutateAsync(mark.id);
      await bookmarkListQuery.refetch();
    },
    [bookmarkListQuery, removeMarkMutation],
  );

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
            <MenuItem onClick={addBookmark}>add bookmark</MenuItem>
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
      />
      <main className={classes.main}>
        <Toolbar />
        <div className={classes.content}>{bookItem}</div>
        <ArrowBackIosIcon
          onClick={prevPage}
          className={cx(classes.pageIcon, classes.prev)}
        />
        <ArrowForwardIosIcon
          onClick={nextPage}
          className={cx(classes.pageIcon, classes.next)}
        />
      </main>
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

export const getServerSideProps: GetServerSideProps<ReaderProps> =
  withSessionSsr(async ({ req, query }) => {
    const userId = req.session.user.id;
    const bookId = Number.parseInt(query.id as string);
    const book = await prisma.book.findFirst({
      where: {
        userId,
        id: bookId,
      },
    });

    if (!book)
      return {
        redirect: {
          permanent: false,
          destination: "/bookshelf",
        },
      } as GetServerSidePropsResult<ReaderProps>;

    const marks = await prisma.mark.findMany({
      where: {
        userId,
        bookId,
      },
    });

    const groups = groupBy(marks, "type");

    const tocData = await getBookToc(book);

    return {
      props: {
        title: book.title,
        current: book.current,
        fileName: book.fileName,
        contentPath: book.contentPath,
        highlights: groups[MarkType.Highlight] ?? [],
        bookmarks: groups[MarkType.Bookmark] ?? [],
        tocData,
      },
    };
  });
