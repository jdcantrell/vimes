from __future__ import with_statement
from flask import Flask, render_template, g, session
from contextlib import closing
import MySQLdb

app = Flask(__name__)
app.config.from_object('config')
app.config.from_envvar('VIMES_SETTINGS')

def init_db():
    with closing(MySQLdb.connect(host = app.config['DB_HOST'], \
        user = app.config['DB_USER'], passwd = app.config['DB_PASSWORD'],\
        db = app.config['DB_DATABASE'])) as db:
        with app.open_resource('schema.sql') as f:
            db.cursor().execute(f.read())
        db.commit()

@app.before_request
def before_request():
    g.db = MySQLdb.connect(host = app.config['DB_HOST'], \
        user = app.config['DB_USER'], passwd = app.config['DB_PASSWORD'], \
        db = app.config['DB_DATABASE'])

@app.after_request
def after_request(response):
    g.db.close()
    return response

@app.route("/")
def start():
    return render_template('start.html')

@app.route("/public/<list>")
def public_list(list):
    cursor = g.db.cursor()
    cursor.execute('select * from list_pages where public = 1 and user_id \
        is NULL and title = %s', g.db.escape_string(list))
    row = cursor.fetchone()
    if row != None:
        return render_template('list.html')
    return render_template('new_list.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0')
