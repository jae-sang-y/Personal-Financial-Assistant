import sys
from datetime import datetime
from typing import NoReturn

logger = open('log.log', 'w')


class RunFlags:
    HideWebBrowser = '-hide_web'
    Scrap = '-scrap'
    Upload = '-upload'
    ScrapStepByStep = '-scrap_sbs'
    CloseWebBrowser = '-close_web'


def is_activated(arg_name: str):
    return arg_name in sys.argv


def timestamp() -> str:
    return '[%s]' % datetime.now().strftime('%y%m%d_%H%M%S')


def log(*args, **kwargs) -> NoReturn:
    print(timestamp(), *args, **kwargs)
    print(timestamp(), *args, **kwargs, file=logger)
