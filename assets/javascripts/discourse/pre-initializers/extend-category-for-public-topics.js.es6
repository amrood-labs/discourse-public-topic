import discourseComputed from "discourse-common/utils/decorators";
import Category from "discourse/models/category";
import Site from "discourse/models/site";
import ApplicationController from 'discourse/controllers/application';

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
      },
    });

    ApplicationController.reopen({
      @discourseComputed
      loginRequired() {
        if (
          this.target &&
          this.target.currentState &&
          this.target.currentState.router &&
          this.target.currentState.router.activeTransition &&
          this.target.currentState.router.activeTransition.resolvedModels.topic &&
          !!this.target.currentState.router.activeTransition.resolvedModels.topic.id
        ) {
          this.siteSettings.login_required = false;
          return false;
        }
        return this.siteSettings.login_required && !this.currentUser;
      }
    });
  }
};
