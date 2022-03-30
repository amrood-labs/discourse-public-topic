require 'email/build_email_helper'

class DiscoursePublicTopic::ContactMailer < ActionMailer::Base
  include Email::BuildEmailHelper

  layout 'email_template'

  def notify_about_query(contact_details)
    contact_details.merge!(template: 'someone_contacted_via_contact_us')
    build_email('kommunikation@vsao-zh.ch', **contact_details)
  end
end
