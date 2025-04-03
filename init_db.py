from flask import Flask
from models import db, User

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'dein_geheimer_key'

db.init_app(app)

with app.app_context():
    db.create_all()
    
    # Admin-Benutzer erstellen, falls nicht vorhanden
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', role='admin')
        admin.set_password('adminpass')  # Ändere das Passwort danach!
        db.session.add(admin)
        db.session.commit()
        print("Admin-Benutzer erstellt.")
    else:
        print("Admin-Benutzer existiert bereits.")
