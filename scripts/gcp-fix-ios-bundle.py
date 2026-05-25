#!/usr/bin/env python3
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

IOS_EDIT = (
    "https://console.cloud.google.com/auth/clients/"
    "839007881987-504p1qnrsrik3evo9hthj0lvl69rvru1.apps.googleusercontent.com"
    "?authuser=1&project=reviewnatin-ph"
)
BUNDLE = "ph.reviewnatin.app"
PROFILE = Path.home() / "Library/Application Support/Google/Chrome/Profile PlaywrightGCP"


def main():
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            channel="chrome",
            headless=False,
            viewport={"width": 1400, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(IOS_EDIT, wait_until="networkidle", timeout=120000)
        page.wait_for_timeout(6000)

        bundle_input = page.locator("cfc-text-field input, mat-form-field input").nth(1)
        bundle_input.wait_for(state="visible", timeout=30000)
        current = bundle_input.input_value()
        print(f"current={current}", flush=True)

        bundle_input.click(click_count=3)
        page.keyboard.press("Meta+A")
        bundle_input.fill(BUNDLE)
        page.wait_for_timeout(500)
        print(f"after_fill={bundle_input.input_value()}", flush=True)

        save = page.get_by_role("button", name="Save")
        save.wait_for(state="visible", timeout=10000)
        for _ in range(20):
            disabled = save.get_attribute("disabled")
            aria = save.get_attribute("aria-disabled")
            if disabled is None and aria != "true":
                break
            page.wait_for_timeout(500)

        save.click(force=True)
        page.wait_for_timeout(5000)
        page.screenshot(path="/tmp/gcp-bundle-saved.png", full_page=True)

        final = bundle_input.input_value()
        print(f"final={final}", flush=True)
        ctx.close()
        if final != BUNDLE:
            sys.exit(1)


if __name__ == "__main__":
    main()
