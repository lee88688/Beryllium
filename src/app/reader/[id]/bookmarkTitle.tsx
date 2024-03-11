"use client";

import React, { useEffect, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import DialogKb from "y/components/dialogKb";

type BookmarkTitleProps = {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (title: string) => void;
};

export default function BookmarkTitle(props: BookmarkTitleProps) {
  const [title, setTitle] = useState(props.title);

  useEffect(() => {
    setTitle(props.title);
  }, [props.title]);

  return (
    <DialogKb open={props.open} maxWidth="xs">
      <DialogTitle>书签标题</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            value={title}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            autoFocus
            label="请输入标题"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>取消</Button>
        <Button color="primary" onClick={() => props.onConfirm(title)}>
          确定
        </Button>
      </DialogActions>
    </DialogKb>
  );
}
