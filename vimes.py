"""A short and friendly list web application using flask"""
from __future__ import with_statement
from flask import Flask, render_template, g, request
from contextlib import closing
from sqlalchemy import create_engine, orm
from models import User, ListPage, get_metadata
import json

VIMES = Flask(__name__)
VIMES.config.from_object('config')
VIMES.config.from_envvar('VIMES_SETTINGS')

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


@VIMES.after_request
def after_request(response):
    """Close database connection when the request is complete"""
    return response


@VIMES.route("/")
def start():
    """Display friendly start page"""
    return render_template('start.html')


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
