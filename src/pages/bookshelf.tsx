import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router'
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import { Hidden } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import useTheme from '@mui/material/styles/useTheme';
import makeStyles from '@mui/material/styles/makeStyles';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ListItemIcon from '@mui/material/ListItemIcon';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import LabelIcon from '@mui/icons-material/Label';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { apiDeleteBook, apiGetBookCurrent, uploadBook } from '../../api/file';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVert from '@mui/icons-material/MoreVert';
import ExitToApp from '@mui/icons-material/ExitToApp';
import Settings from '@mui/icons-material/Settings';
import { useSnackbar } from 'notistack';
// import {
//   getBooks,
//   getCategories,
//   selectBooks,
//   selectCategories,
//   selectCategory,
//   setCategoryAndGetBooks
// } from './bookshelfSlice';
import { apiLogout } from './api/user/logout';
import type * as Prisma from '@prisma/client'
import { apiRemoveCategory } from './api/category/remove';
import { GetServerSideProps } from 'next';
import { prisma } from 'y/server/db';

enum BookMenuType {
  ADD_CATEGORY = 'ADD_CATEGORY',
  REMOVE_FROM_CATEGORY = 'REMOVE_FROM_CATEGORY',
  REMOVE_BOOK = 'REMOVE_BOOK'
};

// const useGridItemStyles = makeStyles(() => ({
//   gridItem: {
//     // width: '180px',
//     // height: '280px',
//     width: '150px',
//     height: '240px',
//     '& > *': {
//       height: '100%'
//     }
//   },
//   tile: {
//     cursor: 'pointer',
//     height: '100%'
//     // position: 'relative'
//   },
//   paper: {
//     position: 'relative'
//   },
//   menuIcon: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1,
//     color: 'white'
//   }
// }));

interface BookShelfItemProps {
  book: Prisma.Book & { category: Prisma.Category[] };
  onClick: () => void;
  onMenuSelected: (type: BookMenuType, id: number) => void;
}

export function getFileUrl(fileName: string, path: string) {
  return `/book-file/${fileName}/${path}`;
}

function BookShelfItem(props: BookShelfItemProps) {
  const { book, onClick } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLDListElement | null>(null);
  const category = book.category;

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
    <Grid className='w-[150px] h-[240px]' item>
      <Paper
        elevation={2}
        className='relative'
        onClick={onClick}
      >
        <IconButton className='absolute t-0 r-0 z-10 text-white' onClick={menuOpen} size="small">
          <MoreVert />
        </IconButton>
        <ImageListItem
          component="div"
          classes={{
            root: 'h-full pointer'
          }}
        >
          <img src={getFileUrl(book.fileName, book.cover)} alt={`${book.fileName} cover`} />
          <ImageListItemBar
            title={book.title}
            subtitle={book.author}
          />
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
        <MenuItem onClick={menuClick(BookMenuType.ADD_CATEGORY, book.id)}>添加到分类</MenuItem>
        {category && (
          <MenuItem onClick={menuClick(BookMenuType.REMOVE_FROM_CATEGORY, book.id)}>从分类中删除</MenuItem>
        )}
        <MenuItem onClick={menuClick(BookMenuType.REMOVE_BOOK, book.id)}>删除书籍</MenuItem>
      </Menu>
    </Grid>
  );
}


const useGridStyles = makeStyles(theme => ({
  root: {
    justifyContent: 'center',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 150px)'
  },
  gridItem: {
    // width: '180px',
    // height: '280px',
    width: '150px',
    height: '240px',
    '& > *': {
      height: '100%'
    }
  },
  addPaper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'rgba(0, 0, 0, 0.2)',
    cursor: 'pointer'
  },
  addInput: {
    display: 'none'
  },
  imgFullWidth: {
    // display: 'block',
    transform: 'none',
    top: '5px',
    left: '0',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '100%'
  },
  selectDialog: {
    minWidth: '300px'
  }
}));

