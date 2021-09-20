import discourseComputed from "discourse-common/utils/decorators";
import { deepMerge } from "discourse-common/lib/object";
import Category from "discourse/models/category";
import PostStream from "discourse/models/post-stream";
import { loadTopicView } from "discourse/models/topic";
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

    PostStream.reopen({
      refresh(opts) {
        console.log('opts', opts);
        opts = opts || {};
        opts.nearPost = parseInt(opts.nearPost, 10);

        if (opts.cancelFilter) {
          this.cancelFilter();
          delete opts.cancelFilter;
        }

        const topic = this.topic;

        console.log('topic ', topic);

        // Do we already have the post in our list of posts? Jump there.
        if (opts.forceLoad) {
          this.set("loaded", false);
        } else {
          console.log('already loaded...')
          const postWeWant = this.posts.findBy("post_number", opts.nearPost);
          if (postWeWant) {
            return Promise.resolve().then(() => this._checkIfShouldShowRevisions());
          }
        }

        // TODO: if we have all the posts in the filter, don't go to the server for them.
        if (!opts.refreshInPlace) {
          this.set("loadingFilter", true);
        }
        this.set("loadingNearPost", opts.nearPost);

        opts = deepMerge(opts, this.streamFilters);

        // Request a topicView
        return loadTopicView(topic, opts)
          .then((json) => {
            console.log('Made it........');
            this.updateFromJson(json.post_stream);
            this.setProperties({
              loadingFilter: false,
              timelineLookup: json.timeline_lookup,
              loaded: true,
            });
            this._checkIfShouldShowRevisions();
          })
          .catch((result) => {
            console.log("Didn't....", result);
            this.errorLoading(result);
            throw new Error(result);
          })
          .finally(() => {
            this.set("loadingNearPost", null);
          });
      },

      errorLoading(result) {
        console.log(result);
        const topic = this.topic;
        this.set("loadingFilter", false);
        topic.set("errorLoading", true);

        const json = result.jqXHR?.responseJSON;
        if (json && json.extras && json.extras.html) {
          topic.set("errorHtml", json.extras.html);
        } else {
          topic.set("errorMessage", I18n.t("topic.server_error.description"));
          topic.set("noRetry", result.jqXHR?.status === 403);
        }
      }
    })
  }
};
