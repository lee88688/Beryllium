import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback, useMemo, useState } from "react";

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [resolve, setResolve] = useState<() => void>();
  const [reject, setReject] = useState<() => void>();

  const openDialog = useCallback(
    (options: {
      title: string;
      content: string;
    }) => {
      setTitle(options.title);
      setContent(options.content);
      setOpen(true);

      return new Promise<void>((resolve, reject) => {
        setResolve(() => resolve);
        setReject(() => reject);
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    resolve?.();
    setResolve(undefined);
    setReject(undefined);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    reject?.();
    setOpen(false);
    setResolve(undefined);
    setReject(undefined);
  }, [reject]);

  const dialog = useMemo(
    () => (
      <Dialog open={open}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <Box sx={{ pt: 1 }}>{content}</Box>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={handleCancel}>
            取消
          </Button>
          <Button variant="text" color="primary" onClick={handleConfirm}>
            确定
          </Button>
        </DialogActions>
      </Dialog>
    ),
    [content, handleCancel, handleConfirm, open, title],
  );

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  return { dialog, openDialog, closeDialog };
}
