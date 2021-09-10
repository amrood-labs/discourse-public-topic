import { Placeholder } from "discourse/lib/posts-with-placeholders";
import transformPost from "discourse/plugins/discourse-public-topic/discourse/lib/transform-post";

const DAY = 1000 * 60 * 60 * 24;

let _cloaked = {};
let _heights = {};

let transformCallbacks = null;
function postTransformCallbacks(transformed) {
  if (transformCallbacks === null) {
    return;
  }

  for (let i = 0; i < transformCallbacks.length; i++) {
    transformCallbacks[i].call(this, transformed);
  }
}

export default function html(attrs) {
  const posts = attrs.posts || [],
    postArray = posts.toArray(),
    result = [],
    before = attrs.gaps && attrs.gaps.before ? attrs.gaps.before : {},
    after = attrs.gaps && attrs.gaps.after ? attrs.gaps.after : {},
    mobileView = this.site.mobileView;

  let prevPost;
  let prevDate;

  for (let i = 0; i < postArray.length; i++) {
    const post = postArray[i];

    if (post instanceof Placeholder) {
      result.push(this.attach("post-placeholder"));
      continue;
    }

    const nextPost = i < postArray.length - 1 ? postArray[i + 1] : null;

    const transformed = transformPost(
      this.currentUser,
      this.site,
      post,
      prevPost,
      nextPost
    );
    transformed.canCreatePost = attrs.canCreatePost;
    transformed.mobileView = mobileView;

    if (transformed.canManage || transformed.canSplitMergeTopic) {
      transformed.multiSelect = attrs.multiSelect;

      if (attrs.multiSelect) {
        transformed.selected = attrs.selectedQuery(post);
      }
    }

    if (attrs.searchService) {
      transformed.highlightTerm = attrs.searchService.highlightTerm;
    }

    // Post gap - before
    const beforeGap = before[post.id];
    if (beforeGap) {
      result.push(
        this.attach(
          "post-gap",
          { pos: "before", postId: post.id, gap: beforeGap },
          { model: post }
        )
      );
    }

    // Handle time gaps
    const curTime = new Date(transformed.created_at).getTime();
    if (prevDate) {
      const daysSince = Math.floor((curTime - prevDate) / DAY);
      if (daysSince > this.siteSettings.show_time_gap_days) {
        result.push(this.attach("time-gap", { daysSince }));
      }
    }
    prevDate = curTime;

    transformed.height = _heights[post.id];
    transformed.cloaked = _cloaked[post.id];

    postTransformCallbacks(transformed);

    if (transformed.isSmallAction) {
      result.push(
        this.attach("post-small-action", transformed, { model: post })
      );
    } else {
      transformed.showReadIndicator = attrs.showReadIndicator;
      result.push(this.attach("post", transformed, { model: post }));
    }

    // Post gap - after
    const afterGap = after[post.id];
    if (afterGap) {
      result.push(
        this.attach(
          "post-gap",
          { pos: "after", postId: post.id, gap: afterGap },
          { model: post }
        )
      );
    }

    prevPost = post;
  }

  if (
    attrs.streamFilters &&
    Object.keys(attrs.streamFilters).length &&
    (Object.keys(before).length > 0 || Object.keys(after).length > 0)
  ) {
    result.push(
      this.attach("posts-filtered-notice", {
        posts: postArray,
        streamFilters: attrs.streamFilters,
        filteredPostsCount: attrs.filteredPostsCount,
      })
    );
  }

  return result;
}
