"""A short and friendly list web application using flask"""
from __future__ import with_statement
import json
from contextlib import closing

from flask import Flask, render_template, g, request, session, flash, redirect, url_for, get_flashed_messages
from flaskext.login import LoginManager,  current_user, login_user, logout_user
from flaskext.wtf import Form, PasswordField, TextField, validators
from models import db, User, ListPage

VIMES = Flask(__name__)
VIMES.config.from_object(__name__)
VIMES.config.from_envvar('VIMES_SETTINGS')

db.init_app(VIMES)
login_manager = LoginManager()
login_manager.setup_app(VIMES)

@login_manager.user_loader
def load_user(userid):
  return User.query.filter_by(id=userid).first()

if VIMES.config['SINGLE_USER']:
  multi_user_path = ''
else:
  multi_user_path = '/<username>'

#Models
#Forms
class LoginForm(Form):
  username = TextField('Username', [validators.Required()])
  password = PasswordField('Password', [validators.Required()])

class ProfileForm(Form):
  name = TextField('Username', [validators.Required()])
  fullname = TextField('Full Name')
  password = PasswordField('Password', [validators.Required()])

@VIMES.route("/")
def start():
  """Display friendly start page"""
  if not current_user.is_anonymous():
    if VIMES.config['SINGLE_USER']:
      return display_index(current_user)
    else:
      return redirect('/%s' % current_user)
  return render_template('start.html')

#The following set of functions handle user login/creation stuff
#TODO: maybe move this to a module, or research to other existing modules
@VIMES.route("/login/", methods=["GET", "POST"])
def login():
  form = LoginForm()
  if form.validate_on_submit():
    # login and validate the user...
    user = User.query.filter_by(name=request.form['username'], password=request.form['password']).first()
    if user is not None:
      login_user(user)
      flash("Logged in successfully.")
      return redirect(url_for("start"))
    else:
      return redirect(url_for("create_profile"))
  return render_template("login.html", form=form)

@VIMES.route("/logout/")
def logout():
  logout_user()
  return redirect(url_for('start'))

#Applications views are below
@VIMES.route('/profile/new/', methods=['GET', 'POST'])
def create_profile():
  if current_user.is_authenticated():
    return redirect(url_for('profile'))

  form = ProfileForm()
  if form.validate_on_submit():
    existing_user = User.query.filter_by(name=request.form['name']).first()
    if existing_user:
      pass
    else:
      name = request.form['name']
      fullname = request.form['fullname']
      password = request.form['password']
      user = User(name, fullname, password)
      db.session.add(user)
      db.session.commit()
      return redirect(url_for('start'))
  return render_template('profile.html', form=form)

@VIMES.route('/profile/edit/', methods=['GET', 'POST'])
def profile():
  if current_user.is_anonymous():
    return redirect(url_for('create_profile'))

  form = ProfileForm(obj=current_user)
  if form.validate_on_submit():
    existing_user = User.query.filter_by(name=request.form['name']).first()
    if existing_user:
      if existing_user.id != current_user.id:
        #TODO: warn about name conflict
        pass
      else:
        existing_user.name = request.form['name']
        existing_user.fullname = request.form['fullname']
        existing_user.password = request.form['password']
        db.session.add(existing_user)
        db.session.commit()
  return render_template('profile.html', form=form)




@VIMES.route('/save/%s/<listname>/' % multi_user_path, methods=['POST'])
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

@VIMES.route('%s/<listname>/' % multi_user_path)
def user_list(listname, username = None):
  if not is_current_user(username):
#Show static version of list instead of redirect to start
    return "oops list"

  """View/Create public list"""
  l = ListPage.query.filter_by(url_slug=listname).first()
  if l:
    data = json.loads(l.data)
    return render_template('list.html', columns=data, column_list=['column-1', 'column-2', 'column-3'])

  return render_template('new_list.html')

def is_current_user(username):
  if VIMES.config['SINGLE_USER']:
    return (username is None and current_user.is_authenticated)
  else:
    return (current_user.is_authenticated and current_user.name == username)

def display_index(username):
  lists = ListPage.query.filter_by(user_id=current_user.id).all()
  if lists:
    return render_template('lists.html', lists=lists)
  return render_template('lists.html', lists=lists)


if __name__ == "__main__":
  VIMES.run(host='0.0.0.0')
