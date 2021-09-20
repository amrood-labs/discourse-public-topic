import { withPluginApi } from "discourse/lib/plugin-api";

import Category from "discourse/models/category";
import postStreamhtml from "discourse/plugins/discourse-public-topic/discourse/lib/post-stream";
import postAvatarhtml from "discourse/plugins/discourse-public-topic/discourse/lib/post-avatar";
import hamburgerCategoriesHTML from "discourse/plugins/discourse-public-topic/discourse/lib/hamburger-categories";

function initializeDiscoursePublicTopic(api) {

  // Use updated postTransform in post-stream widget
  api.reopenWidget('post-stream', {
    html: postStreamhtml
  });

  // Use updated autoGroupFlairForUser in post-avatar widget
  api.reopenWidget('post-avatar', {
    html: postAvatarhtml
  });

  // Share buttons on every post...
  api.attachWidgetAction('post', 'shareToTwitter', function() {
    const shareUrl = this.attrs.shareUrl;
    window.open(`https://twitter.com/share?&url=${window.location.origin}${shareUrl}`, '_blank').focus();
  });

  api.attachWidgetAction('post', 'shareToFacebook', function() {
    const shareUrl = this.attrs.shareUrl;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}${shareUrl}`, '_blank').focus();
  });

  api.addPostMenuButton('twitter', () => {
    return {
      action: 'shareToTwitter',
      icon: 'fab-twitter',
      className: 'fab-twitter',
      title: 'twitter.title',
      position: 'first'
    };
  });

  api.addPostMenuButton('facebook', () => {
    return {
      action: 'shareToFacebook',
      icon: 'fab-facebook',
      className: 'fab-facebook',
      title: 'facebook.title',
      position: 'first'
    };
  });

  Category.reopenClass({
    // Override this for case when there are no categories.
    findById(id) {
      if (!id || !Category._idMap()) {
        return;
      }
      return Category._idMap()[id];
    }
  });

  // Reopen widget to remove the href on categories link.
  api.reopenWidget('hamburger-categories', {
    html: hamburgerCategoriesHTML
  });
}

export default {
  name: "discourse-public-topic",
  initialize() {
    withPluginApi("0.8.3", initializeDiscoursePublicTopic);
  }
};
