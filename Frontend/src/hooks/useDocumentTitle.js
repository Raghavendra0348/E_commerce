import { useEffect } from "react";

const BASE_TITLE = "Amazon.in: Online Shopping India - Best Deals & Fast Delivery";

export function useDocumentTitle(title, retainOnUnmount = false) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Amazon.in`;
    } else {
      document.title = BASE_TITLE;
    }

    return () => {
      if (!retainOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, retainOnUnmount]);
}

export default useDocumentTitle;
