from os import environ

from cleanup import CleanupScheduler
from config import Config
from extensions import db, limiter, login_manager
from flask import Flask, redirect
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.middleware.proxy_fix import ProxyFix

if Config.ENV == "dev":
    environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)
cleanup = CleanupScheduler(app)

if Config.ENV != "dev":
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    Talisman(app, content_security_policy=Config.CSP)

from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.bgremove import bgremove_bp
from routes.marketplace import marketplace_bp
from routes.pfp import pfp_bp
from routes.uploads import uploads_bp
from utils import unauthorized

app.register_blueprint(auth_bp)
app.register_blueprint(pfp_bp)
app.register_blueprint(marketplace_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(bgremove_bp)
app.register_blueprint(uploads_bp)

db.init_app(app)
login_manager.init_app(app)
limiter.init_app(app)
login_manager.login_view = "auth.login"
login_manager.unauthorized_handler = unauthorized

CORS(
    app,
    resources={
        r"/*": {
            "origins": [Config.FRONTEND_URL],
            "supports_credentials": True,
        }
    },
)


@app.route("/", methods=["GET"])
def root():
    return redirect(Config.FRONTEND_URL)


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
