import os
import socket

from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402

app = create_app()


def is_port_in_use(port: int, host: str = "0.0.0.0") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return False
        except OSError:
            return True


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"

    # Cek ketersediaan port sekali pada parent process
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        if is_port_in_use(port):
            original_port = port
            while is_port_in_use(port):
                port += 1
            os.environ["PORT"] = str(port)
            print(f"⚠️  Port {original_port} sedang digunakan. Server dialihkan ke port {port}.")

    port = int(os.environ.get("PORT", str(port)))
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not debug:
        print(f"🚀 Server siap dibuka di: http://127.0.0.1:{port} atau http://localhost:{port}")

    app.run(host="0.0.0.0", port=port, debug=debug)
