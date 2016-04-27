import { each, map, isUndefined } from 'lodash';

import Model from './model';
import Entity from './entity';
import Media from './media';
import Serial from './serial';
import Season from './serial/season';
import Episode from './serial/episode';

const serial = new Serial({
    id: 'serial_id_1',
    name: 'First serial'
});

console.log(serial);

window.serial = serial;
window.Model = Model;
window.Entity = Entity;
window.Media = Media;
window.Serial = Serial;
window.Season = Season;
window.Episode = Episode;











//import './redux-proxy';

/*
import { posts } from 'store/schema2';
import store from 'store';

const state = store.getState();

state.entities = {
    posts: {
        1: {
            id: 1,
            author: 1,
            widgets: [1,2]
        },
        2: {
            id: 2,
            author: 1,
            widgets: [3]
        }
    },
    users: {
        1: {
            id: 1,
            name: 'Author'
        }
    },
    widgets: {
        1: {
            id: 1,
            type: 'text'
        },
        2: {
            id: 2,
            type: 'image'
        },
        3: {
            id: 3,
            type: 'text'
        }
    }
};

console.log(posts.get([ 1 ]));
*/

/*
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import router from './router';

import './styles/index.scss';

ReactDOM.render((
    <Provider store={store}>
        { router }
    </Provider>
), document.getElementById('root'));
*/