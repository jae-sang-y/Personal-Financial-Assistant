import json
import os
import re
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from firebase import Firebase


class Uploader:
    regex_cache = defaultdict(lambda expr: re.compile(expr))

    def __init__(self):
        with open('firebase_config.json', 'r') as file:
            config = json.loads(file.read())
        firebase = Firebase(config)
        auth = firebase.auth()
        user = auth.sign_in_with_email_and_password(os.environ['FIREBASE_EMAIL'], os.environ['FIREBASE_PWD'])
        self.auth_token = user['idToken']
        self.db = firebase.database()
        self._tags = None

    @property
    def tags(self):
        if self._tags is None:
            self._tags = self.db.child('tags').get(token=self.auth_token).val()
        return self._tags

    @staticmethod
    def parse_raw_delta(text: str) -> int:
        sign, quantity = text.split()
        if sign not in ['출금', '입금']:
            assert False, f'{sign} is not expected.'

        amount = int(quantity[:-1].replace(',', ''))
        if sign == '입금':
            return amount
        else:
            return -amount

    def parse_tag_by_note(self, note: str) -> Optional[str]:
        for tag_name, tag_value in self.tags.items():
            for filter_obj in tag_value['filters']:
                if filter_obj['type'] == '키워드':
                    if note == filter_obj['value']:
                        return tag_name
                elif filter_obj['type'] == '정규식':
                    if re.compile(filter_obj['value']).match(note) is not None:
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
