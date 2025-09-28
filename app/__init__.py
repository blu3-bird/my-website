from flask import Flask , session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
import os

db = SQLAlchemy()


DB_NAME = "database.db"


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = 'arson'
    DATABASE_URL = os.environ.get('DATABASE_URL')

    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://" , "postgresql://" , 1 )
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL or 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    @app.context_processor

    
    def inject_theme():
        return {
            'font_family' : session.get('font_family', 'Arial'),
            'font_size' : session.get('font_size', "12px")
        }


    db.init_app(app)
    #login_manager = LoginManager()
    #login_manager.init_app(app)


    from .views import views
    from .auth import auth  
   # from .views import login

    app.register_blueprint(views, url_prefix="/")
    app.register_blueprint(auth, url_prefix="/")
    migrate = Migrate(app,db)

    login_manager = LoginManager()
    #login_manager.login_view = 'views.login'
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))
    


    return app