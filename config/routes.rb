Discourse::Application.routes.append do
  get 'contact-us', to: 'static#show', id: 'contact_us', as: :contact_us
  post 'contact-us', to: 'discourse_public_topic/contact_us#create'
end
