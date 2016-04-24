import {
    create,
    Schema,
    arrayOf,
    unionOf,
    valuesOf
} from '../redux-proxy';

import store from 'store';
import * as types from './types';
import * as fetchers from './fetchers';

const proxy = create({
    getCacheState: () => store.getState().cache,
    getEntitiesState: () => store.getState().entities,
    dispatch: store.dispatch
});

// Schemas

const post = new Schema('post');
const user = new Schema('user');
const group = new Schema('group');
const comment = new Schema('comment');
const widget = new Schema('widget');

post.define({
    author: user,
    widgets: arrayOf(widget),
    comments: arrayOf(comment),
    created_at: types.time,
    updated_at: types.time,
    published_at: types.time,
    deleted_at: types.time,
    url: (post) => '/post/' + post.id
});

// Providers
const provider = {};
export default provider;

export const posts = provider.posts = proxy(post, fetchers.posts);

