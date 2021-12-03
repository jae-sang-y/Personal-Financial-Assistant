import json
import os
from time import sleep

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from common import log, RunFlags, is_activated


def scrap():
    driver = webdriver.Firefox(firefox_binary=os.environ['FIREFOX_PATH'])
    if is_activated(RunFlags.HideWebBrowser):
        driver.set_window_position(-10000, 0)
    driver.get("https://mbanking.dgb.co.kr/com_ebz_mbs_00001.act/")
    commands = [
        lambda: driver.execute_script('document.getElementById("_notiGroundClose").click();'),
        lambda: sleep(0.5),
        lambda: driver.execute_script('document.getElementById("_DGB_MBS_HEADER_LOGIN").click();'),
        lambda: sleep(1),
        lambda: driver.execute_script('document.getElementById("idTab").click();'),
        lambda: driver.execute_script(
            'document.getElementById("user_id").value = "{}";'.format(os.environ['DGB_ID'])),
        lambda: driver.execute_script('$("#pass").focusin()'),
        lambda: sleep(1),
        lambda: [driver.find_element_by_css_selector(f'div>div>p>img[alt="{key}"]').find_element_by_xpath(
            '../../..').click() for key in os.environ['DGB_PWD']],
        lambda: driver.execute_script('document.getElementById("exeLogIn").click();'),
        lambda: sleep(1),
        lambda: driver.execute_script('$("#pswd").focusin()'),
        lambda: sleep(1),
        lambda: [driver.find_element_by_css_selector(
            f'#mtk_pswd>div>div>div>p>img[alt="{key}"]').find_element_by_xpath('../../..').click() for key in
                 os.environ['ACCOUNT_PWD']],
        lambda: driver.execute_script(
            'document.getElementById("birth").value="{}";'.format(os.environ['BIRTH_DATE'])),
        lambda: driver.execute_script('document.getElementById("btn_confirm").click();'),
        lambda: sleep(1),
        lambda: driver.execute_script('document.getElementById("_DGB_ALERT_BTN").click()'),
        lambda: sleep(3),
        lambda: driver.execute_script('document.getElementById("_btnSchAcnt").click()'),
        lambda: sleep(3),
        lambda: driver.execute_script('document.querySelector(".menu-toggle").click()'),
        lambda: driver.execute_script('document.querySelector(".menu-detail>.linkbox>.TRNS_IZ").click()'),
        lambda: sleep(1),
        lambda: driver.execute_script('document.querySelector(".bottom>.btn-close").click()'),
        lambda: sleep(1),
        lambda: driver.execute_script('document.querySelector("#condition_button").click()'),
        lambda: driver.execute_script('document.querySelector("#cal_btn4").click()'),
        lambda: driver.execute_script('document.querySelector("#trnsSearch").click()'),
        lambda: sleep(3),
    ]
    for k, command in enumerate(commands):
        log('{:03d}'.format(k), command.__code__.co_consts[1:])
        if is_activated(RunFlags.ScrapStepByStep):
            input('>>')
        command()

    try:
        result = []
        for k, item in enumerate(driver.find_elements(By.CSS_SELECTOR, '#_repeatArea>div>.item')):
            row = {}
            try:
                row['timestamp'] = item.find_element_by_css_selector(
                    'p[class~="TDT_EFN_TRNS_DVCD"]>em').text
            except NoSuchElementException:
                row['timestamp'] = item.find_element_by_css_selector(
                    'p[class~="TDT_EFN_TRNS_DVCD"]>button>em').text
            row['protocol'] = item.find_element_by_css_selector(
                'p[class~="TDT_EFN_TRNS_DVCD"]>span').text
            row['balance'] = item.find_element_by_css_selector(
                'li[class="AFTRN_LDG_BALAMT"]>span>em').text
            row['delta'] = item.find_element_by_css_selector('span[class~="TRNS_AMT"]').text
            row['note'] = item.find_element_by_css_selector('p[class="tit CLNT_NM"]').text

            result.append(row)
        text_output = json.dumps(obj=result, indent=1, ensure_ascii=False)
        with open('result.json', 'w', encoding='utf-8') as out:
            out.write(text_output)
    finally:
        if is_activated(RunFlags.CloseWebBrowser):
            driver.close()
