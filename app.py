from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/')
def home():
    return "Welcome to MiniBank"


@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        print("Username:", username)
        print("Password:", password)

    return render_template("login.html")


if __name__ == '__main__':
    app.run(port=5000)