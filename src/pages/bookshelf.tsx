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
import { Box, Hidden } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import useTheme from '@mui/material/styles/useTheme';
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
import { apiDeleteBook, apiGetBookCurrent, uploadBook } from './clientApi';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVert from '@mui/icons-material/MoreVert';
import ExitToApp from '@mui/icons-material/ExitToApp';
import Settings from '@mui/icons-material/Settings';
// import { useSnackbar } from 'notistack';
// import {
//   getBooks,
//   getCategories,
//   selectBooks,
//   selectCategories,
//   selectCategory,
//   setCategoryAndGetBooks
// } from './bookshelfSlice';
import { apiLogout } from "./clientApi";
import type * as Prisma from '@prisma/client'
import { apiRemoveCategory } from './clientApi';
import { type GetServerSideProps } from 'next';
import { prisma } from 'y/server/db';
import { withSessionSsr } from 'y/config';
import { apiCreateCategory } from './clientApi';
import { apiRemoveBooksFromCategory } from './clientApi';
import { apiAddBooksToCategory } from './clientApi';
import { useSnackbar } from 'notistack';

enum BookMenuType {
  ADD_CATEGORY = 'ADD_CATEGORY',
  REMOVE_FROM_CATEGORY = 'REMOVE_FROM_CATEGORY',
  REMOVE_BOOK = 'REMOVE_BOOK'
};

interface BookShelfItemProps {
  book: Prisma.Book & { category: Prisma.Category[] };
  onClick: () => void;
  onMenuSelected: (type: BookMenuType, id: number) => void;
}

