# frozen_string_literal: true

# name: discourse-public-topic
# about: Make any topic public to anonymous users.
# version: 0.1
# authors: zaidakram
# url: https://github.com/amrood-labs
# org: Amrood Labs

enabled_site_setting :discourse_public_topic_enabled

PLUGIN_NAME ||= 'discourse-public-topic'

after_initialize do
  Site.preloaded_category_custom_fields << 'make_topics_public'
  
  add_to_serializer(:category, :make_topics_public, false) do
    object.custom_fields['make_topics_public']
  end

  add_to_class(:guardian, :can_see_topic?) do |topic, hide_deleted = true|
    return false unless topic
    return true if is_admin?
    return false if hide_deleted && topic.deleted_at && !can_see_deleted_topics?(topic.category)

    return true if topic.category.custom_fields&.[](:make_topics_public) == 'true'

    if topic.private_message?
      return authenticated? && topic.all_allowed_users.where(id: @user.id).exists?
    end

    return false if topic.shared_draft && !can_see_shared_draft?

    category = topic.category
    can_see_category?(category) &&
      (!category.read_restricted || !is_staged? || secure_category_ids.include?(category.id) || topic.user == user)
  end
end
