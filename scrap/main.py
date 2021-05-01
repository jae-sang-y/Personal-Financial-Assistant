import json
import os
import re
import sys
import traceback
from collections import defaultdict
from datetime import datetime
from time import sleep
from typing import Dict, List, Optional, Tuple

logger = open('log.log', 'w')
print('START', datetime.now(), file=logger)
if '/d' in sys.argv:
    sys.stdout = logger

try:
    from dotenv import load_dotenv
    from firebase import Firebase
    from selenium import webdriver
    from selenium.common.exceptions import NoSuchElementException
    from selenium.webdriver.common.by import By

    load_dotenv()


    class Uploader:
        regex_cache = defaultdict(lambda expr: re.compile(expr))

        def __init__(self, need_scrap=False):
            with open('firebase_config.json', 'r') as file:
                config = json.loads(file.read())
            firebase = Firebase(config)
            auth = firebase.auth()
            user = auth.sign_in_with_email_and_password(os.environ['FIREBASE_EMAIL'], os.environ['FIREBASE_PWD'])
            self.auth_token = user['idToken']
            self.db = firebase.database()
            self._tags = None

            if need_scrap:
                self.scrap()

        def scrap(self):
            driver = webdriver.Firefox(firefox_binary=r'E:\Program Files (x86)\Mozilla Firefox\firefox.exe')
            driver.set_window_position(-10000, 0)
            driver.get("https://mbanking.dgb.co.kr/com_ebz_mbs_00001.act/")

            commands = [
                lambda: driver.execute_script('document.getElementById("_DGB_MBS_HEADER_LOGIN").click();'),
                lambda: sleep(1),
                lambda: driver.execute_script('document.getElementById("idTab").click();'),
                lambda: driver.execute_script('document.getElementById("user_id").value = "{}";'.format(os.environ['DGB_ID'])),
                lambda: driver.execute_script('$("#pass").focusin()'),
                lambda: sleep(1),
                lambda: [driver.find_element_by_css_selector(f'div>div>p>img[alt="{key}"]').find_element_by_xpath('../../..').click() for key in os.environ['DGB_PWD']],
                lambda: driver.execute_script('document.getElementById("exeLogIn").click();'),
                lambda: sleep(1),
                lambda: driver.execute_script('$("#pswd").focusin()'),
                lambda: sleep(1),
                lambda: [driver.find_element_by_css_selector(f'#mtk_pswd>div>div>div>p>img[alt="{key}"]').find_element_by_xpath('../../..').click() for key in os.environ['ACCOUNT_PWD']],
                lambda: driver.execute_script('document.getElementById("birth").value="{}";'.format(os.environ['BIRTH_DATE'])),
                lambda: driver.execute_script('document.getElementById("btn_confirm").click();'),
                lambda: sleep(1),
                lambda: driver.execute_script('document.getElementById("_DGB_ALERT_BTN").click()'),
                lambda: sleep(3),
                lambda: driver.execute_script('document.getElementById("_btnSchAcnt").click()'),
                lambda: sleep(3),
                lambda: driver.execute_script('document.querySelector(".BTN_ITEM_MORE").click()'),
                lambda: driver.execute_script('document.querySelector(".toggle-box>div>div>.TRNS_IZ").click()'),
                lambda: sleep(1),
                lambda: driver.execute_script('document.querySelector(".bottom>.btn-close").click()'),
                lambda: sleep(1),
            ]
            for k, command in enumerate(commands):
                print('{:03d}'.format(k), command.__code__.co_consts[1:], file=logger)
                command()
            with open('result.json', 'w', encoding='utf-8') as out:
                try:
                    print('[', file=out)
                    for k, item in enumerate(driver.find_elements(By.CSS_SELECTOR, '#_repeatArea>div>.item')):
                        # print(driver.execute_script("return arguments[0].innerHTML;", item), file=open(f'{k}.raw', 'w'))
                        result = {}
                        try:
                            result['timestamp'] = item.find_element_by_css_selector('p[class~="TDT_EFN_TRNS_DVCD"]>em').text
                        except NoSuchElementException:
                            result['timestamp'] = item.find_element_by_css_selector('p[class~="TDT_EFN_TRNS_DVCD"]>button>em').text
                        result['protocol'] = item.find_element_by_css_selector('p[class~="TDT_EFN_TRNS_DVCD"]>span').text
                        result['balance'] = item.find_element_by_css_selector('li[class="AFTRN_LDG_BALAMT"]>span>em').text
                        result['delta'] = item.find_element_by_css_selector('span[class~="TRNS_AMT"]').text
                        result['note'] = item.find_element_by_css_selector('p[class="tit CLNT_NM"]').text
                        if k > 0:
                            print(',', file=out)
                        print('\t{', file=out)
                        print('\t\t"timestamp"\t:', '"{}",'.format(result['timestamp']), file=out)
                        print('\t\t"protocol"\t:', '"{}",'.format(result['protocol']), file=out)
                        print('\t\t"balance"\t:', '"{}",'.format(result['balance']), file=out)
                        print('\t\t"delta"\t\t:', '"{}",'.format(result['delta']), file=out)
                        print('\t\t"note"\t\t:', '"{}"'.format(result['note']), file=out)
                        print('\t}', end='', file=out)
                    print('\n]', file=out)
                finally:
                    driver.close()

        @property
        def tags(self):
            if self._tags is None:
                self._tags = self.db.child('tags').get(token=self.auth_token).val()
            return self._tags

        def parse_raw_delta(self, text: str) -> int:
            sign, quantity = text.split()
            if sign not in ['출금', '입금']:
                assert False, f'{sign} is unexpeceted'

            amount = int(quantity[:-1].replace(',', ''))
            if sign == '입금':
                return amount
            else:
                return -amount

        def parse_tag_by_note(self, note: str) -> Optional[str]:
            for tag_name, tag_value in self.tags.items():
                for filter in tag_value['filters']:
                    if filter['type'] == '키워드':
                        if note == filter['value']:
                            return tag_name
                    elif filter['type'] == '정규식':
                        if re.compile(filter['value']).match(note) is not None:
                            return tag_name
            return None

        def assemble_tran(self, raw_item) -> Tuple[str, Dict]:
            yyyy_mm_dd, hh_mm_dd = raw_item['timestamp'].split()
            key = f'{yyyy_mm_dd} {hh_mm_dd}'
            return key, {
                'YYYY_MM': yyyy_mm_dd[:-3],
                'balance': float(raw_item['balance'].replace(',', '')),
                'delta': float(self.parse_raw_delta(raw_item['delta'])),
                # 'memo': raw_item['balance'],
                'note': raw_item['note'],
                'tag': self.parse_tag_by_note(raw_item['note']),
                'timestamp': key,
                'type': raw_item['protocol']
            }

        def get_new_trans(self) -> Dict[str, Dict[str, str]]:
            new_transactions_builder = defaultdict(lambda: {})

            with open('result.json', 'r', encoding='utf-8') as file:
                for raw_item in json.loads(file.read()):
                    yyyy_mm = raw_item['timestamp'].split()[0][:-3]
                    key, value = self.assemble_tran(raw_item)
                    new_transactions_builder[yyyy_mm][key] = value
            return {
                key_by_month: new_transactions_builder[key_by_month]
                for key_by_month in new_transactions_builder
            }

        def get_old_trans(self, target_dates: List[str]) -> Dict[str, Dict[str, str]]:
            old_transactions = {}
            for yyyy_mm in target_dates:
                if yyyy_mm not in old_transactions:
                    res = self.db.child(f'transactions/{yyyy_mm}').get(token=self.auth_token).val()
                    if res is not None:
                        old_transactions[yyyy_mm] = res
            return old_transactions

        def update_trans(self, old_trans: Dict[str, Dict[str, str]], new_trans: Dict[str, Dict[str, str]]):
            union_transactions = dict(old_trans)

            for target_yyyy_mm in new_trans:
                for timestamp, tran in new_trans[target_yyyy_mm].items():
                    if target_yyyy_mm not in union_transactions:
                        union_transactions[target_yyyy_mm] = {}
                    if timestamp not in union_transactions[target_yyyy_mm]:
                        union_transactions[target_yyyy_mm][timestamp] = tran

            firebase_update_list_for_month_of_transactions = {
                target_yyyy_mm: len(tran_list) for target_yyyy_mm, tran_list in union_transactions.items()
            }
            firebase_update_list_for_transactions = union_transactions

            for target_yyyy_mm in firebase_update_list_for_month_of_transactions:
                self.db.child(f'month_of_transactions/{target_yyyy_mm}').set(
                    firebase_update_list_for_month_of_transactions[target_yyyy_mm]
                    , token=self.auth_token
                )

            for target_yyyy_mm in firebase_update_list_for_transactions:
                self.db.child(f'transactions/{target_yyyy_mm}').set(
                    firebase_update_list_for_transactions[target_yyyy_mm]
                    , token=self.auth_token
                )

        def run(self):
            new_trans = self.get_new_trans()
            old_trans = self.get_old_trans(target_dates=list(new_trans.keys()))
            self.update_trans(old_trans, new_trans)


    Uploader(need_scrap='/s' in sys.argv).run()
except:
    print('EXCEPT', datetime.now(), file=logger)
    traceback.print_exc()
    traceback.print_exc(file=logger)
finally:
    print('END', datetime.now(), file=logger)
    logger.close()
