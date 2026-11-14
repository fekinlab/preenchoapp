from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
html=(root/'monterey/preview.html').read_text()
for marker,file in [('__CLASSIFIER__','classifier.js'),('__SCANNER__','scanner.js')]:
    html=html.replace(marker,(root/'extension'/file).read_text())
Path(sys.argv[1]).write_text(html)
