import { useEffect } from "react";
import { useTranslation } from "./useTranslation";

const BASE_TITLE = "Amazon.in: Online Shopping India - Best Deals & Fast Delivery";

export function useDocumentTitle(title, retainOnUnmount = false) {
  const { t } = useTranslation();
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${t(title)} | Amazon.in`;
    } else {
      document.title = BASE_TITLE;
    }

    return () => {
      if (!retainOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, retainOnUnmount, t]);
}

export default useDocumentTitle;
