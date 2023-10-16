import React, { useMemo } from "react";
import Radio from "@mui/material/Radio";
import { makeStyles } from "../utils/makesStyles";

const useStyles = makeStyles()(() => ({
  root: {
    padding: "8px",
    boxSizing: "content-box",
  },
  icon: {
    width: "1em",
    height: "1em",
    backgroundColor: "currentColor",
    borderRadius: "50%",
    backgroundClip: "content-box",
    border: "0.3em solid rgba(0, 0, 0, 0)",
  },
  checkedIcon: {
    backgroundClip: "border-box",
    border: "0.3em solid rgba(255, 255, 255, 0.75)",
  },
}));

type ColorRadioProps = {
  color: string;
};

export function ColorRadio(props: ColorRadioProps) {
  const { color = "red", ...otherProps } = props;
  const { classes, cx } = useStyles();

  const checkedIcon = useMemo(
    () => (
      <span
        className={cx(classes.icon, classes.checkedIcon)}
        style={{ color }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );

  const icon = useMemo(
    () => <span className={classes.icon} style={{ color }} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );

  return (
    <Radio
      color="default"
      className={classes.root}
      checkedIcon={checkedIcon}
      icon={icon}
      {...otherProps}
    />
  );
}