export function getFileUrl(fileName: string, path: string) {
  return `/api/book/file/${fileName}/${path}`;
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

function useBookList(props: BookshelfProps, seleced: number) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter()
  const books = props.books;
  const categories = props.categories;
  const category = seleced;
  const { enqueueSnackbar } = useSnackbar();
  // select category dialog
  const [categoryDialog, setsCategoryDialog] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);

  const currentCategories = categories.find(item => category !== item.id)?.categoryBook ?? [];

  const bookClick = (id: number, book: string, content: string, title: string) => {
    return async () => {
      const { data: cfi } = await apiGetBookCurrent(id);
      const query = new URLSearchParams();
      query.set('book', book);
      query.set('content', content);
      query.set('id', id.toString());
      query.set('cfi', cfi);
      query.set('title', title);
      return router.push(`/reader?${query.toString()}`);
    };
  };

  const bookMenuSelected = async (type: BookMenuType, id: number) => {
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
        // dispatch(getBooks());
        enqueueSnackbar('移除成功', { variant: 'success' });
        break;
      }
      case BookMenuType.REMOVE_BOOK: {
        if (!id) return;
        await apiDeleteBook(id);
        // dispatch(getBooks());
        enqueueSnackbar('删除成功', { variant: 'success' });
        break;
      }
      default: {
        break;
      }
    }
  };

  const inputChange = async () => {
    if (!addInputRef.current) return
    const inputElement = addInputRef.current
    // enqueueSnackbar('start upload');
    const [file] = inputElement.files ?? [];
    if (!file) return;
    await uploadBook(file);
    // dispatch(getBooks());
    enqueueSnackbar('successful upload', { variant: 'success' });
    inputElement.value = '';
  };

  const handleCategorySelected = (id: number) => async () => {
    setsCategoryDialog(false);
    await apiAddBooksToCategory(id, selectedBooks);
    setSelectedBooks([]);
    enqueueSnackbar('添加成功', { variant: 'success' });
  };

  const addItem = category ? null : (
    <Grid onClick={() => addInputRef.current?.click()} item className='w-[150px] h-[240px]' key="add-button">
      <Paper classes={{ root: 'flex justify-center h-full items-center cursor-pointer text-[rgba(0,0,0,0.2)]' }} elevation={2}>
        <AddIcon fontSize="large" />
        <input
          ref={addInputRef}
          onChange={inputChange}
          type="file"
          accept="application/epub+zip"
          className='hidden'
        />
      </Paper>
    </Grid>
  );

  const gridList = (
    <React.Fragment>
      <Grid container className='ml-[240px] w-[calc(100%-240px)] grid justify-center grid-cols-[repeat(auto-fill, 150px)]' spacing={2}>
        {addItem}
        {books.map((book) => (
          <BookShelfItem
            key={book.id}
            book={book}
            onClick={bookClick(book.id, book.fileName, book.contentPath, book.title)}
            onMenuSelected={bookMenuSelected}
          />
        ))}
      </Grid>
      <Dialog classes={{ paper: 'min-w-[300px]' }} open={categoryDialog} onClose={() => setsCategoryDialog(false)}>
        <DialogTitle>选择类别</DialogTitle>
        <List>
          {currentCategories.map(item => (
            <ListItem key={item.id} button onClick={handleCategorySelected(item.categoryId)}>
              <ListItemText primary={item.categoryId}/>
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


type UseDrawerProps = {
  categories: Prisma.Category[];
  selected: number;
  onSelected: (id: number) => void
}

function useDrawer(props: UseDrawerProps) {
  // const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const categories = props.categories;
  const selectedCategory = props.selected;
  // const { enqueueSnackbar } = useSnackbar();
  const router = useRouter()

  // useEffect(() => {
  //   dispatch(getCategories());
  // }, [dispatch]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCategoryClick = (id: number) => () => {
    // dispatch(setCategoryAndGetBooks(id));
    props.onSelected(id)
  };

  const exitClick = async () => {
    await apiLogout();
    return router.push('/login');
  };

  const container = typeof window !== undefined ? () => window.document.body : undefined;

  const drawer = (
    <div className='h-full flex flex-col justify-start items-stretch'>
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
        {categories.map(item => (
          <ListItem button key={item.id} onClick={handleCategoryClick(item.id)} selected={item.id === selectedCategory}>
            <ListItemIcon><LabelIcon /></ListItemIcon>
            <ListItemText primary={item.name}/>
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
        <ListItem button className='text-[#F44336] hover:bg-color-[rgba(244,67,54,0.04)]' onClick={exitClick}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary="退出登陆"/>
        </ListItem>
      </List>
    </div>
  );

  const createCategory = async () => {
    setCategoryDialog(false);
    // await apiCreateCategory(categoryName);
    setCategoryName('');
    // enqueueSnackbar('successful created', { variant: 'success' });
  };

  const addCategoryDialog = (
    <Dialog open={categoryDialog} classes={{ paper: 'min-w-[300px]' }}>
      <DialogTitle>添加类别</DialogTitle>
      <DialogContent>
        <TextField
          value={categoryName}
          onInput={e => setCategoryName(e.target.value as string)}
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
    <nav className={'classes.drawer'} aria-label="mailbox folders">
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Hidden mdUp implementation="css">
        <Drawer
          container={container}
          variant="temporary"
          anchor={'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          classes={{
            paper: 'w-[240px]',
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
            paper: 'w-[240px]',
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

interface BookshelfProps {
  books: Prisma.Book[]
  categories: (Prisma.Category & { categoryBook: Prisma.CategoryBook[] })[]
}

export default function Bookshelf(props: BookshelfProps) {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const { handleDrawerToggle, drawerItem } = useDrawer({ selected: selectedCategory, onSelected: setSelectedCategory, categories: props.categories});
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement>();
  const { gridList } = useBookList(props, selectedCategory);
  // const { enqueueSnackbar } = useSnackbar();

  const menuClose = () => setMenuAnchor(undefined);
  const menuOpen: React.MouseEventHandler<HTMLButtonElement> = (e) => setMenuAnchor(e.currentTarget as HTMLButtonElement);
  const handleRemoveCategory = () => {
    menuClose();
    apiRemoveCategory({ id: selectedCategory });
    // dispatch(setCategoryAndGetBooks(null));
    // dispatch(getCategories());
    // enqueueSnackbar('删除成功', { variant: 'success' });
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
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <AppBar component={'nav'} className='ml-[240px] w-[calc(100%-240px)]'>
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
      <Box component={'main'} sx={{ p: 3 }}>
        <Toolbar/>
        {gridList}
      </Box>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps<BookshelfProps> = withSessionSsr(async ({ req }) => {
  const user = req.session.user
  const books = await prisma.book.findMany({ where: { userId: user.id }})
  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
    // select: {
    //   id: true,
    //   name: true,
    // },
    include: {
      categoryBook: true
    }
  })

  return {
    props: { books, categories }
  }
})