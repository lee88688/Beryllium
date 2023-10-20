import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
import { Box, Hidden, SwipeableDrawer } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
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
import { apiCreateCategory, apiDeleteBook, apiGetBookCurrent, apiGetCategory, uploadBook } from "./clientApi";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVert from "@mui/icons-material/MoreVert";
import ExitToApp from "@mui/icons-material/ExitToApp";
import Settings from "@mui/icons-material/Settings";
import { apiLogout } from "./clientApi";
import type * as Prisma from "@prisma/client";
import { apiRemoveCategory } from "./clientApi";
import { type GetServerSideProps } from "next";
import { prisma } from "y/server/db";
import { withSessionSsr } from "y/config";
import { apiRemoveBooksFromCategory } from "./clientApi";
import { apiAddBooksToCategory } from "./clientApi";
import { useSnackbar } from "notistack";
import { makeStyles } from "../utils/makesStyles";
import { useMutation, useQuery } from "@tanstack/react-query";
import noop from 'lodash/noop'

const BOOK_HEIGHT = 240;
const BOOK_WIDTH = 150;

enum BookMenuType {
  ADD_CATEGORY = "ADD_CATEGORY",
  REMOVE_FROM_CATEGORY = "REMOVE_FROM_CATEGORY",
  REMOVE_BOOK = "REMOVE_BOOK",
}

interface BookShelfItemProps {
  book: Prisma.Book & { category: Prisma.Category[] };
  onClick: () => void;
  onMenuSelected: (type: BookMenuType, id: number) => void;
}

export function getFileUrl(fileName: string, path: string) {
  return `/api/book/file/${fileName}/${path}`;
}

const useGridItemStyles = makeStyles()(() => ({
  gridItem: {
    // width: '180px',
    // height: '280px',
    width: "150px",
    height: "240px",
    "& > *": {
      height: "100%",
    },
  },
  tile: {
    cursor: "pointer",
    height: "100%",
    // position: 'relative'
  },
  paper: {
    position: "relative",
  },
  menuIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
    color: "white",
  },
}));

function BookShelfItem(props: BookShelfItemProps) {
  const { book, onClick } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLDListElement | null>(null);
  const category = book.category;

  const { classes } = useGridItemStyles();

  const menuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget as HTMLDListElement);
  };
  const menuClose = () => setAnchorEl(null);

  const menuClick = (type: BookMenuType, id: number) => () => {
    menuClose();
    props.onMenuSelected(type, id);
  };

  return (
    <Grid className={classes.gridItem} item>
      <Paper elevation={2} className={classes.paper} onClick={onClick}>
        <IconButton
          className={classes.menuIcon}
          onClick={menuOpen}
          size="small"
        >
          <MoreVert />
        </IconButton>
        <ImageListItem
          component="div"
          classes={{
            root: classes.tile,
          }}
          style={{ height: '100%' }}
        >
          <img
            src={getFileUrl(book.fileName, book.cover)}
            alt={`${book.fileName} cover`}
          />
          <ImageListItemBar title={book.title} subtitle={book.author} />
        </ImageListItem>
      </Paper>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={menuClose}
        // anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        // transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        keepMounted
      >
        <MenuItem onClick={menuClick(BookMenuType.ADD_CATEGORY, book.id)}>
          添加到分类
        </MenuItem>
        {category && (
          <MenuItem
            onClick={menuClick(BookMenuType.REMOVE_FROM_CATEGORY, book.id)}
          >
            从分类中删除
          </MenuItem>
        )}
        <MenuItem onClick={menuClick(BookMenuType.REMOVE_BOOK, book.id)}>
          删除书籍
        </MenuItem>
      </Menu>
    </Grid>
  );
}

type BookListProps = BookshelfProps & {
  selected: number;
};

const useGridStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  gridItem: {
    width: "150px",
    height: "240px",
    "& > *": {
      height: "100%",
    },
  },
  addPaper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
  },
  addInput: {
    display: "none",
  },
  imgFullWidth: {
    // display: 'block',
    transform: "none",
    top: "5px",
    left: "0",
    maxWidth: "100%",
    height: "auto",
    maxHeight: "100%",
  },
  selectDialog: {
    minWidth: "300px",
  },
}));

