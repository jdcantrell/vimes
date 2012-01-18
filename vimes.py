"""A short and friendly list web application using flask"""
from __future__ import with_statement
import json
from contextlib import closing

from flask import Flask, render_template, g, request, session, flash, redirect, url_for, get_flashed_messages
from sqlalchemy import create_engine, orm
from flaskext.openid import OpenID

from models import User, ListPage, get_metadata

VIMES = Flask(__name__)
VIMES.config.from_object(__name__)
VIMES.config.from_envvar('VIMES_SETTINGS')
OID = OpenID(VIMES)

if VIMES.config['SINGLE_USER']:
  multi_user_path = ''
else:
  multi_user_path = '/<username>'

@VIMES.before_request
def before_request():
  """Add the database to our global request object"""

  #TODO: move db engine string to be outside of this function

  #Check our db config, and see what parts we need to add
  if VIMES.config['DB_PASSWORD']:
    db_user = '%s:%s' % (VIMES.config['DB_USER'], VIMES.config['DB_PASSWORD'])
  else:
    db_user = VIMES.config['DB_USER']

  if VIMES.config['DB_HOST'] != '':
    if VIMES.config['DB_PORT'] != '':
      db_host = '@%s:%s' % (VIMES.config['DB_HOST'], VIMES.config['DB_PORT'])
    db_host ='@%s' % VIMES.config['DB_HOST']

  g.db_engine = create_engine('%s%s://%s%s/%s' % \
    (VIMES.config['DB_TYPE'], VIMES.config['DB_DRIVER'], \
    db_user, db_host, VIMES.config['DB_DATABASE']))
  get_metadata().create_all(g.db_engine)

  g.db_session = orm.sessionmaker(bind=g.db_engine)
  g.db = g.db_session()
  g.user = None
  if 'openid' in session:
    g.user = g.db.query(User).filter_by(openid=session['openid']).first()


@VIMES.after_request
def after_request(response):
  """Close database connection when the request is complete"""
  return response

@VIMES.route("/")
def start():
  """Display friendly start page"""
  if g.user is not None:
    if VIMES.config['SINGLE_USER']:
      return display_index(g.user.name)
    else:
      return redirect('/%s' % g.user.name)
  return render_template('start.html')

#The following set of functions handle user login/creation stuff
#TODO: maybe move this to a module, or research to other existing modules
@VIMES.route("/login", methods=['GET', 'POST'])
@OID.loginhandler
def login():
  if g.user is not None:
    return redirect(OID.get_next_url())
  if request.method == 'POST':
    openid = request.form.get('openid')
    if openid:
      return OID.try_login(openid, ask_for=['email', 'fullname', 'nickname'])
  return render_template('login.html', next=OID.get_next_url(), error=OID.fetch_error())

@OID.after_login
def create_or_login(response):
  session['openid'] = response.identity_url
  user = g.db.query(User).filter_by(openid=response.identity_url).first()
  if user is not None:
    flash(u'Successfully logged in!')
    g.user = user
    return redirect(OID.get_next_url())
#TODO: protect SINGLE_USER mode
  return redirect(url_for('create_profile', next=OID.get_next_url(), name=response.fullname or response.nickname, email=response.email))

@VIMES.route('/create', methods=['GET', 'POST'])
def create_profile():
  #TODO: protect SINGLE_USER mode
  if g.user is not None or 'openid' not in session:
    return redirect(url_for('start'))
  if request.method == 'POST':
    name = request.form['name']
    email = request.form['email']
    username = request.form['username']
    if not name:
      flash(u'Error: You must provide a username')
    elif '@' not in email:
      flash(u'Error: You have to enter a valid email address')
    else:
      flash(u'Profile successfully created')
      g.db.add(User(username, name, email, session['openid']))
      g.db.commit()
      return redirect(OID.get_next_url())
  return render_template('create_profile.html', next_url=OID.get_next_url())

@VIMES.route('/profile', methods=['GET', 'POST'])
def profile():
  if g.user is None:
    return redirect(url_for('start'))
  if request.method == 'POST':
    name = request.form['name']
    email = request.form['email']
    username = request.form['username']
    if not name:
      flash(u'Error: You must provide a username')
    elif '@' not in email:
      flash(u'Error: You have to enter a valid email address')
    elif not username:
      flash(u'Error: You must provide a username')
    else:
      flash(u'Profile successfully created')
      g.db.add(User(username, name, email, session['openid']))
      g.db.commit()
      return redirect(OID.get_next_url())
  return render_template('profile.html', next_url=OID.get_next_url())

@VIMES.route('/logout')
def logout():
  session.pop('openid', None)
  flash(u'You have been signed out, thank you and come again!')
  return redirect(OID.get_next_url())

#Applications views are below


@VIMES.route('%s/<listname>/save' % multi_user_path, methods=['POST'])
def save_list(listname, username = None):
  """Create or update public lists"""
  if not is_current_user(username):
    #TODO: return a proper error here
    return "You have failed"

  try:
    page = g.db.query(ListPage).filter_by(user_id=g.user.id, url_slug=listname).one()
    page.data = request.form['data']
  except orm.exc.NoResultFound:
    page = ListPage(g.user.id, 0, listname, request.form['data'])
    g.db.add(page)
    
  g.db.commit()
  return "Success"

@VIMES.route('%s/<listname>' % multi_user_path)
def user_list(listname, username = None):
  if not is_current_user(username):
#Show static version of list instead of redirect to start
    return redirect(url_for('start'))

  """View/Create public list"""
  try:
    page = g.db.query(ListPage).filter_by(url_slug=listname, user_id=g.user.id).one()
    data = json.loads(page.data)
    return render_template('list.html', columns=data, column_list=['column-1', 'column-2', 'column-3'])
  except orm.exc.NoResultFound:
    return render_template('new_list.html')
  return render_template('new_list.html')

def is_current_user(username):
  if VIMES.config['SINGLE_USER']:
    return (username is None and g.user is not None)
  else:
    return (g.user is not None and g.user.name == username)

def display_index(username):
  try:
    lists = g.db.query(ListPage).filter_by(user_id=g.user.id).all()
    return render_template('lists.html', lists=lists)
  except orm.exc.NoResultFound:
    pass
  return render_template('lists.html', lists=lists)


if __name__ == "__main__":
  VIMES.run(host='0.0.0.0')
