"""Exercise a real Chromium extension via toolbar, isolated worlds and v57 UI."""
import os
import sys
import tempfile
from contextlib import ExitStack
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lab'))
from mac import start, chrome_origin
from playwright.sync_api import sync_playwright, expect


def run():
    with ExitStack() as stack:
        root = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        vault, target = start(stack,root/'kit',chrome_origin())
        p = stack.enter_context(sync_playwright())
        browser = p.chromium.launch_persistent_context(str(root/'browser'), executable_path=os.environ.get('CHROME'),
            channel='chromium',headless=True,ignore_default_args=['--disable-extensions'],
            args=['--enable-unsafe-extension-debugging','--enable-extensions'])
        stack.callback(browser.close)
        page = browser.pages[0]
        cdp = browser.new_cdp_session(page)
        ext_id = cdp.send('Extensions.loadUnpacked',{'path':str(root/'kit/extension')})['id']
        assert 'chrome-extension://'+ext_id == chrome_origin()
        page.goto(vault)
        password = os.urandom(20).hex()
        page.locator('#vault-pass').fill(password)
        page.locator('#vault-confirm').fill(password)
        page.locator('#vault-submit').click()
        page.locator('[data-page=data]').click()
        page.locator('#data-form [name=name]').fill('Pessoa Teste')
        page.locator('#data-form [name=email]').fill('demo@example.invalid')
        page.locator('#data-form button[type=submit]').click()
        expect(page.locator('#save-status')).to_contain_text('salvos')
        page.goto(target)
        def review():
            page.bring_to_front()
            tab = cdp.send('Target.getTargetInfo')['targetInfo']['targetId']
            # The page session identifies a page target. triggerAction expects its tab target.
            infos = cdp.send('Target.getTargets',{'filter':[{'type':'tab'}]})['targetInfos']
            tab_target = next((i['targetId'] for i in infos if i['url'].rstrip('/') == target),tab)
            with browser.expect_page() as opened:
                cdp.send('Extensions.triggerAction',{'id':ext_id,'targetId':tab_target})
            popup = opened.value
            with browser.expect_page() as opened_review:
                popup.locator('#scan').click()
            result = opened_review.value
            expect(result.locator('#origin')).to_have_text(target)
            return result
        r = review()
        expect(r.locator('input:checked')).to_have_count(0)
        r.locator('#cancel').click()
        expect(page.get_by_label('Nome completo')).to_have_value('')
        r.close()
        r = review()
        r.get_by_label('Nome completo',exact=False).check()
        with browser.expect_page() as gate:
            r.locator('#authorize').click()
        consent = gate.value
        consent.locator('#vault-pass').fill(password)
        consent.locator('#vault-submit').click()
        consent.get_by_text('Liberar campos selecionados',exact=True).click()
        r.locator('#apply').click()
        expect(r.locator('#status')).to_contain_text('1 de 1')
        expect(page.get_by_label('Nome completo')).to_have_value('Pessoa Teste')
        expect(page.get_by_label('E-mail')).to_have_value('')
        assert page.url.rstrip('/') == target
        print('Chromium',cdp.send('Browser.getVersion')['product'],'OK: cancelamento e preenchimento seletivo')


if __name__ == '__main__':
    run()
