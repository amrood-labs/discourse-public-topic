import I18n from "I18n";
import { h } from "virtual-dom";

// Removed href of categoires link & hide the 'n more' next to categories.
export default function html(attrs) {
  let title = I18n.t("filters.categories.title");

  let result = [
    h(
      "li.heading",
      h("a.d-link.categories-link", {}, title)
    ),
  ];

  const categories = attrs.categories;
  if (categories.length === 0) {
    return;
  }
  result = result.concat(
    categories.map((c) => this.attach("hamburger-category", c))
  );

  return result;
}
