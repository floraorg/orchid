from flask_login import UserMixin

from extensions import db, login_manager


class OAuthConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    provider = db.Column(db.String(20), nullable=False)  # 'google' or 'github'
    oauth_id = db.Column(db.String(100), nullable=False)

    __table_args__ = (db.UniqueConstraint("provider", "oauth_id"),)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    oauth_connections = db.relationship("OAuthConnection", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class MarketplaceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    image_path = db.Column(db.String(255), nullable=False)
    compressed_path = db.Column(db.String(255), nullable=False)
    categories = db.Column(db.JSON)  # Array of strings stored as JSON
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('marketplace_items', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_path': self.image_path,
            'compressed_path': self.compressed_path,
            'categories': self.categories,
            'is_private': self.is_private,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author': {
                'id': self.author.id,
                'name': self.author.name
            }
        }
