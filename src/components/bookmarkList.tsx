import React, { useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import ListItemButton from "@mui/material/ListItemButton";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import MoreVert from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { makeStyles } from "../utils/makesStyles";
import type * as Prisma from "@prisma/client";

const useStyles = makeStyles()(() => ({
  title: {
    flexGrow: 1,
    flexShrink: 1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

type BookmarkListItemProps = Prisma.Mark & {
  onClick: (params: Prisma.Mark) => void;
  onRemove: (mark: Prisma.Mark) => void;
};

function BookmarkListItem(props: BookmarkListItemProps) {
  const { title, selectedString, onClick, onRemove } = props;
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
    onRemove(props);
  };

  const stopPropagation = (e: React.UIEvent<HTMLButtonElement>) =>
    e.stopPropagation();

  return (
    <ListItemButton
      onClick={() => (onClick ? onClick(props) : null)}
      style={{ display: "block", padding: "0" }}
    >
      <Box p={1}>
        <Box display="flex" flexDirection="row" sx={{ overflow: "hidden" }}>
          <Typography className={classes.title} variant="h6">
            {title}
          </Typography>
          <IconButton
            color="inherit"
            onClick={menuOpen}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
          >
            <MoreVert />
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={menuClose}
              keepMounted
            >
              <MenuItem onClick={removeBookmark}>删除</MenuItem>
            </Menu>
          </IconButton>
        </Box>
        <Typography variant="body1">{selectedString}</Typography>
      </Box>
      <Divider />
    </ListItemButton>
  );
}

type BookmarkListProps = {
  onClick: (params: { epubcfi: string }) => void;
  onRemove: (mark: Prisma.Mark) => void;
  bookmarkList: Prisma.Mark[];
};

export function BookmarkList(props: BookmarkListProps) {
  const { onClick, bookmarkList, onRemove } = props;

  const list = useMemo(
    () => (
      <List>
        {bookmarkList.map((item) => (
          <BookmarkListItem
            key={item.id}
            {...item}
            onClick={onClick}
            onRemove={onRemove}
          />
        ))}
      </List>
    ),
    [bookmarkList, onClick, onRemove],
  );

  return list;
}
