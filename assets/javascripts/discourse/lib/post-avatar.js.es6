import { h } from "virtual-dom";
import { iconNode } from "discourse-common/lib/icon-library";
import { avatarFor } from 'discourse/widgets/post';

import autoGroupFlairForUser from "discourse/plugins/discourse-public-topic/discourse/lib/avatar-flair";

export default function html(attrs) {
  let body;
  if (!attrs.user_id) {
    body = iconNode("far-trash-alt", { class: "deleted-user-avatar" });
  } else {
    body = avatarFor.call(this, this.settings.size, {
      template: attrs.avatar_template,
      username: attrs.username,
      name: attrs.name,
      url: attrs.usernameUrl,
      className: "main-avatar",
      hideTitle: true,
    });
  }

  const result = [body];

  if (attrs.primary_group_flair_url || attrs.primary_group_flair_bg_color) {
    result.push(this.attach("avatar-flair", attrs));
  } else {
    const autoFlairAttrs = autoGroupFlairForUser(this.site, attrs);
    if (autoFlairAttrs) {
      result.push(this.attach("avatar-flair", autoFlairAttrs));
    }
  }

  result.push(h("div.poster-avatar-extra"));

  if (this.settings.displayPosterName) {
    result.push(this.attach("post-avatar-user-info", attrs));
  }

  return result;
}
