import { withPluginApi } from "discourse/lib/plugin-api";

function initializeDiscoursePublicTopic(api) {
  // https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/lib/plugin-api.js.es6
}

export default {
  name: "discourse-public-topic",

  initialize() {
    withPluginApi("0.8.3", initializeDiscoursePublicTopic);
  }
};
