import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { makeStyles } from "y/utils/makesStyles";
import { useReader } from "./epubReader";
import { apiUpdateBookCurrent, getFileUrl } from "../clientApi";
import { ReaderDrawer, drawerWidth, viewBreakPoint } from "./readerDrawer";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVert from "@mui/icons-material/MoreVert";
import truncate from "lodash/truncate";
import { addMark } from "../clientApi";
import type * as Prisma from "@prisma/client";
import { MarkType } from "y/utils/constants";
import { type GetServerSidePropsResult, type GetServerSideProps } from "next";
import { withSessionSsr } from "y/config";
import { prisma } from "y/server/db";
import groupBy from "lodash/groupBy";
import { getBookToc } from "y/server/service/book";
import {
  type NestedItemData,
  type NestedListItemClick,
} from "y/components/nestedList";

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
  // necessary for content to be below app bar
  //   shim: theme.mixins.toolbar,
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
  const { classes, cx } = useStyles();
  const router = useRouter();
  const query = router.query;
  const id = Number.parseInt(query.id as string);
  const title = props.title;
  const cfi = props.current;
  const bookFileName = props.fileName;
  const content = props.contentPath;
  const contentUrl = getFileUrl(bookFileName, content);

  const { bookItem, nextPage, prevPage, rendition } = useReader({
    highlightList: props.highlights,
    opfUrl: contentUrl,
    bookId: id,
    startCfi: cfi,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const menuOpen = (e) => setMenuAnchorEl(e.currentTarget);
  const menuClose = () => setMenuAnchorEl(null);

  const addBookmark = async () => {
    const { start } = await rendition.current?.currentLocation();
    const range = rendition.current?.getRange(start.cfi);
    const title = getElementHeading(range.startContainer);
    menuClose();
    console.log("current cfi", start);
    await addMark({
      bookId: id,
      type: MarkType.Bookmark,
      selectedString: truncate(range.startContainer.textContent),
      epubcfi: start.cfi,
      title,
    });
    // dispatch(getBookmarkList(id));
  };

  const goBack = async () => {
    router.back();
    const { start } = await rendition.current.currentLocation();
    console.log("current cfi", start);
    await apiUpdateBookCurrent(id, start.cfi as string);
  };

  const handleTocClick = useCallback<NestedListItemClick>(
    ({ src }) => {
      return rendition.current?.display(src);
    },
    [rendition],
  );

  const handleHighlightClick = useCallback(
    ({ epubcfi }: Pick<Prisma.Mark, "epubcfi">) => {
      return rendition.current?.display(epubcfi);
    },
    [rendition],
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
          <IconButton edge="end" color="inherit" onClick={menuOpen}>
            <MoreVert />
          </IconButton>
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
        tocData={props.tocData}
        bookmarks={props.bookmarks}
        highlights={props.highlights}
        onClickToc={handleTocClick}
        onClickHighlight={handleHighlightClick}
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
  return headingText;
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
