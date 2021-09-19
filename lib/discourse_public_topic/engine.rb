# frozen_string_literal: true

module ::DiscoursePublicTopic
  PLUGIN_NAME ||= 'discourse-public-topic'

  class Engine < ::Rails::Engine
    engine_name PLUGIN_NAME
    isolate_namespace DiscoursePublicTopic
  end
end
