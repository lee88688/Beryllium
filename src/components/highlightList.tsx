import React, { useMemo, useState } from "react";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { makeStyles } from "../utils/makesStyles";
import { getColorsValue } from "./highlightEditor";
import IconButton from "@mui/material/IconButton";
import MoreVert from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type * as Prisma from "@prisma/client";

const useStyles = makeStyles()((theme) => ({
  title: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    overflow: "hidden",
  },
  color: {
    minWidth: "0.7em",
    minHeight: "0.7em",
    backgroundColor: "currentColor",
    display: "inline-block",
    marginRight: theme.spacing(1),
    borderRadius: "50%",
    border: "0.2em solid rgba(255, 255, 255, 0.9)",
    boxSizing: "content-box",
  },
  titleContent: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
}));

type HighlightListItemProps = Prisma.Mark & {
  onClick: (mark: Prisma.Mark) => void;
  onRemoveMark: (mark: Prisma.Mark) => void;
};

function HighlightListItem(props: HighlightListItemProps) {
  const { color, selectedString, content, title, onClick, onRemoveMark } =
    props;
  const { classes } = useStyles();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement>();

  const menuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };
  const menuClose = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchorEl(undefined);
  };

  const removeBookmark = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); // for menu is in the button, clicking menu will trigger button again without stopPropagation
    setMenuAnchorEl(undefined);
    onRemoveMark(props);
  };

  const stopRipplePropagation = (e: React.UIEvent<HTMLElement>) =>
    e.stopPropagation();

  const comment = !content ? null : (
    <>
      <Typography variant="caption">comment</Typography>
      <Typography variant="body1">{content}</Typography>
    </>
  );

  return (
    <ListItemButton
      onClick={() => (onClick ? onClick(props) : null)}
      style={{ display: "block", padding: "0" }}
    >
      <Box p={1}>
        <Box display="flex" flexDirection="row">
          <Typography className={classes.title} variant="h6">
            <span
              className={classes.color}
              style={{ color: getColorsValue(color) }}
            />
            <span className={classes.titleContent}>{title}</span>
          </Typography>
          <IconButton
            color="inherit"
            onClick={menuOpen}
            onMouseDown={stopRipplePropagation}
            onTouchStart={stopRipplePropagation}
          >
            <MoreVert />
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={menuClose}
              keepMounted
            >
              <MenuItem onClick={removeBookmark}>remove bookmark</MenuItem>
            </Menu>
          </IconButton>
        </Box>
        <Typography variant="body1">{selectedString}</Typography>
        <br />
        {comment}
      </Box>
      <Divider />
    </ListItemButton>
  );
}

type HighlightListProps = {
  highlightList: Prisma.Mark[];
  onClick: (mark: Prisma.Mark) => void;
  // remove from server and rendition to remove mark
  onRemoveMark: (mark: Prisma.Mark) => void;
};

export function HighlightList(props: HighlightListProps) {
  const { onClick, onRemoveMark, highlightList } = props;

  const list = useMemo(
    () => (
      <List>
        {highlightList.map((item) => (
          <HighlightListItem
            key={item.id}
            {...item}
            onClick={onClick}
            onRemoveMark={onRemoveMark}
          />
        ))}
      </List>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlightList],
  );

  return list;
}
