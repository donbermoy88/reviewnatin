#!/usr/bin/env python3
"""Set GitHub Actions secrets for Vercel auto-deploy via GitHub REST API."""
import base64
import json
import subprocess
import sys
import urllib.request

REPO = "donbermoy88/reviewnatin"
AUTH_PATH = __import__("os").path.expanduser(
    "~/Library/Application Support/com.vercel.cli/auth.json"
)

SECRETS = {
    "VERCEL_TOKEN": None,  # filled from auth.json
    "VERCEL_ORG_ID": "team_b7ae4QPDug0JGfNYDx7gADRU",
    "VERCEL_PROJECT_ID_MARKETING": "prj_VevT9zkUxx3PnDCTRr4FurIy76q1",
    "VERCEL_PROJECT_ID_ADMIN": "prj_fj7B7ueXTGKlcJAnYnDwcDlauD4e",
}


def git_token() -> str:
    out = subprocess.check_output(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        text=True,
    )
    for line in out.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise SystemExit("No GitHub token in git credential store.")


def vercel_token() -> str:
    with open(AUTH_PATH, encoding="utf-8") as f:
        return json.load(f)["token"]


def api(method: str, path: str, token: str, body: dict | None = None) -> dict:
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(
        f"https://api.github.com{path}", data=data, headers=headers, method=method
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def encrypt_secret(public_key_b64: str, secret: str) -> str:
    from nacl import encoding, public

    pk = public.PublicKey(public_key_b64.encode(), encoding.Base64Encoder)
    sealed = public.SealedBox(pk).encrypt(secret.encode())
    return base64.b64encode(sealed).decode()


def main() -> None:
    try:
        from nacl import public  # noqa: F401
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pynacl"])
        from nacl import public  # noqa: F401

    gh = git_token()
    SECRETS["VERCEL_TOKEN"] = vercel_token()

    key = api("GET", f"/repos/{REPO}/actions/secrets/public-key", gh)
    for name, value in SECRETS.items():
        print(f"Setting {name}...")
        api(
            "PUT",
            f"/repos/{REPO}/actions/secrets/{name}",
            gh,
            {
                "encrypted_value": encrypt_secret(key["key"], value),
                "key_id": key["key_id"],
            },
        )
    print("Done. GitHub Actions will auto-deploy on push to master.")


if __name__ == "__main__":
    main()
