from . import db
from flask_login import UserMixin
from datetime import datetime
from sqlalchemy.sql import func

class User(db.Model , UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(200), nullable=False)
    date_created = db.Column(db.DateTime, default = func.now())
    avatar = db.Column(db.String(300), default = "uploads/user_12.png")
    firstName = db.Column(db.String(50), nullable=False)
    lastName = db.Column(db.String(50), nullable=False)

    def __repr__(self): return f"<User {self.email}>"