function useBookList() {
  const classes = useGridStyles();
  const addInputRef = useRef(null);
  const router = useRouter()
  const books = useSelector(selectBooks);
  const categories = useSelector(selectCategories);
  const category = useSelector(selectCategory);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  // select category dialog
  const [categoryDialog, setsCategoryDialog] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);

  useEffect(() => {
    dispatch(getBooks());
  }, [dispatch]);

  const currentCategories = categories.filter(name => category !== name);

  const bookClick = (id, book, content, title) => {
    return async () => {
      const { data: cfi } = await apiGetBookCurrent(id);
      const query = new URLSearchParams();
      query.set('book', book);
      query.set('content', content);
      query.set('id', id);
      query.set('cfi', cfi);
      query.set('title', title);
      return router.push(`/reader?${query.toString()}`);
    };
  };

  const bookMenuSelected = async (type, id) => {
    if (type !== BookMenuType.REMOVE_BOOK && Array.isArray(currentCategories) && currentCategories.length === 0) {
      enqueueSnackbar('暂无类别，请添加后重试！');
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
        dispatch(getBooks());
        enqueueSnackbar('移除成功', { variant: 'success' });
        break;
      }
      case BookMenuType.REMOVE_BOOK: {
        if (!id) return;
        await apiDeleteBook(id);
        dispatch(getBooks());
        enqueueSnackbar('删除成功', { variant: 'success' });
        break;
      }
      default: {
        break;
      }
    }
  };

  const inputChange = async () => {
    enqueueSnackbar('start upload');
    const [file] = addInputRef.current.files;
    if (!file) return;
    await uploadBook(file);
    dispatch(getBooks());
    enqueueSnackbar('successful upload', { variant: 'success' });
    addInputRef.current.value = null;
  };

  const handleCategorySelected = name => async () => {
    setsCategoryDialog(false);
    await apiAddBooksToCategory(name, selectedBooks);
    setSelectedBooks([]);
    enqueueSnackbar('添加成功', { variant: 'success' });
  };

  const addItem = category ? null : (
    <Grid onClick={() => addInputRef.current.click()} item className={classes.gridItem} key="add-button">
      <Paper classes={{ root: classes.addPaper }} elevation={2}>
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

  const gridList = (
    <React.Fragment>
      <Grid container className={classes.root} justify="center" spacing={2}>
        {addItem}
        {books.map((book) => (
          <BookShelfItem
            key={book._id}
            book={book}
            onClick={bookClick(book._id, book.fileName, book.contentPath, book.title)}
            onMenuSelected={bookMenuSelected}
          />
        ))}
      </Grid>
      <Dialog classes={{ paper: classes.selectDialog }} open={categoryDialog} onClose={() => setsCategoryDialog(false)}>
        <DialogTitle>选择类别</DialogTitle>
        <List>
          {currentCategories.map(name => (
            <ListItem key={name} button onClick={handleCategorySelected(name)}>
              <ListItemText primary={name}/>
            </ListItem>
          ))}
        </List>
      </Dialog>
    </React.Fragment>
  );
  return {
    gridList
  };
}

const useDrawerStyles = makeStyles(theme => ({
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  exitListItem: {
    color: '#F44336',
    '&:hover': {
      backgroundColor: 'rgba(244, 67, 54, 0.04)'
    },
    '& > div': {
      color: '#F44336'
    }
  },
  dialogPaper: {
    minWidth: '300px'
  }
}));

