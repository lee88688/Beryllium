import { enqueueSnackbar } from "notistack";
import { type ReactNode, useCallback, useRef } from "react";
import { useLatest } from "ahooks";
// import { styled } from "@mui/material/styles";
// import CircularProgress from "@mui/material/CircularProgress";
// import UndoIcon from "@mui/icons-material/Undo";
// import IconButton from "@mui/material/IconButton";

// const CircleProgress = styled(CircularProgress)(({
//   theme,
//   size,
//   thickness,
// }) => {
//   const circleLen = 2 * Math.PI * ((Number(size) - Number(thickness)) / 2);

//   return {
//     transform: "rotate(-90deg)",
//     [`& circle`]: {
//       [`@keyframes countdown`]: {
//         from: {
//           strokeDasharray: `${circleLen}px, ${circleLen}px`,
//           strokeDashoffset: 0,
//         },
//         to: {
//           strokeDasharray: `${circleLen}px, ${circleLen}px`,
//           strokeDashoffset: circleLen,
//         },
//       },
//       color: "red",
//       animation: `5s linear countdown`,
//     },
//   };
// });

export function useCancelableSnackbar(options: {
  content: ReactNode;
  onCanceled: () => void;
}) {
  const keyRef = useRef<number | string>();
  const onCanceledRef = useLatest(options.onCanceled);

  const openSnackbar = useCallback(() => {
    keyRef.current = enqueueSnackbar(options.content, {
      action: null,
    });
  }, [options.content]);
}
