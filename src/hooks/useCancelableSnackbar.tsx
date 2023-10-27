import { enqueueSnackbar, closeSnackbar, SnackbarKey } from "notistack";
import { type ReactNode, useCallback, useRef } from "react";
import { useLatest } from "ahooks";
import { styled } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

export const CircleProgress = styled(CircularProgress)(({
  theme,
  size,
  thickness,
}) => {
  const circleLen = 2 * Math.PI * ((Number(size) - Number(thickness)) / 2);

  return {
    transform: "rotate(-90deg)",
    [`& circle`]: {
      [`@keyframes countdown`]: {
        from: {
          strokeDasharray: `${circleLen}px, ${circleLen}px`,
          strokeDashoffset: 0,
        },
        to: {
          strokeDasharray: `${circleLen}px, ${circleLen}px`,
          strokeDashoffset: circleLen,
        },
      },
      color: "red",
      animation: `5s linear countdown`,
    },
  };
});

export function useCancelableSnackbar() {
  const openCancelableSnackbar = useCallback(
    (options: {
      content: string;
      onComplete?: () => void;
      onCancel?: () => void;
    }) => {
      let key: SnackbarKey | null = null;
      const handleCancel = () => {
        if (key) {
          closeSnackbar(key);
          key = null;
        }

        options.onCancel?.();
      };
      key = enqueueSnackbar(options.content, {
        action: (
          <Button variant="text" color="error" onClick={handleCancel}>
            Undo
          </Button>
        ),
        onExited: () => {
          if (key) {
            options.onComplete?.();
          }
        },
      });
    },
    [],
  );

  return { openCancelableSnackbar };
}
