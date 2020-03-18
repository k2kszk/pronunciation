#./pronunciation/main.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask
from flask import request
from flask import render_template
from flask import send_file
from flask import jsonify
import os
import io
import argparse
import six
import base64
import hashlib
import json
import time
import ffmpeg
import requests
import config


app = Flask(__name__)

@app.route("/", methods=['POST', 'GET'])
def index():
    if request.method == "POST":
        f = open('/tmp/file.wav', 'wb')
        f.write(request.files['audio_data'].read())
        f.close()
        if os.path.isfile('/tmp/output.wav'):
            os.remove ('/tmp/output.wav')
        (
            ffmpeg
            .input('/tmp/file.wav')
            .output('/tmp/output.wav', ar='16000')
            .run()
        )
        url = 'https://pett-proxy.joyzbackend.com'
        text = request.form['text']
    
        user_file_handle = open('/tmp/output.wav', 'rb')
        files = {'sounddata': user_file_handle}

        body = {'transcription': text}

        x_header = {"application-key": config.key}
        req = requests.post(url, data=body, files=files, headers=x_header)
        if req.ok:
            result = req.json()
            print(req.text)
        return jsonify(result)
    else:
        return render_template("index.html")

if __name__ == "__main__":
    app.run()