import React from "react";
import Hidden from "@mui/material/Hidden";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Drawer from "@mui/material/Drawer";
import { makeStyles } from "y/utils/makesStyles";
import noop from "lodash/noop";

const useDrawerStyles = makeStyles<{ drawerWidth?: number }>()(
  (theme, { drawerWidth }) => ({
    root: {
      [theme.breakpoints.up("sm")]: {
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
  }),
);

type DrawerProps = {
  open: boolean;
  drawerWidth?: number;
  anchor: "right" | "left";
  onDrawerClose: () => void;
  children?: React.ReactNode;
};

export function AutoDrawer(props: DrawerProps) {
  const drawerWidth = props.drawerWidth ?? 340;
  const { classes } = useDrawerStyles({ drawerWidth });

  const container =
    typeof window !== undefined ? () => window.document.body : undefined;

  return (
    <nav className={classes.root}>
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp>
        <SwipeableDrawer
          container={container}
          variant="temporary"
          anchor={props.anchor}
          open={props.open}
          onOpen={noop}
          onClose={props.onDrawerClose}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {props.children}
        </SwipeableDrawer>
      </Hidden>
      <Hidden smDown>
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          anchor={props.anchor}
          variant="permanent"
          open
        >
          {props.children}
        </Drawer>
      </Hidden>
    </nav>
  );
}
