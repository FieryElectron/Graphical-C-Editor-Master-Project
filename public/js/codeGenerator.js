tf.setBackend('cpu');

const Tx = 18;
const Ty = 11;

const x_vocab_len = 21;
const y_vocab_len = 21;

const pre_units = 32;
const post_units = 64;

let model = null;

tf.loadLayersModel('http://localhost:8080/tfjs_models/attention/model.json')
    .then((mode) => {
        model = mode;
    });

let X_dict = {
    '<pad>': 0,
    ' ': 1,
    '0': 2,
    '1': 3,
    '2': 4,
    '3': 5,
    '4': 6,
    '5': 7,
    '6': 8,
    '7': 9,
    '8': 10,
    '9': 11,
    'a': 12,
    'd': 13,
    'g': 14,
    'i': 15,
    'm': 16,
    'n': 17,
    'o': 18,
    's': 19,
    't': 20
}

let Y_dict = {
    '<pad>': 0,
    '.': 1,
    '0': 2,
    '1': 3,
    '2': 4,
    '3': 5,
    '4': 6,
    '5': 7,
    '6': 8,
    '7': 9,
    '8': 10,
    '9': 11,
    ';': 12,
    '=': 13,
    'a': 14,
    'd': 15,
    'i': 16,
    'm': 17,
    'n': 18,
    'o': 19,
    't': 20
}

let X_dict_inv = {
    0: '<pad>',
    1: ' ',
    2: '0',
    3: '1',
    4: '2',
    5: '3',
    6: '4',
    7: '5',
    8: '6',
    9: '7',
    10: '8',
    11: '9',
    12: 'a',
    13: 'd',
    14: 'g',
    15: 'i',
    16: 'm',
    17: 'n',
    18: 'o',
    19: 's',
    20: 't'
}

let Y_dict_inv = {
    0: '<pad>',
    1: '.',
    2: '0',
    3: '1',
    4: '2',
    5: '3',
    6: '4',
    7: '5',
    8: '6',
    9: '7',
    10: '8',
    11: '9',
    12: ';',
    13: '=',
    14: 'a',
    15: 'd',
    16: 'i',
    17: 'm',
    18: 'n',
    19: 'o',
    20: 't'
}

function SplitAndPad(_text, _len) {
    _text = _text.split("");
    let len = _text.length;

    for (let i = 0; i < (_len - len); ++i) {
        _text.push("<pad>");
    }

    return _text;
}

function ConvertLable(_arr, _dict) {
    let arr = []
    for (let i = 0; i < _arr.length; ++i) {
        arr.push(_dict[_arr[i]])
    }
    return arr
}

function Label2OneHote(_label, _len, _vocab_len) {
    let arr2d = [];
    for (let i = 0; i < _len; ++i) {
        let arr = new Array(_vocab_len).fill(0);
        arr[_label[i]] = 1;
        arr2d.push(arr);
    }

    return arr2d;
}

function OneHote2Label(_oneHot) {
    let arr = [];
    for (let i = 0; i < _oneHot.length; ++i) {
        arr.push(_oneHot[i].indexOf(Math.max(..._oneHot[i])));
    }

    return arr;
}

function predict(inputtext, updateCallback) {
    if (!model) {
        if (updateCallback) {
            updateCallback("model not ready!");
        }
        return;
    }

    let xo = Label2OneHote(ConvertLable(SplitAndPad(inputtext, Tx), X_dict), Tx, x_vocab_len);

    let onehot = tf.tensor(xo).reshape([1, Tx, x_vocab_len]);

    let h0 = tf.zeros([1, post_units]);
    let c0 = tf.zeros([1, post_units]);

    let prediction = model.predict([onehot, h0, c0]);

    let promiseArr = [];

    for (let i = 0; i < prediction.length; ++i) {
        promiseArr.push(prediction[i].data());
    }

    Promise.all(promiseArr).then(arr => {
        let text = ConvertLable(OneHote2Label(arr), Y_dict_inv).join("").replaceAll("<pad>", "");
        // $("#output").val(text);

        if (updateCallback) {
            updateCallback(text);
        }
    });
}