import subprocess as sp

p = None
try:
    p = sp.Popen('run.bat -upload', shell=True)
    p.wait()
finally:
    if p:
        p.terminate()
