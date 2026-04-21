"""
Playwright end-to-end test for tracebug using share_id: 2b12fd77-efe2-4a9f-9eec-c18e7de59f2a
"""

from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3000"
SHARE_ID = "2b12fd77-efe2-4a9f-9eec-c18e7de59f2a"
SESSION_ID = "f5fe8cf2-d8a0-4d07-9811-4e571875ef33"

SCREENSHOTS_DIR = "/tmp/tracebug-screenshots"

import os
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        passed = []
        failed = []

        def ok(name):
            print(f"  ✓ {name}")
            passed.append(name)

        def fail(name, err):
            print(f"  ✗ {name}: {err}")
            failed.append((name, str(err)))

        # ── Test 1: Landing page loads ──────────────────────────────────────────
        print("\n[1] Landing page")
        try:
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            page.screenshot(path=f"{SCREENSHOTS_DIR}/01-landing.png")

            assert page.is_visible("#landing"), "Landing div not visible"
            assert page.is_hidden("#session"), "Session div should be hidden"
            assert page.is_visible("#share-id-input"), "Share ID input missing"
            assert page.is_visible("button:has-text('Load Session')")
            ok("Landing page renders correctly")
        except Exception as e:
            fail("Landing page renders correctly", e)

        # ── Test 2: Enter share_id via URL query param ──────────────────────────
        print("\n[2] Load session via URL query param")
        try:
            page.goto(f"{BASE_URL}/?share_id={SHARE_ID}")
            page.wait_for_load_state("networkidle")
            # Wait for session view to become visible
            page.wait_for_selector("#session:not(.hidden)", timeout=8000)
            page.screenshot(path=f"{SCREENSHOTS_DIR}/02-session-via-url.png")
            ok("Session loaded via URL query param")
        except Exception as e:
            fail("Session loaded via URL query param", e)

        # ── Test 3: Header shows correct IDs ────────────────────────────────────
        print("\n[3] Session header IDs")
        try:
            share_id_text = page.text_content("#header-share-id")
            session_id_text = page.text_content("#header-session-id")
            assert share_id_text == SHARE_ID, f"Expected {SHARE_ID}, got {share_id_text}"
            assert session_id_text == SESSION_ID, f"Expected {SESSION_ID}, got {session_id_text}"
            ok(f"Header shows share_id={SHARE_ID[:8]}… and session_id={SESSION_ID[:8]}…")
        except Exception as e:
            fail("Header shows correct IDs", e)

        # ── Test 4: Messages rendered in timeline ────────────────────────────────
        print("\n[4] Timeline messages")
        try:
            message_cards = page.locator(".message-card").all()
            assert len(message_cards) >= 1, f"Expected ≥1 message cards, got {len(message_cards)}"
            ok(f"{len(message_cards)} message card(s) rendered")

            # Each card has a type badge and timestamp
            for i, card in enumerate(message_cards):
                badge = card.locator(".message-type-badge")
                assert badge.count() == 1, f"Card {i} missing type badge"
            ok("Each message card has a type badge")
        except Exception as e:
            fail("Timeline messages rendered", e)

        # ── Test 5: Pipeline pills / trace panel ────────────────────────────────
        print("\n[5] Trace panel")
        try:
            # Every message card should have a trace panel or 'No trace data'
            panels = page.locator(".trace-panel, .trace-empty").all()
            assert len(panels) >= 1, "No trace panels or empty trace divs found"
            ok(f"{len(panels)} trace panel/empty element(s) found")
        except Exception as e:
            fail("Trace panel elements present", e)

        # ── Test 6: Load session via form submission ─────────────────────────────
        print("\n[6] Load session via form (from landing page)")
        try:
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            page.fill("#share-id-input", SHARE_ID)
            page.screenshot(path=f"{SCREENSHOTS_DIR}/03-form-filled.png")
            page.click("button:has-text('Load Session')")
            page.wait_for_selector("#session:not(.hidden)", timeout=8000)
            page.screenshot(path=f"{SCREENSHOTS_DIR}/04-session-after-form.png")
            ok("Session loaded via form submit")
        except Exception as e:
            fail("Load session via form submit", e)

        # ── Test 7: Error for unknown share_id ──────────────────────────────────
        print("\n[7] Error handling – unknown share_id")
        try:
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            page.fill("#share-id-input", "00000000-0000-0000-0000-000000000000")
            page.click("button:has-text('Load Session')")
            page.wait_for_selector("#landing-error:not(:empty)", timeout=5000)
            error_text = page.text_content("#landing-error")
            assert error_text, "Expected an error message"
            ok(f"Error shown for unknown share_id: '{error_text}'")
        except Exception as e:
            fail("Error handling for unknown share_id", e)

        # ── Test 8: Back link returns to landing ────────────────────────────────
        print("\n[8] Back link from session to landing")
        try:
            # Load a valid session first
            page.goto(f"{BASE_URL}/?share_id={SHARE_ID}")
            page.wait_for_selector("#session:not(.hidden)", timeout=8000)
            page.click(".session-back")
            page.wait_for_load_state("networkidle")
            assert page.url.rstrip("/") == BASE_URL.rstrip("/") or "share_id" not in page.url
            page.screenshot(path=f"{SCREENSHOTS_DIR}/05-back-to-landing.png")
            ok("Back link navigates away from session view")
        except Exception as e:
            fail("Back link from session to landing", e)

        # ── Test 9: Message card click selects it ───────────────────────────────
        print("\n[9] Message card selection")
        try:
            page.goto(f"{BASE_URL}/?share_id={SHARE_ID}")
            page.wait_for_selector("#session:not(.hidden)", timeout=8000)
            first_card = page.locator(".message-card").first
            first_card.click()
            # After click the card should have the 'selected' class
            page.wait_for_selector(".message-card.selected", timeout=3000)
            ok("Clicking a message card adds 'selected' class")
        except Exception as e:
            fail("Message card selection on click", e)

        # ── Summary ──────────────────────────────────────────────────────────────
        browser.close()

        print(f"\n{'='*55}")
        print(f"Results: {len(passed)} passed, {len(failed)} failed")
        if failed:
            print("\nFailed tests:")
            for name, err in failed:
                print(f"  ✗ {name}")
                print(f"    {err}")
        print(f"\nScreenshots saved to: {SCREENSHOTS_DIR}")
        return len(failed) == 0


if __name__ == "__main__":
    import sys
    success = run_tests()
    sys.exit(0 if success else 1)
