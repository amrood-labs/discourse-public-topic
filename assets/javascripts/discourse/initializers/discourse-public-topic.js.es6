import { withPluginApi } from "discourse/lib/plugin-api";

function initializeDiscoursePublicTopic(api) {
  api.attachWidgetAction('post', 'shareToTwitter', function(){
    const shareUrl = this.attrs.shareUrl;
    window.open(`https://twitter.com/share?&url=${window.location.origin}${shareUrl}`, '_blank').focus();
  });

  api.attachWidgetAction('post', 'shareToFacebook', function(){
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
}

export default {
  name: "discourse-public-topic",

  initialize() {
    withPluginApi("0.8.3", initializeDiscoursePublicTopic);
  }
};
