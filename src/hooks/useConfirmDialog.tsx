import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback, useState } from "react";

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const openDialog = useCallback(
    (options: {
      title: string;
      content: string;
      onConfirm?: () => Promise<void> | void;
    }) => {
      setTitle(options.title);
      setContent(options.content);
      setOpen(true);
    },
    [],
  );

  const dialog = (
    <Dialog open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>{content}</Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text">取消</Button>
        <Button variant="text" color="primary">
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { dialog };
}
