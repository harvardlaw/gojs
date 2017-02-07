from flask import Flask, render_template, request
import ast
app = Flask(__name__)


@app.route('/')
def hello_world():
    # with open('/static/tmp/test.txt', 'r') as myfile:
    #     stable = myfile.read()

    # return render_template('index.html', passin=stable)


    return render_template('port.html')


@app.route('/postdata/', methods = ['GET', 'POST'])
def postdata():
    print "post"
    x = request.form['posted_data']
    # card_dictionary = ast.literal_eval(request.form['posted_data'])
    # print card_dictionary['loc']
    # print card_dictionary
    # print x
    # print render_template('test_card.html')
    return render_template('test_card.html')


if __name__ == '__main__':
    app.run()
