#To get more informative error messages set this True
DEBUG = True

#DB Settings
SQLALCHEMY_DATABASE_URI = "sqlite:////tmp/vimes.db"

#If this is set to True, then we will not use usernames in urls
#otherwise usernames will be used when visiting some pages.
SINGLE_USER = True

#Secret key
SECRET_KEY = 'change me'
