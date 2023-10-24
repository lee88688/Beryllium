import type * as Prisma from "@prisma/client";
import { drawerWidth } from ".";
import { makeStyles } from "y/utils/makesStyles";
import { useState } from "react";
import { useSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { apiCreateCategory, apiLogout } from "../clientApi";
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
import { Hidden, SwipeableDrawer } from "@mui/material";
import noop from "lodash/noop";
import Typography from "@mui/material/Typography";

export type UseDrawerProps = {
  categories: Prisma.Category[];
  selected: number;
  onSelected: (id: number) => void;
};

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

export function useDrawer(props: UseDrawerProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const categories = props.categories;
  const selectedCategory = props.selected;
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const { classes } = useDrawerStyles();

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => apiCreateCategory({ name }),
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
            setMobileOpen(false);
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
    await createCategoryMutation.mutateAsync(categoryName);
    setCategoryDialog(false);
    setCategoryName("");
    enqueueSnackbar("successful created", { variant: "success" });
  };

  const addCategoryDialog = (
    <Dialog open={categoryDialog} classes={{ paper: classes.dialogPaper }}>
      <DialogTitle>添加类别</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <TextField
          value={categoryName}
          onInput={(e) => setCategoryName(e.target.value as string)}
          autoFocus
          label="输入类别名称"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
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

  const drawerItem = (
    <nav className={classes.drawer} aria-label="mailbox folders">
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp>
        <SwipeableDrawer
          container={container}
          variant="temporary"
          anchor={"left"}
          open={mobileOpen}
          onOpen={noop}
          onClose={handleDrawerToggle}
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

  return {
    handleDrawerToggle,
    drawerItem,
  };
}
