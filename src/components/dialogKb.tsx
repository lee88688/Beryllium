import React from "react";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import useVirtualKeyboard from "y/hooks/useVirtualKeyboard";
import { makeStyles } from "y/utils/makesStyles";

const useStyles = makeStyles<{
  isOpen: boolean;
  bottom: string;
}>()((_, { isOpen, bottom }) => {
  if (isOpen) {
    return {
      container: {
        position: "relative",
      },
      root: {
        position: "absolute",
        bottom,
      },
    };
  } else {
    return {
      container: {},
      root: {},
    };
  }
});

export default function DialogKb(props: DialogProps) {
  const { isSupported, isKeyboardOpen, boundingRect } = useVirtualKeyboard();

  const { classes } = useStyles({
    isOpen: isSupported && isKeyboardOpen,
    bottom: boundingRect?.height ? `${boundingRect.height}px` : "50vh",
  });

  return (
    <Dialog
      {...props}
      classes={{
        container: classes.container,
        root: classes.root,
      }}
    />
  );
}
