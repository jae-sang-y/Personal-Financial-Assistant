from selenium import webdriver
import os
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from time import sleep

from dotenv import load_dotenv

load_dotenv()


def scrap():
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
        print('{:03d}'.format(k), command.__code__.co_consts[1:])
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


scrap()
