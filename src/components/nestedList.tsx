import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from "react";
import { makeStyles } from "../utils/makesStyles";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useMemoizedFn } from "ahooks";

const NestedListContext = React.createContext({
  selected: "",
  onSelected: (() => {
    /* empty */
  }) as NestedListItemClick,
});

const useItemStyles = makeStyles<{ level?: number }>()(
  (theme, { level = 1 }) => ({
    root: {},
    nested: {
      paddingLeft: theme.spacing(3 * level) + 10,
    },
  }),
);

export type NestedItemData = {
  open?: boolean;
  label: string;
  src: string;
  children?: NestedItemData[];
};

export type NestedListItemClick = (
  params: NestedItemData & { level: number },
) => void;

type NestedListItemProps = {
  level: number;
  data: NestedItemData;
};

function NestedListItem(props: NestedListItemProps) {
  const {
    level,
    data: { label, src, children },
  } = props;
  const { classes } = useItemStyles(props);
  const [open, setOpen] = useState(props.data.open ?? false);

  const { selected, onSelected } = useContext(NestedListContext);

  // when prop open change, update state
  // when this happens, the origin data or selected may change
  const previousPropOpenRef = useRef(open);
  const propOpen = Boolean(props.data.open);
  if (previousPropOpenRef.current !== propOpen) {
    setOpen(propOpen);
    previousPropOpenRef.current = propOpen;
  }

  const handleExpand: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const handleClick: React.MouseEventHandler<HTMLElement> = () => {
    onSelected({ ...props.data, level });
  };

  if (Array.isArray(children) && children.length) {
    return (
      <React.Fragment>
        <ListItemButton
          selected={selected === src}
          className={classes.nested}
          onClick={handleClick}
        >
          <ListItemText primary={label} />
          {open ? (
            <ListItemSecondaryAction>
              <IconButton onClick={handleExpand}>
                <ExpandLess fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          ) : (
            <ListItemSecondaryAction>
              <IconButton onClick={handleExpand}>
                <ExpandMore fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((item) => (
              <NestedListItem key={item.src} data={item} level={level + 1} />
            ))}
          </List>
        </Collapse>
      </React.Fragment>
    );
  }
  return (
    <ListItemButton
      selected={src === selected}
      className={classes.nested}
      onClick={handleClick}
    >
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

type NestedListProps = {
  selected: string;
  data: Array<NestedItemData>;
  onClick: NestedListItemClick;
};

export function NestedList(props: NestedListProps) {
  const { onClick } = props;
  const level = useRef(0);
  const [selected, setSelected] = useState("");

  // should use props.selected to re-generate open state.
  // click item in sub-list may not change props.selected outside.
  const dataWithOpen = useMemo(() => {
    const fn = (data: Array<NestedItemData>) => {
      let isOpen = false;
      const newChildren = data.map((item) => {
        const newItem: NestedItemData = {
          ...item,
          open: props.selected === item.src,
        };
        if (item.children) {
          const [isSomeChildrenOpen, newChildren] = fn(item.children);
          newItem.children = newChildren;
          newItem.open = isSomeChildrenOpen;
        }

        if (!isOpen && newItem.open) {
          isOpen = newItem.open;
        }

        return newItem;
      });

      return [isOpen, newChildren] as const;
    };

    return fn(props.data)[1];
  }, [props.data, props.selected]);

  // when props.selected changes, update current selected
  const previousPropSelectedRef = useRef(props.selected);
  if (previousPropSelectedRef.current !== props.selected) {
    setSelected(props.selected);
    previousPropSelectedRef.current = props.selected;
  }

  const onSelected = useMemoizedFn<NestedListItemClick>((item) => {
    setSelected(item.src);
    onClick(item);
  });

  return (
    <NestedListContext.Provider value={{ selected, onSelected }}>
      <List component="nav">
        {dataWithOpen.map((item) => (
          <NestedListItem key={item.src} data={item} level={level.current} />
        ))}
      </List>
    </NestedListContext.Provider>
  );
}
