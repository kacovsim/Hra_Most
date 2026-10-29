from flask import Flask, render_template, request, Response, jsonify
from flask_cors import CORS
import requests
import os
import hashlib
import base64


tts_cache = {}


def make_key(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()



app = Flask(__name__)
CORS(app)
API_KEY = os.getenv("GOOGLE_TTS_KEY")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/city')
def city():
    return render_template('city.html')

@app.route('/village')
def village():
    return render_template('village.html')

@app.route('/village-without-light')
def village_without_light():
    return render_template('village-without-light.html')

@app.route('/vmck')
def vmck():
    return render_template('vmck.html')

@app.route('/vmck2')
def vmck2():
    return render_template('vmck2.html')

@app.route('/most1')
def most1():
    return render_template('most1.html')

@app.route('/most2')
def most2():
    return render_template('most2.html')

@app.route('/most3')
def most3():
    return render_template('most3.html')

@app.route('/optim')
def optim():
    return render_template('optim.html')

@app.route('/model')
def model():
    return render_template('model.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/demo')
def demo():
    return render_template('demo.html')

@app.route('/testScene')
def testScene():
    return render_template('testScene.html')


@app.route('/tts', methods=['POST'])
def tts():
    if not API_KEY:
        return jsonify({"error": "API key not set"}), 500

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Missing text"}), 400

    text = data['text'].strip()
    key = make_key(text)

    # audio file already in cache
    if key in tts_cache:
        print("Using cached audio file")
        return Response(
            tts_cache[key],
            mimetype="audio/mpeg",
            headers={"X-Cache": "HIT"}
        )


    # call Google cloud
    print("Calling google Cloud");
    response = requests.post("https://texttospeech.googleapis.com/v1/text:synthesize",
        params={"key": API_KEY},
        json={
            "input": {"text": text},
            "voice": {
                "languageCode": "cs-CZ",
                "name": "cs-CZ-Chirp3-HD-Alnilam"
            },
            "audioConfig": {
                "audioEncoding": "MP3"
            }
        }
    )

    if response.status_code != 200:
        return jsonify({"error": response.text}), 500

    result = response.json()
    audio_binary = base64.b64decode(result["audioContent"])

    tts_cache[key] = audio_binary

    return Response(
        audio_binary,
        mimetype="audio/mpeg",
        headers={"X-Cache": "MISS"}
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8443, ssl_context=('cert.pem', 'key.pem'))
    