from flask import Flask, render_template, request
import ast, json
app = Flask(__name__)

currModel = {}
tempNo = 0

with open('templates/datum.json') as data_file:
    currModel = json.load(data_file)

@app.route('/')
def hello_world():
    return render_template('index.html',currModel=json.dumps(currModel))

@app.route('/savecurrmodel', methods = ['GET','POST'])
def postdata():
    currModel = json.loads(request.args.get("payload"))
    global tempNo
    with open('JSONtemp/temp'+str(tempNo)+'.txt', 'w') as write_file:
        json.dump(currModel, write_file, indent=4, sort_keys=True)
    tempNo += 1
    return "OK"

@app.errorhandler(500)
def handle_bad_request(e):
    print e

@app.errorhandler(400)
def handle_bad_request(e):
    print e

if __name__ == '__main__':
    app.run()
