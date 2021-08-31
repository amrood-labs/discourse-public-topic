import discourseComputed from "discourse-common/utils/decorators";
import Category from "discourse/models/category";

export default {
  name: "extend-category-for-public-topics",
  before: "inject-discourse-objects",
  initialize() {
    Category.reopen({
      @discourseComputed('custom_fields.make_topics_public')
      make_topics_public: {
        set(value) {
          if (typeof(value) == "string") {
            return value === "true";
          } else if (typeof(value) == "boolean") {
            this.set("custom_fields.make_topics_public", value.toString());
            return value;
          }
        }
      }
    });
  }
};
