import React, { useState, useEffect, useMemo } from "react";
import isFunction from "lodash/isFunction";
import Paper from "@mui/material/Paper";
import Input from "@mui/material/Input";
import Divider from "@mui/material/Divider";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ColorRadio } from "./colorRadio";
import Button from "@mui/material/Button";
import { makeStyles } from "../utils/makesStyles";

const colors = [
  { label: "red", value: "#F44336" },
  { label: "purple", value: "#9C27B0" },
  { label: "blue", value: "#2196F3" },
  { label: "cyan", value: "#00BCD4" },
  { label: "teal", value: "#009688" },
  { label: "orange", value: "#FF9800" },
  { label: "blue-grey", value: "#607D8B" },
];

const colorsMap: Record<string, string> = colors.reduce(
  (acc, { label, value }) => ({ ...acc, [label]: value }),
  {},
);
export function getColorsValue(label: string) {
  return colorsMap[label];
}

type HighlightEditorProps = {
  color: string;
  content: string;
  onConfirm: (params: Pick<HighlightEditorProps, "color" | "content">) => void;
  onDelete: (params: Pick<HighlightEditorProps, "color" | "content">) => void;
  onCancel: (params: Pick<HighlightEditorProps, "color" | "content">) => void;
  onChange: (params: Pick<HighlightEditorProps, "color" | "content">) => void;
};

const useStyles = makeStyles()(() => ({
  root: {
    width: "300px",
  },
  input: {
    paddingLeft: "5px",
    paddingRight: "5px",
    "&::before": { display: "none" },
    "&::after": { display: "none" },
  },
  radioGroup: {
    paddingLeft: "11px",
    "& > label": {
      marginRight: 0,
    },
  },
  actions: {
    display: "flex",
    flexDirection: "row-reverse",
  },
}));

export function HighlightEditor(props: HighlightEditorProps) {
  const { onChange, onCancel, onDelete, onConfirm, ...otherProps } = props;
  const { classes } = useStyles();
  const [{ color, content }, setEditorContent] = useState({
    color: "",
    content: "",
  });

  useEffect(() => {
    setEditorContent({ color: props.color, content: props.content });
  }, [props.color, props.content]);

  const onEditChange = (type: string) => {
    if (type === "color") {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditorContent({ color: e.target.value, content });
        isFunction(onChange) &&
          onChange({ ...otherProps, color: e.target.value, content });
      };
    } else if (type === "text") {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditorContent({ color, content: e.target.value });
        isFunction(onChange) &&
          onChange({ ...otherProps, color, content: e.target.value });
      };
    }
  };
  const colorRadios = useMemo(() => {
    return colors.map(({ label, value }) => (
      <FormControlLabel
        key={label}
        label=""
        value={label}
        control={<ColorRadio key={label} color={value} />}
      />
    ));
  }, []);

  return (
    <Paper className={classes.root} elevation={3}>
      <RadioGroup
        value={color}
        onChange={onEditChange("color")}
        row
        name="color"
        className={classes.radioGroup}
      >
        {colorRadios}
      </RadioGroup>
      <Divider />
      <Input
        value={content}
        onChange={onEditChange("text")}
        fullWidth
        multiline
        classes={{ root: classes.input }}
        placeholder="comment"
      />
      <Divider />
      <div className={classes.actions}>
        <Button
          key="confirm"
          color="primary"
          onClick={() => {
            isFunction(onConfirm) && onConfirm({ ...props, color, content });
          }}
        >
          confirm
        </Button>
        <Button
          key="delete"
          color="secondary"
          onClick={() => {
            isFunction(onDelete) && onDelete({ ...props, color, content });
          }}
        >
          delete
        </Button>
        <Button
          key="cancel"
          onClick={() => {
            isFunction(onCancel) && onCancel({ ...props, color, content });
          }}
        >
          cancel
        </Button>
      </div>
    </Paper>
  );
}
