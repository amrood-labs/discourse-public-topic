class DiscoursePublicTopic::ContactUsController < ::ApplicationController
  skip_before_action :redirect_to_login_if_required, :check_xhr

  def create
    DiscoursePublicTopic::ContactMailer.notify_about_query(
      params.permit(:name, :email, :query).to_h
    )
    redirect_to thank_you_path
  end
end
