"""Defines the database models used within in Vimes"""
from flaskext.sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
  __tablename__ = 'users'
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(255))
  fullname = db.Column(db.String(255))
  password = db.Column(db.String(255))

  def __init__(self, name, fullname, password):
    self.name = name
    self.fullname = fullname
    self.password = password

  def __repr__(self):
    return "<User('%s', '%s', '%s')>" % (self.name, self.fullname)

  def is_authenticated(self):
    return True

  def is_active(self):
    return True

  def is_anonymous(self):
    return False

  def get_id(self):
    return self.id

class ListPage(db.Model):
  __tablename__ = 'list_pages'
  id = db.Column(db.Integer, primary_key=True)
  public = db.Column(db.Integer)
  url_slug = db.Column(db.String(255))
  data = db.Column(db.Text)
  modify_date = db.Column(db.DateTime)
  modify_user_id = db.Column(db.Integer)
  create_date = db.Column(db.DateTime)
  create_user_id = db.Column(db.Integer)

  user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
  user = db.relationship('User', backref=db.backref('list_pages', order_by=url_slug, lazy='dynamic'))

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

