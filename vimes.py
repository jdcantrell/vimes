from __future__ import with_statement
from flask import Flask, render_template, g
from contextlib import closing
import MySQLdb


app = Flask(__name__)
app.config.from_object('config')
app.config.from_envvar('VIMES_SETTINGS')

def init_db():
    with closing(MySQLdb.connect(host = g.DB_HOST, user = g.DB_USER, \
            passwd = g.DB_PASSWORD, db = g.DB_DATABASE)) as db:
        with app.open_resource('schema.sql') as f:
            db.cursor().execute(f.read())
        db.commit()

@app.before_request
def before_request():
    g.db = MySQLdb.connect(host = g.DB_HOST, user = g.DB_USER, \
            passwd = g.DB_PASSWORD, db = g.DB_DATABASE)

@app.after_request
def after_request(response):
    g.db.close()
    return response


@app.route("/")
def start():
    return render_template('start.html')

@app.route("/public/<listname>")
def public_list(listname):
    return render_template('list.html')

if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=8888)
