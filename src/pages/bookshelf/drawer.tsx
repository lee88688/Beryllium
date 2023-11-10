import type * as Prisma from "@prisma/client";
import { drawerWidth } from ".";
import { makeStyles } from "y/utils/makesStyles";
import { useState } from "react";
import { useRouter } from "next/router";
import { apiLogout } from "../clientApi";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Drawer from "@mui/material/Drawer";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/Add";
import BookIcon from "@mui/icons-material/Book";
import LabelIcon from "@mui/icons-material/Label";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ExitToApp from "@mui/icons-material/ExitToApp";
import Settings from "@mui/icons-material/Settings";
import { Box, Hidden, SwipeableDrawer } from "@mui/material";
import Typography from "@mui/material/Typography";

export const useDrawerStyles = makeStyles()((theme) => ({
  drawer: {
    [theme.breakpoints.up("sm")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContent: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  exitListItem: {
    color: "#F44336",
    "&:hover": {
      backgroundColor: "rgba(244, 67, 54, 0.04)",
    },
    "& > div": {
      color: "#F44336",
    },
  },
  dialogPaper: {
    minWidth: "300px",
  },
}));

export type BookshelfDrawerProps = {
  categories: Prisma.Category[];
  selected: number;
  mobileOpen: boolean;
  onSelected: (id: number) => void;
  onMobileOpenChange: (open: boolean) => void;
  onCreateCategory: (name: string) => Promise<void>;
};

export function BookshelfDrawer(props: BookshelfDrawerProps) {
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const categories = props.categories;
  const selectedCategory = props.selected;
  const router = useRouter();

  const { classes } = useDrawerStyles();

  const handleDrawerClose = () => {
    props.onMobileOpenChange(false);
  };

  const handleCategoryClick = (id: number) => () => {
    // dispatch(setCategoryAndGetBooks(id));
    props.onSelected(id);
  };

  const exitClick = async () => {
    await apiLogout();
    return router.push("/login");
  };

  const container =
    typeof window !== undefined ? () => window.document.body : undefined;

  const drawer = (
    <div className={classes.drawerContent}>
      <List>
        <ListItem>
          <Typography variant="h5">Beryllium</Typography>
        </ListItem>
        <ListItemButton
          selected={!selectedCategory}
          onClick={handleCategoryClick(0)}
        >
          <ListItemIcon>
            <BookIcon />
          </ListItemIcon>
          <ListItemText primary="我的书籍" />
        </ListItemButton>
      </List>
      <Divider />
      <List subheader={<ListSubheader>分类</ListSubheader>}>
        {categories.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={handleCategoryClick(item.id)}
            selected={item.id === selectedCategory}
          >
            <ListItemIcon>
              <LabelIcon />
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItemButton>
        ))}
        <ListItemButton
          onClick={() => {
            setCategoryDialog(true);
            props.onMobileOpenChange(false);
          }}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="创建分类" />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItemButton>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="设置" />
        </ListItemButton>
        <ListItemButton className={classes.exitListItem} onClick={exitClick}>
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="退出登陆" />
        </ListItemButton>
      </List>
    </div>
  );

  const createCategory = async () => {
    await props.onCreateCategory(categoryName);
    setCategoryDialog(false);
    setCategoryName("");
  };

  const addCategoryDialog = (
    <Dialog open={categoryDialog} classes={{ paper: classes.dialogPaper }}>
      <DialogTitle>添加类别</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            value={categoryName}
            onInput={(e) => setCategoryName(e.target.value as string)}
            autoFocus
            label="输入类别名称"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setCategoryName("");
            setCategoryDialog(false);
          }}
        >
          取消
        </Button>
        <Button color="primary" onClick={createCategory}>
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <nav className={classes.drawer}>
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp>
        <SwipeableDrawer
          container={container}
          variant="temporary"
          anchor={"left"}
          open={props.mobileOpen}
          onOpen={() => props.onMobileOpenChange(true)}
          onClose={handleDrawerClose}
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
            paper: classes.dialogPaper,
          }}
          variant="permanent"
          open
        >
          {drawer}
        </Drawer>
      </Hidden>
      {addCategoryDialog}
    </nav>
  );
}
