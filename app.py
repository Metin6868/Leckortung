from flask import Flask, render_template
from flask_login import LoginManager, login_required, current_user
from models import db, User
from auth import auth_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'dein_geheimer_key'

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Blueprint registrieren
app.register_blueprint(auth_bp)

# Beispiel für geschützte Startseite
@app.route('/')
@login_required
def index():
    return render_template('index.html', user=current_user)

if __name__ == '__main__':
    app.run(debug=True)
