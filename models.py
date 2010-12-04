"""Defines the database models used within in Vimes"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, orm, ForeignKey
Base = declarative_base()

def get_metadata():
    """Returns sqlalchemy's metadata object for the models"""
    return Base.metadata

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    fullname = Column(String(255))
    password = Column(String(255))
    openid = Column(String(255))
    email = Column(String(255))

    def __init__(self, name, fullname, email, openid):
        self.name = name
        self.fullname = fullname
        self.email = email
        self.openid = openid

    def __repr__(self):
        return "<User('%s', '%s', '%s')>" % (self.name, self.fullname, self.email, self.openid)

class ListPage(Base):
    __tablename__ = 'list_pages'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    public = Column(Integer)
    url_slug = Column(String(255))
    data = Column(Text)
    modify_date = Column(DateTime)
    modify_user_id = Column(Integer)
    create_date = Column(DateTime)
    create_user_id = Column(Integer)

    user = orm.relationship(User, backref=orm.backref('list_pages', order_by=url_slug))

    def __init__(self, user_id, public, url_slug, data):
        self.user_id = user_id
        self.public = public
        self.url_slug = url_slug
        self.data = data
        self.create_user_id = user_id

    def __repr__(self):
        return "<ListPage('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', \
                '%s'>" % (self.id, self.user_id, self.public, self.url_slug, \
                self.data, self.modify_date, self.modify_user_id, \
                self.create_date, self.create_user_id)
