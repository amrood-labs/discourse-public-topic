import autoGroupFlairForUser from 'discourse/lib/avatar-flair';

let _autoGroupFlair, _noAutoFlair;

export default function initializeAutoGroupFlair(site) {
  _autoGroupFlair = {};
  _noAutoFlair = true;

  [
    "admins",
    "moderators",
    "staff",
    "trust_level_0",
    "trust_level_1",
    "trust_level_2",
    "trust_level_3",
    "trust_level_4",
  ].forEach((groupName) => {
    if (!site.groups) {
      return;
    }

    const group = site.groups.findBy("name", groupName);
    if (group && group.flair_url) {
      _noAutoFlair = false;
      _autoGroupFlair[groupName] = {
        primary_group_flair_url: group.flair_url,
        primary_group_flair_bg_color: group.flair_bg_color,
        primary_group_flair_color: group.flair_color,
        primary_group_name: group.name.replace(/_/g, " "),
      };
    }
  });
}