function useDrawer() {
  const theme = useTheme();
  const classes: Record<string, string> = useDrawerStyles();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const categories = useSelector(selectCategories);
  const selectedCategory = useSelector(selectCategory);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter()

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCategoryClick = name => () => {
    dispatch(setCategoryAndGetBooks(name));
  };

  const exitClick = async () => {
    await apiLogout();
    return router.push('/login');
  };

  const container = window !== undefined ? () => window.document.body : undefined;

  const drawer = (
    <div className={classes.drawerContent}>
      <List>
        <ListItem>
          <Typography variant="h5">Beryllium</Typography>
        </ListItem>
        <ListItem button selected={!selectedCategory} onClick={handleCategoryClick('')}>
          <ListItemIcon><BookIcon /></ListItemIcon>
          <ListItemText primary="我的书籍"/>
        </ListItem>
      </List>
      <Divider />
      <List subheader={<ListSubheader>分类</ListSubheader>}>
        {categories.map(name => (
          <ListItem button key={name} onClick={handleCategoryClick(name)} selected={name === selectedCategory}>
            <ListItemIcon><LabelIcon /></ListItemIcon>
            <ListItemText primary={name}/>
          </ListItem>
        ))}
        <ListItem button onClick={() => {
          setCategoryDialog(true);
          setMobileOpen(false);
        }}>
          <ListItemIcon><AddIcon /></ListItemIcon>
          <ListItemText primary="创建分类"/>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button>
          <ListItemIcon><Settings /></ListItemIcon>
          <ListItemText primary="设置"/>
        </ListItem>
        <ListItem button className={classes.exitListItem} onClick={exitClick}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary="退出登陆"/>
        </ListItem>
      </List>
    </div>
  );

  const createCategory = async () => {
    setCategoryDialog(false);
    await apiCreateCategory(categoryName);
    setCategoryName('');
    dispatch(getCategories());
    enqueueSnackbar('successful created', { variant: 'success' });
  };

  const addCategoryDialog = (
    <Dialog open={categoryDialog} classes={{ paper: classes.dialogPaper }}>
      <DialogTitle>添加类别</DialogTitle>
      <DialogContent>
        <TextField
          value={categoryName}
          onInput={e => setCategoryName(e.target.value)}
          autoFocus
          label="输入类别名称"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={() => {
          setCategoryName('');
          setCategoryDialog(false);
        }}>取消</Button>
        <Button color="primary" onClick={createCategory}>创建</Button>
      </DialogActions>
    </Dialog>
  );

  const drawerItem = (
    <nav className={classes.drawer} aria-label="mailbox folders">
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp implementation="css">
        <Drawer
          container={container}
          variant="temporary"
          anchor={theme.direction === 'rtl' ? 'right' : 'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
      <Hidden xsDown implementation="css">
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="permanent"
          open
        >
          {drawer}
        </Drawer>
      </Hidden>
      { addCategoryDialog }
    </nav>
  );

  return {
    handleDrawerToggle,
    drawerItem
  };
}

const drawerWidth = 240;

// const useStyles = makeStyles((theme) => ({
//   root: {
//     display: 'flex',
//   },
//   appBar: {
//     [theme.breakpoints.up('sm')]: {
//       width: `calc(100% - ${drawerWidth}px)`,
//       marginLeft: drawerWidth,
//     },
//   },
//   sidebarButton: {
//     marginRight: theme.spacing(2),
//     [theme.breakpoints.up('sm')]: {
//       display: 'none',
//     },
//   },
//   appBarTitle: {
//     flexGrow: 1
//   },
//   menuButton: {},
//   // necessary for content to be below app bar
//   toolbar: theme.mixins.toolbar,
//   content: {
//     flexGrow: 1,
//     padding: `${theme.spacing(3)}px 0`,
//   },
// }));

interface BookshelfProps {
  books: Prisma.Book[]
  categories: Prisma.Category[]
}

export default function Bookshelf({books, categories}: BookshelfProps) {
  const { gridList } = useBookList();
  const { handleDrawerToggle, drawerItem } = useDrawer();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const selectedCategory = useSelector(selectCategory);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const menuClose = () => setMenuAnchor(null);
  const menuOpen = e => setMenuAnchor(e.currentTarget);
  const handleRemoveCategory = async () => {
    menuClose();
    await apiRemoveCategory(selectedCategory);
    dispatch(setCategoryAndGetBooks(null));
    dispatch(getCategories());
    enqueueSnackbar('删除成功', { variant: 'success' });
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
    <Container className='flex'>
      <AppBar position="fixed" className=''>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className=''
          >
            <MenuIcon />
          </IconButton>
          <Typography className='flex-grow' variant="h6" noWrap>
            Bookshelf
          </Typography>
          {menuButton}
          <Menu open={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={menuClose}>
            <MenuItem onClick={handleRemoveCategory}>删除类别</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      { drawerItem }
      <main className='flex-grow px-3 py-0'>
        <div className='' />
        {gridList}
      </main>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps<BookshelfProps> = async () => {
  const books = await prisma.book.findMany({ where: { userId: 0 }})

  return {
    props: { books, categories: [] }
  }
}