function BookList(props: BookListProps) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const books = props.books;
  const categories = props.categories;
  const category = props.selected;
  const { enqueueSnackbar } = useSnackbar();
  // select category dialog
  const [categoryDialog, setsCategoryDialog] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);

  const { classes } = useGridStyles();

  const currentCategories = useMemo(() => {
    return categories.filter((item) => category !== item.id) ?? [];
  }, [categories, category])

  const bookClick = (
    id: number,
    book: string,
    content: string,
    title: string,
  ) => {
    return async () => {
      const { data: cfi } = await apiGetBookCurrent(id);
      const query = new URLSearchParams();
      query.set("book", book);
      query.set("content", content);
      query.set("id", id.toString());
      query.set("cfi", cfi);
      query.set("title", title);
      return router.push(`/reader?${query.toString()}`);
    };
  };

  const bookMenuSelected = async (type: BookMenuType, id: number) => {
    if (
      type !== BookMenuType.REMOVE_BOOK &&
      Array.isArray(currentCategories) &&
      currentCategories.length === 0
    ) {
      enqueueSnackbar("暂无类别，请添加后重试！");
      return;
    }
    switch (type) {
      case BookMenuType.ADD_CATEGORY: {
        setSelectedBooks([...selectedBooks, id]);
        setsCategoryDialog(true);
        break;
      }
      case BookMenuType.REMOVE_FROM_CATEGORY: {
        if (!category) return;
        await apiRemoveBooksFromCategory(category, [id]);
        // dispatch(getBooks());
        enqueueSnackbar("移除成功", { variant: "success" });
        break;
      }
      case BookMenuType.REMOVE_BOOK: {
        if (!id) return;
        await apiDeleteBook(id);
        // dispatch(getBooks());
        enqueueSnackbar("删除成功", { variant: "success" });
        break;
      }
      default: {
        break;
      }
    }
  };

  const inputChange = async () => {
    if (!addInputRef.current) return;
    const inputElement = addInputRef.current;
    enqueueSnackbar("start upload");
    const [file] = inputElement.files ?? [];
    if (!file) return;
    await uploadBook(file);
    // dispatch(getBooks());
    enqueueSnackbar("successful upload", { variant: "success" });
    inputElement.value = "";
  };

  const handleCategorySelected = (id: number) => async () => {
    setsCategoryDialog(false);
    await apiAddBooksToCategory(id, selectedBooks);
    setSelectedBooks([]);
    enqueueSnackbar("添加成功", { variant: "success" });
  };

  const addItem = category ? null : (
    <Grid
      onClick={() => addInputRef.current?.click()}
      item
      className={classes.gridItem}
      key="add-button"
    >
      <Paper
        classes={{
          root: classes.addPaper,
        }}
        elevation={2}
      >
        <AddIcon fontSize="large" />
        <input
          ref={addInputRef}
          onChange={inputChange}
          type="file"
          accept="application/epub+zip"
          className={classes.addInput}
        />
      </Paper>
    </Grid>
  );

  return (
    <React.Fragment>
      <Grid
        container
        direction={"row"}
        className={classes.root}
        rowGap={2}
        columnGap={2}
      >
        {addItem}
        {books.map((book) => (
          <BookShelfItem
            key={book.id}
            book={book}
            onClick={bookClick(
              book.id,
              book.fileName,
              book.contentPath,
              book.title,
            )}
            onMenuSelected={bookMenuSelected}
          />
        ))}
      </Grid>
      <Dialog
        classes={{ paper: classes.selectDialog }}
        open={categoryDialog}
        onClose={() => setsCategoryDialog(false)}
      >
        <DialogTitle>选择类别</DialogTitle>
        <List>
          {currentCategories.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={handleCategorySelected(item.id)}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          ))}
        </List>
      </Dialog>
    </React.Fragment>
  );
}

type UseDrawerProps = {
  categories: Prisma.Category[];
  selected: number;
  onSelected: (id: number) => void;
};

const useDrawerStyles = makeStyles()((theme) => ({
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

function useDrawer(props: UseDrawerProps) {
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
  })

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
        <ListItem button>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="设置" />
        </ListItem>
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
    enqueueSnackbar('successful created', { variant: 'success' });
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

const drawerWidth = 300;

interface BookshelfProps {
  books: Prisma.Book[];
  categories: (Prisma.Category & { categoryBook: Prisma.CategoryBook[] })[];
}

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    [theme.breakpoints.up("sm")]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  sidebarButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  appBarTitle: {
    flexGrow: 1,
  },
  menuButton: {},
  content: {
    flexGrow: 1,
    padding: `${theme.spacing(3)}px 0`,
  },
}));

export default function Bookshelf(props: BookshelfProps) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const { handleDrawerToggle, drawerItem } = useDrawer({
    selected: selectedCategory,
    onSelected: setSelectedCategory,
    categories: props.categories,
  });
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement>();
  const { enqueueSnackbar } = useSnackbar();

  const { classes } = useStyles();

  const categoryQuery = useQuery({
    queryKey: ['getCategory'] as const,
    queryFn: () => apiGetCategory().then(res => res.data),
    initialData: props.categories
  })

  const categories = categoryQuery.data;

  const books = useMemo(() => {
    if (selectedCategory) {
      return categories?.find(item => item.id === selectedCategory)?.categoryBook ?? []
    }

    return props.books
  }, [categories, props.books, selectedCategory])

  const menuClose = () => setMenuAnchor(undefined);
  const menuOpen: React.MouseEventHandler<HTMLButtonElement> = (e) =>
    setMenuAnchor(e.currentTarget as HTMLButtonElement);
  const handleRemoveCategory = () => {
    menuClose();
    apiRemoveCategory({ id: selectedCategory });
    // dispatch(setCategoryAndGetBooks(null));
    // dispatch(getCategories());
    enqueueSnackbar("删除成功", { variant: "success" });
  };

  const menuButton = !selectedCategory ? null : (
    <IconButton
      color="inherit"
      aria-label="open menu"
      edge="end"
      onClick={menuOpen}
    >
      <MoreVert />
    </IconButton>
  );

  return (
    <Box className={classes.root}>
      <AppBar component={"nav"} className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            className={classes.sidebarButton}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography className={classes.appBarTitle} variant="h6" noWrap>
            Bookshelf
          </Typography>
          {menuButton}
          <Menu
            open={Boolean(menuAnchor)}
            anchorEl={menuAnchor}
            onClose={menuClose}
          >
            <MenuItem onClick={handleRemoveCategory}>删除类别</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {drawerItem}
      <Box component={"main"} className={classes.content}>
        <Toolbar />
        <BookList
          categories={categories}
          books={books}
          selected={selectedCategory}
        />
      </Box>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps<BookshelfProps> =
  withSessionSsr(async ({ req }) => {
    const user = req.session.user;
    const books = await prisma.book.findMany({ where: { userId: user.id } });
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
      include: {
        categoryBook: true,
      },
    });

    return {
      props: { books, categories },
    };
  });
