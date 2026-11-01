import { Children, cloneElement, isValidElement } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { translate } from "@/lib/translations";

export function T({ children, values }) {
  const { t } = useTranslation();
  return t(children, values);
}

// Translate React children without changing the DOM behind React's back.
export function translateChildren(children, language) {
  const translateChild = child => {
    if (typeof child === "string") {
      const source = child.trim();
      return source ? child.replace(source, translate(language, source)) : child;
    }
    if (isValidElement(child) && child.props.children != null) return cloneElement(child, {}, translateChildren(child.props.children, language));
    return child;
  };
  return Array.isArray(children) ? Children.map(children, translateChild) : translateChild(children);
}
