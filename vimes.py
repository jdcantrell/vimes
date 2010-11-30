"""A short and friendly list web application using flask"""
from __future__ import with_statement
import json

from flask import Flask, render_template, g, request, session, flash, redirect, url_for, get_flashed_messages
from contextlib import closing
from sqlalchemy import create_engine, orm
from flaskext.openid import OpenID

from models import User, ListPage, get_metadata

VIMES = Flask(__name__)
VIMES.config.from_object('config')
VIMES.config.from_envvar('VIMES_SETTINGS')
OID = OpenID(VIMES)


@VIMES.before_request
def before_request():
    """Add the database to our global request object"""
    g.db_engine = create_engine('%s%s://%s:%s@%s%s/%s' % \
        (VIMES.config['DB_TYPE'], VIMES.config['DB_DRIVER'], \
        VIMES.config['DB_USER'], VIMES.config['DB_PASSWORD'], \
        VIMES.config['DB_HOST'], VIMES.config['DB_PORT'], \
        VIMES.config['DB_DATABASE']))
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
    return render_template('start.html')

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
    return redirect(url_for('create_profile', next=OID.get_next_url(), name=response.fullname or response.nickname, email=response.email))

@VIMES.route('/profile', methods=['GET', 'POST'])
def create_profile():
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
            g.db.add(User(username, name, session['openid']))
            g.db.commit()
            return redirect(OID.get_next_url())
    return render_template('profile.html', next_url=OID.get_next_url())

@VIMES.route('/logout')
def logout():
    session.pop('openid', None)
    flash(u'You have been signed out, thank you and come again!')
    return redirect(OID.get_next_url())

@VIMES.route("/public/<list_name>")
def public_list(list_name):
    """View/Create public list"""
    try:
        page = g.db.query(ListPage).filter_by(url_slug=list_name).one()
        data = json.loads(page.data)
        return render_template('list.html', columns=data, \
                column_list=['column-1', 'column-2', 'column-3'])
    except orm.exc.NoResultFound:
        pass
    return render_template('new_list.html')


@VIMES.route("/save/public/<list_name>", methods=['POST', 'GET'])
def save_list(list_name):
    """Create or update public lists"""
    try:
        page = g.db.query(ListPage).filter_by(url_slug=list_name).one()
        page.data = request.form['data']
    except orm.exc.NoResultFound:
        page = ListPage(None, 1, list_name, request.form['data'])
        g.db.add(page)
        
    g.db.commit()
    return "Success"


if __name__ == "__main__":
    VIMES.run(host='0.0.0.0')
