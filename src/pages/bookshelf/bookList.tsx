import type * as Prisma from "@prisma/client";
import { makeStyles } from "y/utils/makesStyles";
import MoreVert from "@mui/icons-material/MoreVert";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import React, { useMemo, useRef, useState } from "react";
import { type BookshelfProps } from ".";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import {
  apiGetBookCurrent,
  apiRemoveBooksFromCategory,
  apiDeleteBook,
  uploadBook,
  apiAddBooksToCategory,
} from "../clientApi";

export interface BookShelfItemProps {
  book: Prisma.Book & { category: Prisma.Category[] };
  onClick: () => void;
  onMenuSelected: (type: BookMenuType, id: number) => void;
}

function getFileUrl(fileName: string, path: string) {
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

export enum BookMenuType {
  ADD_CATEGORY = "ADD_CATEGORY",
  REMOVE_FROM_CATEGORY = "REMOVE_FROM_CATEGORY",
  REMOVE_BOOK = "REMOVE_BOOK",
}

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
          style={{ height: "100%" }}
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

export type BookListProps = BookshelfProps & {
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

export function BookList(props: BookListProps) {
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
  }, [categories, category]);

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
    await apiAddBooksToCategory(
      selectedBooks.map((bookId) => {
        return {
          bookId,
          categoryId: id,
        };
      }),
    );
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
