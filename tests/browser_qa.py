"""Run actual Chromium UI tests in an ephemeral lab."""
import subprocess
import sys
import tempfile
from contextlib import ExitStack
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lab'))
from mac import start, chrome_origin, ROOT

with ExitStack() as stack:
    out = Path(stack.enter_context(tempfile.TemporaryDirectory()))
    vault,target = start(stack,out,chrome_origin())
    subprocess.run(['node',str(ROOT/'tests/chrome.mjs'),vault,target,str(out/'extension'),chrome_origin()],check=True)
