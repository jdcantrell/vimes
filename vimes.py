from flask import Flask, render_template
app = Flask(__name__)

@app.route("/")
def start():
    return render_template('start.html')

@app.route("/public/<listname>")
def public_list(listname):
    return render_template('list.html')

if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=8888)
