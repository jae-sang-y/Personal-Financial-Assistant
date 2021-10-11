from dotenv import load_dotenv

from scrap import scrap
from uploader import Uploader
from common import log, is_activated, RunFlags

load_dotenv()
try:
    log('START')
    if is_activated(RunFlags.Scrap):
        scrap()

    if is_activated(RunFlags.Upload):
        Uploader().run()
except Exception as e:
    log('EXCEPT')
    raise e
finally:
    log('END')
