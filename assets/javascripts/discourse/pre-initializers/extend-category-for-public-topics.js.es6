import EmberObject from "@ember/object";
import discourseComputed from "discourse-common/utils/decorators";
import { deepMerge } from "discourse-common/lib/object";
import Category from "discourse/models/category";
import PostStream from "discourse/models/post-stream";
import { loadTopicView } from "discourse/models/topic";
import ActionSummary from "discourse/models/action-summary";
import Post from "discourse/models/post";
import Site from "discourse/models/site";
import User from "discourse/models/user";
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

    Post.reopenClass({
      munge(json) {
        if (json.actions_summary) {
          // If any can_act or acted is not there, then its an annon user...
          json.actions_summary = json.actions_summary.filter((a) => {
            return (a.can_act !== undefined || a.acted !== undefined)
          });

          const lookup = EmberObject.create();

          // this area should be optimized, it is creating way too many objects per post
          json.actions_summary = json.actions_summary.map((a) => {
            a.actionType = Site.current().postActionTypeById(a.id);
            a.count = a.count || 0;
            const actionSummary = ActionSummary.create(a);
            lookup[a.actionType.name_key] = actionSummary;

            if (a.actionType.name_key === "like") {
              json.likeAction = actionSummary;
            }
            return actionSummary;
          });

          json.actionByName = lookup;
        }

        if (json && json.reply_to_user) {
          json.reply_to_user = User.create(json.reply_to_user);
        }

        return json;
      }
    });
  }
};
