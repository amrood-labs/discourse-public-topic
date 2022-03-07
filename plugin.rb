# frozen_string_literal: true

# name: discourse-public-topic
# about: Make any topic public to anonymous users.
# version: 0.1
# authors: zaidakram
# org: Amrood Labs
# url: https://github.com/amrood-labs

enabled_site_setting :discourse_public_topic_enabled

after_initialize do
  %w[
    ../lib/discourse_public_topic/engine.rb
    ../config/routes.rb
    ../controllers/discourse_public_topic/contact_us_controller.rb
    ../mailers/discourse_public_topic/contact_mailer.rb
  ].each do |path|
    load File.expand_path(path, __FILE__)
  end

  Site.preloaded_category_custom_fields << 'make_topics_public'
  
  add_to_serializer(:category, :make_topics_public, false) do
    object.custom_fields['make_topics_public']
  end

  # Skip redirect to login for topics#show
  add_to_class(:application_controller, :redirect_to_login_if_required) do
    return if request.format.json? && is_api?

    # Used by clients authenticated via user API.
    # Redirects to provided URL scheme if
    # - request uses a valid public key and auth_redirect scheme
    # - one_time_password scope is allowed
    if !current_user &&
      params.has_key?(:user_api_public_key) &&
      params.has_key?(:auth_redirect)
      begin
        OpenSSL::PKey::RSA.new(params[:user_api_public_key])
      rescue OpenSSL::PKey::RSAError
        return render plain: I18n.t("user_api_key.invalid_public_key")
      end

      if UserApiKey.invalid_auth_redirect?(params[:auth_redirect])
        return render plain: I18n.t("user_api_key.invalid_auth_redirect")
      end

      if UserApiKey.allowed_scopes.superset?(Set.new(["one_time_password"]))
        redirect_to("#{params[:auth_redirect]}?otp=true")
        return
      end
    end

    if !current_user && SiteSetting.login_required? && "#{controller_name}##{action_name}" != 'topics#show'
      flash.keep
      redirect_to_login
      return
    end

    return if !current_user
    return if !should_enforce_2fa?

    redirect_path = path("/u/#{current_user.encoded_username}/preferences/second-factor")
    if !request.fullpath.start_with?(redirect_path)
      redirect_to path(redirect_path)
      nil
    end
  end

  # Let anon users view the topic.
  add_to_class(:guardian, :can_see_topic?) do |topic, hide_deleted = true|
    return false unless topic
    return true if is_admin?
    return false if hide_deleted && topic.deleted_at && !can_see_deleted_topics?(topic.category)

    return true if topic&.category&.custom_fields&.[](:make_topics_public) == 'true'

    if topic.private_message?
      return authenticated? && topic.all_allowed_users.where(id: @user.id).exists?
    end

    return false if topic.shared_draft && !can_see_shared_draft?

    category = topic.category
    can_see_category?(category) &&
      (!category.read_restricted || !is_staged? || secure_category_ids.include?(category.id) || topic.user == user)
  end

  # Make static_controller look into our views folder as well.
  # That is where the contact_us page is.
  add_to_class(:static_controller, :add_contact_us_page_path) do
    prepend_view_path "plugins/discourse-public-topic/views"
  end
  
  # Contact Us page...
  add_model_callback(:static_controller, :before_action) do
    return unless action_name == 'show'
    add_contact_us_page_path
  end

  # Activate user immediatly when they signup if they are in vsao db.
  # Let admin manually activate the rest.
  DiscourseEvent.on :user_confirmed_email do |user|
    url = URI("https://vsao.ch/wp-json/doc-doc/check-member/?email=#{user.email}")
    response = Net::HTTP.get(url)
    parsed_response = JSON.parse(response)

    # This is a block being called by Discourse App.
    # Cant use guard clause here.
    if parsed_response['member'] == 'ja'
      admin = User.real.where(admin: true).first
      reviewable = ReviewableUser.find_by(target: user) ||
        Jobs::CreateUserReviewable.new.execute(user_id: user.id).reviewable

      reviewable.perform(admin, :approve_user)
    end
  end

end
