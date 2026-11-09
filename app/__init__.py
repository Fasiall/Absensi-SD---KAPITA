from pathlib import Path

from flask import Flask, flash, jsonify, redirect, render_template, request, send_from_directory, url_for
from flask_login import LoginManager, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFError, CSRFProtect

from config import Config
from .formatting import jam_id, periode_id, tanggal_id, tanggal_input, tanggal_singkat
from .timeutil import now_local, today_local

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    Path(app.root_path).parent.joinpath("instance").mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message = "Silakan masuk terlebih dahulu."
    login_manager.login_message_category = "warning"

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        try:
            user = db.session.get(User, int(user_id))
        except (TypeError, ValueError):
            return None
        if user and user.aktif:
            return user
        return None

    from .admin import bp as admin_bp
    from .auth import bp as auth_bp
    from .guru import bp as guru_bp
    from .print_cards import bp as print_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(guru_bp, url_prefix="/guru")
    app.register_blueprint(print_bp, url_prefix="/cetak")

    app.jinja_env.filters["tanggal_id"] = tanggal_id
    app.jinja_env.filters["tanggal_singkat"] = tanggal_singkat
    app.jinja_env.filters["tanggal_input"] = tanggal_input
    app.jinja_env.filters["periode_id"] = periode_id
    app.jinja_env.filters["jam_id"] = jam_id

    @app.context_processor
    def inject_globals():
        def page_url(page):
            args = request.args.to_dict(flat=True)
            args["page"] = page
            return url_for(request.endpoint or "auth.login", **args)

        return {
            "school_name": app.config.get("SCHOOL_NAME", "SD KAPITA"),
            "app_name": "Absensi QR Siswa",
            "today": today_local(),
            "now": now_local(),
            "page_url": page_url,
        }

    @app.route("/")
    def index():
        if not current_user.is_authenticated:
            return redirect(url_for("auth.login"))
        if current_user.role == "admin":
            return redirect(url_for("admin.dashboard"))
        return redirect(url_for("guru.scan"))

    @app.route("/sw.js")
    def service_worker():
        response = send_from_directory(
            app.static_folder, "sw.js", mimetype="application/javascript"
        )
        response.headers["Service-Worker-Allowed"] = "/"
        response.headers["Cache-Control"] = "no-cache"
        return response

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    @app.errorhandler(CSRFError)
    def handle_csrf_error(error):
        if request.path.startswith("/guru/api"):
            return (
                jsonify(
                    ok=False,
                    code="csrf",
                    message="Sesi keamanan sudah berakhir. Muat ulang halaman lalu coba lagi.",
                ),
                400,
            )
        flash("Sesi keamanan sudah berakhir. Silakan coba lagi.", "warning")
        return redirect(request.referrer or url_for("auth.login"))

    @app.errorhandler(403)
    def forbidden(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def not_found(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(413)
    def too_large(error):
        flash("Ukuran file terlalu besar. Maksimal 5 MB.", "danger")
        return redirect(request.referrer or url_for("admin.students_import"))

    @app.errorhandler(500)
    def server_error(error):
        db.session.rollback()
        return render_template("errors/500.html"), 500

    with app.app_context():
        db.create_all()

    return app
