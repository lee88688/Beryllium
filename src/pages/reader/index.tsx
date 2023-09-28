import React, { useState, useMemo } from "react";
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
import { type GetServerSideProps } from "next";
import { withSessionSsr } from "y/config";
import { prisma } from "y/server/db";
import groupBy from "lodash/groupBy";

export const ReaderContext = React.createContext({ rendition: {} });

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
    "max-height": "100%",
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
    right: `${theme.spacing(2)}px`,
  },
  prev: {
    left: `${theme.spacing(2)}px`,
  },
}));

type ReaderProps = {
  highlights: Prisma.Mark[];
  bookmarks: Prisma.Mark[];
};

export default function Reader(props: ReaderProps) {
  const { classes, cx } = useStyles();
  const router = useRouter();
  const query = router.query;
  const id = Number.parseInt(query.id as string);
  const title = query.title as string;
  const cfi = query.cfi as string;
  const bookFileName = query.book as string;
  const content = query.content as string;
  const contentUrl = getFileUrl(bookFileName, content);

  const { bookItem, nextPage, prevPage, rendition } = useReader({
    highlightList: props.highlights,
    opfUrl: contentUrl,
    bookId: id,
    startCfi: cfi,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const contextValue = useMemo(
    () => ({
      rendition,
    }),
    [rendition],
  );

  const menuOpen = (e) => setMenuAnchorEl(e.currentTarget);
  const menuClose = () => setMenuAnchorEl(null);

  const addBookmark = async () => {
    const { start } = await rendition.current.currentLocation();
    const range = rendition.current.getRange(start.cfi);
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

  return (
    <ReaderContext.Provider value={contextValue}>
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
        <ReaderDrawer book={bookFileName} />
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
    </ReaderContext.Provider>
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
    const marks = await prisma.mark.findMany({
      where: {
        userId,
        bookId,
      },
    });

    const groups = groupBy(marks, "type");

    return {
      props: {
        highlights: groups[MarkType.Highlight] ?? [],
        bookmarks: groups[MarkType.Bookmark] ?? [],
      },
    };
  });
