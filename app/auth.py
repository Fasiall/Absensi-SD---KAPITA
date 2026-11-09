from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from . import db
from .models import User
from .utils import is_safe_url

bp = Blueprint("auth", __name__)


@bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(_home_for(current_user))

    next_url = request.args.get("next", "")
    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))
        next_url = request.form.get("next", next_url)

        user = User.query.filter(db.func.lower(User.username) == username).first()
        if not user or not user.check_password(password):
            flash("Username atau password salah. Silakan coba lagi.", "danger")
        elif not user.aktif:
            flash("Akun ini sedang dinonaktifkan. Hubungi admin sekolah.", "warning")
        else:
            login_user(user, remember=remember)
            session.permanent = True
            flash(f"Selamat datang, {user.nama}!", "success")
            if next_url and is_safe_url(next_url):
                return redirect(next_url)
            return redirect(_home_for(user))

    return render_template("auth/login.html", next_url=next_url)


@bp.post("/logout")
@login_required
def logout():
    logout_user()
    flash("Anda telah keluar. Sampai jumpa!", "info")
    return redirect(url_for("auth.login"))


@bp.route("/akun/password", methods=["GET", "POST"])
@login_required
def change_password():
    if request.method == "POST":
        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not current_user.check_password(current_password):
            flash("Password saat ini tidak sesuai.", "danger")
        elif len(new_password) < 6:
            flash("Password baru minimal 6 karakter.", "danger")
        elif new_password != confirm_password:
            flash("Konfirmasi password baru tidak sama.", "danger")
        else:
            current_user.set_password(new_password)
            db.session.commit()
            flash("Password berhasil diubah. Gunakan password baru saat masuk berikutnya.", "success")
            return redirect(_home_for(current_user))

    return render_template("auth/password.html")


def _home_for(user):
    if user.role == "admin":
        return url_for("admin.dashboard")
    return url_for("guru.scan")
