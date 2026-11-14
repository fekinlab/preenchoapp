"""Run the full browser scenario using verified TLS in a disposable CI account."""
import os
import ssl
import subprocess
import sys
import tempfile
import threading
from contextlib import ExitStack
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lab'))
from mac import server, chrome_origin, ROOT
from prepare import prepare

def run(*args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL)

with ExitStack() as stack:
    tmp=Path(stack.enter_context(tempfile.TemporaryDirectory()))
    out=tmp/'sites'
    def cert(*args):
        run('openssl',*args)
    ca,key=tmp/'ca.pem',tmp/'ca.key'
    leaf,private=tmp/'server.pem',tmp/'server.key'
    cert('req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=Preencho CI ephemeral CA',
         '-addext','basicConstraints=critical,CA:TRUE','-keyout',key,'-out',ca)
    cert('req','-new','-newkey','rsa:2048','-nodes','-subj','/CN=localhost','-keyout',private,'-out',tmp/'request')
    (tmp/'extensions').write_text('subjectAltName=DNS:localhost\nextendedKeyUsage=serverAuth\nbasicConstraints=CA:FALSE\n')
    cert('x509','-req','-in',tmp/'request','-CA',ca,'-CAkey',key,'-CAcreateserial','-days','1',
         '-extfile',tmp/'extensions','-out',leaf)
    home=tmp/'home'
    # Chrome versions use either of these per-user NSS database paths.
    for path in (home/'.pki/nssdb',home/'.local/share/pki/nssdb'):
        path.mkdir(parents=True)
        db='sql:'+str(path)
        run('certutil','-N','--empty-password','-d',db)
        run('certutil','-A','-d',db,'-n','Preencho ephemeral CA','-t','C,,','-i',ca)
    tls=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls.minimum_version=ssl.TLSVersion.TLSv1_2
    tls.load_cert_chain(leaf,private)
    origins=[]
    for name in ('vault','target'):
        http,url=server(stack,out/name)
        http.socket=tls.wrap_socket(http.socket,server_side=True)
        origins.append(url.replace('http:','https:'))
        threading.Thread(target=http.serve_forever,daemon=True).start()
        stack.callback(http.shutdown)
    prepare(out,chrome_origin(),*origins)
    env=dict(os.environ,HOME=str(home),PUPPETEER_CACHE_DIR=str(Path.home()/'.cache/puppeteer'))
    subprocess.run(['node',str(ROOT/'tests/chrome.mjs'),*origins,str(out/'extension'),chrome_origin()],env=env,check=True)
