"""A short and friendly list web VIMESlication using flask"""
from __future__ import with_statement
from flask import Flask, render_template, g, request
from contextlib import closing
import MySQLdb
import json

VIMES = Flask(__name__)
VIMES.config.from_object('config')
VIMES.config.from_envvar('VIMES_SETTINGS')


def init_db():
    """Create the database structure"""
    with closing(MySQLdb.connect(host=VIMES.config['DB_HOST'], \
        user=VIMES.config['DB_USER'], passwd=VIMES.config['DB_PASSWORD'],\
        db=VIMES.config['DB_DATABASE'])) as sql_db:
        with VIMES.open_resource('schema.sql') as file_handle:
            sql_db.cursor().execute(file_handle.read())
        sql_db.commit()


@VIMES.before_request
def before_request():
    """Add the database to our global request object"""
    g.db = MySQLdb.connect(host=VIMES.config['DB_HOST'], \
        user=VIMES.config['DB_USER'], passwd=VIMES.config['DB_PASSWORD'], \
        db=VIMES.config['DB_DATABASE'])


@VIMES.after_request
def after_request(response):
    """Close database connection when the request is complete"""
    g.db.close()
    return response


@VIMES.route("/")
def start():
    """Display friendly start page"""
    return render_template('start.html')


@VIMES.route("/public/<list_name>")
def public_list(list_name):
    """View/Create public list"""
    cursor = g.db.cursor()
    cursor.execute('select * from list_pages where public = 1 and user_id \
        is NULL and title = %s', list_name)
    row = cursor.fetchone()
    if row != None:
        print row
        data = json.loads(row[4])
        return render_template('list.html', columns=data, \
                column_list=['column-1', 'column-2', 'column-3'])
    return render_template('new_list.html')


@VIMES.route("/save/public/<list_name>", methods=['POST', 'GET'])
def save_list(list_name):
    """Create or update public lists"""
    cursor = g.db.cursor()
    cursor.execute('select * from list_pages where public = 1 and user_id \
            is NULL and title = %s', list_name)
    row = cursor.fetchone()
    if row != None:
        cursor.execute('update list_pages set data = %s where \
                title = %s', (request.form['data'], list_name))
    else:
        cursor.execute('insert into list_pages (data, title, public, user_id)\
                values (%s,%s, 1, NULL)', (request.form['data'], list_name))
    return "Success"


if __name__ == "__main__":
    VIMES.run(host='0.0.0.0')
