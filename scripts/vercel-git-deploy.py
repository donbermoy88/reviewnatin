#!/usr/bin/env python3
"""Trigger Vercel git-based deployments via REST API (no GitHub App link required)."""
import json
import os
import sys
import time
import urllib.error
import urllib.request

TEAM = os.environ.get("VERCEL_ORG_ID", "team_b7ae4QPDug0JGfNYDx7gADRU")
REPO = "donbermoy88/reviewnatin"
REPO_ID = 1249226618
ORG, REPO_NAME = REPO.split("/")

PROJECTS = {
    "marketing": {
        "name": "reviewnatin-marketing",
        "id": os.environ.get(
            "VERCEL_PROJECT_ID_MARKETING", "prj_VevT9zkUxx3PnDCTRr4FurIy76q1"
        ),
    },
    "admin": {
        "name": "reviewnatin-admin",
        "id": os.environ.get(
            "VERCEL_PROJECT_ID_ADMIN", "prj_fj7B7ueXTGKlcJAnYnDwcDlauD4e"
        ),
    },
}


def token() -> str:
    if os.environ.get("VERCEL_TOKEN"):
        return os.environ["VERCEL_TOKEN"]
    path = os.path.expanduser("~/Library/Application Support/com.vercel.cli/auth.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)["token"]


def api(method: str, path: str, body: dict | None = None) -> dict:
    data = None
    headers = {
        "Authorization": f"Bearer {token()}",
        "Content-Type": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://api.vercel.com{path}", data=data, headers=headers, method=method
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def deploy(project: dict, ref: str, target: str | None) -> dict:
    payload = {
        "name": project["name"],
        "project": project["id"],
        "gitSource": {
            "type": "github",
            "org": ORG,
            "repo": REPO_NAME,
            "repoId": REPO_ID,
            "ref": ref,
        },
    }
    if target:
        payload["target"] = target
    return api("POST", f"/v13/deployments?teamId={TEAM}", payload)


def wait_ready(deployment_id: str, timeout_s: int = 600) -> dict:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        d = api("GET", f"/v13/deployments/{deployment_id}?teamId={TEAM}")
        state = d.get("readyState")
        print(f"  {deployment_id}: {state}")
        if state in {"READY", "ERROR", "CANCELED"}:
            return d
        time.sleep(15)
    raise TimeoutError(f"Deployment {deployment_id} not ready in {timeout_s}s")


def main() -> None:
    ref = os.environ.get("VERCEL_GIT_REF", "master")
    target = os.environ.get("VERCEL_DEPLOY_TARGET", "production")
    only = os.environ.get("VERCEL_DEPLOY_APP")

    selected = PROJECTS.items()
    if only:
        selected = [(only, PROJECTS[only])]

    results = []
    for label, project in selected:
        print(f"\nDeploying {label} ({project['name']}) ref={ref} target={target or 'preview'}")
        try:
            d = deploy(project, ref, target if target != "preview" else None)
        except urllib.error.HTTPError as e:
            print(e.read().decode(), file=sys.stderr)
            sys.exit(1)
        dep_id = d["id"]
        url = d.get("url", "")
        print(f"  started: {url}")
        final = wait_ready(dep_id)
        if final.get("readyState") != "READY":
            print(json.dumps(final, indent=2), file=sys.stderr)
            sys.exit(1)
        alias = final.get("url")
        print(f"  ready: {alias}")
        results.append((label, alias))

    print("\nDone:")
    for label, url in results:
        print(f"  {label}: {url}")


if __name__ == "__main__":
    main()
