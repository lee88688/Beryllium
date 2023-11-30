import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import { makeStyles } from "y/utils/makesStyles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import noop from "lodash/noop";
import {
  type NestedItemData,
  NestedList,
  type NestedListItemClick,
} from "y/components/nestedList";
import Hidden from "@mui/material/Hidden";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Drawer from "@mui/material/Drawer";
import { useRendered } from "../../../hooks/useRendered";
import { HighlightList } from "y/components/highlightList";
import { BookmarkList } from "y/components/bookmarkList";
import type * as Prisma from "@prisma/client";

type TabPanelProps = {
  children: React.ReactNode;
  index: number;
  value: number;
  className: string;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, className } = props;
  const [rendered, curState] = useRendered(value === index);

  return (
    <div
      className={className}
      role="tabpanel"
      hidden={!curState}
      style={{ display: !curState ? "none" : "block" }}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
    >
      {rendered && <Box p={0}>{children}</Box>}
    </div>
  );
}

export const drawerWidth = 340;
export const viewBreakPoint = "sm";

const useDrawerStyles = makeStyles()((theme) => ({
  root: {
    [theme.breakpoints.up(viewBreakPoint)]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawer: {
    maxHeight: "100%;",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  appBar: {
    flexShrink: 0,
  },
  tabPanel: {
    flexGrow: 1,
    overflow: "auto",
  },
  tab: {
    minWidth: 0,
  },
  bottomDrawer: {
    overflow: "visible",
    height: "20px",
  },
}));

type ReaderDrawerProps = {
  id: number;
  open: boolean;
  currentTocItem: string;
  tocData: NestedItemData[];
  bookmarks: Prisma.Mark[];
  highlights: Prisma.Mark[];
  onDrawerClose: () => void;
  onClickToc: NestedListItemClick;
  onClickHighlight: (params: { epubcfi: string }) => void;
  onRemoveMark: (mark: Prisma.Mark) => void;
};

export function ReaderDrawer(props: ReaderDrawerProps) {
  const {
    open,
    tocData,
    bookmarks,
    highlights,
    currentTocItem,
    onDrawerClose,
    onClickToc,
    onClickHighlight,
    onRemoveMark,
  } = props;

  const [tabIndex, setTabIndex] = useState(0);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const { classes } = useDrawerStyles();

  const tocItem = useMemo(
    () => (
      <NestedList
        selected={currentTocItem}
        data={tocData}
        onClick={onClickToc}
      />
    ),
    [tocData, onClickToc, currentTocItem],
  );

  const container =
    typeof window !== undefined ? () => window.document.body : undefined;

  const drawer = (
    <div className={classes.drawer}>
      <AppBar className={classes.appBar} position="static" color="default">
        <Tabs
          value={tabIndex}
          onChange={(_, index: number) => setTabIndex(index)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="目录" classes={{ root: classes.tab }} />
          <Tab label="备注" classes={{ root: classes.tab }} />
          <Tab label="书签" classes={{ root: classes.tab }} />
        </Tabs>
      </AppBar>
      <TabPanel className={classes.tabPanel} value={tabIndex} index={0}>
        {tocItem}
      </TabPanel>
      <TabPanel className={classes.tabPanel} value={tabIndex} index={1}>
        <HighlightList
          highlightList={highlights}
          onClick={onClickHighlight}
          onRemoveMark={onRemoveMark}
        />
      </TabPanel>
      <TabPanel className={classes.tabPanel} value={tabIndex} index={2}>
        <BookmarkList
          bookmarkList={bookmarks}
          onClick={onClickHighlight}
          onRemove={onRemoveMark}
        />
      </TabPanel>
    </div>
  );

  return (
    <nav className={classes.root}>
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp>
        <SwipeableDrawer
          container={container}
          variant="temporary"
          anchor="right"
          open={open}
          onOpen={noop}
          onClose={onDrawerClose}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </SwipeableDrawer>
      </Hidden>
      <Hidden smDown>
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          anchor="right"
          variant="permanent"
          open
        >
          {drawer}
        </Drawer>
      </Hidden>
      {/* used for bottom setting */}
      <SwipeableDrawer
        container={container}
        classes={{ paper: classes.bottomDrawer }}
        anchor="bottom"
        open={bottomDrawerOpen}
        swipeAreaWidth={20}
        disableSwipeToOpen={true}
        onOpen={noop}
        onClose={() => setBottomDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <Box
          sx={{
            visibility: "visible",
            top: `-20px`,
            left: "50%",
            position: "absolute",
            pointerEvents: "auto",
          }}
          onClick={() => setBottomDrawerOpen(!bottomDrawerOpen)}
        >
          {""}
        </Box>
        <Box>test3</Box>
      </SwipeableDrawer>
    </nav>
  );
}
