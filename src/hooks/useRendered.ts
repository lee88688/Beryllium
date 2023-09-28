import { useEffect, useState } from "react";

export function useRendered(renderState: boolean) {
  const [rendered, setRendered] = useState(!!renderState);

  useEffect(() => {
    if (renderState && !rendered) {
      setRendered(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderState]);

  return [rendered, renderState];
}
