class DiscoursePublicTopic::ContactUsController < ::ApplicationController
  skip_before_action :redirect_to_login_if_required, :check_xhr

  def create
    message = DiscoursePublicTopic::ContactMailer.notify_about_query(
      params.permit(:name, :email, :query).to_h
    )
    Email::Sender.new(message, :someone_contacted_via_contact_us).send
    redirect_to thank_you_path
  end
end
