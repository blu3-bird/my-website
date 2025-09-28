from app import create_app
from app import db
from flask import session

app = create_app()


if __name__ == "__main__":
    app.run(debug=True)

print(app.url_map)
