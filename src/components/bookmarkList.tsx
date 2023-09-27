import React, { useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import ListItem from "@mui/material/ListItem";
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
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
  },
}));

type BookmarkListItemProps = Prisma.Mark & {
  onClick: (params: Prisma.Mark) => void;
  onRemove: (id: number, bookId: number) => void;
};

function BookmarkListItem(props: BookmarkListItemProps) {
  const { title, selectedString, onClick, id, bookId, onRemove } = props;
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
    onRemove(id, bookId);
  };

  const stopPropagation = (e: React.MouseEvent<HTMLButtonElement>) =>
    e.stopPropagation();

  return (
    <ListItem
      onClick={() => (onClick ? onClick(props) : null)}
      button
      style={{ display: "block", padding: "0" }}
    >
      <Box p={1}>
        <Box display="flex" flexDirection="row">
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
              <MenuItem onClick={removeBookmark}>remove bookmark</MenuItem>
            </Menu>
          </IconButton>
        </Box>
        <Typography variant="body1">{selectedString}</Typography>
      </Box>
      <Divider />
    </ListItem>
  );
}

type BookmarkListProps = {
  onClick: () => void;
  onRemove: (id: number, bookId: number) => void;
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
